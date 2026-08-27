import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Upload, FileImage, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import {
  DRAWING_CATEGORIES,
  fetchProjectDrawings,
  uploadProjectDrawing,
  deleteProjectDrawing,
  reconvertProjectDrawing,
} from "../../api/drawing.api";

const STATUS_BADGE = {
  READY: "default",
  CONVERTING: "secondary",
  FAILED: "destructive",
  UPLOADED: "outline",
};

export default function ProjectDrawingsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("ARCHITECTURAL");
  const [error, setError] = useState("");
  const [reconvertingId, setReconvertingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchProjectDrawings(projectId);
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
  }, [projectId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadProjectDrawing(projectId, category, file);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
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
    <PageShell className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageTitle
          title="Project Drawings"
          subtitle="Upload PDF or DWG drawings for quantity take-off"
          className="flex-1"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Upload Drawing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DRAWING_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="sr-only">File</Label>
            <Button asChild disabled={uploading}>
              <label className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2 inline" />
                {uploading ? "Uploading..." : "Choose PDF / DWG"}
                <input type="file" accept=".pdf,.dwg" className="hidden" onChange={handleUpload} />
              </label>
            </Button>
          </div>
        </CardContent>
        {error && (
          <CardContent className="pt-0">
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          </CardContent>
        )}
      </Card>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : drawings.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No drawings uploaded yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {drawings.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileImage className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{d.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {DRAWING_CATEGORIES.find((c) => c.value === d.category)?.label || d.category}
                      {d.fileSize ? ` · ${(d.fileSize / 1024 / 1024).toFixed(2)} MB` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE[d.status] || "outline"}>{d.status}</Badge>
                  {d.previewAvailable && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/projects/${projectId}/drawings/${d.id}/qto`}>QTO</Link>
                    </Button>
                  )}
                  {d.status === "FAILED" && d.fileName?.toLowerCase().endsWith(".dwg") && (
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
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
