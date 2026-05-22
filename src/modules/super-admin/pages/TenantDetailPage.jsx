import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pause, Play, RefreshCw } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "../components/shared/PageHeader";
import { MODULES, PLAN_MODULES, TENANT_DETAIL } from "../data/tenants";
import { PLAN_TYPES } from "../data/plans";
import { TenantQuickActions } from "../components/tenant-management";
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
import { Separator } from "@/components/ui/separator";
import { useTenantManagement } from "../context/tenant-management-context";

function moduleDiff(currentPlan, newPlan) {
  const current = new Set(PLAN_MODULES[currentPlan] || []);
  const next = new Set(PLAN_MODULES[newPlan] || []);
  const added = [...next].filter((m) => !current.has(m));
  const removed = [...current].filter((m) => !next.has(m));
  const kept = [...current].filter((m) => next.has(m));
  return { added, removed, kept };
}

export default function TenantDetailPage() {
  const { tenantId } = useParams();
  const { getTenantById } = useTenantManagement();
  const tenant = getTenantById(tenantId);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(tenant?.plan || "Pro");
  const [suspended, setSuspended] = useState(tenant?.status === "suspended");

  const detail = TENANT_DETAIL[tenantId] || {
    enabledModules: PLAN_MODULES[tenant?.plan] || [],
    loginActivity: [{ user: "Admin User", action: "Signed in", time: "Today", ip: "-" }],
    billing: {
      lastInvoice: "-",
      nextBilling: "-",
      paymentMethod: "-",
      outstanding: "$0",
    },
  };

  const diff = useMemo(
    () => (tenant ? moduleDiff(tenant.plan, selectedPlan) : { added: [], removed: [], kept: [] }),
    [tenant, selectedPlan]
  );

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

  const modLabel = (id) => MODULES.find((m) => m.id === id)?.name || id;

  return (
    <div className="space-y-6">
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
            description={`${tenant.plan} plan - ${tenant.activeUsers} active users - MRR ${
              tenant.mrr ? `$${tenant.mrr}` : "-"
            }`}
            actions={<TenantQuickActions />}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={tenant.status === "active" ? "success" : "warning"}>
                  {suspended ? "suspended" : tenant.status}
                </Badge>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Renewal</CardTitle>
              </CardHeader>
              <CardContent className="text-sm font-medium">
                {new Date(tenant.renewalDate).toLocaleDateString("en-AU")}
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold">
                ${tenant.revenue?.toLocaleString() || 0}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="subscription">
            <TabsList>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="activity">Login activity</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="subscription" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Subscription information</CardTitle>
                  <CardDescription>Current plan and renewal settings</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Plan</span>
                    <p className="font-medium">{tenant.plan}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Renewal state</span>
                    <p className="font-medium capitalize">{tenant.renewalState}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Billing cycle</span>
                    <p className="font-medium">Monthly</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Seats used</span>
                    <p className="font-medium">{tenant.activeUsers}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Enabled modules</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {detail.enabledModules.map((id) => (
                    <Badge key={id} variant="secondary">
                      {modLabel(id)}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card className="border-border/60">
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
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Billing summary</CardTitle>
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
          <Card className="sticky top-20 border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Admin actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full gap-2" variant="outline" onClick={() => setPlanDialogOpen(true)}>
                <RefreshCw className="h-4 w-4" />
                Change plan
              </Button>
              <Button
                className="w-full gap-2"
                variant={suspended ? "default" : "destructive"}
                onClick={() => setSuspendDialogOpen(true)}>
                {suspended ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {suspended ? "Reactivate" : "Suspend tenant"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Change subscription plan</DialogTitle>
            <DialogDescription>
              Review module changes before applying to {tenant.company}.
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAN_TYPES.map((p) => (
                <SelectItem key={p.id} value={p.displayName}>
                  {p.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Card className="border-border/60 bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Module comparison</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="mb-1 font-medium text-muted-foreground">Current ({tenant.plan})</p>
                {PLAN_MODULES[tenant.plan]?.map((m) => (
                  <p key={m}>{modLabel(m)}</p>
                ))}
              </div>
              <div>
                <p className="mb-1 font-medium text-primary">New ({selectedPlan})</p>
                {PLAN_MODULES[selectedPlan]?.map((m) => (
                  <p key={m}>{modLabel(m)}</p>
                ))}
              </div>
            </CardContent>
            <Separator className="my-2" />
            <CardContent className="grid gap-2 text-xs sm:grid-cols-3">
              <div>
                <p className="font-semibold text-emerald-600">Added</p>
                {diff.added.length ? (
                  diff.added.map((m) => <p key={m}>+ {modLabel(m)}</p>)
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
              <div>
                <p className="font-semibold text-destructive">Removed</p>
                {diff.removed.length ? (
                  diff.removed.map((m) => <p key={m}>- {modLabel(m)}</p>)
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
              <div>
                <p className="font-semibold">Unchanged</p>
                {diff.kept.map((m) => (
                  <p key={m}>{modLabel(m)}</p>
                ))}
              </div>
            </CardContent>
          </Card>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setPlanDialogOpen(false)}>Confirm plan change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{suspended ? "Reactivate tenant" : "Suspend tenant"}</DialogTitle>
            <DialogDescription>
              {suspended
                ? `Restore platform access for ${tenant.company}.`
                : `Users will lose access until reactivated.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={suspended ? "default" : "destructive"}
              onClick={() => {
                setSuspended(!suspended);
                setSuspendDialogOpen(false);
              }}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
