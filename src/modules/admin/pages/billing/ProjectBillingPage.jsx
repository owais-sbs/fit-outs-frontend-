import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Plus, Trash2, X, Banknote } from "lucide-react";
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
  requestMilestonePayment,
  approvePaymentRequest,
  submitPaymentRequest,
  rejectPaymentRequest,
  markPaymentRequestPaid,
} from "../../api/billing.api";
import { ROUTES } from "@/shared/constants/routes";

export default function ProjectBillingPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const detailPath = (isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL)
    .replace(":projectId", projectId);

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [rejectReasons, setRejectReasons] = useState({});
  const [form, setForm] = useState({
    name: "",
    amount: "",
    dueDate: "",
    percentCompleteRequired: "",
    linkedActivityUuid: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    fetchBillingMilestones(projectId)
      .then((list) => setMilestones(Array.isArray(list) ? list : []))
      .catch(() => setMilestones([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMsg) => {
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

  const handleCreate = () =>
    run(async () => {
      await createBillingMilestone(projectId, {
        name: form.name.trim(),
        amount: Number(form.amount) || 0,
        dueDate: form.dueDate || null,
        percentCompleteRequired: form.percentCompleteRequired !== ""
          ? Number(form.percentCompleteRequired)
          : null,
        linkedActivityUuid: form.linkedActivityUuid.trim() || null,
      });
      setForm({
        name: "",
        amount: "",
        dueDate: "",
        percentCompleteRequired: "",
        linkedActivityUuid: "",
      });
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
              <Label className="text-xs">Amount</Label>
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
            <div className="space-y-1">
              <Label className="text-xs">% complete required</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.percentCompleteRequired}
                onChange={(e) => setForm((f) => ({ ...f, percentCompleteRequired: e.target.value }))}
                placeholder="e.g. 50"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Linked activity UUID</Label>
              <Input
                value={form.linkedActivityUuid}
                onChange={(e) => setForm((f) => ({ ...f, linkedActivityUuid: e.target.value }))}
                placeholder="Optional schedule activity UUID"
              />
            </div>
          </div>
          <Button size="sm" onClick={handleCreate} disabled={busy || !form.name.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Milestones ({milestones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No milestones yet</p>
          ) : (
            <div className="divide-y divide-border/40">
              {milestones.map((m) => {
                const paymentReq = m.paymentRequest || m.latestPaymentRequest;
                return (
                  <div key={m.uuid} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{m.name}</p>
                        <Badge variant="secondary">{m.status || "DRAFT"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        AED {Number(m.amount || 0).toLocaleString()}
                        {m.dueDate ? ` · due ${m.dueDate}` : ""}
                        {m.percentCompleteRequired != null
                          ? ` · ≥${m.percentCompleteRequired}%`
                          : ""}
                        {m.linkedActivityUuid
                          ? ` · activity ${String(m.linkedActivityUuid).slice(0, 8)}…`
                          : ""}
                        {paymentReq ? ` · payment ${paymentReq.status}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () => requestMilestonePayment(projectId, m.uuid, { amount: m.amount }),
                            "Payment requested"
                          )
                        }
                      >
                        Request payment
                      </Button>
                      {paymentReq?.uuid && paymentReq.status === "DRAFT" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            run(() => submitPaymentRequest(paymentReq.uuid), "Submitted to PM")
                          }
                        >
                          Submit
                        </Button>
                      )}
                      {paymentReq?.uuid && paymentReq.status === "PENDING_PM" && (
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
                              run(() => approvePaymentRequest(paymentReq.uuid), "Approved")
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
                                "Rejected"
                              )
                            }
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {paymentReq?.uuid &&
                        (paymentReq.status === "ISSUED" || paymentReq.status === "PART_PAID") && (
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
