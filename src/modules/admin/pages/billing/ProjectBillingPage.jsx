import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Send,
  Trash2,
  X,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchBillingMilestones,
  createBillingMilestone,
  deleteBillingMilestone,
  submitMilestoneForApproval,
  approvePaymentRequest,
  rejectPaymentRequest,
  markPaymentRequestPaid,
} from "../../api/billing.api";
import { fetchProjectById } from "../../api/projects.api";
import { fetchBoqsByProject } from "../../api/boq.api";
import { isBoqApproved } from "../boq/boqDataUtils";
import {
  allocatePercents,
  createFinanceTemplateRows,
  FINANCE_BOQ_PAYMENT_SLICES,
} from "@/shared/constants/financePaymentTemplate";
import { portalRoutesFromPath, ROUTES } from "@/shared/constants/routes";
import { ROLES } from "@/shared/constants/roles";
import { useAuth } from "@/shared/context/auth-context";
import { formatAed } from "@/shared/utils/currency";
import { BillingApprovalPipeline, BillingApprovalTimeline } from "./BillingApprovalPipeline";

const STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_PM: "Pending PM",
  PENDING_DIRECTOR: "Pending Director",
  ISSUED: "Sent to client",
  PAID: "Paid",
  PART_PAID: "Part paid",
};

function paymentRequestFor(milestone) {
  return milestone?.latestPaymentRequest || milestone?.paymentRequest || null;
}

function pickLatestApprovedBoq(boqs = []) {
  const list = Array.isArray(boqs) ? boqs : [];
  return (
    list
      .filter((b) => isBoqApproved(b.status))
      .sort((a, b) => {
        const aDate = new Date(a.approvedAt || a.updatedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.approvedAt || b.updatedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      })[0] || null
  );
}

function resolveBoqGrandTotal(boq) {
  if (!boq) return 0;
  return Number(boq.grandTotal ?? boq.totals?.grandTotal) || 0;
}

export default function ProjectBillingPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const { role } = useAuth();
  const portalRoutes = portalRoutesFromPath(location.pathname);
  const detailPath = location.pathname.startsWith("/business-owner")
    ? ROUTES.BUSINESS_OWNER.PROJECTS
    : portalRoutes.PROJECT_DETAIL.replace(":projectId", projectId);

  const isFinanceUser =
    role === ROLES.FINANCE || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const isPmUser =
    role === ROLES.PROJECT_MANAGER || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const isDirectorUser =
    role === ROLES.BUSINESS_OWNER || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

  const [milestones, setMilestones] = useState([]);
  const [projectBudget, setProjectBudget] = useState(0);
  const [approvedBoq, setApprovedBoq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [rejectReasons, setRejectReasons] = useState({});
  const [createMode, setCreateMode] = useState("manual");
  const [showBoqLines, setShowBoqLines] = useState(false);
  const [templateRows, setTemplateRows] = useState(createFinanceTemplateRows);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    dueDate: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchBillingMilestones(projectId).catch(() => []),
      fetchProjectById(projectId).catch(() => ({ budget: 0 })),
      fetchBoqsByProject(projectId).catch(() => []),
    ])
      .then(([milestoneList, project, boqList]) => {
        setMilestones(Array.isArray(milestoneList) ? milestoneList : []);
        setProjectBudget(Number(project?.budget) || 0);
        setApprovedBoq(pickLatestApprovedBoq(boqList));
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (approvedBoq) {
      setCreateMode("template");
    }
  }, [approvedBoq?.id]);

  const boqGrandTotal = resolveBoqGrandTotal(approvedBoq);
  const percentBasis = boqGrandTotal > 0 ? boqGrandTotal : projectBudget;

  const scheduledTotal = useMemo(
    () => milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0),
    [milestones]
  );

  const remainingBoq = boqGrandTotal > 0 ? boqGrandTotal - scheduledTotal : 0;

  const templateAllocations = useMemo(() => {
    if (boqGrandTotal <= 0) return [];
    const selected = templateRows
      .filter((row) => row.selected)
      .map((row) => ({
        id: row.id,
        name: row.name,
        percent: row.percent,
      }));
    return allocatePercents(boqGrandTotal, selected);
  }, [boqGrandTotal, templateRows]);

  const allocationById = useMemo(
    () => Object.fromEntries(templateAllocations.map((row) => [row.id, row.amount])),
    [templateAllocations]
  );

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      const result = await fn();
      await load();
      if (typeof result === "string" && result.trim()) {
        setMessage(result);
      } else if (okMsg) {
        setMessage(okMsg);
      }
    } catch (e) {
      setMessage(
        e?.message
        || e?.response?.data?.message
        || e?.response?.data?.error
        || "Request failed"
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () =>
    run(async () => {
      await createBillingMilestone(projectId, {
        name: form.name.trim(),
        amount: Number(form.amount) || 0,
        dueDate: form.dueDate || null,
      });
      setForm({ name: "", amount: "", dueDate: "" });
    }, "Milestone created");

  const handleCreateFromTemplate = () =>
    run(async () => {
      const selectedRows = templateRows.filter((row) => row.selected);
      if (selectedRows.length === 0) {
        throw new Error("Select at least one payment slice.");
      }

      for (const row of selectedRows) {
        if (!(row.name || "").trim()) {
          throw new Error("Each selected slice needs a name.");
        }
        if (!row.dueDate) {
          throw new Error(`Due date required for ${row.name.trim()}.`);
        }
      }

      let created = 0;
      for (const row of selectedRows) {
        const amount = allocationById[row.id] ?? 0;
        if (amount <= 0) continue;
        await createBillingMilestone(projectId, {
          name: row.name.trim(),
          amount,
          dueDate: row.dueDate,
        });
        created += 1;
      }

      if (created === 0) {
        throw new Error("No amounts to create for the selected slices.");
      }

      setTemplateRows(createFinanceTemplateRows());
      return `Created ${created} milestone${created === 1 ? "" : "s"}.`;
    });

  if (loading) {
    return (
      <PageShell className="max-w-4xl mx-auto flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Link to={detailPath}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageTitle title="Milestone Billing" subtitle={`Project #${projectId}`} />
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {isFinanceUser && approvedBoq && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Approved BOQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{approvedBoq.status}</Badge>
              {approvedBoq.version && (
                <span className="text-xs text-muted-foreground">Version {approvedBoq.version}</span>
              )}
              {approvedBoq.revisionLabel && (
                <span className="text-xs text-muted-foreground">{approvedBoq.revisionLabel}</span>
              )}
            </div>
            <p>
              Grand total:{" "}
              <span className="font-semibold tabular-nums">{formatAed(boqGrandTotal)}</span>
            </p>
            {(approvedBoq.lines?.length ?? 0) > 0 && (
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 -ml-2 text-xs"
                  onClick={() => setShowBoqLines((open) => !open)}
                >
                  {showBoqLines ? (
                    <ChevronUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  )}
                  {approvedBoq.lines.length} line item{approvedBoq.lines.length === 1 ? "" : "s"}
                </Button>
                {showBoqLines && (
                  <div className="mt-2 overflow-x-auto rounded-md border border-border/60">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-medium">Description</th>
                          <th className="px-2 py-1.5 text-right font-medium">Qty</th>
                          <th className="px-2 py-1.5 text-right font-medium">Rate</th>
                          <th className="px-2 py-1.5 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedBoq.lines.map((line) => (
                          <tr key={line.id || `${line.description}-${line.sortOrder}`} className="border-t border-border/40">
                            <td className="px-2 py-1.5">{line.description || "—"}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{line.quantity ?? "—"}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              {line.rate != null ? formatAed(line.rate) : "—"}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums font-medium">
                              {formatAed(line.amount || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isFinanceUser && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Approval workflow</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>
              {approvedBoq
                ? "Create milestones from the approved BOQ template or enter amounts manually, then submit for approval."
                : "Create milestones manually, then submit for approval."}
            </p>
            <p>PM approves first, then the Director. After Director approval, the client receives a payment reminder by email.</p>
            {boqGrandTotal > 0 && (
              <p className="pt-1">
                Approved BOQ total:{" "}
                <span className="font-medium text-foreground">{formatAed(boqGrandTotal)}</span>
                {scheduledTotal > 0 && (
                  <>
                    {" "}
                    · scheduled {formatAed(scheduledTotal)}
                    {" "}
                    · remaining {formatAed(remainingBoq)}
                  </>
                )}
              </p>
            )}
            {!approvedBoq && projectBudget > 0 && (
              <p className="pt-1">
                Contract budget:{" "}
                <span className="font-medium text-foreground">{formatAed(projectBudget)}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {isFinanceUser && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">New milestone</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={createMode} onValueChange={setCreateMode}>
              <TabsList>
                <TabsTrigger value="template" disabled={!approvedBoq}>
                  From template
                </TabsTrigger>
                <TabsTrigger value="manual">Enter manually</TabsTrigger>
              </TabsList>

              {!approvedBoq && (
                <p className="mt-3 text-xs text-muted-foreground">
                  No approved BOQ on this project. Template mode is unavailable until a BOQ is approved.
                </p>
              )}

              <TabsContent value="template" className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Payment split ({FINANCE_BOQ_PAYMENT_SLICES.map((s) => `${s.percent}%`).join(" / ")}) of{" "}
                  {formatAed(boqGrandTotal)}. Select slices, set due dates, then create draft milestones.
                </p>
                <div className="space-y-2">
                  {templateRows.map((row) => (
                    <div
                      key={row.id}
                      className="grid gap-2 rounded-md border border-border/50 p-2 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-center"
                    >
                      <Checkbox
                        checked={row.selected}
                        onCheckedChange={(checked) =>
                          setTemplateRows((rows) =>
                            rows.map((r) =>
                              r.id === row.id ? { ...r, selected: checked === true } : r
                            )
                          )
                        }
                        aria-label={`Select ${row.name}`}
                      />
                      <Input
                        value={row.name}
                        onChange={(e) =>
                          setTemplateRows((rows) =>
                            rows.map((r) =>
                              r.id === row.id ? { ...r, name: e.target.value } : r
                            )
                          )
                        }
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground tabular-nums sm:text-right">
                        {row.percent}%
                      </span>
                      <span className="text-xs font-medium tabular-nums sm:text-right">
                        {row.selected ? formatAed(allocationById[row.id] ?? 0) : "—"}
                      </span>
                      <Input
                        type="date"
                        value={row.dueDate}
                        disabled={!row.selected}
                        onChange={(e) =>
                          setTemplateRows((rows) =>
                            rows.map((r) =>
                              r.id === row.id ? { ...r, dueDate: e.target.value } : r
                            )
                          )
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={handleCreateFromTemplate}
                  disabled={busy || !approvedBoq || boqGrandTotal <= 0}
                >
                  <Plus className="h-4 w-4 mr-1" /> Create selected milestones
                </Button>
              </TabsContent>

              <TabsContent value="manual" className="space-y-3">
                {boqGrandTotal > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Remaining unscheduled BOQ value:{" "}
                    <span className="font-medium text-foreground">{formatAed(remainingBoq)}</span>
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Mobilisation"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Amount (AED)</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Due date</Label>
                    <Input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
                <Button size="sm" onClick={handleCreate} disabled={busy || !form.name.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Create milestone
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Milestones ({milestones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {isFinanceUser
                ? "No milestones yet. Create one above."
                : "No billing milestones on this project."}
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {milestones.map((m) => {
                const paymentReq = paymentRequestFor(m);
                const workflowStatus = paymentReq?.status || m.status || "DRAFT";
                return (
                  <div key={m.uuid} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{m.name}</p>
                        <Badge variant="secondary">
                          {STATUS_LABELS[workflowStatus] || workflowStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatAed(m.amount || 0)}
                        {percentBasis > 0 && m.amount
                          ? ` (${Math.round((Number(m.amount) / percentBasis) * 100)}%)`
                          : ""}
                        {m.dueDate ? ` · due ${m.dueDate}` : ""}
                        {paymentReq?.requestedByName
                          ? ` · sent by ${paymentReq.requestedByName}`
                          : ""}
                      </p>
                      <BillingApprovalPipeline status={workflowStatus} compact className="mt-2 max-w-[260px]" />
                      {paymentReq && (
                        <div className="mt-2">
                          <BillingApprovalTimeline item={{ ...paymentReq, status: workflowStatus }} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      {isFinanceUser && workflowStatus === "DRAFT" && (
                        <>
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              run(
                                () =>
                                  submitMilestoneForApproval(projectId, m.uuid, {
                                    amount: m.amount,
                                  }),
                                "Submitted to PM for approval"
                              )
                            }
                          >
                            <Send className="h-4 w-4 mr-1" /> Submit for approval
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            disabled={busy}
                            onClick={() =>
                              run(() => deleteBillingMilestone(projectId, m.uuid), "Deleted")
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {isPmUser && paymentReq?.uuid && workflowStatus === "PENDING_PM" && (
                        <>
                          <Input
                            className="h-8 w-28 text-xs"
                            placeholder="Reject reason"
                            value={rejectReasons[paymentReq.uuid] || ""}
                            onChange={(e) =>
                              setRejectReasons((map) => ({
                                ...map,
                                [paymentReq.uuid]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              run(
                                () => approvePaymentRequest(paymentReq.uuid),
                                "Forwarded to Director"
                              )
                            }
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || !(rejectReasons[paymentReq.uuid] || "").trim()}
                            onClick={() =>
                              run(
                                () =>
                                  rejectPaymentRequest(
                                    paymentReq.uuid,
                                    rejectReasons[paymentReq.uuid]
                                  ),
                                "Returned to finance"
                              )
                            }
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}

                      {isDirectorUser && paymentReq?.uuid && workflowStatus === "PENDING_DIRECTOR" && (
                        <>
                          <Input
                            className="h-8 w-28 text-xs"
                            placeholder="Reject reason"
                            value={rejectReasons[paymentReq.uuid] || ""}
                            onChange={(e) =>
                              setRejectReasons((map) => ({
                                ...map,
                                [paymentReq.uuid]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                const result = await approvePaymentRequest(paymentReq.uuid);
                                if (result?.clientEmailSent && result?.clientEmail) {
                                  return `Approved. Payment reminder sent to ${result.clientEmail}.`;
                                }
                                if (result?.clientEmailSent === false && result?.clientEmail) {
                                  return "Approved, but the client email could not be sent.";
                                }
                                if (result?.clientEmailSent === false) {
                                  return "Approved. No client email on file for this project.";
                                }
                                return "Approved and sent to client.";
                              })
                            }
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve & notify client
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || !(rejectReasons[paymentReq.uuid] || "").trim()}
                            onClick={() =>
                              run(
                                () =>
                                  rejectPaymentRequest(
                                    paymentReq.uuid,
                                    rejectReasons[paymentReq.uuid]
                                  ),
                                "Returned to finance"
                              )
                            }
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}

                      {isFinanceUser &&
                        paymentReq?.uuid &&
                        (workflowStatus === "ISSUED" || workflowStatus === "PART_PAID") && (
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              run(() => markPaymentRequestPaid(paymentReq.uuid), "Marked paid")
                            }
                          >
                            <Banknote className="h-4 w-4 mr-1" /> Mark paid
                          </Button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
