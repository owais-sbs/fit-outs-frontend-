import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, ClipboardList, ExternalLink } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "../components/shared/PageHeader";
import AnalyticsToolbar from "@/modules/shared/components/AnalyticsToolbar";
import KpiGrid from "@/modules/shared/components/KpiGrid";
import DashboardSection from "../components/dashboard/DashboardSection";
import {
  RevenueAnalyticsSection,
  TenantGrowthSection,
  CrmPerformanceSection,
  LeadConversionSection,
  SiteVisitAnalyticsSection,
  SubscriptionRevenueSection,
  MonthlyTrendsSection,
  ReportsMetricsTable,
  KPI_ICONS,
} from "../components/reports/ReportsAnalytics";
import { REPORTS_KPIS, REPORTS_TABLE_ROWS } from "../data/reports-analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-05-21");
  const [tenantFilter, setTenantFilter] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [period]);

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        title="Reports & analytics"
        description="Platform-wide revenue, tenant growth, CRM performance, and site visit insights."
      />

      <AnalyticsToolbar
        period={period}
        onPeriodChange={setPeriod}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onExport={() => {}}
        filterSlot={
          <Select value={tenantFilter} onValueChange={setTenantFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tenants</SelectItem>
              <SelectItem value="enterprise">Enterprise only</SelectItem>
              <SelectItem value="pro">Pro only</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <KpiGrid kpis={REPORTS_KPIS} icons={KPI_ICONS} loading={loading} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="tenants">Tenant growth</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="visits">Site visits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardSection gridClassName="lg:grid-cols-2">
            <RevenueAnalyticsSection />
            <TenantGrowthSection />
            <CrmPerformanceSection />
            <LeadConversionSection />
            <SiteVisitAnalyticsSection />
            <SubscriptionRevenueSection />
          </DashboardSection>
          <MonthlyTrendsSection />
          {!loading && <ReportsMetricsTable rows={REPORTS_TABLE_ROWS} />}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <DashboardSection gridClassName="lg:grid-cols-2">
            <RevenueAnalyticsSection />
            <SubscriptionRevenueSection />
          </DashboardSection>
          <MonthlyTrendsSection />
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <TenantGrowthSection />
        </TabsContent>

        <TabsContent value="crm" className="space-y-6">
          <DashboardSection gridClassName="lg:grid-cols-2">
            <CrmPerformanceSection />
            <LeadConversionSection />
          </DashboardSection>
        </TabsContent>

        <TabsContent value="visits" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link to={ROUTES.SUPER_ADMIN.SITE_VISITS}>
                <ClipboardList className="h-4 w-4" />
                Open site visits
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to={ROUTES.SUPER_ADMIN.SITE_VISIT_SCHEDULE}>
                <CalendarPlus className="h-4 w-4" />
                Schedule visit
              </Link>
            </Button>
            <Button asChild variant="ghost" className="gap-2">
              <Link to={ROUTES.ADMIN.SITE_VISITS}>
                <ExternalLink className="h-4 w-4" />
                CRM view
              </Link>
            </Button>
          </div>
          <SiteVisitAnalyticsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
