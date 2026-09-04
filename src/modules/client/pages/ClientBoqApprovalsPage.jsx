import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/modules/admin/pages/boq/quantityCalcUtils";
import { DIRHAM_SYMBOL } from "@/shared/utils/currency";
import { BoqStatusBadge } from "@/modules/admin/pages/boq/BoqApprovalTimeline";
import BoqApprovalPipeline from "@/modules/admin/pages/boq/BoqApprovalPipeline";
import {
  approveBoq,
  fetchBoq,
  fetchBoqInbox,
  rejectBoq,
} from "@/modules/admin/api/boq.api";
import { useAuth } from "@/shared/context/auth-context";
import { boqViewPath } from "@/shared/constants/routes";
import { canApproveBoq, filterBoqInboxForRole, isBoqPendingForRole } from "@/shared/constants/roles";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function ClientBoqApprovalsPage() {
  const { role } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [comments, setComments] = useState("");
  const [detailBoq, setDetailBoq] = useState(null);
  const [acting, setActing] = useState(false);

  const loadInbox = useCallback(() => {
    setLoading(true);
    fetchBoqInbox(role)
      .then((list) => setItems(filterBoqInboxForRole(list, role)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [role]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const openAction = (item, type) => {
    setActionItem(item);
    setActionType(type);
    setComments("");
    fetchBoq(item.id).then(setDetailBoq).catch(() => setDetailBoq(null));
  };

  const closeAction = () => {
    setActionItem(null);
    setActionType(null);
    setComments("");
    setDetailBoq(null);
  };

  const confirmAction = async () => {
    if (!actionItem) return;
    if (actionType === "reject" && !comments.trim()) {
      setMessage("Please provide a reason for rejection.");
      return;
    }
    setActing(true);
    setMessage("");
    try {
      if (actionType === "approve") {
        await approveBoq(actionItem.id, comments.trim() || null);
        setMessage("BOQ approved. The quotation is now finalized.");
      } else {
        await rejectBoq(actionItem.id, comments.trim());
        setMessage("BOQ returned to the QS team for revision.");
      }
      closeAction();
      loadInbox();
    } catch (e) {
      setMessage(e.response?.data?.message || "Action failed.");
    } finally {
      setActing(false);
    }
  };

  return (
    <PageShell>
      <PageTitle
        title="BOQ Approvals"
        subtitle="Review quotation BOQs submitted for your final sign-off."
      />

      {message && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
          {message}
        </p>
      )}

      <Surface className="overflow-hidden">
        <div className="border-b border-border/30 px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight">Awaiting your approval</h2>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No BOQs pending your approval.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Total ({DIRHAM_SYMBOL})</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const canAct = canApproveBoq(role) && isBoqPendingForRole(role, item.status);
                return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="space-y-2">
                      <span>{item.projectName}</span>
                      <BoqApprovalPipeline status={item.status} compact className="max-w-[220px]" />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">v{item.version}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(item.grandTotal)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(item.submittedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={boqViewPath(role, item.id, item.projectId)}>
                          <Eye className="mr-1 h-3.5 w-3.5" /> View document
                        </Link>
                      </Button>
                      {canAct && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openAction(item, "approve")}>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => openAction(item, "reject")}>
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Surface>

      <Dialog open={!!actionItem} onOpenChange={(open) => !open && closeAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve quotation BOQ" : "Request BOQ changes"}
            </DialogTitle>
          </DialogHeader>
          {detailBoq && (
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl bg-secondary/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project</span>
                <span className="font-medium">{detailBoq.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grand total</span>
                <span className="font-bold">{formatCurrency(detailBoq.grandTotal)}</span>
              </div>
              <BoqStatusBadge status={detailBoq.status} />
              <ul className="space-y-1 border-t border-border/30 pt-2 text-xs text-muted-foreground">
                {(detailBoq.lines || []).slice(0, 8).map((line) => (
                  <li key={line.id}>{line.description} — {line.quantity} {line.unit}</li>
                ))}
                {(detailBoq.lines || []).length > 8 && (
                  <li>…and {detailBoq.lines.length - 8} more lines</li>
                )}
              </ul>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="client-boq-comments">
              {actionType === "reject" ? "What should be revised? (required)" : "Comments (optional)"}
            </Label>
            <Input
              id="client-boq-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>Cancel</Button>
            <Button
              onClick={confirmAction}
              disabled={acting}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {acting ? "Processing…" : actionType === "approve" ? "Approve BOQ" : "Send back"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
