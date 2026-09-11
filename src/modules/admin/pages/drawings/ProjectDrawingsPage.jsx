import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Upload, FileImage, Trash2, AlertCircle, Lock, History, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import {
  DRAWING_CATEGORIES,
  fetchProjectDrawings,
  fetchDrawingRevisions,
  uploadProjectDrawing,
  deleteProjectDrawing,
  reconvertProjectDrawing,
} from "../../api/drawing.api";

export default function ProjectDrawingsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const basePath = isPm ? `/project-manager/projects/${projectId}` : `/admin/projects/${projectId}`;

  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [reconvertingId, setReconvertingId] = useState(null);

  // Upload Form State
  const [drawingNumber, setDrawingNumber] = useState("");
  const [revisionCode, setRevisionCode] = useState("Rev A");
  const [revisionDate, setRevisionDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("ARCHITECTURAL");
  const [selectedFile, setSelectedFile] = useState(null);

  const [includeSuperseded, setIncludeSuperseded] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [historyError, setHistoryError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchProjectDrawings(projectId, includeSuperseded);
      setDrawings(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load drawings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, includeSuperseded]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    // Auto-fill drawing number if blank based on file name
    if (!drawingNumber.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setDrawingNumber(nameWithoutExt);
    }
  };

  const handleUploadSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setError("Please choose a PDF or DWG file to upload.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      await uploadProjectDrawing(projectId, {
        category,
        file: selectedFile,
        drawingNumber: drawingNumber.trim() || undefined,
        revisionCode: revisionCode.trim() || undefined,
        revisionDate: revisionDate || undefined,
      });

      // Reset form
      setSelectedFile(null);
      setDrawingNumber("");
      setRevisionCode("Rev A");
      const fileInput = document.getElementById("project-drawing-file-input");
      if (fileInput) fileInput.value = "";

      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenHistory = async (drawing) => {
    setSelectedDrawing(drawing);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const drawingNo = drawing.drawingNumber || drawing.fileName;
      const list = await fetchDrawingRevisions(projectId, drawingNo);
      setRevisions(Array.isArray(list) ? list : [drawing]);
    } catch (err) {
      setHistoryError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load revision history");
      setRevisions([drawing]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleReconvert = async (id) => {
    setReconvertingId(id);
    setError("");
    try {
      await reconvertProjectDrawing(projectId, id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Conversion failed");
    } finally {
      setReconvertingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this drawing?")) return;
    await deleteProjectDrawing(projectId, id);
    load();
  };

  return (
    <PageShell className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageTitle
          title="Project Drawings"
          subtitle="Upload PDF or DWG drawings with revision control and superseded lockout"
          className="flex-1"
        />
      </div>

      {/* Upload Form Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" /> Upload Project Drawing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Drawing Number</Label>
                <Input
                  placeholder="e.g. A-101"
                  value={drawingNumber}
                  onChange={(e) => setDrawingNumber(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Revision Code</Label>
                <Input
                  placeholder="e.g. Rev A"
                  value={revisionCode}
                  onChange={(e) => setRevisionCode(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Revision Date</Label>
                <Input
                  type="date"
                  value={revisionDate}
                  onChange={(e) => setRevisionDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DRAWING_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/40">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Input
                  type="file"
                  accept=".pdf,.dwg"
                  id="project-drawing-file-input"
                  className="text-xs h-9 cursor-pointer file:bg-muted file:text-foreground file:border-0 file:text-xs file:font-medium"
                  onChange={handleFileChange}
                />
              </div>
              <Button
                type="submit"
                disabled={uploading || !selectedFile}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                {uploading ? "Uploading Drawing..." : "Upload Drawing"}
              </Button>
            </div>
          </form>

          {error && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1 bg-destructive/10 p-2 rounded">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Drawings Header & Filter Bar */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-semibold text-foreground">Project Drawings</h3>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <Switch
            checked={includeSuperseded}
            onCheckedChange={setIncludeSuperseded}
          />
          Show superseded revisions
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : drawings.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No drawings uploaded yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {drawings.map((d) => {
            const isSuperseded = Boolean(d.isSuperseded || d.status === "SUPERSEDED");
            const revCode = d.revisionCode || (d.revisionNo != null ? `R${d.revisionNo}` : null) || "R1";
            const dwgNumberDisplay = d.drawingNumber ? `[${d.drawingNumber}] ` : "";

            return (
              <Card key={d.id} className={isSuperseded ? "opacity-80 bg-amber-500/5 border-amber-500/30" : ""}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {isSuperseded ? (
                      <Lock className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                      <FileImage className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">
                          {dwgNumberDisplay}
                          <span className="font-normal text-muted-foreground">{d.fileName}</span>
                        </p>
                        <Badge
                          variant={isSuperseded ? "destructive" : "default"}
                          className={`text-[10px] ${!isSuperseded ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
                        >
                          {isSuperseded ? (
                            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SUPERSEDED ({revCode})</span>
                          ) : (
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> LATEST ({revCode})</span>
                          )}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Category: {DRAWING_CATEGORIES.find((c) => c.value === d.category)?.label || d.category}
                        {d.revisionDate ? ` · Revised: ${new Date(d.revisionDate).toLocaleDateString()}` : ""}
                        {d.fileSize ? ` · ${(d.fileSize / 1024 / 1024).toFixed(2)} MB` : ""}
                      </p>
                      {isSuperseded && (
                        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1.5 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> SUPERSEDED REVISION - DO NOT USE FOR CONSTRUCTION OR QTO
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleOpenHistory(d)}>
                      <History className="w-3.5 h-3.5 mr-1" /> History
                    </Button>
                    {!isSuperseded && d.previewAvailable && (
                      <Button asChild size="sm" variant="outline">
                        <Link to={`${basePath}/drawings/${d.id}/qto`}>QTO</Link>
                      </Button>
                    )}
                    {isSuperseded && (
                      <Button size="sm" variant="secondary" disabled className="opacity-60 cursor-not-allowed text-xs">
                        <Lock className="w-3.5 h-3.5 mr-1" /> QTO Locked
                      </Button>
                    )}
                    {!isSuperseded && d.status === "FAILED" && d.fileName?.toLowerCase().endsWith(".dwg") && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reconvertingId === d.id}
                        onClick={() => handleReconvert(d.id)}
                      >
                        {reconvertingId === d.id ? "Converting…" : "Retry DWG"}
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(d.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Revision History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <CardTitle className="text-base">Drawing Revision History</CardTitle>
            <DialogDescription className="text-xs">
              Audit log of all issued revisions for <strong>{selectedDrawing?.drawingNumber || selectedDrawing?.fileName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            {historyLoading ? (
              <p className="text-center py-4 text-muted-foreground">Loading revisions…</p>
            ) : historyError ? (
              <p className="text-destructive p-2 bg-destructive/10 rounded">{historyError}</p>
            ) : (
              <div className="space-y-2">
                {revisions.map((rev, idx) => {
                  const isSup = Boolean(rev.isSuperseded || rev.status === "SUPERSEDED");
                  const rCode = rev.revisionCode || (rev.revisionNo != null ? `R${rev.revisionNo}` : null) || `Rev ${revisions.length - idx}`;
                  return (
                    <div
                      key={rev.id || idx}
                      className={`p-3 rounded border flex items-center justify-between ${
                        isSup ? "bg-muted/40" : "bg-emerald-500/10 border-emerald-500/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{rCode}</span>
                          <Badge variant={isSup ? "secondary" : "default"} className={`text-[10px] ${!isSup ? "bg-emerald-600 text-white" : ""}`}>
                            {isSup ? "SUPERSEDED" : "LATEST"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          Issued: {rev.revisionDate ? new Date(rev.revisionDate).toLocaleDateString() : rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "N/A"}
                          {rev.fileName ? ` · ${rev.fileName}` : ""}
                        </p>
                      </div>
                      {isSup ? (
                        <span className="text-amber-600 font-medium flex items-center gap-1 text-xs">
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium flex items-center gap-1 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active Print
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
