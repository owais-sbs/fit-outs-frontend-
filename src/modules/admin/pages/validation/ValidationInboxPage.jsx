import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Check, ClipboardCheck, HardHat, Loader2, Plus, X, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { AttachmentList } from "@/components/shared/AttachmentField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchValidationInbox,
  fetchProjectValidations,
  approveValidation,
  rejectValidation,
  fetchHoldPoints,
  createHoldPoint,
  clearHoldPoint,
  fetchQualityTemplate,
} from "../../api/validation.api";
import { projectPlanningBackPath } from "@/shared/constants/routes";
import ProjectLifecycleBanner from "../../components/projects/ProjectLifecycleBanner";
import { useProjectLifecycle } from "../../hooks/useProjectLifecycle";
import {
  approveScClaim,
  rejectScClaim,
  measureScClaim,
  certifyScClaim,
  markScCertificatePayable,
  approveScVariation,
  rejectScVariation,
  approveScInvoice,
  rejectScInvoice,
  markScInvoicePaid,
} from "../../api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";

const TAB = { PROGRESS: "progress", CLAIMS: "claims", VARIATIONS: "variations", INVOICES: "invoices" };

function parseChecklist(raw) {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return null;
  }
}

function claimStatus(item) {
  const s = item?.status;
  if (s && typeof s === "object" && s.name) return String(s.name).toUpperCase();
  return String(s || "").toUpperCase();
}

export default function ValidationInboxPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const { commercialStage, archived } = useProjectLifecycle(projectId || null);
  const backPath = projectPlanningBackPath(location, projectId);
  const backLabel = projectId
    ? (location.state?.from === "detail" ? "Project" : "Schedule")
    : "Dashboard";

  const [inbox, setInbox] = useState({
    progressItems: [],
    claimItems: [],
    pendingProgressCount: 0,
    pendingClaimCount: 0,
  });
  const [activeTab, setActiveTab] = useState(TAB.PROGRESS);
  const [holdPoints, setHoldPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [rejectReasons, setRejectReasons] = useState({});
  const [measureForms, setMeasureForms] = useState({});
  const [holdForm, setHoldForm] = useState({
    title: "",
    activityUuid: "",
    activityType: "",
    notes: "",
    checklistItems: [""],
  });

  const load = useCallback(() => {
    setLoading(true);
    setMessage("");
    const req = projectId ? fetchProjectValidations(projectId) : fetchValidationInbox();
    const holdReq = projectId
      ? fetchHoldPoints(projectId).catch(() => [])
      : Promise.resolve([]);
    Promise.all([req, holdReq])
      .then(([data, holds]) => {
        setInbox(data);
        setHoldPoints(Array.isArray(holds) ? holds : []);
      })
      .catch((err) => {
        setInbox({
          progressItems: [],
          claimItems: [],
          pendingProgressCount: 0,
          pendingClaimCount: 0,
        });
        setMessage(
          err?.response?.data?.error
            || err?.response?.data?.message
            || err?.message
            || "Failed to load validation inbox"
        );
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMsg) => {
    if (projectId && archived) {
      setMessage("This project is archived and read-only.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await load();
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const setChecklistItem = (index, value) => {
    setHoldForm((f) => {
      const next = [...f.checklistItems];
      next[index] = value;
      return { ...f, checklistItems: next };
    });
  };

  const addChecklistItem = () =>
    setHoldForm((f) => ({ ...f, checklistItems: [...f.checklistItems, ""] }));

  const removeChecklistItem = (index) =>
    setHoldForm((f) => ({
      ...f,
      checklistItems: f.checklistItems.length <= 1
        ? [""]
        : f.checklistItems.filter((_, i) => i !== index),
    }));

  const loadTemplate = async () => {
    const type = holdForm.activityType.trim();
    if (!type) {
      setMessage("Enter an activity type to load a template");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const tpl = await fetchQualityTemplate(type);
      const items = parseChecklist(tpl?.checklistItems || tpl?.checklistJson || tpl);
      if (items.length) {
        setHoldForm((f) => ({ ...f, checklistItems: items }));
        setMessage(`Loaded ${items.length} checklist item(s) from template`);
      } else {
        setMessage("Template empty or not found");
      }
    } catch {
      setMessage("Quality template not available for this activity type");
    } finally {
      setBusy(false);
    }
  };

  const progressItems = inbox.progressItems || [];
  const claimItems = inbox.claimItems || [];
  const { needsAction, acceptedOrCertified, rejected } = useMemo(() => {
    const needsAction = [];
    const acceptedOrCertified = [];
    const rejected = [];
    for (const item of claimItems) {
      const s = claimStatus(item);
      if (["SUBMITTED", "PENDING", "UNDER_REVIEW", "MEASURED"].includes(s)) {
        needsAction.push(item);
      } else if (["APPROVED", "CERTIFIED", "PAID"].includes(s)) {
        acceptedOrCertified.push(item);
      } else if (s === "REJECTED") {
        rejected.push(item);
      }
    }
    return { needsAction, acceptedOrCertified, rejected };
  }, [claimItems]);
  const variationItems = inbox.variationItems || [];
  const invoiceItems = inbox.invoiceItems || [];
  const totalPending = (inbox.pendingProgressCount || 0) + (inbox.pendingClaimCount || 0)
    + (inbox.pendingVariationCount || 0) + (inbox.pendingInvoiceCount || 0);

  if (loading) {
    return (
      <PageShell className="w-full max-w-none px-3 md:px-4 flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="w-full max-w-none px-3 md:px-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title={`Back to ${backLabel}`}>
          <Link to={backPath}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <span className="text-sm text-muted-foreground hidden sm:inline">Back to {backLabel}</span>
        <PageTitle
          title={projectId ? "Project Validations" : "Validation Inbox"}
          subtitle={
            projectId
              ? `Project #${projectId} · ${totalPending} pending`
              : `${totalPending} pending approvals across progress and subcontractor claims`
          }
        />
      </div>

      {projectId ? <ProjectLifecycleBanner commercialStage={commercialStage} /> : null}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={activeTab === TAB.PROGRESS ? "default" : "outline"}
          onClick={() => setActiveTab(TAB.PROGRESS)}
        >
          <ClipboardCheck className="h-4 w-4 mr-1" />
          Progress ({inbox.pendingProgressCount || 0})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === TAB.CLAIMS ? "default" : "outline"}
          onClick={() => setActiveTab(TAB.CLAIMS)}
        >
          <HardHat className="h-4 w-4 mr-1" />
          Subcontractor claims ({needsAction.length} pending
          {` · ${acceptedOrCertified.length} approved`}
          {` · ${rejected.length} rejected`})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === TAB.VARIATIONS ? "default" : "outline"}
          onClick={() => setActiveTab(TAB.VARIATIONS)}
        >
          Variations ({inbox.pendingVariationCount || 0})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === TAB.INVOICES ? "default" : "outline"}
          onClick={() => setActiveTab(TAB.INVOICES)}
        >
          SC invoices ({inbox.pendingInvoiceCount || 0})
        </Button>
      </div>

      {activeTab === TAB.PROGRESS && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Schedule progress ({progressItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No pending progress validations</p>
            ) : (
              <div className="divide-y divide-border/40">
                {progressItems.map((item) => (
                  <div key={item.uuid} className="flex flex-col sm:flex-row sm:items-start gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="border-none bg-amber-500/15 text-amber-700">
                          {item.status || "PENDING"}
                        </Badge>
                        <span className="text-sm font-medium">
                          {item.activityName || "Schedule activity"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.projectName ? item.projectName : `Project #${item.projectId}`}
                        {item.percentComplete != null ? ` · ${item.percentComplete}% complete` : ""}
                        {item.reportedByName ? ` · ${item.reportedByName}` : ""}
                        {formatDate(item.reportedAt) ? ` · ${formatDate(item.reportedAt)}` : ""}
                      </p>
                      {item.progressNotes && (
                        <p className="text-xs text-muted-foreground mt-1">{item.progressNotes}</p>
                      )}
                      {Array.isArray(item.materialIssues) && item.materialIssues.length > 0 && (
                        <div className="mt-2 rounded-md border border-border/40 bg-muted/20 p-2 space-y-1">
                          <p className="text-[11px] font-medium">Materials declared vs plan</p>
                          {item.materialIssues.map((m) => (
                            <div
                              key={m.uuid || `${m.materialId}-${m.qty}`}
                              className="flex justify-between gap-2 text-[11px] text-muted-foreground"
                            >
                              <span className="truncate">{m.materialName || m.materialId}</span>
                              <span className="tabular-nums whitespace-nowrap">
                                used {Number(m.qty ?? 0)} / planned {Number(m.plannedQty ?? 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <AttachmentList paths={item.photoPaths} className="mt-2" />
                      {item.reason && (
                        <p className="text-xs text-destructive mt-1">Reason: {item.reason}</p>
                      )}
                    </div>
                    {(item.status === "PENDING" || !item.status) && (
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <Input
                          className="h-8 w-full sm:w-40 text-xs"
                          placeholder="Reject reason"
                          value={rejectReasons[`p-${item.uuid}`] || ""}
                          onChange={(e) =>
                            setRejectReasons((m) => ({ ...m, [`p-${item.uuid}`]: e.target.value }))
                          }
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => run(() => approveValidation(item.uuid), "Progress approved — schedule updated")}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              run(
                                () => rejectValidation(item.uuid, rejectReasons[`p-${item.uuid}`]),
                                "Progress rejected"
                              )
                            }
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === TAB.CLAIMS && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Subcontractor claims ({claimItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {claimItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No pending subcontractor claims</p>
            ) : (
              <div className="space-y-4">
                {[
                  { key: "action", title: "Needs action", items: needsAction, tone: "default" },
                  { key: "accepted", title: "Accepted only (not measured yet)", items: acceptedOrCertified.filter((i) => claimStatus(i) === "APPROVED"), tone: "green" },
                  { key: "certified", title: "Certified — certificate with SC", items: acceptedOrCertified.filter((i) => ["CERTIFIED", "PAID"].includes(claimStatus(i))), tone: "green" },
                  { key: "rejected", title: "Rejected", items: rejected, tone: "red" },
                ]
                  .filter((section) => section.items.length > 0)
                  .map((section) => (
                    <div key={section.key} className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-1">
                        {section.title} ({section.items.length})
                      </p>
                      <div className="space-y-2">
                        {section.items.map((item) => {
                          const status = claimStatus(item);
                          const isRejected = status === "REJECTED";
                          const isApproved = status === "APPROVED" || status === "CERTIFIED" || status === "PAID";
                          const isMeasured = status === "MEASURED";
                          const canMeasure =
                            status === "SUBMITTED" || status === "PENDING" || status === "UNDER_REVIEW" || status === "APPROVED";
                          const canAcceptReject = status === "SUBMITTED" || status === "PENDING";
                          return (
                            <div
                              key={String(item.uuid)}
                              className={`flex flex-col sm:flex-row sm:items-start gap-3 rounded-lg border border-border/40 py-3 px-3 ${
                                section.tone === "red"
                                  ? "bg-red-50/90"
                                  : section.tone === "green"
                                    ? "bg-emerald-50/90"
                                    : "bg-background"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    className={`border-none ${
                                      isRejected
                                        ? "bg-red-600/15 text-red-700"
                                        : isApproved
                                          ? "bg-emerald-600/15 text-emerald-800"
                                          : isMeasured
                                            ? "bg-blue-500/15 text-blue-700"
                                            : "bg-amber-500/15 text-amber-700"
                                    }`}
                                  >
                                    {status || "SUBMITTED"}
                                  </Badge>
                                  <span
                                    className={`text-sm font-medium ${
                                      isRejected ? "text-red-900" : isApproved ? "text-emerald-900" : ""
                                    }`}
                                  >
                                    {item.packageName || "Work package"}
                                  </span>
                                  {item.claimNumber && (
                                    <span className="text-[11px] text-muted-foreground font-mono">{item.claimNumber}</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.projectName ? item.projectName : `Project #${item.projectId}`}
                                  {item.subcontractorName ? ` · ${item.subcontractorName}` : ""}
                                  {item.submittedByName ? ` · ${item.submittedByName}` : ""}
                                  {formatDate(item.submittedAt) ? ` · ${formatDate(item.submittedAt)}` : ""}
                                </p>
                                <div className="mt-2 grid grid-cols-2 gap-2 max-w-md sm:grid-cols-4">
                                  <div className="rounded-lg bg-secondary/60 px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Claimed qty</p>
                                    <p className="text-sm font-semibold tabular-nums">{Number(item.claimedQty ?? 0)}</p>
                                  </div>
                                  <div className="rounded-lg bg-secondary/60 px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Measured</p>
                                    <p className="text-sm font-semibold tabular-nums">{item.measuredQty ?? item.measuredValue ?? "—"}</p>
                                  </div>
                                  <div className="rounded-lg bg-secondary/60 px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Certified</p>
                                    <p className="text-sm font-semibold tabular-nums">{item.certifiedValue ?? "—"}</p>
                                  </div>
                                  <div className="rounded-lg bg-secondary/60 px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Claimed value</p>
                                    <p className="text-sm font-semibold tabular-nums">{item.claimedValue ?? "—"}</p>
                                  </div>
                                </div>
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                                )}
                                {isRejected && item.reason && (
                                  <p className="mt-2 text-xs font-medium text-red-700">
                                    Rejection reason: {item.reason}
                                  </p>
                                )}
                                {isApproved && (
                                  <p className="mt-2 text-xs font-medium text-emerald-700">
                                    {status === "CERTIFIED" || status === "PAID"
                                      ? `Certified${item.certifiedValue != null ? ` · value ${item.certifiedValue}` : ""}${item.certificateUuid ? ` · cert ${String(item.certificateUuid).slice(0, 8).toUpperCase()}` : ""}`
                                      : `Accepted${formatDate(item.decidedAt) ? ` · ${formatDate(item.decidedAt)}` : ""} — ready to measure`}
                                  </p>
                                )}
                                <AttachmentList paths={item.attachmentPaths} className="mt-2" />
                              </div>
                              {isRejected ? (
                                <div className="text-xs text-red-600/90 sm:text-right max-w-xs">
                                  Rejected{formatDate(item.decidedAt) ? ` · ${formatDate(item.decidedAt)}` : ""}.
                                  Subcontractor can revise and resubmit.
                                </div>
                              ) : status === "CERTIFIED" || status === "PAID" ? (
                                <div className="flex flex-col gap-2 sm:items-end text-xs text-emerald-800 max-w-xs">
                                  <p>
                                    {status === "PAID"
                                      ? "Certificate paid — record kept."
                                      : "Certificate issued to SC. Next: mark PAYABLE so they can invoice."}
                                  </p>
                                  {status === "CERTIFIED" && item.certificateUuid && item.projectId && (
                                    <Button
                                      size="sm"
                                      disabled={busy}
                                      onClick={() =>
                                        run(
                                          () => markScCertificatePayable(item.projectId, item.certificateUuid),
                                          "Certificate marked PAYABLE — SC can now invoice"
                                        )
                                      }
                                    >
                                      Mark Payable
                                    </Button>
                                  )}
                                  {item.projectId && (
                                    <Button size="sm" variant="ghost" asChild>
                                      <Link
                                        to={ROUTES.ADMIN.PROJECT_SUBCONTRACTORS.replace(":projectId", String(item.projectId))}
                                      >
                                        Open package
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2 sm:items-end">
                                  {canMeasure && (
                                    <div className="flex flex-wrap gap-2 items-center">
                                      <Input
                                        className="h-8 w-24 text-xs"
                                        placeholder="Meas. qty"
                                        value={measureForms[item.uuid]?.qty ?? ""}
                                        onChange={(e) =>
                                          setMeasureForms((m) => ({
                                            ...m,
                                            [item.uuid]: { ...m[item.uuid], qty: e.target.value },
                                          }))
                                        }
                                      />
                                      <Input
                                        className="h-8 w-28 text-xs"
                                        placeholder="Meas. value"
                                        value={measureForms[item.uuid]?.value ?? ""}
                                        onChange={(e) =>
                                          setMeasureForms((m) => ({
                                            ...m,
                                            [item.uuid]: { ...m[item.uuid], value: e.target.value },
                                          }))
                                        }
                                      />
                                      <Button
                                        size="sm"
                                        disabled={busy}
                                        onClick={() => {
                                          const formValue = measureForms[item.uuid]?.value;
                                          const measuredValue =
                                            formValue !== "" && formValue != null
                                              ? Number(formValue)
                                              : Number(item.claimedValue ?? item.claimedQty) || 0;
                                          return run(
                                            () =>
                                              measureScClaim(item.projectId, item.uuid, {
                                                measuredQty: Number(measureForms[item.uuid]?.qty) || Number(item.claimedQty),
                                                measuredValue,
                                              }),
                                            "Claim measured — ready to certify"
                                          );
                                        }}
                                      >
                                        Measure
                                      </Button>
                                    </div>
                                  )}
                                  {isMeasured && (
                                    <Button
                                      size="sm"
                                      disabled={busy}
                                      onClick={() =>
                                        run(
                                          () =>
                                            certifyScClaim(item.projectId, item.uuid, {
                                              certifiedValue:
                                                Number(item.measuredValue ?? item.claimedValue ?? item.claimedQty) || 0,
                                            }),
                                          "Payment certificate generated"
                                        )
                                      }
                                    >
                                      Certify
                                    </Button>
                                  )}
                                  {canAcceptReject && (
                                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                      <Input
                                        className="h-8 w-full sm:w-40 text-xs"
                                        placeholder="Reject reason"
                                        value={rejectReasons[`c-${item.uuid}`] || ""}
                                        onChange={(e) =>
                                          setRejectReasons((m) => ({ ...m, [`c-${item.uuid}`]: e.target.value }))
                                        }
                                      />
                                      <div className="flex gap-1 flex-wrap">
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          disabled={busy}
                                          onClick={() =>
                                            run(
                                              () => approveScClaim(item.projectId, item.uuid),
                                              "Claim accepted for review"
                                            )
                                          }
                                        >
                                          <Check className="h-4 w-4 mr-1" /> Accept
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={busy}
                                          onClick={() =>
                                            run(
                                              () => rejectScClaim(item.projectId, item.uuid, rejectReasons[`c-${item.uuid}`]),
                                              "Claim rejected"
                                            )
                                          }
                                        >
                                          <X className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                        {item.projectId && (
                                          <Button size="sm" variant="ghost" asChild>
                                            <Link
                                              to={ROUTES.ADMIN.PROJECT_SUBCONTRACTORS.replace(":projectId", String(item.projectId))}
                                            >
                                              Open package
                                            </Link>
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === TAB.VARIATIONS && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Variations ({variationItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {variationItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No pending variations</p>
            ) : (
              <div className="divide-y divide-border/40">
                {variationItems.map((item) => (
                  <div key={item.uuid} className="flex flex-col sm:flex-row sm:items-start gap-3 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.projectName} · {item.packageName}
                        {item.estimatedCost != null ? ` · est. ${item.estimatedCost}` : ""}
                      </p>
                      {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        className="h-8 w-full sm:w-40 text-xs"
                        placeholder="Reject reason"
                        value={rejectReasons[`v-${item.uuid}`] || ""}
                        onChange={(e) => setRejectReasons((m) => ({ ...m, [`v-${item.uuid}`]: e.target.value }))}
                      />
                      <Button size="sm" disabled={busy} onClick={() => run(() => approveScVariation(item.projectId, item.uuid), "Variation approved")}>
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => rejectScVariation(item.projectId, item.uuid, rejectReasons[`v-${item.uuid}`]), "Variation rejected")}>
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === TAB.INVOICES && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">SC invoices ({invoiceItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {invoiceItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No pending invoices</p>
            ) : (
              <div className="divide-y divide-border/40">
                {invoiceItems.map((item) => (
                  <div key={item.uuid} className="flex flex-col sm:flex-row sm:items-start gap-3 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.invoiceNumber || item.uuid.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.projectName} · {item.packageName} · {item.currency} {item.totalAmount ?? item.amount}
                      </p>
                      {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        className="h-8 w-full sm:w-40 text-xs"
                        placeholder="Reject reason"
                        value={rejectReasons[`i-${item.uuid}`] || ""}
                        onChange={(e) => setRejectReasons((m) => ({ ...m, [`i-${item.uuid}`]: e.target.value }))}
                      />
                      <Button size="sm" disabled={busy} onClick={() => run(() => approveScInvoice(item.projectId, item.uuid), "Invoice approved")}>
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => rejectScInvoice(item.projectId, item.uuid, rejectReasons[`i-${item.uuid}`]), "Invoice rejected")}>
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      {item.status === "APPROVED" && (
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => markScInvoicePaid(item.projectId, item.uuid, "PAID"), "Marked paid")}>
                          Mark paid
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {projectId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Hold points ({holdPoints.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input
                  value={holdForm.title}
                  onChange={(e) => setHoldForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Inspection hold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Activity type</Label>
                <div className="flex gap-2">
                  <Input
                    value={holdForm.activityType}
                    onChange={(e) => setHoldForm((f) => ({ ...f, activityType: e.target.value }))}
                    placeholder="e.g. MEP_INSTALL"
                  />
                  <Button type="button" size="sm" variant="outline" disabled={busy} onClick={loadTemplate}>
                    Load template
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Activity UUID</Label>
                <Input
                  value={holdForm.activityUuid}
                  onChange={(e) => setHoldForm((f) => ({ ...f, activityUuid: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Input
                  value={holdForm.notes}
                  onChange={(e) => setHoldForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Checklist items</Label>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={addChecklistItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add item
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dynamic list below, or paste comma-separated values into the first row.
              </p>
              <div className="space-y-2">
                {holdForm.checklistItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (idx === 0 && val.includes(",")) {
                          const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
                          setHoldForm((f) => ({
                            ...f,
                            checklistItems: parts.length ? parts : [""],
                          }));
                          return;
                        }
                        setChecklistItem(idx, val);
                      }}
                      placeholder={idx === 0 ? "Item, or comma-separated list" : `Item ${idx + 1}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 shrink-0"
                      onClick={() => removeChecklistItem(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              disabled={busy || !holdForm.title.trim()}
              onClick={() =>
                run(async () => {
                  const checklistItems = holdForm.checklistItems.map((s) => s.trim()).filter(Boolean);
                  await createHoldPoint(projectId, {
                    title: holdForm.title.trim(),
                    activityUuid: holdForm.activityUuid.trim() || null,
                    activityType: holdForm.activityType.trim() || null,
                    notes: holdForm.notes.trim() || null,
                    checklistItems,
                  });
                  setHoldForm({
                    title: "",
                    activityUuid: "",
                    activityType: "",
                    notes: "",
                    checklistItems: [""],
                  });
                }, "Hold point created")
              }
            >
              <Plus className="h-4 w-4 mr-1" /> Create hold point
            </Button>

            {holdPoints.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hold points</p>
            ) : (
              <div className="divide-y divide-border/40">
                {holdPoints.map((hp) => {
                  const checklist = parseChecklist(hp.checklistItems || hp.checklistJson);
                  return (
                    <div key={hp.uuid} className="flex flex-col sm:flex-row sm:items-start gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{hp.title || "Hold point"}</p>
                          <Badge
                            className={`border-none ${
                              hp.clearedAt || hp.status === "CLEARED"
                                ? "bg-emerald-500/15 text-emerald-700"
                                : "bg-amber-500/15 text-amber-700"
                            }`}
                          >
                            {hp.clearedAt || hp.status === "CLEARED" ? "Cleared" : hp.status || "OPEN"}
                          </Badge>
                          {hp.activityType && (
                            <Badge variant="secondary" className="text-[10px]">{hp.activityType}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {hp.notes || "—"}
                          {hp.activityUuid ? ` · activity ${String(hp.activityUuid).slice(0, 8)}…` : ""}
                        </p>
                        {checklist.length > 0 && (
                          <ul className="mt-1.5 text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                            {checklist.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {!hp.clearedAt && hp.status !== "CLEARED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            run(() => clearHoldPoint(projectId, hp.uuid), "Hold point cleared")
                          }
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
