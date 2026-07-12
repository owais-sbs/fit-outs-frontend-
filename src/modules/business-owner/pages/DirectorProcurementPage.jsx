import { Link } from "react-router-dom";
import StockDashboardPage from "@/modules/admin/pages/procurement/StockDashboardPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import DashboardHeader from "@/modules/super-admin/components/DashboardHeader";

export default function DirectorProcurementPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Procurement Overview"
        description="Company-wide stock balances, value, and warehouse activity."
      >
        <Button asChild size="sm" variant="outline">
          <Link to={ROUTES.ADMIN.PROCUREMENT_STOCK}>Full stock dashboard</Link>
        </Button>
      </DashboardHeader>
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Live from warehouse APIs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <StockDashboardPage />
        </CardContent>
      </Card>
    </div>
  );
}
