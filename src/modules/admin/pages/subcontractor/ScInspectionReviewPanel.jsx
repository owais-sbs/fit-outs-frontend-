import React, { useState, useEffect, useCallback } from "react";
import { Loader2, FileCheck, CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { fetchProjectScInspections, reviewScInspection } from "../../api/subcontractor.api";

const STATUS_BADGES = {
  SUBMITTED: { variant: "outline", label: "Submitted", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  SCHEDULED: { variant: "secondary", label: "Scheduled", color: "bg-purple-500/10 text-purple-700 border-purple-200" },
  APPROVED: { variant: "default", label: "Approved", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  REJECTED: { variant: "destructive", label: "Rejected", color: "bg-rose-500/10 text-rose-700 border-rose-200" },
  RESUBMISSION_REQUESTED: { variant: "secondary", label: "Resubmission Requested", color: "bg-amber-500/10 text-amber-700 border-amber-200" },
};

export default function ScInspectionReviewPanel({ projectId }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedInspection, setSelectedInspection] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("APPROVED");
  const [resultNotes, setResultNotes] = useState("");
  const [evidencePaths, setEvidencePaths] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const loadInspections = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchProjectScInspections(projectId);
      setInspections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load subcontractor inspection requests");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const handleOpenReview = (item, targetStatus) => {
    setSelectedInspection(item);
    setReviewStatus(targetStatus);
    setResultNotes("");
    setEvidencePaths("");
    setReviewError("");
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInspection || !reviewStatus) return;

    setSubmitting(true);
    setReviewError("");
    try {
      await reviewScInspection(projectId, selectedInspection.uuid || selectedInspection.id, {
        status: reviewStatus,
        resultNotes: resultNotes.trim() || null,
        evidencePaths: evidencePaths.trim() || null,
      });
      setReviewModalOpen(false);
      await loadInspections();
    } catch (err) {
      setReviewError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to submit inspection review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Subcontractor Quality Inspection Requests ({inspections.length})</CardTitle>
            <CardDescription className="text-xs">
              Review and clear QA/QC hold point inspection requests raised by appointed subcontractors
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={loadInspections}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 p-3 rounded">{error}</p>
        )}

        {inspections.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
            No subcontractor inspection requests for this project.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {inspections.map((item) => {
              const st = STATUS_BADGES[item.status] || STATUS_BADGES.SUBMITTED;
              const isTerminal = item.status === "APPROVED" || item.status === "REJECTED";

              return (
                <div key={item.uuid || item.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{item.inspectionType}</p>
                        <Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
                        {item.packageName && <span>Package: <strong className="text-foreground">{item.packageName}</strong></span>}
                        {item.noticePeriodHours && <span>Notice: {item.noticePeriodHours}h</span>}
                        <span>Submitted: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}</span>
                      </div>
                    </div>

                    {!isTerminal && (
                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {item.status === "SUBMITTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => handleOpenReview(item, "SCHEDULED")}
                          >
                            Schedule
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleOpenReview(item, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs h-8"
                          onClick={() => handleOpenReview(item, "REJECTED")}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs h-8"
                          onClick={() => handleOpenReview(item, "RESUBMISSION_REQUESTED")}
                        >
                          Request Resubmission
                        </Button>
                      </div>
                    )}
                  </div>

                  {item.resultNotes && (
                    <div className="p-3 bg-muted/40 rounded text-xs border border-border/50">
                      <p className="font-semibold text-foreground mb-0.5">Review Notes ({item.inspectedBy || "Quality Manager"}):</p>
                      <p className="text-muted-foreground">{item.resultNotes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Review Dialog */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Subcontractor Inspection</DialogTitle>
            <DialogDescription className="text-xs">
              Confirm quality decision for: <strong>{selectedInspection?.inspectionType}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReviewSubmit} className="space-y-4 py-2">
            {reviewError && (
              <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded">{reviewError}</p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Review Outcome Status *</label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED" className="text-xs text-emerald-600">Approve Inspection</SelectItem>
                  <SelectItem value="REJECTED" className="text-xs text-rose-600">Reject Inspection</SelectItem>
                  <SelectItem value="RESUBMISSION_REQUESTED" className="text-xs text-amber-600">Request Resubmission</SelectItem>
                  <SelectItem value="SCHEDULED" className="text-xs text-purple-600">Schedule Site Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Inspection Result Notes & Feedback</label>
              <Textarea
                className="text-xs min-h-[80px]"
                placeholder="Enter inspection findings, quality comments, or defects to rectify..."
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Evidence / Photo File Paths (Optional)</label>
              <Input
                className="h-9 text-xs"
                placeholder="Comma separated evidence document/photo URLs..."
                value={evidencePaths}
                onChange={(e) => setEvidencePaths(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setReviewModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Submit Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
