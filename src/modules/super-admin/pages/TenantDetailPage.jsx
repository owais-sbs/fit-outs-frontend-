import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pause, Play, RefreshCw, Ban } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "../components/shared/PageHeader";
import { PageShell, StatTile } from "@/components/layout/PageShell";
import { MODULES, PLAN_MODULES, TENANT_DETAIL } from "../data/tenants";
import { TenantQuickActions } from "../components/tenant-management";
import { formatAed } from "@/shared/utils/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenantManagement } from "../context/tenant-management-context";
import axiosInstance from "@/lib/axiosInstance";

function moduleDiff(currentModules, nextModules) {
  const current = new Set(currentModules || []);
  const next = new Set(nextModules || []);
  const added = [...next].filter((m) => !current.has(m));
  const removed = [...current].filter((m) => !next.has(m));
  const kept = [...current].filter((m) => next.has(m));
  return { added, removed, kept };
}

export default function TenantDetailPage() {
  const { tenantId } = useParams();
  const { getTenantById, updateTenantStatus, changeTenantPlan } = useTenantManagement();
  const tenant = getTenantById(tenantId);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlanUuid, setSelectedPlanUuid] = useState("");
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/subscription-plans")
      .then(({ data }) => {
        const list = Array.isArray(data?.data) ? data.data : [];
        setPlans(list.filter((p) => p.active !== false));
      })
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    if (tenant?.planUuid) {
      setSelectedPlanUuid(tenant.planUuid);
    }
  }, [tenant?.planUuid]);

  const selectedPlan = plans.find((p) => p.uuid === selectedPlanUuid);
  const currentPlan = plans.find((p) => p.uuid === tenant?.planUuid);
  const diff = useMemo(
    () =>
      moduleDiff(
        currentPlan?.modulesIncluded || PLAN_MODULES[tenant?.plan] || [],
        selectedPlan?.modulesIncluded || []
      ),
    [currentPlan, selectedPlan, tenant?.plan]
  );

  const detail = TENANT_DETAIL[tenantId] || {
    enabledModules: currentPlan?.modulesIncluded || PLAN_MODULES[tenant?.plan] || [],
    loginActivity: [{ user: "Admin User", action: "Signed in", time: "Today", ip: "-" }],
    billing: {
      lastInvoice: "-",
      nextBilling: "-",
      paymentMethod: "-",
      outstanding: "د.إ 0",
    },
  };

  if (!tenant) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={ROUTES.SUPER_ADMIN.TENANTS}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">Tenant not found</CardContent>
        </Card>
      </div>
    );
  }

  const suspended = tenant.status === "suspended";
  const terminated = tenant.status === "terminated";
  const modLabel = (id) => MODULES.find((m) => m.id === id)?.name || id;

  const runStatusAction = async (action) => {
    setBusy(true);
    setActionError(null);
    try {
      await updateTenantStatus(tenant.id, action);
      setSuspendDialogOpen(false);
      setTerminateDialogOpen(false);
    } catch (err) {
      setActionError(err?.response?.data?.message || err.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const confirmPlanChange = async () => {
    if (!selectedPlanUuid) return;
    setBusy(true);
    setActionError(null);
    try {
      await changeTenantPlan(tenant, selectedPlanUuid);
      setPlanDialogOpen(false);
    } catch (err) {
      setActionError(err?.response?.data?.message || err.message || "Plan change failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link to={ROUTES.SUPER_ADMIN.TENANTS}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          All tenants
        </Link>
      </Button>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <PageHeader
            title={tenant.company}
            description={`${tenant.plan} plan · ${tenant.activeUsers} active users`}
            actions={<TenantQuickActions />}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Status" value={tenant.status} />
            <StatTile label="Domain" value={tenant.domainSlug || "—"} />
            <StatTile label="Plan" value={tenant.plan || "—"} />
          </div>

          {actionError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </div>
          )}

          <Tabs defaultValue="subscription">
            <TabsList>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="activity">Login activity</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subscription information</CardTitle>
                  <CardDescription>Current plan and access status</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Plan</span>
                    <p className="font-medium">{tenant.plan}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p className="font-medium capitalize">{tenant.status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Domain slug</span>
                    <p className="font-mono text-xs">{tenant.domainSlug || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created</span>
                    <p className="font-medium">
                      {tenant.createdAt
                        ? new Date(tenant.createdAt).toLocaleDateString("en-AU")
                        : "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Enabled modules</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {(currentPlan?.modulesIncluded || detail.enabledModules || []).map((id) => (
                    <Badge key={id} variant="secondary">
                      {modLabel(id)}
                    </Badge>
                  ))}
                  {!(currentPlan?.modulesIncluded || detail.enabledModules || []).length && (
                    <p className="text-sm text-muted-foreground">No modules assigned yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Login activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detail.loginActivity.map((ev, i) => (
                    <div key={i} className="flex gap-4 border-l-2 border-primary/30 pl-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ev.user}</p>
                        <p className="text-sm text-muted-foreground">{ev.action}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{ev.time}</p>
                        <p>{ev.ip}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Billing summary</CardTitle>
                  <CardDescription>
                    Use the Payments page for SaaS payment log and approvals.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Last invoice</span>
                    <p className="font-medium">{detail.billing.lastInvoice}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Next billing</span>
                    <p className="font-medium">{detail.billing.nextBilling}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment method</span>
                    <p className="font-medium">{detail.billing.paymentMethod}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Outstanding</span>
                    <p className="font-medium">{detail.billing.outstanding}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="w-full shrink-0 lg:w-72">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Admin actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full gap-2" variant="outline" onClick={() => setPlanDialogOpen(true)}>
                <RefreshCw className="h-4 w-4" />
                Change plan
              </Button>
              {!terminated && (
                <Button
                  className="w-full gap-2"
                  variant={suspended ? "default" : "destructive"}
                  onClick={() => setSuspendDialogOpen(true)}>
                  {suspended ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {suspended ? "Activate" : "Suspend"}
                </Button>
              )}
              {!terminated && (
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => setTerminateDialogOpen(true)}>
                  <Ban className="h-4 w-4" />
                  Cancel (terminate)
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Change subscription plan</DialogTitle>
            <DialogDescription>Assign an active plan to {tenant.company}.</DialogDescription>
          </DialogHeader>
          <Select value={selectedPlanUuid} onValueChange={setSelectedPlanUuid}>
            <SelectTrigger>
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((p) => (
                <SelectItem key={p.uuid} value={p.uuid}>
                  {p.planName} — {formatAed(p.priceMonthly)}/mo
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Module comparison</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-xs sm:grid-cols-3">
              <div>
                <p className="font-semibold text-emerald-600">Added</p>
                {diff.added.length ? (
                  diff.added.map((m) => <p key={m}>+ {modLabel(m)}</p>)
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </div>
              <div>
                <p className="font-semibold text-destructive">Removed</p>
                {diff.removed.length ? (
                  diff.removed.map((m) => <p key={m}>- {modLabel(m)}</p>)
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </div>
              <div>
                <p className="font-semibold">Unchanged</p>
                {diff.kept.length ? (
                  diff.kept.map((m) => <p key={m}>{modLabel(m)}</p>)
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </div>
            </CardContent>
          </Card>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPlanChange} disabled={busy || !selectedPlanUuid}>
              Confirm plan change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{suspended ? "Activate company" : "Suspend company"}</DialogTitle>
            <DialogDescription>
              {suspended
                ? `Restore login access for ${tenant.company}.`
                : `Users of ${tenant.company} will lose access until activated.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={suspended ? "default" : "destructive"}
              disabled={busy}
              onClick={() => runStatusAction(suspended ? "activate" : "suspend")}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel company</DialogTitle>
            <DialogDescription>
              Mark {tenant.company} as terminated. Users will lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateDialogOpen(false)}>
              Back
            </Button>
            <Button variant="destructive" disabled={busy} onClick={() => runStatusAction("terminate")}>
              Confirm cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
