import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, ImagePlus, LockKeyhole, Paperclip } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { REPORT_CHECKLIST } from "../data/site-visits";
import axiosInstance from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const INITIAL_NOTES =
  "Ceiling grid is suitable for LED panels. Client requested premium finish in reception and a clear path for cable runs.";

const MOCK_PHOTOS = ["Reception", "Services", "Floor plan"];

function fallbackChecklistItems() {
  return REPORT_CHECKLIST.map((item) => ({
    id: item.id,
    label: item.label,
    required: item.required,
  }));
}

function normalizeTemplateItem(item) {
  return {
    id: String(item.uuid),
    label: item.question || item.sectionName || "Checklist item",
    required: Boolean(item.isRequired),
    sectionName: item.sectionName || "",
  };
}

function locationLabel(locationDetails = {}) {
  return [
    locationDetails.addressLine1,
    locationDetails.buildingName,
    locationDetails.area,
    locationDetails.city,
    locationDetails.state,
  ].filter(Boolean).join(", ") || "Location not specified";
}

export default function SiteVisitReportPage() {
  const { visitId } = useParams();
  const [submitted, setSubmitted] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [visit, setVisit] = useState(null);
  const [lead, setLead] = useState(null);
  const [checklistItems, setChecklistItems] = useState(fallbackChecklistItems);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [conversion, setConversion] = useState(null);
  const [checks, setChecks] = useState(() =>
    Object.fromEntries(fallbackChecklistItems().map((item) => [item.id, false]))
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    axiosInstance.get(`/site-visits/GetSiteVisitByUuid/${visitId}`)
      .then(async ({ data }) => {
        if (cancelled) return;
        const visitData = data?.data;
        setVisit(visitData);
        const completed = String(visitData?.status || "").toUpperCase() === "COMPLETED";
        setSubmitted(completed);
        setNotes(completed ? (visitData?.notes || INITIAL_NOTES) : "");

        const [templateResult, leadResult] = await Promise.allSettled([
          visitData?.checklistTemplateUuid
            ? axiosInstance.get(`/checklist-templates/GetCheckListByUuid/${visitData.checklistTemplateUuid}`)
            : Promise.resolve({ data: { data: null } }),
          visitData?.leadId
            ? axiosInstance.get(`/leads/${visitData.leadId}`)
            : Promise.resolve({ data: { data: null } }),
        ]);

        if (cancelled) return;
        const template = templateResult.status === "fulfilled" ? templateResult.value.data?.data : null;
        const templateItems = Array.isArray(template?.items) && template.items.length > 0
          ? template.items.map(normalizeTemplateItem)
          : fallbackChecklistItems();
        setChecklistItems(templateItems);
        setChecks(Object.fromEntries(templateItems.map((item) => [item.id, completed])));

        const leadData = leadResult.status === "fulfilled" ? leadResult.value.data?.data : null;
        setLead(leadData);
      })
      .catch((err) => {
        if (cancelled) return;
        const completedMockVisit = visitId === "v4" || visitId === "v5";
        const fallbackItems = fallbackChecklistItems();
        setChecklistItems(fallbackItems);
        setChecks(Object.fromEntries(fallbackItems.map((item) => [item.id, completedMockVisit])));
        setSubmitted(completedMockVisit);
        setNotes(completedMockVisit ? INITIAL_NOTES : "");
        setError(err.response?.data?.error || err.response?.data?.message || "Unable to load site visit report details");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [visitId]);

  const completedCount = useMemo(
    () => Object.values(checks).filter(Boolean).length,
    [checks]
  );
  const progress = checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 0;
  const requiredMissing = checklistItems.filter((item) => item.required && !checks[item.id]);
  const readOnly = submitted;
  const canSubmit = requiredMissing.length === 0;

  const toggle = (id) => {
    if (readOnly) return;
    setChecks((current) => ({ ...current, [id]: !current[id] }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await axiosInstance.post(`/site-visits/EmployeeSiteVisitByUuid/${visitId}/report`, {
        outcome: "QUALIFIED",
        notes,
        items: checklistItems.map((item) => ({
          templateItemUuid: item.id,
          response: checks[item.id] ? "YES" : "",
          remarks: "",
          photoUrls: [],
        })),
      });

      setConversion(data?.data || null);
      setSubmitted(true);
      setSubmitOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to submit site visit report");
      setSubmitOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const clientName = lead?.clientName || (visit ? `Lead #${visit.leadId}` : "Client");
  const companyName = lead?.company || visit?.locationDetails?.buildingName || "—";
  const visitLocation = visit ? locationLabel(visit.locationDetails) : "Location not specified";
  const assignee = visit?.assignedTo ? `User #${visit.assignedTo}` : "—";

  return (
    <div className="space-y-6 pb-28">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={ROUTES.ADMIN.SITE_VISITS}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Site visits
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site visit report</h1>
          <p className="text-muted-foreground">Visit {visitId} - Commercial fit-out inspection</p>
        </div>
        {readOnly ? (
          <Badge variant="success" className="gap-1">
            <Check className="h-3 w-3" />
            Submitted
          </Badge>
        ) : (
          <Badge variant="warning">{progress}% complete</Badge>
        )}
      </div>

      {readOnly && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-primary">
            <LockKeyhole className="h-4 w-4" />
            This report is read-only after submission.
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading report details...</CardContent>
        </Card>
      )}

      {!loading && (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Client information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium">{clientName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Company</p>
                <p className="font-medium">{companyName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{visitLocation}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Inspector</p>
                <p className="font-medium">{assignee}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Checklist completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklistItems.map((item) => {
                const checked = !!checks[item.id];
                const isRequiredMissing = item.required && !checked && !readOnly;

                return (
                  <label
                    key={item.id}
                    className={[
                      "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                      checked ? "border-primary/20 bg-primary/5" : "border-border/60 bg-card",
                      isRequiredMissing ? "border-destructive/30 bg-destructive/5" : "",
                      readOnly ? "cursor-default" : "cursor-pointer hover:bg-muted/30",
                    ].join(" ")}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(item.id)} disabled={readOnly} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.sectionName && <Badge variant="outline" className="text-[10px]">{item.sectionName}</Badge>}
                        {item.required && (
                          <Badge variant={checked ? "success" : "destructive"} className="text-[10px]">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {checked ? "Completed" : item.required ? "Must be completed before submission" : "Optional inspection item"}
                      </p>
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Notes and observations</CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="mb-2 block text-sm">Inspection notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={readOnly}
                rows={5}
                placeholder="Site observations and recommendations..."
              />
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Photos and attachments</CardTitle>
            </CardHeader>
            <CardContent>
              {readOnly ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {MOCK_PHOTOS.map((label) => (
                    <div
                      key={label}
                      className="flex h-28 items-center justify-center rounded-xl border border-border/60 bg-muted text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {["Upload image", "Upload image", "Upload image"].map((label, index) => (
                    <div
                      key={index}
                      className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground"
                    >
                      <ImagePlus className="mb-2 h-7 w-7" />
                      <p className="text-xs">{label}</p>
                    </div>
                  ))}
                  <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground">
                    <Paperclip className="mb-2 h-7 w-7" />
                    <p className="text-xs">Attach notes or files</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6 border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Report status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Required items missing</span>
                <span className="font-medium">{requiredMissing.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium">{readOnly ? "Read-only" : "Editable"}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                After submission, the entire report is locked and marked as submitted.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Submission rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Required checklist items must be completed before submission.</p>
              <p>Submitted reports become fully read-only with disabled inputs.</p>
              <p>The current report state is preserved for completed visits.</p>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {!readOnly && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" asChild>
              <Link to={ROUTES.ADMIN.SITE_VISITS}>Cancel</Link>
            </Button>
            <Button disabled={!canSubmit} onClick={() => setSubmitOpen(true)} className="gap-2">
              <Check className="h-4 w-4" />
              Submit report
            </Button>
          </div>
        </div>
      )}

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit report?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The report will switch to read-only mode after submission.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleSubmit();
              }}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!conversion} onOpenChange={(open) => { if (!open) setConversion(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report submitted</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">The site visit is complete and the linked lead is now a client.</p>
            {conversion?.clientEmail && (
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Client email</p>
                <p className="font-medium">{conversion.clientEmail}</p>
              </div>
            )}
            {conversion?.temporaryPassword && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">Temporary password</p>
                <p className="font-mono text-base font-semibold">{conversion.temporaryPassword}</p>
              </div>
            )}
            {!conversion?.temporaryPassword && (
              <p className="text-xs text-muted-foreground">An existing account was reused, so no new password was generated.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setConversion(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
