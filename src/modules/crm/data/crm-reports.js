import { CHART_COLORS } from "@/modules/super-admin/data/analytics-dashboard";

export const CRM_REPORT_KPIS = [
  { id: "pipeline", title: "Pipeline value", value: "$2.4M", growth: 11.2, growthLabel: "open deals" },
  { id: "won", title: "Won this month", value: "$428k", growth: 18.4, growthLabel: "vs last month" },
  { id: "conversion", title: "Win rate", value: "24%", growth: 2.1, growthLabel: "qualified → won" },
  { id: "cycle", title: "Avg sales cycle", value: "34d", growth: -5.2, growthLabel: "days" },
];

export const PIPELINE_PERF_DATA = [
  { month: "Jan", value: 1800 },
  { month: "Feb", value: 1950 },
  { month: "Mar", value: 2100 },
  { month: "Apr", value: 2280 },
  { month: "May", value: 2400 },
  { month: "Jun", value: 2550 },
];

export const PIPELINE_PERF_CONFIG = {
  value: { label: "Pipeline ($k)", colors: CHART_COLORS.chart1 },
};

export const LEAD_SOURCE_DATA = [
  { source: "website", count: 42 },
  { source: "referral", count: 38 },
  { source: "tradeShow", count: 24 },
  { source: "linkedin", count: 28 },
  { source: "outreach", count: 18 },
];

export const LEAD_SOURCE_CONFIG = {
  website: { label: "Website", colors: CHART_COLORS.chart1 },
  referral: { label: "Referral", colors: CHART_COLORS.chart2 },
  tradeShow: { label: "Trade show", colors: CHART_COLORS.chart3 },
  linkedin: { label: "LinkedIn", colors: CHART_COLORS.chart4 },
  outreach: { label: "Outreach", colors: CHART_COLORS.chart5 },
};

export const TEAM_PERF_DATA = [
  { rep: "James", deals: 8, revenue: 420 },
  { rep: "Emma", deals: 6, revenue: 380 },
  { rep: "Tom", deals: 7, revenue: 510 },
  { rep: "Lisa", deals: 4, revenue: 290 },
];

export const TEAM_PERF_CONFIG = {
  deals: { label: "Deals won", colors: CHART_COLORS.chart2 },
  revenue: { label: "Revenue ($k)", colors: CHART_COLORS.chart1 },
};
