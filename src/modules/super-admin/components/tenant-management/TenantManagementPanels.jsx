import { BadgeCheck, CalendarRange, DollarSign, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenantManagement } from "../../context/tenant-management-context";

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
  const {
    tenants,
    stats,
    exportOpen,
    setExportOpen,
    exportTenants,
  } = useTenantManagement();

  const handleExport = () => {
    exportTenants();
    setExportOpen(false);
  };

  const revenueLabel = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(stats.totalRevenue);

  return (
    <>
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Export company data</DialogTitle>
            <DialogDescription>
              Download a clean CSV snapshot of every company, including plan, status, renewal, and revenue data.
            </DialogDescription>
          </DialogHeader>

          <Card className="border-border/60 bg-muted/20">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
              <StatChip icon={BadgeCheck} label="Companies included" value={tenants.length} />
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
