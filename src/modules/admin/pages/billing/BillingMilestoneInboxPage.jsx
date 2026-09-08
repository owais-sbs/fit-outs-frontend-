import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
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
import { BillingApprovalPipeline, BillingApprovalTimeline } from "./BillingApprovalPipeline";

const STATUS_LABELS = {
  DRAFT: "Draft — with Finance",
  PENDING_PM: "Waiting for PM",
  PENDING_DIRECTOR: "Waiting for Director",
  ISSUED: "Sent to client",
  PAID: "Paid",
  PART_PAID: "Part paid",
};

const APPROVED_STATUSES = new Set(["ISSUED", "PAID", "PART_PAID"]);

function isApprovedMilestone(item) {
  return APPROVED_STATUSES.has(String(item?.status || "").toUpperCase());
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

export default function BillingMilestoneInboxPage() {
  const { role } = useAuth();
  const isPm = role === ROLES.PROJECT_MANAGER || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const isDirector = role === ROLES.BUSINESS_OWNER || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [acting, setActing] = useState(false);
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState("approve");
  const [comments, setComments] = useState("");
  const loadGeneration = useRef(0);

  const loadInbox = useCallback(async (options = {}) => {
    const requestId = ++loadGeneration.current;
    setLoading(true);
    try {
      const list = await fetchBillingMilestoneInbox();
      if (requestId !== loadGeneration.current) return;
      setItems(Array.isArray(list) ? list : []);
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

  const openAction = (item, type) => {
    setActionItem(item);
    setActionType(type);
    setComments("");
    setMessage("");
  };

  const closeAction = () => {
    setActionItem(null);
    setComments("");
  };

  const confirmAction = async () => {
    if (!actionItem?.uuid) return;
    if (actionType === "reject" && !comments.trim()) {
      setMessage("Comments are required to reject.");
      return;
    }
    setActing(true);
    const actingUuid = actionItem.uuid;
    try {
      let patched = null;
      if (actionType === "approve") {
        const result = await approvePaymentRequest(actingUuid, comments.trim());
        const directorStep = actionItem.status === "PENDING_DIRECTOR";
        const nextStatus = String(
          result?.status || (directorStep ? "ISSUED" : "PENDING_DIRECTOR")
        ).toUpperCase();
        patched = {
          ...actionItem,
          ...(result && typeof result === "object" ? result : {}),
          uuid: actingUuid,
          status: directorStep && nextStatus === "PENDING_DIRECTOR" ? "ISSUED" : nextStatus,
        };
        setMessage(
          role === ROLES.BUSINESS_OWNER || directorStep
            ? "Approved. The client will be notified."
            : "Approved and sent to the Director."
        );
      } else {
        await rejectPaymentRequest(actingUuid, comments.trim());
        setMessage("Returned to Finance with comments.");
      }
      closeAction();
      await loadInbox({ preserveMessage: true });
      if (patched) {
        setItems((prev) => {
          const rest = prev.filter((item) => item.uuid !== actingUuid);
          return [patched, ...rest];
        });
      }
    } catch (e) {
      setMessage(e.response?.data?.message || e.message || "Action failed.");
    } finally {
      setActing(false);
    }
  };

  const canAct = (item) => {
    const status = item?.status;
    if (status === "PENDING_PM") return isPm;
    if (status === "PENDING_DIRECTOR") return isDirector;
    return false;
  };

  const pendingItems = items.filter((item) => !isApprovedMilestone(item));
  const approvedItems = items.filter(isApprovedMilestone);

  const renderRows = (rows, { showActions }) =>
    rows.map((item) => {
      const href = billingPath(role, item.projectId);
      return (
        <TableRow key={item.uuid}>
          <TableCell>
            <p className="font-medium">{item.milestoneName || "Milestone"}</p>
            {href ? (
              <Link to={href} className="text-xs text-primary hover:underline">
                {item.projectName || `Project #${item.projectId}`}
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">
                {item.projectName || `Project #${item.projectId}`}
              </p>
            )}
            {item.notes && (
              <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{item.notes}</p>
            )}
          </TableCell>
          <TableCell>
            <p className="text-sm">{item.requestedByName || "Finance"}</p>
            {item.requestedByEmail && (
              <p className="text-xs text-muted-foreground">{item.requestedByEmail}</p>
            )}
          </TableCell>
          <TableCell className="font-medium tabular-nums">{formatAed(item.amount || 0)}</TableCell>
          <TableCell className="min-w-[240px]">
            <Badge variant="secondary" className="mb-2 text-[10px]">
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
            <BillingApprovalPipeline status={item.status} compact className="max-w-[240px]" />
            <div className="mt-2">
              <BillingApprovalTimeline item={item} />
            </div>
          </TableCell>
          <TableCell className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
          {showActions && (
            <TableCell className="text-right">
              {canAct(item) && (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="outline" onClick={() => openAction(item, "approve")}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => openAction(item, "reject")}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </TableCell>
          )}
        </TableRow>
      );
    });

  return (
    <PageShell className="max-w-6xl mx-auto">
      <PageTitle
        title="Billing milestone approval"
        subtitle="Finance submits, PM approves, Director signs off, then the client receives the payment request."
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
            Each row has its own chain: Finance → PM → Director → Client. Green checks are done. The filled
            dot is waiting. After Director approval the client sees this as a payment request.
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
          ) : pendingItems.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No billing milestones waiting for PM or Director. Approved ones appear in the box below.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Sent by (Finance)</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Approval chain</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderRows(pendingItems, { showActions: true })}</TableBody>
            </Table>
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
          ) : approvedItems.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              After the Director approves a milestone, it moves here and the client receives the payment request.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Sent by (Finance)</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Approval chain</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderRows(approvedItems, { showActions: false })}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!actionItem} onOpenChange={(open) => !open && closeAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve milestone" : "Reject milestone"}
              {actionItem?.milestoneName ? ` · ${actionItem.milestoneName}` : ""}
            </DialogTitle>
          </DialogHeader>
          {actionItem && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{actionItem.projectName || `Project #${actionItem.projectId}`}</p>
              <p className="font-semibold text-foreground">{formatAed(actionItem.amount || 0)}</p>
              <p>
                Sent by {actionItem.requestedByName || "Finance"}
                {actionItem.requestedByEmail ? ` (${actionItem.requestedByEmail})` : ""}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="milestone-comments">
              Comments {actionType === "reject" ? "(required)" : "(optional)"}
            </Label>
            <Textarea
              id="milestone-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                actionType === "reject"
                  ? "Reason for returning this milestone to Finance…"
                  : "Optional note for the next approver…"
              }
            />
          </div>
          {actionItem && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Who approved</p>
              <BillingApprovalPipeline status={actionItem.status} compact className="max-w-[280px] mb-3" />
              <BillingApprovalTimeline item={actionItem} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={acting || (actionType === "reject" && !comments.trim())}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {acting ? "Processing…" : actionType === "approve" ? "Confirm approve" : "Confirm reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
