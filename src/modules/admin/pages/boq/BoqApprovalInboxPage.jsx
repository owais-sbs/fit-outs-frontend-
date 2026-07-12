import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, Inbox, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { formatCurrency } from "./quantityCalcUtils";
import { BoqStatusBadge } from "./BoqApprovalTimeline";
import {
  approveBoq,
  fetchBoq,
  fetchBoqInbox,
  rejectBoq,
} from "../../api/boq.api";
import BoqApprovalTimeline from "./BoqApprovalTimeline";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function BoqApprovalInboxPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [comments, setComments] = useState("");
  const [detailBoq, setDetailBoq] = useState(null);
  const [history, setHistory] = useState(null);
  const [acting, setActing] = useState(false);

  const loadInbox = useCallback(() => {
    setLoading(true);
    fetchBoqInbox()
      .then((list) => setItems(Array.isArray(list) ? list : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const openAction = (item, type) => {
    setActionItem(item);
    setActionType(type);
    setComments("");
    fetchBoq(item.id)
      .then((boq) => setDetailBoq(boq))
      .catch(() => setDetailBoq(null));
  };

  const closeAction = () => {
    setActionItem(null);
    setActionType(null);
    setComments("");
    setDetailBoq(null);
    setHistory(null);
  };

  const confirmAction = async () => {
    if (!actionItem) return;
    if (actionType === "reject" && !comments.trim()) {
      setMessage("Rejection comment is required.");
      return;
    }
    setActing(true);
    setMessage("");
    try {
      if (actionType === "approve") {
        await approveBoq(actionItem.id, comments.trim() || null);
        setMessage(`BOQ v${actionItem.version} approved.`);
      } else {
        await rejectBoq(actionItem.id, comments.trim());
        setMessage(`BOQ v${actionItem.version} returned to QS.`);
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Inbox className="h-5 w-5" /> BOQ Approval Inbox
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve BOQs pending your sign-off ({role?.replace(/-/g, " ")})
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadInbox}>Refresh</Button>
      </div>

      {message && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          {message}
        </p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pending approvals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading inbox…</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No BOQs waiting for your approval.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.projectName}</TableCell>
                    <TableCell className="font-mono text-xs">v{item.version}</TableCell>
                    <TableCell><BoqStatusBadge status={item.status} /></TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(item.grandTotal)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(item.submittedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`${ROUTES.ADMIN.BOQ}?boqId=${item.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAction(item, "approve")}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => openAction(item, "reject")}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!actionItem} onOpenChange={(open) => !open && closeAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve BOQ" : "Reject BOQ"}
              {actionItem ? ` · v${actionItem.version}` : ""}
            </DialogTitle>
          </DialogHeader>
          {detailBoq && (
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>{detailBoq.projectName}</p>
              <p className="font-semibold text-foreground">{formatCurrency(detailBoq.grandTotal)}</p>
              <p>{detailBoq.lines?.length || 0} line items</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="approval-comments">
              Comments {actionType === "reject" ? "(required)" : "(optional)"}
            </Label>
            <Input
              id="approval-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={actionType === "reject" ? "Reason for rejection…" : "Optional note…"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>Cancel</Button>
            <Button
              onClick={confirmAction}
              disabled={acting}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {acting ? "Processing…" : actionType === "approve" ? "Confirm Approve" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        <Link to={ROUTES.ADMIN.BOQ} className="underline">Open BOQ workspace</Link>
      </p>
    </div>
  );
}
