import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, ClipboardList } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "../components/shared/PageHeader";
import AnalyticsToolbar from "@/modules/shared/components/AnalyticsToolbar";
import KpiGrid from "@/modules/shared/components/KpiGrid";
import DashboardSection from "../components/dashboard/DashboardSection";
import {
  RevenueAnalyticsSection,
  TenantGrowthSection,
  SiteVisitAnalyticsSection,
  SubscriptionRevenueSection,
  MonthlyTrendsSection,
  KPI_ICONS,
} from "../components/reports/ReportsAnalytics";
import { REPORTS_KPIS } from "../data/reports-analytics";
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
    <div className="sa-reports-page space-y-8 pb-8">
      <PageHeader
        title="Reports & analytics"
        description="Platform-wide revenue, tenant growth, and site visit insights."
      />

      <AnalyticsToolbar
        period={period}
        onPeriodChange={setPeriod}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onExport={() => {}}
        showDateIcon={false}
        dateInputClassName="sa-date-input w-[11.75rem]"
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
        <TabsList className="sa-reports-tabs inline-flex h-auto w-fit max-w-full flex-wrap justify-start gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
          <TabsTrigger
            value="overview"
            className="rounded-md px-3.5 py-2 text-sm text-muted-foreground data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-[#C9A96E]/25 dark:data-[state=active]:text-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="revenue"
            className="rounded-md px-3.5 py-2 text-sm text-muted-foreground data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-[#C9A96E]/25 dark:data-[state=active]:text-foreground">
            Revenue
          </TabsTrigger>
          <TabsTrigger
            value="tenants"
            className="rounded-md px-3.5 py-2 text-sm text-muted-foreground data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-[#C9A96E]/25 dark:data-[state=active]:text-foreground">
            Tenant growth
          </TabsTrigger>
          <TabsTrigger
            value="visits"
            className="rounded-md px-3.5 py-2 text-sm text-muted-foreground data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-[#C9A96E]/25 dark:data-[state=active]:text-foreground">
            Site visits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardSection gridClassName="lg:grid-cols-2">
            <RevenueAnalyticsSection />
            <TenantGrowthSection />
            <SiteVisitAnalyticsSection />
            <SubscriptionRevenueSection />
          </DashboardSection>
          <MonthlyTrendsSection />
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
          </div>
          <SiteVisitAnalyticsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
