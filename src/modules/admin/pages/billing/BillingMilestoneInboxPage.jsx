import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronDown, ChevronRight, Layers, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { ROLES } from "@/shared/constants/roles";
import { formatAed } from "@/shared/utils/currency";
import {
  approvePaymentRequest,
  fetchBillingMilestoneInbox,
  rejectPaymentRequest,
} from "../../api/billing.api";
import { fetchAllProjects } from "../../api/projects.api";
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
  DRAFT: "Draft — with Finance",
  PENDING_PM: "Pending Project Manager Approval",
  PENDING_DIRECTOR: "Pending Project Director Approval",
  ISSUED: "Awaiting Client Acceptance",
  CLIENT_ACCEPTED: "Client Accepted Proposal",
  PAID: "Paid",
  PART_PAID: "Part paid",
  REJECTED: "Returned to Finance",
};

const APPROVED_STATUSES = new Set(["ISSUED", "CLIENT_ACCEPTED", "PAID", "PART_PAID"]);

function isApprovedProjectGroup(group) {
  return APPROVED_STATUSES.has(String(group?.status || "").toUpperCase());
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function billingPath(role, projectId) {
  if (!projectId) return null;
  if (role === ROLES.PROJECT_MANAGER) {
    return ROUTES.PROJECT_MANAGER.PROJECT_BILLING.replace(":projectId", projectId);
  }
  if (role === ROLES.BUSINESS_OWNER) {
    return ROUTES.BUSINESS_OWNER.PROJECT_BILLING.replace(":projectId", projectId);
  }
  if (role === ROLES.FINANCE) {
    return ROUTES.FINANCE.PROJECT_BILLING.replace(":projectId", projectId);
  }
  return ROUTES.ADMIN.PROJECT_BILLING.replace(":projectId", projectId);
}

function groupMilestonesByProject(itemList) {
  const groups = new Map();
  (Array.isArray(itemList) ? itemList : []).forEach((item) => {
    const key = String(item.projectId || item.projectName || "default");
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        projectId: item.projectId,
        projectName: item.projectName || `Project #${item.projectId}`,
        clientName: item.clientName || "",
        requestedByName: item.requestedByName || "Finance",
        requestedByEmail: item.requestedByEmail || "",
        createdAt: item.createdAt,
        milestones: [],
      });
    }
    groups.get(key).milestones.push(item);
  });

  return Array.from(groups.values()).map((group) => {
    const totalAmount = group.milestones.reduce(
      (sum, m) => sum + (Number(m.amount) || 0),
      0
    );
    const statuses = group.milestones.map((m) =>
      String(m.status || "").toUpperCase()
    );

    let groupStatus = "DRAFT";
    if (statuses.includes("PENDING_PM")) {
      groupStatus = "PENDING_PM";
    } else if (statuses.includes("PENDING_DIRECTOR")) {
      groupStatus = "PENDING_DIRECTOR";
    } else if (statuses.includes("ISSUED")) {
      groupStatus = "ISSUED";
    } else if (statuses.includes("CLIENT_ACCEPTED")) {
      groupStatus = "CLIENT_ACCEPTED";
    } else if (statuses.includes("PART_PAID")) {
      groupStatus = "PART_PAID";
    } else if (statuses.length > 0 && statuses.every((s) => s === "PAID")) {
      groupStatus = "PAID";
    } else if (statuses.includes("REJECTED")) {
      groupStatus = "REJECTED";
    } else {
      groupStatus = statuses[0] || "DRAFT";
    }

    const latestSubmitted = group.milestones.reduce(
      (latest, m) =>
        !latest || new Date(m.createdAt || 0) > new Date(latest)
          ? m.createdAt
          : latest,
      null
    );

    return {
      ...group,
      totalAmount,
      status: groupStatus,
      submittedAt: latestSubmitted || group.createdAt,
    };
  });
}

export default function BillingMilestoneInboxPage() {
  const { role } = useAuth();
  const isPm = role === ROLES.PROJECT_MANAGER || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const isDirector = role === ROLES.BUSINESS_OWNER || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [acting, setActing] = useState(false);
  const [actionGroup, setActionGroup] = useState(null);
  const [actionType, setActionType] = useState("approve");
  const [comments, setComments] = useState("");
  const [expandedProjects, setExpandedProjects] = useState({});
  const loadGeneration = useRef(0);

  const loadInbox = useCallback(async (options = {}) => {
    const requestId = ++loadGeneration.current;
    setLoading(true);
    try {
      const [list, projects] = await Promise.all([
        fetchBillingMilestoneInbox().catch(() => []),
        fetchAllProjects().catch(() => []),
      ]);
      if (requestId !== loadGeneration.current) return;
      const projectMap = new Map((Array.isArray(projects) ? projects : []).map((p) => [p.id, p]));
      const enrichedList = (Array.isArray(list) ? list : []).map((item) => {
        const p = projectMap.get(item.projectId);
        return {
          ...item,
          projectName: item.projectName || p?.projectName || p?.name,
          clientName: item.clientName || p?.clientName,
        };
      });
      setItems(enrichedList);
      if (!options.preserveMessage) {
        setMessage("");
      }
    } catch (e) {
      if (requestId !== loadGeneration.current) return;
      if (e.code === "ERR_CANCELED" || e.name === "CanceledError") return;
      const network = !e.response;
      setMessage(
        network
          ? "Could not refresh the list. The milestones below are the last loaded data — try Refresh again."
          : e.response?.data?.message || e.message || "Unable to load billing milestone inbox."
      );
    } finally {
      if (requestId === loadGeneration.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const toggleExpand = (groupId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const openActionGroup = (group, type) => {
    setActionGroup(group);
    setActionType(type);
    setComments("");
    setMessage("");
  };

  const closeAction = () => {
    setActionGroup(null);
    setComments("");
  };

  const confirmActionGroup = async () => {
    if (!actionGroup || !actionGroup.milestones?.length) return;
    if (actionType === "reject" && !comments.trim()) {
      setMessage("Comments are required to reject.");
      return;
    }
    setActing(true);
    try {
      const targets = actionGroup.milestones.filter((m) => {
        const s = String(m.status || "").toUpperCase();
        if (actionType === "approve") {
          if (s === "PENDING_PM") return isPm;
          if (s === "PENDING_DIRECTOR") return isDirector;
          return false;
        }
        return s === "PENDING_PM" || s === "PENDING_DIRECTOR";
      });

      if (targets.length === 0) {
        setMessage("No milestones in this package are currently pending your approval role.");
        setActing(false);
        return;
      }

      if (actionType === "approve") {
        for (const m of targets) {
          await approvePaymentRequest(m.uuid, comments.trim() || null);
        }
        setMessage(`Approved project billing milestone package for ${actionGroup.projectName}.`);
      } else {
        for (const m of targets) {
          await rejectPaymentRequest(m.uuid, comments.trim());
        }
        setMessage(`Returned project billing milestone package for ${actionGroup.projectName} back to Finance.`);
      }

      closeAction();
      await loadInbox({ preserveMessage: true });
    } catch (e) {
      setMessage(e.response?.data?.message || e.message || "Action failed.");
    } finally {
      setActing(false);
    }
  };

  const canActOnGroup = (group) => {
    const status = group?.status;
    if (status === "PENDING_PM") return isPm;
    if (status === "PENDING_DIRECTOR") return isDirector;
    return false;
  };

  const projectGroups = useMemo(() => groupMilestonesByProject(items), [items]);

  const pendingGroups = useMemo(
    () => projectGroups.filter((g) => !isApprovedProjectGroup(g)),
    [projectGroups]
  );
  const approvedGroups = useMemo(
    () => projectGroups.filter(isApprovedProjectGroup),
    [projectGroups]
  );

  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);

  const totalPendingPages = Math.ceil(pendingGroups.length / PAGE_SIZE) || 1;
  const totalApprovedPages = Math.ceil(approvedGroups.length / PAGE_SIZE) || 1;

  useEffect(() => {
    if (pendingPage > totalPendingPages) {
      setPendingPage(Math.max(1, totalPendingPages));
    }
  }, [pendingGroups.length, totalPendingPages, pendingPage]);

  useEffect(() => {
    if (approvedPage > totalApprovedPages) {
      setApprovedPage(Math.max(1, totalApprovedPages));
    }
  }, [approvedGroups.length, totalApprovedPages, approvedPage]);

  const paginatedPendingGroups = useMemo(() => {
    const start = (pendingPage - 1) * PAGE_SIZE;
    return pendingGroups.slice(start, start + PAGE_SIZE);
  }, [pendingGroups, pendingPage]);

  const paginatedApprovedGroups = useMemo(() => {
    const start = (approvedPage - 1) * PAGE_SIZE;
    return approvedGroups.slice(start, start + PAGE_SIZE);
  }, [approvedGroups, approvedPage]);

  const renderProjectRows = (groups, { showActions }) =>
    groups.map((group) => {
      const href = billingPath(role, group.projectId);
      const isExpanded = !!expandedProjects[group.id];

      return (
        <React.Fragment key={group.id}>
          <TableRow className="hover:bg-muted/40 transition-colors">
            <TableCell className="w-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => toggleExpand(group.id)}
                title={isExpanded ? "Collapse payment slices" : "View payment slices breakdown"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div>
                  {href ? (
                    <Link to={href} className="font-semibold text-foreground text-sm hover:underline">
                      {group.projectName}
                    </Link>
                  ) : (
                    <p className="font-semibold text-foreground text-sm">{group.projectName}</p>
                  )}
                  {group.clientName && group.clientName !== group.projectName && (
                    <p className="text-xs text-muted-foreground">Client: {group.clientName}</p>
                  )}
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      <Layers className="h-3 w-3 mr-1" />
                      {group.milestones.length} payment slice{group.milestones.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <p className="text-sm font-medium">{group.requestedByName || "Finance"}</p>
              {group.requestedByEmail && (
                <p className="text-xs text-muted-foreground">{group.requestedByEmail}</p>
              )}
            </TableCell>
            <TableCell className="font-bold tabular-nums text-sm">
              {formatAed(group.totalAmount || 0)}
            </TableCell>
            <TableCell className="min-w-[240px]">
              <Badge variant="secondary" className="mb-2 text-[10px]">
                {STATUS_LABELS[group.status] || group.status}
              </Badge>
              <BillingApprovalPipeline status={group.status} compact className="max-w-[240px]" />
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDate(group.submittedAt)}</TableCell>
            {showActions && (
              <TableCell className="text-right">
                {canActOnGroup(group) && (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openActionGroup(group, "approve")}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30"
                      onClick={() => openActionGroup(group, "reject")}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            )}
          </TableRow>

          {/* Expanded Payment Slices Breakdown */}
          {isExpanded && (
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableCell colSpan={showActions ? 7 : 6} className="p-4 pl-12">
                <div className="rounded-lg border bg-background p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      Payment Slices Breakdown · {group.projectName}
                    </h4>
                    <span className="text-xs font-medium tabular-nums">
                      Total: {formatAed(group.totalAmount || 0)}
                    </span>
                  </div>

                  <Table className="text-xs">
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Milestone / Slice</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Approval State</TableHead>
                        <TableHead>Timeline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.milestones.map((m) => (
                        <TableRow key={m.uuid}>
                          <TableCell className="font-medium">
                            <p>{m.milestoneName || "Milestone"}</p>
                            {m.notes && <p className="text-[11px] text-muted-foreground">{m.notes}</p>}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold tabular-nums">
                            {formatAed(m.amount || 0)}
                            {group.totalAmount > 0 && (
                              <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                                ({Math.round((Number(m.amount) / group.totalAmount) * 100)}%)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{m.dueDate || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="mb-1 text-[9px]">
                              {STATUS_LABELS[m.status] || m.status}
                            </Badge>
                            <BillingApprovalPipeline status={m.status} compact className="max-w-[180px]" />
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <BillingApprovalTimeline item={m} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TableCell>
            </TableRow>
          )}
        </React.Fragment>
      );
    });

  return (
    <PageShell className="max-w-6xl mx-auto">
      <PageTitle
        title="Billing milestone approval"
        subtitle="Finance submits project billing packages, PM approves, Director signs off, then client receives payment requests."
        actions={
          <Button variant="outline" size="sm" onClick={() => loadInbox()} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-4">
          <BillingApprovalPipeline status="" className="max-w-xl" />
          <p className="mt-2 text-xs text-muted-foreground">
            Each project profile package has its approval chain: Finance → PM → Director → Client.
            Approving or rejecting operates on the complete project billing schedule. Click any project row to view the payment slice breakdown.
          </p>
        </CardContent>
      </Card>

      {message && (
        <p
          className={`text-sm rounded-xl px-3 py-2 ${
            /could not refresh|unable to load|failed/i.test(message)
              ? "text-destructive bg-destructive/10"
              : "text-emerald-700 bg-emerald-50/80"
          }`}
        >
          {message}
        </p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Waiting for approval</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Loading inbox…</p>
          ) : pendingGroups.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No project billing milestone packages waiting for PM or Director. Approved ones appear in the box below.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Project Profile</TableHead>
                    <TableHead>Sent by (Finance)</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Approval chain</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderProjectRows(paginatedPendingGroups, { showActions: true })}</TableBody>
              </Table>
              {pendingGroups.length > 0 && (
                <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing {(pendingPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(pendingPage * PAGE_SIZE, pendingGroups.length)} of {pendingGroups.length} project package
                    {pendingGroups.length !== 1 ? "s" : ""}
                  </p>
                  {totalPendingPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                            className={pendingPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {getPageNumbers(pendingPage, totalPendingPages).map((pNum) => (
                          <PaginationItem key={pNum}>
                            <PaginationLink
                              isActive={pendingPage === pNum}
                              onClick={() => setPendingPage(pNum)}
                              className="cursor-pointer"
                            >
                              {pNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setPendingPage((p) => Math.min(totalPendingPages, p + 1))}
                            className={
                              pendingPage >= totalPendingPages ? "pointer-events-none opacity-50" : "cursor-pointer"
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Approved billing milestones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Loading approved milestones…</p>
          ) : approvedGroups.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              After the Director approves a project billing package, it moves here and the client receives payment requests.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Project Profile</TableHead>
                    <TableHead>Sent by (Finance)</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Approval chain</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderProjectRows(paginatedApprovedGroups, { showActions: false })}</TableBody>
              </Table>
              {approvedGroups.length > 0 && (
                <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing {(approvedPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(approvedPage * PAGE_SIZE, approvedGroups.length)} of {approvedGroups.length} approved package
                    {approvedGroups.length !== 1 ? "s" : ""}
                  </p>
                  {totalApprovedPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setApprovedPage((p) => Math.max(1, p - 1))}
                            className={approvedPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {getPageNumbers(approvedPage, totalApprovedPages).map((pNum) => (
                          <PaginationItem key={pNum}>
                            <PaginationLink
                              isActive={approvedPage === pNum}
                              onClick={() => setApprovedPage(pNum)}
                              className="cursor-pointer"
                            >
                              {pNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setApprovedPage((p) => Math.min(totalApprovedPages, p + 1))}
                            className={
                              approvedPage >= totalApprovedPages ? "pointer-events-none opacity-50" : "cursor-pointer"
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

      <Dialog open={!!actionGroup} onOpenChange={(open) => !open && closeAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve project billing package" : "Reject project billing package"}
              {actionGroup?.projectName ? ` · ${actionGroup.projectName}` : ""}
            </DialogTitle>
          </DialogHeader>
          {actionGroup && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{actionGroup.projectName}</p>
              {actionGroup.clientName && <p>Client: {actionGroup.clientName}</p>}
              <p className="font-semibold text-foreground">
                Total Amount: {formatAed(actionGroup.totalAmount || 0)} ({actionGroup.milestones?.length || 0} payment slices)
              </p>
              <p>
                Sent by {actionGroup.requestedByName || "Finance"}
                {actionGroup.requestedByEmail ? ` (${actionGroup.requestedByEmail})` : ""}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="milestone-comments">
              Comments {actionType === "reject" ? "(required — reason to return to Finance)" : "(optional)"}
            </Label>
            <Textarea
              id="milestone-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                actionType === "reject"
                  ? "Explain why this payment milestone schedule is being returned to Finance (e.g. adjust splits to 30/30/30/5/5)…"
                  : "Optional note for the next approver…"
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>
              Cancel
            </Button>
            <Button
              onClick={confirmActionGroup}
              disabled={acting || (actionType === "reject" && !comments.trim())}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {acting ? "Processing…" : actionType === "approve" ? "Confirm approve package" : "Confirm reject package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
