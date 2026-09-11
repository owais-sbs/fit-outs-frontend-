import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, FileImage, AlertCircle, Lock, History, Eye, CheckCircle2, FileText, ExternalLink, Download } from "lucide-react";
import { Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/shared/context/auth-context";
import { resolveFileUrl } from "@/modules/admin/api/documents.api";
import { DRAWING_CATEGORIES, fetchProjectDrawings, fetchDrawingRevisions, fetchDrawingPreviewBlob } from "@/modules/admin/api/drawing.api";

export default function PackageDrawingsSection({ projectId }) {
  const { role } = useAuth();
  const isAdminUser = role !== "subcontractor";

  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [includeSuperseded, setIncludeSuperseded] = useState(false);

  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [historyError, setHistoryError] = useState("");

  // Drawing preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [viewingDrawing, setViewingDrawing] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const loadDrawings = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchProjectDrawings(projectId, includeSuperseded);
      setDrawings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load project drawings");
    } finally {
      setLoading(false);
    }
  }, [projectId, includeSuperseded]);

  useEffect(() => {
    loadDrawings();
  }, [loadDrawings]);

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

  const handleOpenPreview = async (drawing) => {
    setViewingDrawing(drawing);
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    setPreviewError("");

    if (previewBlobUrl) {
      if (previewBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      setPreviewBlobUrl(null);
    }

    try {
      const res = await fetchDrawingPreviewBlob(projectId, drawing.id);
      if (res?.blob) {
        const url = URL.createObjectURL(res.blob);
        setPreviewBlobUrl(url);
      } else {
        setPreviewError("Could not retrieve drawing preview blob.");
      }
    } catch (err) {
      const fallbackUrl = resolveFileUrl(drawing.filePath || drawing.fileUrl);
      if (fallbackUrl) {
        setPreviewBlobUrl(fallbackUrl);
      } else {
        setPreviewError(err?.response?.data?.message || err?.message || "Failed to load drawing preview");
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = (open) => {
    setPreviewModalOpen(open);
    if (!open) {
      if (previewBlobUrl && previewBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      setPreviewBlobUrl(null);
      setViewingDrawing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Approved Project Drawings</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Official issued construction drawings and design revisions for this project
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={includeSuperseded ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setIncludeSuperseded(!includeSuperseded)}
            >
              {includeSuperseded ? "Showing All (Incl. Superseded)" : "Show Superseded"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
              {error}
            </div>
          )}

          {drawings.length === 0 ? (
            <Surface className="p-8 text-center border-dashed">
              <FileImage className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No approved drawings available</p>
              <p className="text-xs text-muted-foreground mt-1">
                No issued drawings found for this project.
              </p>
            </Surface>
          ) : (
            <div className="grid gap-3">
              {drawings.map((d) => {
                const isSuperseded = Boolean(d.isSuperseded || d.status === "SUPERSEDED");
                const categoryLabel = DRAWING_CATEGORIES.find((c) => c.value === d.category)?.label || d.category;
                const revCode = d.revisionCode || (d.revisionNo != null ? `R${d.revisionNo}` : null) || "R1";

                return (
                  <Card key={d.id} className={`border bg-background transition-colors ${isSuperseded ? "opacity-75 bg-amber-500/5 border-amber-500/30" : ""}`}>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {isSuperseded ? (
                            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                          ) : (
                            <FileImage className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{d.fileName}</p>
                            {d.drawingNumber && (
                              <Badge variant="outline" className="text-[10px] font-mono">
                                #{d.drawingNumber}
                              </Badge>
                            )}
                            <Badge variant={isSuperseded ? "destructive" : "default"} className="text-[10px]">
                              {isSuperseded ? (
                                <span className="flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> SUPERSEDED
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> CURRENT REVISION ({revCode})
                                </span>
                              )}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Category: {categoryLabel}
                            {d.revisionDate ? ` · Revised: ${new Date(d.revisionDate).toLocaleDateString()}` : ""}
                            {d.fileSize ? ` · ${(d.fileSize / 1024 / 1024).toFixed(2)} MB` : ""}
                          </p>

                          {isSuperseded && (
                            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" /> SUPERSEDED REVISION - DO NOT USE FOR CONSTRUCTION OR TAKEOFF
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => handleOpenHistory(d)}
                        >
                          <History className="w-3.5 h-3.5 mr-1" /> Revision History
                        </Button>

                        {!isSuperseded && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => handleOpenPreview(d)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Drawing
                          </Button>
                        )}

                        {!isSuperseded && isAdminUser && (
                          <Button asChild size="sm" variant="secondary" className="text-xs">
                            <Link to={`/admin/projects/${projectId}/drawings/${d.id}/qto`}>
                              QTO Workspace
                            </Link>
                          </Button>
                        )}

                        {isSuperseded && (
                          <Button size="sm" variant="secondary" disabled className="opacity-60 cursor-not-allowed text-xs">
                            <Lock className="w-3.5 h-3.5 mr-1" /> Lockout Active
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revision History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Drawing Revision History</DialogTitle>
            <DialogDescription className="text-xs">
              Audit log of all issued revisions for {selectedDrawing?.drawingNumber || selectedDrawing?.fileName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {historyLoading ? (
              <div className="flex justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : historyError ? (
              <p className="text-xs text-destructive bg-destructive/10 p-3 rounded">{historyError}</p>
            ) : (
              <div className="space-y-2">
                {revisions.map((rev, idx) => {
                  const isSup = Boolean(rev.isSuperseded || rev.status === "SUPERSEDED");
                  const rCode = rev.revisionCode || (rev.revisionNo != null ? `R${rev.revisionNo}` : null) || `Rev ${revisions.length - idx}`;
                  return (
                    <div
                      key={rev.id || idx}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                        isSup ? "bg-muted/40 border-border" : "bg-emerald-500/10 border-emerald-500/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{rCode}</span>
                          <Badge variant={isSup ? "secondary" : "default"} className="text-[10px]">
                            {isSup ? "SUPERSEDED" : "CURRENT"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          Issued: {rev.revisionDate ? new Date(rev.revisionDate).toLocaleDateString() : rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      {isSup ? (
                        <span className="text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active Print
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

      {/* Drawing Preview Viewer Modal */}
      <Dialog open={previewModalOpen} onOpenChange={handleClosePreview}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {viewingDrawing?.drawingNumber ? `[${viewingDrawing.drawingNumber}] ` : ""}
              {viewingDrawing?.fileName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {DRAWING_CATEGORIES.find((c) => c.value === viewingDrawing?.category)?.label || viewingDrawing?.category}
              {viewingDrawing?.revisionCode ? ` · ${viewingDrawing.revisionCode}` : ""}
              {viewingDrawing?.revisionDate ? ` · Revised: ${new Date(viewingDrawing.revisionDate).toLocaleDateString()}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-[60vh] flex items-center justify-center p-2 bg-muted/20 rounded-md overflow-hidden my-2">
            {previewLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Loading drawing PDF preview...</p>
              </div>
            ) : previewError ? (
              <div className="text-center p-6 text-destructive bg-destructive/10 rounded border border-destructive/20 space-y-2 max-w-md">
                <AlertCircle className="w-8 h-8 mx-auto" />
                <p className="font-medium text-sm">{previewError}</p>
              </div>
            ) : previewBlobUrl ? (
              <iframe
                src={previewBlobUrl}
                title={viewingDrawing?.fileName || "Drawing Preview"}
                className="w-full h-[65vh] rounded border bg-white"
              />
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              {previewBlobUrl && (
                <>
                  <Button size="sm" variant="outline" className="text-xs" asChild>
                    <a href={previewBlobUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open in New Tab
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" asChild>
                    <a href={previewBlobUrl} download={viewingDrawing?.fileName || "drawing.pdf"}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
                    </a>
                  </Button>
                </>
              )}
            </div>
            <Button size="sm" variant="secondary" className="text-xs" onClick={() => handleClosePreview(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
