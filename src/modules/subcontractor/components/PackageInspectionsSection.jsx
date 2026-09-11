import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Plus, AlertCircle, CheckCircle2, XCircle, Clock, FileCheck, RefreshCw, Upload, FileText, Image as ImageIcon, Trash2, ExternalLink } from "lucide-react";
import { Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { fetchPackageInspections, createPackageInspection } from "@/modules/admin/api/subcontractor.api";

const STATUS_VARIANTS = {
  SUBMITTED: { variant: "outline", label: "Submitted", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  SCHEDULED: { variant: "secondary", label: "Scheduled", color: "bg-purple-500/10 text-purple-700 border-purple-200" },
  APPROVED: { variant: "default", label: "Approved", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  REJECTED: { variant: "destructive", label: "Rejected", color: "bg-rose-500/10 text-rose-700 border-rose-200" },
  RESUBMISSION_REQUESTED: { variant: "secondary", label: "Resubmission Requested", color: "bg-amber-500/10 text-amber-700 border-amber-200" },
};

const COMMON_INSPECTION_TYPES = [
  "Pre-Pour Concrete Inspection",
  "MEP First Fix Inspection",
  "Framing & Drywall Inspection",
  "Waterproofing Test & Inspection",
  "Ceiling Closing Inspection",
  "Final Finishes & Joinery Inspection",
  "Fire & Life Safety Inspection",
  "Custom Quality Inspection",
];

function resolveFileUrl(filePath) {
  if (!filePath) return "#";
  const clean = filePath.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("blob:")) {
    return clean;
  }
  const baseUrl = process.env.REACT_APP_API_BASE_URL || "/api";
  if (clean.startsWith("/")) {
    if (clean.startsWith("/api/")) return clean;
    return `${baseUrl}${clean}`;
  }
  return `${baseUrl}/${clean}`;
}

function isImageFile(pathOrName) {
  if (!pathOrName) return false;
  const lower = pathOrName.toLowerCase();
  return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp") || lower.endsWith(".gif");
}

export default function PackageInspectionsSection({ packageUuid }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [inspectionType, setInspectionType] = useState(COMMON_INSPECTION_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [description, setDescription] = useState("");
  const [noticePeriodHours, setNoticePeriodHours] = useState(24);
  const [activityUuid, setActivityUuid] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fileInputRef = useRef(null);

  const loadInspections = useCallback(async () => {
    if (!packageUuid) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchPackageInspections(packageUuid);
      setInspections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load inspection requests");
    } finally {
      setLoading(false);
    }
  }, [packageUuid]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;

    setFormError("");
    const valid = [];
    for (const f of newFiles) {
      if (f.size === 0) {
        setFormError(`File "${f.name}" is empty`);
        continue;
      }
      const lower = f.name.toLowerCase();
      if (lower.endsWith(".exe") || lower.endsWith(".sh") || lower.endsWith(".bat") || lower.endsWith(".cmd")) {
        setFormError(`Executable file "${f.name}" is not allowed`);
        continue;
      }
      if (f.size > 25 * 1024 * 1024) {
        setFormError(`File "${f.name}" exceeds 25MB size limit`);
        continue;
      }
      valid.push(f);
    }

    setSelectedFiles((prev) => [...prev, ...valid]);
    if (e.target) e.target.value = "";
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalType = inspectionType === "Custom Quality Inspection" ? customType.trim() : inspectionType;
    if (!finalType || !description.trim()) return;

    setSubmitting(true);
    setFormError("");
    setSuccessMsg("");
    try {
      let payload;
      if (selectedFiles.length > 0) {
        const fd = new FormData();
        fd.append("inspectionType", finalType);
        if (description.trim()) fd.append("description", description.trim());
        if (noticePeriodHours) fd.append("noticePeriodHours", String(noticePeriodHours));
        if (activityUuid.trim()) fd.append("activityUuid", activityUuid.trim());
        selectedFiles.forEach((file) => {
          fd.append("files", file);
        });
        payload = fd;
      } else {
        payload = {
          inspectionType: finalType,
          description: description.trim(),
          noticePeriodHours: Number(noticePeriodHours) || 24,
          activityUuid: activityUuid.trim() || null,
        };
      }

      await createPackageInspection(packageUuid, payload);
      setModalOpen(false);
      setDescription("");
      setActivityUuid("");
      setSelectedFiles([]);
      setSuccessMsg("Inspection request submitted successfully.");
      await loadInspections();
    } catch (err) {
      setFormError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to submit inspection request");
    } finally {
      setSubmitting(false);
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
            <CardTitle className="text-base font-semibold">Site Quality Inspections</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Submit Hold Point inspection requests and track contractor QA/QC decisions
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Request Inspection
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMsg && (
            <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
              {error}
            </div>
          )}

          {inspections.length === 0 ? (
            <Surface className="p-8 text-center border-dashed">
              <FileCheck className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No inspection requests submitted yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Request Inspection" to raise a new QA/QC Hold Point check for this package.
              </p>
            </Surface>
          ) : (
            <div className="grid gap-4">
              {inspections.map((item) => {
                const st = STATUS_VARIANTS[item.status] || STATUS_VARIANTS.SUBMITTED;
                const attachmentList = item.attachments
                  ? item.attachments.split(",").map((s) => s.trim()).filter(Boolean)
                  : [];

                return (
                  <Card key={item.uuid || item.id} className="border bg-background">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{item.inspectionType}</p>
                            <Badge className={`text-[10px] px-2 py-0.5 ${st.color}`}>
                              {st.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        </div>
                        {item.noticePeriodHours && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 bg-muted/40 px-2 py-1 rounded">
                            <Clock className="h-3 w-3" /> {item.noticePeriodHours}h notice
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2 border-t text-muted-foreground">
                        <div>
                          <span>Requested: </span>
                          <span className="font-medium text-foreground">
                            {item.createdAt || item.requestedDateTime ? new Date(item.createdAt || item.requestedDateTime).toLocaleString() : "N/A"}
                          </span>
                        </div>
                        {item.inspectedAt && (
                          <div>
                            <span>Inspected: </span>
                            <span className="font-medium text-foreground">{new Date(item.inspectedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {item.inspectedBy && (
                          <div>
                            <span>Reviewer: </span>
                            <span className="font-medium text-foreground">{item.inspectedBy}</span>
                          </div>
                        )}
                      </div>

                      {/* Uploaded Attachments Display */}
                      {attachmentList.length > 0 && (
                        <div className="pt-2 border-t space-y-1.5">
                          <p className="text-[11px] font-semibold text-muted-foreground">Attached Files / Photos ({attachmentList.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {attachmentList.map((path, idx) => {
                              const fullUrl = resolveFileUrl(path);
                              const fileName = path.split("/").pop() || `Attachment ${idx + 1}`;
                              const isImg = isImageFile(path);

                              return isImg ? (
                                <a
                                  key={idx}
                                  href={fullUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative rounded-lg border overflow-hidden bg-muted/30 hover:border-primary transition-colors inline-block"
                                  title={fileName}
                                >
                                  <img
                                    src={fullUrl}
                                    alt={fileName}
                                    className="h-16 w-16 object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = "none";
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <ExternalLink className="h-4 w-4" />
                                  </div>
                                </a>
                              ) : (
                                <Button key={idx} asChild size="sm" variant="outline" className="text-xs h-7 gap-1">
                                  <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                                    <FileText className="h-3 w-3" /> {fileName}
                                  </a>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Result Notes */}
                      {item.resultNotes && (
                        <div className={`p-3 rounded text-xs border ${
                          item.status === "APPROVED" 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                            : item.status === "REJECTED"
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                        }`}>
                          <p className="font-semibold mb-0.5">Contractor Review Notes:</p>
                          <p>{item.resultNotes}</p>
                        </div>
                      )}

                      {/* Resubmission Action */}
                      {item.status === "RESUBMISSION_REQUESTED" && (
                        <div className="pt-2 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => {
                              setInspectionType(item.inspectionType);
                              setDescription(`Resubmission for: ${item.description}`);
                              setModalOpen(true);
                            }}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> Submit Revised Request
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Inspection Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Site Quality Inspection</DialogTitle>
            <DialogDescription className="text-xs">
              Raise a new hold point inspection request for the main contractor / project team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Inspection Category / Type *</Label>
              <Select value={inspectionType} onValueChange={setInspectionType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_INSPECTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {inspectionType === "Custom Quality Inspection" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Custom Inspection Title *</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder="Specify inspection title..."
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Description / Inspection Scope *</Label>
              <Textarea
                className="text-xs min-h-[80px]"
                placeholder="Describe work completed and specific area ready for inspection..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Notice Period (Hours) *</Label>
                <Input
                  type="number"
                  min="1"
                  className="h-9 text-xs"
                  value={noticePeriodHours}
                  onChange={(e) => setNoticePeriodHours(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Activity Reference (Optional)</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder="e.g. Zone B Slab 2"
                  value={activityUuid}
                  onChange={(e) => setActivityUuid(e.target.value)}
                />
              </div>
            </div>

            {/* Photos / Attachments File Picker */}
            <div className="space-y-2 pt-1 border-t">
              <Label className="text-xs font-medium">Photos / Attachments (Optional)</Label>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs w-full border-dashed gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 text-primary" /> Choose Site Photos / Documents
                </Button>
              </div>

              {/* Selected Files Preview List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Selected Files ({selectedFiles.length}):
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {selectedFiles.map((file, idx) => {
                      const isImg = file.type.startsWith("image/");
                      const previewUrl = isImg ? URL.createObjectURL(file) : null;

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 text-xs gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isImg && previewUrl ? (
                              <img src={previewUrl} alt={file.name} className="h-9 w-9 object-cover rounded border shrink-0" />
                            ) : (
                              <FileText className="h-5 w-5 text-primary shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate text-foreground text-[11px]">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleRemoveFile(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Submit Inspection Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
