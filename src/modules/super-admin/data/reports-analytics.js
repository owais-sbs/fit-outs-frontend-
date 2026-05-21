import { CHART_COLORS } from "./analytics-dashboard";

export const REPORTS_KPIS = [
  { id: "mrr", title: "Platform MRR", value: "$128.4k", growth: 5.7, growthLabel: "vs prior period" },
  { id: "tenants", title: "Active Tenants", value: "214", growth: 6.4, growthLabel: "vs prior period" },
  { id: "crm", title: "CRM Pipeline", value: "$2.4M", growth: 11.2, growthLabel: "open value" },
  { id: "conversion", title: "Lead Conversion", value: "24.8%", growth: 3.1, growthLabel: "won / qualified" },
];

export const TENANT_GROWTH_DATA = [
  { month: "Jan", newTenants: 12, churned: 2 },
  { month: "Feb", newTenants: 15, churned: 1 },
  { month: "Mar", newTenants: 14, churned: 3 },
  { month: "Apr", newTenants: 18, churned: 2 },
  { month: "May", newTenants: 16, churned: 4 },
  { month: "Jun", newTenants: 20, churned: 2 },
  { month: "Jul", newTenants: 17, churned: 3 },
  { month: "Aug", newTenants: 22, churned: 2 },
  { month: "Sep", newTenants: 19, churned: 5 },
  { month: "Oct", newTenants: 21, churned: 3 },
  { month: "Nov", newTenants: 24, churned: 2 },
  { month: "Dec", newTenants: 18, churned: 4 },
];

export const TENANT_GROWTH_CONFIG = {
  newTenants: { label: "New tenants", colors: CHART_COLORS.chart1 },
  churned: { label: "Churned", colors: CHART_COLORS.destructive },
};

export const CRM_PERFORMANCE_DATA = [
  { month: "Jan", leads: 84, qualified: 32, won: 12 },
  { month: "Feb", leads: 92, qualified: 38, won: 15 },
  { month: "Mar", leads: 88, qualified: 41, won: 14 },
  { month: "Apr", leads: 102, qualified: 45, won: 18 },
  { month: "May", leads: 96, qualified: 44, won: 16 },
  { month: "Jun", leads: 110, qualified: 52, won: 21 },
];

export const CRM_PERFORMANCE_CONFIG = {
  leads: { label: "Leads", colors: CHART_COLORS.chart4 },
  qualified: { label: "Qualified", colors: CHART_COLORS.chart2 },
  won: { label: "Won", colors: CHART_COLORS.chart3 },
};

export const LEAD_CONVERSION_DATA = [
  { stage: "new", rate: 100 },
  { stage: "contacted", rate: 78 },
  { stage: "qualified", rate: 52 },
  { stage: "siteVisit", rate: 34 },
  { stage: "won", rate: 24 },
];

export const LEAD_CONVERSION_CONFIG = {
  new: { label: "New", colors: CHART_COLORS.chart4 },
  contacted: { label: "Contacted", colors: CHART_COLORS.chart2 },
  qualified: { label: "Qualified", colors: CHART_COLORS.chart1 },
  siteVisit: { label: "Site visit", colors: CHART_COLORS.chart3 },
  won: { label: "Won", colors: CHART_COLORS.chart3 },
};

export const SITE_VISIT_ANALYTICS_DATA = [
  { month: "Jan", scheduled: 42, completed: 38 },
  { month: "Feb", scheduled: 48, completed: 44 },
  { month: "Mar", scheduled: 45, completed: 41 },
  { month: "Apr", scheduled: 52, completed: 48 },
  { month: "May", scheduled: 50, completed: 46 },
  { month: "Jun", scheduled: 58, completed: 54 },
];

export const SITE_VISIT_CONFIG = {
  scheduled: { label: "Scheduled", colors: CHART_COLORS.chart2 },
  completed: { label: "Completed", colors: CHART_COLORS.chart3 },
};

export const SUBSCRIPTION_REVENUE_DATA = [
  { plan: "starter", revenue: 29200 },
  { plan: "pro", revenue: 102960 },
  { plan: "enterprise", revenue: 220800 },
];

export const SUBSCRIPTION_REVENUE_CONFIG = {
  starter: { label: "Starter", colors: CHART_COLORS.chart4 },
  pro: { label: "Pro", colors: CHART_COLORS.chart1 },
  enterprise: { label: "Enterprise", colors: CHART_COLORS.chart2 },
};

export const MONTHLY_TRENDS_DATA = [
  { month: "Jan", mrr: 96, visits: 38, leads: 84 },
  { month: "Feb", mrr: 102, visits: 44, leads: 92 },
  { month: "Mar", mrr: 108, visits: 41, leads: 88 },
  { month: "Apr", mrr: 112, visits: 48, leads: 102 },
  { month: "May", mrr: 118, visits: 46, leads: 96 },
  { month: "Jun", mrr: 124, visits: 54, leads: 110 },
];

export const MONTHLY_TRENDS_CONFIG = {
  mrr: { label: "MRR ($k)", colors: CHART_COLORS.chart1 },
  visits: { label: "Site visits", colors: CHART_COLORS.chart3 },
  leads: { label: "CRM leads", colors: CHART_COLORS.chart2 },
};

export const REPORTS_TABLE_ROWS = [
  { metric: "Average deal size", value: "$48,200", change: "+6.2%" },
  { metric: "Sales cycle (days)", value: "34", change: "-4 days" },
  { metric: "Site visit completion", value: "92%", change: "+2.1%" },
  { metric: "Trial → paid conversion", value: "68%", change: "+4.2%" },
];
