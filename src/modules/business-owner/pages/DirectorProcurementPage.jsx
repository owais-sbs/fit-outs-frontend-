import { Link } from "react-router-dom";
import StockDashboardPage from "@/modules/admin/pages/procurement/StockDashboardPage";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import DashboardHeader from "@/modules/super-admin/components/DashboardHeader";
import { PageShell } from "@/components/layout/PageShell";

export default function DirectorProcurementPage() {
  return (
    <PageShell>
      <DashboardHeader
        title="Procurement Overview"
        description="Company-wide stock balances, value, and warehouse activity."
      >
        <Button asChild size="sm" variant="outline">
          <Link to={ROUTES.ADMIN.PROCUREMENT_STOCK}>Full stock dashboard</Link>
        </Button>
      </DashboardHeader>
      <div className="rounded-2xl bg-secondary/30 p-1">
        <StockDashboardPage />
      </div>
    </PageShell>
  );
}
