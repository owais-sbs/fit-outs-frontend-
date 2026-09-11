import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, XCircle, Award, Clock } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  fetchBoqsByProject,
  rejectBoq,
} from "@/modules/admin/api/boq.api";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { useAuth } from "@/shared/context/auth-context";
import { boqViewPath } from "@/shared/constants/routes";
import { canApproveBoq, isBoqPendingForRole } from "@/shared/constants/roles";

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

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const inboxList = await fetchBoqInbox(role).catch(() => []);
      const projects = await fetchAllProjects().catch(() => []);
      const projectBoqsList = await Promise.all(
        (Array.isArray(projects) ? projects : []).map(async (p) => {
          try {
            const boqs = await fetchBoqsByProject(p.id);
            return (Array.isArray(boqs) ? boqs : []).map((b) => ({
              ...b,
              projectName: b.projectName || p.projectName || p.name,
              clientName: p.clientName || p.projectName || p.name,
              projectId: b.projectId || p.id,
            }));
          } catch {
            return [];
          }
        })
      );

      const combined = [
        ...(Array.isArray(inboxList) ? inboxList : []),
        ...projectBoqsList.flat(),
      ];

      const map = new Map();
      combined.forEach((b) => {
        if (b && b.id) {
          map.set(b.id, { ...map.get(b.id), ...b });
        }
      });
      setItems(Array.from(map.values()));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
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
      await loadInbox();
    } catch (e) {
      setMessage(e.response?.data?.message || "Action failed.");
    } finally {
      setActing(false);
    }
  };

  const pendingItems = items.filter(
    (item) => String(item.status || "").toUpperCase() === "PENDING_CLIENT"
  );
  const approvedItems = items.filter((item) =>
    ["APPROVED", "FINAL"].includes(String(item.status || "").toUpperCase())
  );

  return (
    <PageShell className="space-y-6">
      <PageTitle
        title="BOQ Approvals"
        subtitle="Review quotation BOQs submitted for your sign-off and view all approved project profiles."
      />

      {message && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
          {message}
        </p>
      )}

      {/* Section 1: Awaiting Your Approval */}
      <Surface className="overflow-hidden">
        <div className="border-b border-border/30 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Awaiting your approval</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Waiting for your approval to accept or reject.
            </p>
          </div>
          {pendingItems.length > 0 && (
            <Badge variant="warning" className="px-2.5 py-0.5 text-xs font-medium">
              {pendingItems.length} Pending
            </Badge>
          )}
        </div>
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : pendingItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Clock className="h-8 w-8 mb-2 text-muted-foreground/40" />
            <p className="text-sm font-medium">No BOQs pending your approval</p>
            <p className="text-xs text-muted-foreground">You are all caught up!</p>
          </div>
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
              {pendingItems.map((item) => {
                const canAct = canApproveBoq(role) && isBoqPendingForRole(role, item.status);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1.5">
                        <div>
                          <p className="font-semibold text-foreground">{item.projectName}</p>
                          {item.clientName && item.clientName !== item.projectName && (
                            <p className="text-xs text-muted-foreground">{item.clientName}</p>
                          )}
                        </div>
                        <BoqApprovalPipeline status={item.status} compact className="max-w-[220px]" />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">v{item.version}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-semibold">
                      {formatCurrency(item.grandTotal)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(item.submittedAt || item.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={boqViewPath(role, item.id, item.projectId)}>
                            <Eye className="mr-1 h-3.5 w-3.5" /> View document
                          </Link>
                        </Button>
                        {canAct && (
                          <>
                            <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openAction(item, "approve")}>
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Accept
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => openAction(item, "reject")}>
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

      {/* Section 2: Approved BOQs & Project Profiles */}
      <Surface className="overflow-hidden">
        <div className="border-b border-border/30 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Approved BOQs & Project Profiles</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              All quotation BOQs accepted and approved by you.
            </p>
          </div>
          {approvedItems.length > 0 && (
            <Badge variant="success" className="px-2.5 py-0.5 text-xs font-medium">
              {approvedItems.length} Approved
            </Badge>
          )}
        </div>
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading approved BOQs…</p>
        ) : approvedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Award className="h-8 w-8 mb-2 text-muted-foreground/40" />
            <p className="text-sm font-medium">No approved BOQs yet</p>
            <p className="text-xs text-muted-foreground">When you accept a BOQ approval, it will appear here with full project profile details.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Profile</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Total ({DIRHAM_SYMBOL})</TableHead>
                <TableHead>Approval Pipeline</TableHead>
                <TableHead>Approved Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold text-foreground">{item.projectName}</p>
                      {item.clientName && (
                        <p className="text-xs text-muted-foreground">Client: {item.clientName}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">v{item.version}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(item.grandTotal)}
                  </TableCell>
                  <TableCell className="min-w-[200px]">
                    <div className="space-y-1">
                      <Badge variant="success" className="text-[10px]">
                        Approved & Accepted
                      </Badge>
                      <BoqApprovalPipeline status={item.status} compact className="max-w-[200px]" />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(item.approvedAt || item.updatedAt || item.submittedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={boqViewPath(role, item.id, item.projectId)}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> View document
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
