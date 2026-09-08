import { useCallback, useEffect, useState } from "react";
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

const STATUS_LABELS = {
  DRAFT: "Draft — with Finance",
  PENDING_PM: "Waiting for PM",
  PENDING_DIRECTOR: "Waiting for Director",
  ISSUED: "Sent to client",
  PAID: "Paid",
  PART_PAID: "Part paid",
};

const PIPELINE = [
  { key: "FINANCE", label: "Finance" },
  { key: "PENDING_PM", label: "PM" },
  { key: "PENDING_DIRECTOR", label: "Director" },
  { key: "ISSUED", label: "Client" },
];

function pipelineIndex(status) {
  if (status === "PENDING_PM") return 1;
  if (status === "PENDING_DIRECTOR") return 2;
  if (status === "ISSUED" || status === "PAID" || status === "PART_PAID") return 3;
  return 0;
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

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchBillingMilestoneInbox();
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setMessage(e.response?.data?.message || e.message || "Unable to load billing milestone inbox.");
      setItems([]);
    } finally {
      setLoading(false);
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
    try {
      if (actionType === "approve") {
        await approvePaymentRequest(actionItem.uuid, comments.trim());
        setMessage(
          role === ROLES.BUSINESS_OWNER
            ? "Approved. The client will be notified."
            : "Approved and sent to the Director."
        );
      } else {
        await rejectPaymentRequest(actionItem.uuid, comments.trim());
        setMessage("Returned to Finance with comments.");
      }
      closeAction();
      await loadInbox();
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

  return (
    <PageShell className="max-w-6xl mx-auto">
      <PageTitle
        title="BOQ milestone approval"
        subtitle="Finance sends a billing milestone here first. After you sign off it goes to the Director, then the client."
        actions={
          <Button variant="outline" size="sm" onClick={loadInbox} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {PIPELINE.map((step, i) => (
          <span key={step.key} className="flex items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-1 font-medium text-foreground">{step.label}</span>
            {i < PIPELINE.length - 1 && <span aria-hidden>→</span>}
          </span>
        ))}
      </div>

      {message && (
        <p className="text-sm text-emerald-700 bg-emerald-50/80 rounded-xl px-3 py-2">{message}</p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pending milestone requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading inbox…</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No billing milestones waiting for your approval. When Finance submits a milestone, it appears here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Sent by (Finance)</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const href = billingPath(role, item.projectId);
                  const active = pipelineIndex(item.status);
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
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {STATUS_LABELS[item.status] || item.status}
                        </Badge>
                        <div className="mt-1 flex gap-1">
                          {PIPELINE.slice(1).map((step, i) => (
                            <span
                              key={step.key}
                              className={`h-1.5 w-5 rounded-full ${i + 1 <= active ? "bg-primary" : "bg-muted"}`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
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
                    </TableRow>
                  );
                })}
              </TableBody>
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
