import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Plus, Send, Trash2, X, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { portalRoutesFromPath, ROUTES } from "@/shared/constants/routes";
import { ROLES } from "@/shared/constants/roles";
import { useAuth } from "@/shared/context/auth-context";
import { formatAed } from "@/shared/utils/currency";

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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [rejectReasons, setRejectReasons] = useState({});
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
    ])
      .then(([milestoneList, project]) => {
        setMilestones(Array.isArray(milestoneList) ? milestoneList : []);
        setProjectBudget(Number(project?.budget) || 0);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

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

      {isFinanceUser && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Approval workflow</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>Create milestones manually, then submit for approval.</p>
            <p>PM approves first, then the Director. After Director approval, the client receives a payment reminder by email.</p>
            {projectBudget > 0 && (
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
          <CardContent className="space-y-3">
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
                        {projectBudget > 0 && m.amount
                          ? ` (${Math.round((Number(m.amount) / projectBudget) * 100)}%)`
                          : ""}
                        {m.dueDate ? ` · due ${m.dueDate}` : ""}
                        {paymentReq?.requestedByName
                          ? ` · sent by ${paymentReq.requestedByName}`
                          : ""}
                      </p>
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
