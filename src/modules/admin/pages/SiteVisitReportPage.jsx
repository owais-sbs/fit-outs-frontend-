import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, ImagePlus, LockKeyhole, Paperclip } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { REPORT_CHECKLIST } from "../data/site-visits";
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

export default function SiteVisitReportPage() {
  const { visitId } = useParams();
  const [submitted, setSubmitted] = useState(visitId === "v4" || visitId === "v5");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [notes, setNotes] = useState(submitted ? INITIAL_NOTES : "");
  const [checks, setChecks] = useState(() =>
    Object.fromEntries(REPORT_CHECKLIST.map((item) => [item.id, submitted]))
  );

  const completedCount = useMemo(
    () => Object.values(checks).filter(Boolean).length,
    [checks]
  );
  const progress = Math.round((completedCount / REPORT_CHECKLIST.length) * 100);
  const requiredMissing = REPORT_CHECKLIST.filter((item) => item.required && !checks[item.id]);
  const readOnly = submitted;
  const canSubmit = requiredMissing.length === 0;

  const toggle = (id) => {
    if (readOnly) return;
    setChecks((current) => ({ ...current, [id]: !current[id] }));
  };

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Client information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium">Claire Moss</p>
              </div>
              <div>
                <p className="text-muted-foreground">Company</p>
                <p className="font-medium">Moss Interiors</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">200 Crown St, Surry Hills</p>
              </div>
              <div>
                <p className="text-muted-foreground">Inspector</p>
                <p className="font-medium">Lisa Park</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Checklist completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {REPORT_CHECKLIST.map((item) => {
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
                setSubmitted(true);
                setSubmitOpen(false);
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
