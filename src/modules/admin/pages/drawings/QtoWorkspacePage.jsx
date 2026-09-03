import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { boqViewPath } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";
import { fetchDrawingPreviewBlob, reconvertProjectDrawing } from "../../api/drawing.api";
import {
  QTO_LINE_TYPES,
  createQtoSession,
  updateQtoScale,
  updateQtoLines,
  approveQtoSession,
} from "../../api/qto.api";
import { generateBoqFromQto } from "../../api/boq.api";
import { fetchWorkItems } from "../../api/work-item.api";
import DrawingMeasureCanvas, { TOOLS } from "./DrawingMeasureCanvas";
import { defaultUnitForType } from "./drawingQtoUtils";

export default function QtoWorkspacePage() {
  const { projectId, drawingId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [session, setSession] = useState(null);
  const [lines, setLines] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState("pdf");
  const [scaleRatio, setScaleRatio] = useState(0);
  const [activeTool, setActiveTool] = useState("scale");
  const [selectedLineType, setSelectedLineType] = useState("FLOOR_AREA");
  const [workItems, setWorkItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [regeneratingPreview, setRegeneratingPreview] = useState(false);

  const applyPreviewBlob = useCallback((preview) => {
    const type = preview.contentType.includes("svg")
      ? "svg"
      : preview.contentType.includes("png")
        ? "png"
        : preview.contentType.includes("dxf")
          ? "dxf"
          : "pdf";
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(preview.blob);
    });
    setPreviewType(type);
    if (type === "dxf") {
      setActiveTool("pan");
    } else if (type !== "pdf") {
      setActiveTool("scale");
    }
    return type;
  }, []);

  const loadPreview = useCallback(async () => {
    const preview = await fetchDrawingPreviewBlob(projectId, drawingId);
    return applyPreviewBlob(preview);
  }, [applyPreviewBlob, projectId, drawingId]);

  const init = useCallback(async () => {
    try {
      const [previewTypeLoaded, wiRes] = await Promise.all([
        loadPreview(),
        fetchWorkItems({}, 0, 200),
      ]);
      const wiList = wiRes?.content ?? (Array.isArray(wiRes) ? wiRes : []);
      setWorkItems(wiList);

      const created = await createQtoSession({
        projectId: Number(projectId),
        drawingId,
        notes: "Drawing QTO session",
      });
      setSession(created);
      setLines(created.lines || []);
      if (created.scaleRatio) setScaleRatio(Number(created.scaleRatio));

      if (previewTypeLoaded === "dxf") {
        setMessage("Large DWG preview loaded as DXF. If rendering fails, use Regenerate preview for a PNG.");
      }
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to start QTO session");
    }
  }, [projectId, drawingId, loadPreview]);

  const regeneratePreview = async () => {
    setRegeneratingPreview(true);
    setMessage("");
    try {
      await reconvertProjectDrawing(projectId, drawingId);
      const type = await loadPreview();
      setMessage(
        type === "png" || type === "svg"
          ? "Preview regenerated. You can measure on the drawing now."
          : "Preview regenerated."
      );
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to regenerate preview");
    } finally {
      setRegeneratingPreview(false);
    }
  };

  useEffect(() => {
    init();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init]);

  const handleScaleCalibrated = async (ratio) => {
    setScaleRatio(ratio);
    if (session?.id) {
      const updated = await updateQtoScale(session.id, { scaleRatio: ratio, scaleUnit: "M" });
      setSession(updated);
    }
  };

  const handleMeasurementComplete = ({ tool, page, points, quantity, coordSpace }) => {
    const typeDef = QTO_LINE_TYPES.find((t) => t.value === selectedLineType) || QTO_LINE_TYPES[0];
    const newLine = {
      lineType: selectedLineType,
      label: typeDef.label,
      quantity: quantity || 0,
      unit: defaultUnitForType(selectedLineType),
      source: "DRAWING",
      geometryJson: JSON.stringify({ tool, page: page || 1, points, coordSpace: coordSpace || "screen" }),
      sortOrder: lines.length,
    };
    setLines((prev) => [...prev, newLine]);
  };

  const addManualLine = () => {
    const typeDef = QTO_LINE_TYPES.find((t) => t.value === selectedLineType) || QTO_LINE_TYPES[0];
    setLines((prev) => [
      ...prev,
      {
        lineType: selectedLineType,
        label: typeDef.label,
        quantity: 0,
        unit: typeDef.unit,
        source: "MANUAL",
        sortOrder: prev.length,
      },
    ]);
  };

  const updateLine = (idx, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "workItemId") {
        const wi = workItems.find((w) => w.id === value);
        if (wi) next[idx].rate = wi.defaultRate;
      }
      if (field === "quantity" || field === "rate") {
        const q = parseFloat(field === "quantity" ? value : next[idx].quantity) || 0;
        const r = parseFloat(field === "rate" ? value : next[idx].rate) || 0;
        next[idx].amount = parseFloat((q * r).toFixed(2));
      }
      return next;
    });
  };

  const saveLines = async () => {
    if (!session?.id) return;
    setSaving(true);
    try {
      const updated = await updateQtoLines(session.id, lines);
      setSession(updated);
      setLines(updated.lines || []);
      setMessage("QTO lines saved");
    } catch (e) {
      setMessage(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const approveAndGenerateBoq = async () => {
    if (!session?.id) return;
    setSaving(true);
    try {
      await updateQtoLines(session.id, lines);
      await approveQtoSession(session.id);
      const boq = await generateBoqFromQto(session.id);
      setMessage(`BOQ generated (${boq.id})`);
      navigate(boqViewPath(role, boq.id, projectId));
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to generate BOQ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageTitle
            title="Quantity Take-Off"
            subtitle="Calibrate scale, measure on drawing, review quantities"
            className="min-w-0"
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={saveLines} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
          <Button size="sm" onClick={approveAndGenerateBoq} disabled={saving || lines.length === 0}>
            <FileText className="w-4 h-4 mr-1" /> Generate BOQ
          </Button>
        </div>
      </div>

      {message && <p className="text-xs text-muted-foreground">{message}</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Drawing & Measurement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {(previewType === "dxf" ? TOOLS : TOOLS.filter((t) => t.id !== "pan")).map((t) => (
                  <Button
                    key={t.id}
                    size="sm"
                    variant={activeTool === t.id ? "default" : "outline"}
                    onClick={() => setActiveTool(t.id)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
              {(previewType === "dxf" || previewType === "png") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={regeneratePreview}
                  disabled={regeneratingPreview}
                >
                  {regeneratingPreview ? "Regenerating…" : "Regenerate preview"}
                </Button>
              )}
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Line type for next measurement</Label>
                <Select value={selectedLineType} onValueChange={setSelectedLineType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QTO_LINE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DrawingMeasureCanvas
              previewUrl={previewUrl}
              previewType={previewType}
              scaleRatio={scaleRatio}
              onScaleCalibrated={handleScaleCalibrated}
              activeTool={activeTool}
              onMeasurementComplete={handleMeasurementComplete}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">QTO Lines</CardTitle>
            <Button size="sm" variant="outline" onClick={addManualLine}>
              <Plus className="w-4 h-4 mr-1" /> Add row
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Work Item</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-8">
                      Measure on drawing or add manual rows
                    </TableCell>
                  </TableRow>
                ) : lines.map((line, idx) => (
                  <TableRow key={line.id || idx}>
                    <TableCell className="text-xs">
                      <Input
                        className="h-7 text-xs"
                        value={line.label || ""}
                        onChange={(e) => updateLine(idx, "label", e.target.value)}
                      />
                      <Badge variant="outline" className="mt-1 text-[10px]">{line.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-7 text-xs w-20"
                        value={line.quantity ?? ""}
                        onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-xs">{line.unit}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-7 text-xs w-20"
                        value={line.rate ?? ""}
                        onChange={(e) => updateLine(idx, "rate", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={line.workItemId || "none"}
                        onValueChange={(v) => updateLine(idx, "workItemId", v === "none" ? null : v)}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {workItems.map((w) => (
                            <SelectItem key={w.id} value={w.id}>{w.workItemName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {session?.status === "APPROVED" && (
        <div className="flex items-center gap-2 text-emerald-600 text-sm">
          <CheckCircle className="w-4 h-4" /> QTO approved
        </div>
      )}
    </PageShell>
  );
}
