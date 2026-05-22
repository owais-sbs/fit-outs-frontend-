import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, BadgeCheck, CalendarRange, DollarSign, Users2 } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useTenantManagement } from "../../context/tenant-management-context";

const PLAN_OPTIONS = ["Starter", "Pro", "Enterprise"];
const STATUS_OPTIONS = ["active", "trial", "suspended", "expired"];
const RENEWAL_OPTIONS = ["auto", "manual", "overdue", "cancelled"];

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default function TenantManagementPanels() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    tenants,
    stats,
    createOpen,
    setCreateOpen,
    exportOpen,
    setExportOpen,
    tenantForm,
    setTenantForm,
    addTenant,
    exportTenants,
    resetForm,
  } = useTenantManagement();

  useEffect(() => {
    if (location.pathname === ROUTES.SUPER_ADMIN.TENANTS_CREATE) {
      setCreateOpen(true);
      return;
    }

    if (createOpen) {
      setCreateOpen(false);
    }
    resetForm();
  }, [createOpen, location.pathname, resetForm, setCreateOpen]);

  const handleCreateChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setTenantForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateSubmit = (event) => {
    event.preventDefault();

    if (!tenantForm.company.trim()) {
      return;
    }

    const created = addTenant(tenantForm);
    setCreateOpen(false);
    navigate(ROUTES.SUPER_ADMIN.TENANT_DETAIL.replace(":tenantId", created.id));
  };

  const handleExport = () => {
    exportTenants();
    setExportOpen(false);
  };

  const revenueLabel = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(stats.totalRevenue);

  return (
    <>
      <Sheet
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            resetForm();
            if (location.pathname === ROUTES.SUPER_ADMIN.TENANTS_CREATE) {
              navigate(ROUTES.SUPER_ADMIN.TENANTS, { replace: true });
            }
          }
        }}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-3xl">
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-border/60 px-6 py-6 text-left">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]">
                  New tenant
                </Badge>
                <span className="text-xs text-muted-foreground">Fast setup</span>
              </div>
              <SheetTitle className="text-2xl">Add tenant</SheetTitle>
              <SheetDescription className="max-w-xl">
                Create a new tenant profile, assign the plan, and set renewal and billing details in one pass.
              </SheetDescription>
            </SheetHeader>

            <form className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_280px]" onSubmit={handleCreateSubmit}>
              <div className="space-y-6 px-6 py-6">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Company details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="company">Company name</Label>
                      <Input
                        id="company"
                        value={tenantForm.company}
                        onChange={handleCreateChange("company")}
                        placeholder="Apex Fitouts Pty Ltd"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Primary contact</Label>
                      <Input
                        id="contactName"
                        value={tenantForm.contactName}
                        onChange={handleCreateChange("contactName")}
                        placeholder="Sarah Chen"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Contact email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={tenantForm.email}
                        onChange={handleCreateChange("email")}
                        placeholder="sarah@company.com"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Subscription setup</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <Select value={tenantForm.plan} onValueChange={handleCreateChange("plan")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAN_OPTIONS.map((plan) => (
                            <SelectItem key={plan} value={plan}>
                              {plan}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={tenantForm.status} onValueChange={handleCreateChange("status")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="activeUsers">Active users</Label>
                      <Input
                        id="activeUsers"
                        type="number"
                        min="0"
                        value={tenantForm.activeUsers}
                        onChange={handleCreateChange("activeUsers")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="revenue">Monthly revenue</Label>
                      <Input
                        id="revenue"
                        type="number"
                        min="0"
                        value={tenantForm.revenue}
                        onChange={handleCreateChange("revenue")}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Renewal and notes</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="renewalDate">Renewal date</Label>
                      <Input
                        id="renewalDate"
                        type="date"
                        value={tenantForm.renewalDate}
                        onChange={handleCreateChange("renewalDate")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Renewal state</Label>
                      <Select value={tenantForm.renewalState} onValueChange={handleCreateChange("renewalState")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {RENEWAL_OPTIONS.map((state) => (
                            <SelectItem key={state} value={state} className="capitalize">
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="notes">Internal notes</Label>
                      <Textarea
                        id="notes"
                        rows={4}
                        value={tenantForm.notes}
                        onChange={handleCreateChange("notes")}
                        placeholder="Access notes, onboarding context, or billing reminders."
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="border-t border-border/60 bg-muted/20 px-6 py-6 lg:border-l lg:border-t-0">
                <div className="space-y-4 lg:sticky lg:top-6">
                  <Card className="border-border/60 bg-background shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{tenantForm.company || "Company name"}</p>
                            <p className="text-xs text-muted-foreground">
                              {tenantForm.contactName || "Primary contact"}
                            </p>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {tenantForm.plan}
                          </Badge>
                        </div>
                        <Separator className="my-4" />
                        <div className="grid gap-3">
                          <StatChip
                            icon={Users2}
                            label="Active users"
                            value={tenantForm.activeUsers || "0"}
                          />
                          <StatChip
                            icon={DollarSign}
                            label="Monthly revenue"
                            value={Intl.NumberFormat("en-AU", {
                              style: "currency",
                              currency: "AUD",
                              maximumFractionDigits: 0,
                            }).format(Number(tenantForm.revenue || 0))}
                          />
                          <StatChip
                            icon={CalendarRange}
                            label="Renewal date"
                            value={tenantForm.renewalDate || "Not set"}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <StatChip icon={BadgeCheck} label="Tenant count" value={`${tenants.length + 1} records`} />
                        <StatChip icon={ArrowUpRight} label="Platform revenue" value={revenueLabel} />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="rounded-2xl border border-border/60 bg-background px-4 py-4 text-xs text-muted-foreground shadow-sm">
                    New tenants will be added to the list and you can jump straight into the detail page after saving.
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button type="submit" className="w-full">
                      Save tenant
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setCreateOpen(false);
                        resetForm();
                      }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Export tenant data</DialogTitle>
            <DialogDescription>
              Download a clean CSV snapshot of every tenant, including plan, status, renewal, and revenue data.
            </DialogDescription>
          </DialogHeader>

          <Card className="border-border/60 bg-muted/20">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
              <StatChip icon={BadgeCheck} label="Tenants included" value={tenants.length} />
              <StatChip icon={DollarSign} label="Total revenue" value={revenueLabel} />
              <StatChip icon={Users2} label="Active subscriptions" value={stats.activeSubscriptions} />
              <StatChip icon={CalendarRange} label="Expiring in 30 days" value={stats.expiringSoon} />
            </CardContent>
          </Card>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Close
            </Button>
            <Button onClick={handleExport}>Download CSV</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
