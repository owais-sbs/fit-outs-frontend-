import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calendar, Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchVariation, submitVariationReview, triageVariation, updateVariation,
  uploadVariationAttachment,
} from "@/modules/admin/api/variations.api";
import {
  approveCommercialTask, rejectCommercialTask,
} from "@/modules/admin/api/commercial-approvals.api";
import { formatCurrency } from "@/modules/admin/pages/boq/quantityCalcUtils";
import { useAuth } from "@/shared/context/auth-context";
import { ROLES } from "@/shared/constants/roles";

export default function VariationDetailPage() {
  const { projectId, uuid } = useParams();
  const { role } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [comment, setComment] = useState("");
  const [sellEdit, setSellEdit] = useState("");
  const [costEdit, setCostEdit] = useState("");
  const [delayEdit, setDelayEdit] = useState("0");
  const [applyScheduleEdit, setApplyScheduleEdit] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchVariation(projectId, uuid)
      .then((v) => {
        setItem(v);
        setSellEdit(v?.sellDelta != null ? String(v.sellDelta) : "");
        setCostEdit(v?.costDelta != null ? String(v.costDelta) : "");
        setDelayEdit(v?.proposedDelayDays != null ? String(v.proposedDelayDays) : "0");
        setApplyScheduleEdit(Boolean(v?.applyScheduleOnApproval));
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [projectId, uuid]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      setMessage(okMsg);
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const savePricing = () => run(async () => {
    await updateVariation(projectId, uuid, {
      title: item.title,
      description: item.description,
      reasonCode: item.reasonCode,
      proposedDelayDays: Number(delayEdit || 0),
      applyScheduleOnApproval: applyScheduleEdit,
      lines: [{
        lineType: "LUMP_SUM",
        description: item.title,
        quantity: 1,
        sellRate: Number(sellEdit || 0),
        costRate: Number(costEdit || 0),
      }],
    });
  }, "Pricing & schedule settings saved");

  if (loading) {
    return (
      <PageShell>
        <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </PageShell>
    );
  }
  if (!item) {
    return (
      <PageShell>
        <p className="text-muted-foreground">Variation not found</p>
      </PageShell>
    );
  }

  const pendingTasks = (item.approvalRun?.tasks || []).filter((t) => t.status === "PENDING");
  const canTriage = [ROLES.PROJECT_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);
  const editable = ["DRAFT", "REVISED"].includes(item.status);

  return (
    <PageShell>
      <PageTitle
        title={`${item.crNumber} — ${item.title}`}
        description={`${item.origin} · ${item.status?.replace(/_/g, " ")}`}
        actions={(
          <Button variant="outline" asChild>
            <Link to={window.location.pathname.replace(/\/[^/]+$/, "")}>Back</Link>
          </Button>
        )}
      />

      {message && <p className="text-sm mb-3 text-muted-foreground">{message}</p>}

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Surface className="p-4 space-y-2 text-sm lg:col-span-2">
          <div><span className="text-muted-foreground">Reason:</span> {item.reasonCode || "—"}</div>
          <div className="whitespace-pre-wrap">{item.description || "No description"}</div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>Sell delta: <strong>{formatCurrency(item.sellDelta)}</strong></div>
            <div>Cost delta: <strong>{formatCurrency(item.costDelta)}</strong></div>
            <div>Margin delta: <strong>{formatCurrency(item.marginDelta)}</strong></div>
            <div>Delay days: <strong>{item.proposedDelayDays ?? "—"}</strong></div>
            <div>Current contract: <strong>{formatCurrency(item.currentContractValue)}</strong></div>
            <div>Proposed contract: <strong>{formatCurrency(item.proposedContractValue)}</strong></div>
          </div>
          {item.lockedAt && (
            <Badge className="mt-2">Locked {new Date(item.lockedAt).toLocaleString()}</Badge>
          )}
          {item.rejectComment && (
            <p className="text-destructive text-sm mt-2">Reject note: {item.rejectComment}</p>
          )}
        </Surface>

        <Surface className="p-4 space-y-3">
          {item.status === "AWAITING_TRIAGE" && canTriage && (
            <>
              <Label>Triage note</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="flex gap-2">
                <Button disabled={busy} onClick={() => run(
                  () => triageVariation(projectId, uuid, { accept: true, note: comment }),
                  "Accepted to draft",
                )}>Accept</Button>
                <Button variant="outline" disabled={busy} onClick={() => run(
                  () => triageVariation(projectId, uuid, { accept: false, note: comment || "Rejected" }),
                  "Rejected",
                )}>Reject</Button>
              </div>
            </>
          )}

          {editable && (
            <>
              <Label>Sell amount</Label>
              <Input type="number" value={sellEdit} onChange={(e) => setSellEdit(e.target.value)} />
              <Label>Cost amount</Label>
              <Input type="number" value={costEdit} onChange={(e) => setCostEdit(e.target.value)} />

              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="applySchedule"
                    checked={applyScheduleEdit}
                    onChange={(e) => setApplyScheduleEdit(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <Label htmlFor="applySchedule" className="cursor-pointer text-xs font-medium">
                    Apply schedule re-baseline on approval
                  </Label>
                </div>
                {applyScheduleEdit && (
                  <div>
                    <Label className="text-xs">Proposed delay days (+ extension / - acceleration)</Label>
                    <Input
                      type="number"
                      value={delayEdit}
                      onChange={(e) => setDelayEdit(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              <Button disabled={busy} variant="outline" onClick={savePricing}>Save pricing</Button>
              <Button disabled={busy} onClick={() => run(
                () => submitVariationReview(projectId, uuid),
                "Submitted for internal review",
              )}>Submit for review</Button>
              <div>
                <Label>Attachment</Label>
                <Input type="file" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) run(() => uploadVariationAttachment(projectId, uuid, f), "Uploaded");
                }} />
              </div>
            </>
          )}

          {item.status === "INTERNAL_REVIEW" && pendingTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Your approval tasks</p>
              {pendingTasks.map((t) => (
                <div key={t.uuid} className="border rounded-md p-2 space-y-2">
                  <div className="text-xs text-muted-foreground">{t.role} · step {t.stepOrder}</div>
                  <Textarea placeholder="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy} onClick={() => run(
                      () => approveCommercialTask(t.uuid, comment),
                      "Approved",
                    )}>Approve</Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => run(
                      () => rejectCommercialTask(t.uuid, comment || "Rejected"),
                      "Rejected",
                    )}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>

      {item.approvalRun && (
        <Surface className="p-4 mb-4">
          <h3 className="font-semibold text-sm mb-2">Internal approval run</h3>
          <ul className="text-sm space-y-1">
            {(item.approvalRun.tasks || []).map((t) => (
              <li key={t.uuid}>
                Step {t.stepOrder} · {t.role} · <Badge variant="outline">{t.status}</Badge>
                {t.comment ? ` — ${t.comment}` : ""}
              </li>
            ))}
          </ul>
        </Surface>
      )}

      {(() => {
        const scheduleOutcome = parseScheduleOutcome(item.events);
        if (!scheduleOutcome) return null;
        return (
          <Surface className="p-4 mb-4 space-y-3 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm">Schedule Re-baseline</h3>
              </div>
              <Badge
                variant={
                  scheduleOutcome.status === "COMPLETED"
                    ? "default"
                    : scheduleOutcome.status === "FAILED"
                    ? "destructive"
                    : "secondary"
                }
              >
                {scheduleOutcome.status || scheduleOutcome.action}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {scheduleOutcome.message || "Schedule re-baseline recorded"}
            </p>

            {scheduleOutcome.error && (
              <div className="p-2 text-xs bg-destructive/10 text-destructive rounded-md">
                <strong>Failure reason:</strong> {scheduleOutcome.error}
              </div>
            )}

            {scheduleOutcome.baselineName && (
              <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-md border">
                <div>
                  <span className="text-muted-foreground">Snapshot Baseline:</span>{" "}
                  <strong className="font-mono text-foreground">{scheduleOutcome.baselineName}</strong>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/admin/projects/${projectId}/schedule`}>View in Gantt</Link>
                </Button>
              </div>
            )}

            {scheduleOutcome.activities?.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-medium text-muted-foreground">Activities Extended:</p>
                <div className="text-xs divide-y border rounded-md">
                  {scheduleOutcome.activities.map((act, idx) => (
                    <div key={act.activityUuid || idx} className="p-2 flex justify-between items-center bg-card">
                      <span className="font-medium">{act.activityName || act.activityUuid}</span>
                      <span className="text-muted-foreground font-mono">
                        {act.oldDuration}d → <strong className="text-foreground">{act.newDuration}d</strong>
                        {act.delayApplied ? ` (${act.delayApplied > 0 ? "+" : ""}${act.delayApplied}d)` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Surface>
        );
      })()}

      {item.events?.length > 0 && (
        <Surface className="p-4">
          <h3 className="font-semibold text-sm mb-2">Audit trail</h3>
          <ul className="text-sm space-y-2">
            {item.events.map((e) => {
              const detailParsed = parseEventDetail(e.detail);
              return (
                <li key={e.uuid} className="border-b pb-2">
                  <div className="font-medium">{e.action}</div>
                  <div className="text-muted-foreground text-xs">
                    {e.fromStatus} → {e.toStatus} · {e.createdAt ? new Date(e.createdAt).toLocaleString() : ""}
                  </div>
                  {detailParsed ? (
                    <div className="text-xs mt-1 space-y-0.5">
                      {detailParsed.message && <div>{detailParsed.message}</div>}
                      {detailParsed.error && (
                        <div className="text-destructive font-medium">Error: {detailParsed.error}</div>
                      )}
                      {detailParsed.baselineName && (
                        <div className="text-muted-foreground">
                          Baseline: <span className="font-mono">{detailParsed.baselineName}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    e.detail && <div className="text-xs mt-1">{e.detail}</div>
                  )}
                  {(e.previousContractValue != null || e.newContractValue != null) && (
                    <div className="text-xs mt-1">
                      Contract {formatCurrency(e.previousContractValue)} → {formatCurrency(e.newContractValue)}
                      {" · "}
                      Margin {formatCurrency(e.previousMargin)} → {formatCurrency(e.newMargin)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Surface>
      )}
    </PageShell>
  );
}

function parseScheduleOutcome(events = []) {
  if (!Array.isArray(events) || events.length === 0) return null;
  const target =
    events.find((e) => e.action === "SCHEDULE_REBASELINED" || e.action === "SCHEDULE_REBASELINE_FAILED" || e.action === "SCHEDULE_SKIPPED") ||
    events.find((e) => e.action === "CLIENT_APPROVED" && e.detail);

  if (!target || !target.detail) return null;

  try {
    const data = JSON.parse(target.detail);
    return {
      action: target.action,
      ...data,
    };
  } catch {
    return {
      action: target.action,
      message: target.detail,
      status: target.action === "SCHEDULE_REBASELINE_FAILED" ? "FAILED" : "COMPLETED",
    };
  }
}

function parseEventDetail(detail) {
  if (!detail) return null;
  try {
    return JSON.parse(detail);
  } catch {
    return null;
  }
}
