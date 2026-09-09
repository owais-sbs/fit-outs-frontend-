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
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  fetchBillingMilestones,
  createBillingMilestone,
  deleteBillingMilestone,
  submitMilestoneForApproval,
  approvePaymentRequest,
  rejectPaymentRequest,
  markPaymentRequestPaid,
  sendPaymentReminderEmail,
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

const PAGE_SIZE = 10;

function getPageNumbers(currentPage, totalPages, maxVisible = 5) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

const STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_PM: "Pending Project Manager Approval",
  PENDING_DIRECTOR: "Pending Project Director Approval",
  ISSUED: "Awaiting Client Acceptance",
  CLIENT_ACCEPTED: "Client Accepted Proposal",
  PAID: "Paid",
  PART_PAID: "Part paid",
};

function paymentRequestFor(milestone) {
  if (!milestone) return null;
  if (milestone.latestPaymentRequest) return milestone.latestPaymentRequest;
  if (milestone.paymentRequest) return milestone.paymentRequest;
  if (milestone.paymentRequestUuid) return { uuid: milestone.paymentRequestUuid, status: milestone.status };
  const status = (milestone.status || "").toUpperCase();
  if (milestone.uuid && status && status !== "DRAFT") {
    return {
      uuid: milestone.paymentRequestId || milestone.uuid,
      status: milestone.status,
      requestedByName: milestone.requestedByName,
    };
  }
  return null;
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
  const [createMode, setCreateMode] = useState("manual");
  const [showBoqLines, setShowBoqLines] = useState(false);
  const [templateRows, setTemplateRows] = useState(createFinanceTemplateRows);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    dueDate: "",
  });

  const totalPages = Math.max(1, Math.ceil(milestones.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [milestones.length, totalPages, page]);

  const paginatedMilestones = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return milestones.slice(start, start + PAGE_SIZE);
  }, [milestones, page]);

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
    } catch (err) {
      setMessage(err?.response?.data?.message || err.message || "Operation failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () =>
    run(async () => {
      const name = form.name.trim();
      const amount = Number(form.amount);
      if (!name) throw new Error("Milestone name required.");
      if (!amount || amount <= 0) throw new Error("Amount must be positive.");
      await createBillingMilestone(projectId, {
        name,
        amount,
        dueDate: form.dueDate || undefined,
      });
      setForm({ name: "", amount: "", dueDate: "" });
      return "Milestone created.";
    });

  const handleCreateFromTemplate = () =>
    run(async () => {
      if (!approvedBoq) throw new Error("No approved BOQ for template mode.");
      const selectedRows = templateRows.filter((r) => r.selected);
      if (selectedRows.length === 0) throw new Error("Select at least one slice.");
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

  const draftOrRejectedMilestones = useMemo(
    () =>
      milestones.filter((m) => {
        const s = (paymentRequestFor(m)?.status || m.status || "DRAFT").toUpperCase();
        return s === "DRAFT" || s === "REJECTED";
      }),
    [milestones]
  );

  const rejectedMilestones = useMemo(
    () =>
      milestones.filter((m) => {
        const s = (paymentRequestFor(m)?.status || m.status || "").toUpperCase();
        return s === "REJECTED";
      }),
    [milestones]
  );

  const handleSubmitAllForApproval = () =>
    run(async () => {
      if (draftOrRejectedMilestones.length === 0) {
        throw new Error("No draft or rejected milestones to submit.");
      }
      for (const m of draftOrRejectedMilestones) {
        await submitMilestoneForApproval(projectId, m.uuid, { amount: m.amount });
      }
      return `Submitted ${draftOrRejectedMilestones.length} milestone${
        draftOrRejectedMilestones.length === 1 ? "" : "s"
      } to PM for approval.`;
    });

  const pendingPmMilestones = useMemo(
    () =>
      milestones.filter((m) => {
        const req = paymentRequestFor(m);
        const s = (req?.status || m.status || "").toUpperCase();
        return (req?.uuid || m.uuid) && s === "PENDING_PM";
      }),
    [milestones]
  );

  const pendingDirectorMilestones = useMemo(
    () =>
      milestones.filter((m) => {
        const req = paymentRequestFor(m);
        const s = (req?.status || m.status || "").toUpperCase();
        return (req?.uuid || m.uuid) && s === "PENDING_DIRECTOR";
      }),
    [milestones]
  );

  const [pmRejectComment, setPmRejectComment] = useState("");
  const [showPmRejectDialog, setShowPmRejectDialog] = useState(false);
  const [directorRejectComment, setDirectorRejectComment] = useState("");
  const [showDirectorRejectDialog, setShowDirectorRejectDialog] = useState(false);

  const handlePmApproveAll = () =>
    run(async () => {
      if (pendingPmMilestones.length === 0) {
        throw new Error("No milestones pending PM approval.");
      }
      for (const m of pendingPmMilestones) {
        const req = paymentRequestFor(m);
        const targetUuid = req?.uuid || m.uuid;
        if (targetUuid) {
          await approvePaymentRequest(targetUuid);
        }
      }
      return `Approved project billing milestone package (${pendingPmMilestones.length} slices) and forwarded to Director.`;
    });

  const handlePmRejectAll = async () => {
    if (!pmRejectComment.trim()) {
      setMessage("Please enter a reason for returning the package to Finance.");
      return;
    }
    setShowPmRejectDialog(false);
    await run(async () => {
      if (pendingPmMilestones.length === 0) {
        throw new Error("No milestones pending PM approval.");
      }
      for (const m of pendingPmMilestones) {
        const req = paymentRequestFor(m);
        const targetUuid = req?.uuid || m.uuid;
        if (targetUuid) {
          await rejectPaymentRequest(targetUuid, pmRejectComment.trim());
        }
      }
      setPmRejectComment("");
      return `Returned project billing milestone package (${pendingPmMilestones.length} slices) back to Finance.`;
    });
  };

  const handleDirectorApproveAll = () =>
    run(async () => {
      if (pendingDirectorMilestones.length === 0) {
        throw new Error("No milestones pending Director approval.");
      }
      for (const m of pendingDirectorMilestones) {
        const req = paymentRequestFor(m);
        const targetUuid = req?.uuid || m.uuid;
        if (targetUuid) {
          await approvePaymentRequest(targetUuid);
        }
      }
      return `Approved project billing milestone package (${pendingDirectorMilestones.length} slices). Client notified.`;
    });

  const handleDirectorRejectAll = async () => {
    if (!directorRejectComment.trim()) {
      setMessage("Please enter a reason for returning the package to Finance.");
      return;
    }
    setShowDirectorRejectDialog(false);
    await run(async () => {
      if (pendingDirectorMilestones.length === 0) {
        throw new Error("No milestones pending Director approval.");
      }
      for (const m of pendingDirectorMilestones) {
        const req = paymentRequestFor(m);
        const targetUuid = req?.uuid || m.uuid;
        if (targetUuid) {
          await rejectPaymentRequest(targetUuid, directorRejectComment.trim());
        }
      }
      setDirectorRejectComment("");
      return `Returned project billing milestone package (${pendingDirectorMilestones.length} slices) back to Finance.`;
    });
  };

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

      {rejectedMilestones.length > 0 && isFinanceUser && (
        <Card className="border-amber-400/30 bg-amber-500/5">
          <CardContent className="pt-4 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-semibold text-sm">
              Billing milestones returned/rejected ({rejectedMilestones.length})
            </p>
            <p>
              PM or Director returned this milestone package. You can re-allocate payment percentages/amounts
              above or adjust due dates, then click <strong>Submit for approval</strong> below to re-send.
            </p>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">Milestones ({milestones.length})</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and action the complete project billing schedule together.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isFinanceUser && draftOrRejectedMilestones.length > 0 && (
              <Button size="sm" disabled={busy} onClick={handleSubmitAllForApproval}>
                <Send className="h-4 w-4 mr-1.5" /> Submit all for approval ({draftOrRejectedMilestones.length})
              </Button>
            )}

            {isPmUser && pendingPmMilestones.length > 0 && (
              <div className="flex gap-2">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={handlePmApproveAll}>
                  <Check className="h-4 w-4 mr-1.5" /> Approve Package ({pendingPmMilestones.length})
                </Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30" disabled={busy} onClick={() => setShowPmRejectDialog(true)}>
                  <X className="h-4 w-4 mr-1.5" /> Reject Package
                </Button>
              </div>
            )}

            {isDirectorUser && pendingDirectorMilestones.length > 0 && (
              <div className="flex gap-2">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={handleDirectorApproveAll}>
                  <Check className="h-4 w-4 mr-1.5" /> Approve & Notify Client ({pendingDirectorMilestones.length})
                </Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30" disabled={busy} onClick={() => setShowDirectorRejectDialog(true)}>
                  <X className="h-4 w-4 mr-1.5" /> Reject Package
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {isFinanceUser
                ? "No milestones yet. Create one above."
                : "No billing milestones on this project."}
            </p>
          ) : (
            <>
              <div className="divide-y divide-border/40">
                {paginatedMilestones.map((m) => {
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
                        {isFinanceUser && (workflowStatus === "DRAFT" || workflowStatus === "REJECTED") && (
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
                        )}

                        {isFinanceUser &&
                          paymentReq?.uuid &&
                          (workflowStatus === "CLIENT_ACCEPTED" || workflowStatus === "PART_PAID") && (
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  run(
                                    () => sendPaymentReminderEmail(paymentReq.uuid),
                                    "Payment deadline reminder email queued for client"
                                  )
                                }
                              >
                                <Mail className="h-4 w-4 mr-1" /> Send Reminder
                              </Button>
                              <Button
                                size="sm"
                                disabled={busy}
                                onClick={() =>
                                  run(() => markPaymentRequestPaid(paymentReq.uuid), "Marked paid")
                                }
                              >
                                <Banknote className="h-4 w-4 mr-1" /> Mark paid
                              </Button>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {milestones.length > 0 && (
                <div className="flex flex-col gap-2 border-t pt-3 mt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, milestones.length)} of {milestones.length} milestone
                    {milestones.length !== 1 ? "s" : ""}
                  </p>
                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {getPageNumbers(page, totalPages).map((pNum) => (
                          <PaginationItem key={pNum}>
                            <PaginationLink
                              isActive={page === pNum}
                              onClick={() => setPage(pNum)}
                              className="cursor-pointer"
                            >
                              {pNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className={
                              page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPmRejectDialog} onOpenChange={setShowPmRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Billing Milestone Package</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Please provide a reason for returning this billing milestone package back to Finance for adjustments.
            </p>
            <Textarea
              placeholder="Reason for rejection / requested changes..."
              value={pmRejectComment}
              onChange={(e) => setPmRejectComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPmRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handlePmRejectAll} disabled={busy || !pmRejectComment.trim()}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDirectorRejectDialog} onOpenChange={setShowDirectorRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Billing Milestone Package</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Please provide a reason for returning this billing milestone package back to Finance for adjustments.
            </p>
            <Textarea
              placeholder="Reason for rejection / requested changes..."
              value={directorRejectComment}
              onChange={(e) => setDirectorRejectComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDirectorRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDirectorRejectAll} disabled={busy || !directorRejectComment.trim()}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
