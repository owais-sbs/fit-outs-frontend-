/** Theme-aligned chart colors — use oklch() with CSS variables from index.css */
export const CHART_COLORS = {
  primary: {
    light: ["oklch(var(--primary))"],
    dark: ["oklch(var(--primary))"],
  },
  secondary: {
    light: ["oklch(var(--secondary))"],
    dark: ["oklch(var(--secondary))"],
  },
  chart1: {
    light: ["oklch(var(--chart-1))"],
    dark: ["oklch(var(--chart-1))"],
  },
  chart2: {
    light: ["oklch(var(--chart-2))"],
    dark: ["oklch(var(--chart-2))"],
  },
  chart3: {
    light: ["oklch(var(--chart-3))"],
    dark: ["oklch(var(--chart-3))"],
  },
  chart4: {
    light: ["oklch(var(--chart-4))"],
    dark: ["oklch(var(--chart-4))"],
  },
  chart5: {
    light: ["oklch(var(--chart-5))"],
    dark: ["oklch(var(--chart-5))"],
  },
  muted: {
    light: ["oklch(var(--muted-foreground))"],
    dark: ["oklch(var(--muted-foreground))"],
  },
  destructive: {
    light: ["oklch(var(--destructive))"],
    dark: ["oklch(var(--destructive))"],
  },
};

export const ANALYTICS_STATS = [
  {
    id: "total-tenants",
    title: "Total Tenants",
    value: "248",
    growth: 8.2,
    growthLabel: "vs last month",
  },
  {
    id: "active-subscriptions",
    title: "Active Subscriptions",
    value: "214",
    growth: 6.4,
    growthLabel: "vs last month",
  },
  {
    id: "monthly-revenue",
    title: "Monthly Revenue",
    value: "$128.4k",
    growth: 5.7,
    growthLabel: "MRR",
  },
  {
    id: "trial-conversions",
    title: "Trial Conversions",
    value: "68%",
    growth: 4.2,
    growthLabel: "last 30 days",
  },
];

/** Monthly MRR + CRM pipeline value (AED thousands) */
export const REVENUE_ANALYTICS_DATA = [
  { month: "Jan", mrr: 96, crmPipeline: 42 },
  { month: "Feb", mrr: 102, crmPipeline: 48 },
  { month: "Mar", mrr: 108, crmPipeline: 51 },
  { month: "Apr", mrr: 112, crmPipeline: 55 },
  { month: "May", mrr: 118, crmPipeline: 58 },
  { month: "Jun", mrr: 121, crmPipeline: 62 },
  { month: "Jul", mrr: 124, crmPipeline: 64 },
  { month: "Aug", mrr: 126, crmPipeline: 67 },
  { month: "Sep", mrr: 127, crmPipeline: 69 },
  { month: "Oct", mrr: 128, crmPipeline: 71 },
  { month: "Nov", mrr: 128, crmPipeline: 74 },
  { month: "Dec", mrr: 128, crmPipeline: 76 },
];

export const REVENUE_CHART_CONFIG = {
  mrr: {
    label: "MRR ($k)",
    colors: CHART_COLORS.chart1,
  },
  crmPipeline: {
    label: "CRM pipeline ($k)",
    colors: CHART_COLORS.chart2,
  },
};

/** Tenant count by subscription plan */
export const TENANT_PLAN_DATA = [
  { plan: "starter", tenants: 98 },
  { plan: "pro", tenants: 104 },
  { plan: "enterprise", tenants: 46 },
];

export const TENANT_PLAN_CONFIG = {
  starter: {
    label: "Starter",
    colors: CHART_COLORS.chart4,
  },
  pro: {
    label: "Pro",
    colors: CHART_COLORS.chart1,
  },
  enterprise: {
    label: "Enterprise",
    colors: CHART_COLORS.chart2,
  },
};

/** New vs renewed subscriptions per month */
export const SUBSCRIPTION_GROWTH_DATA = [
  { month: "Jan", newSubscriptions: 18, renewals: 142 },
  { month: "Feb", newSubscriptions: 22, renewals: 148 },
  { month: "Mar", newSubscriptions: 19, renewals: 151 },
  { month: "Apr", newSubscriptions: 24, renewals: 155 },
  { month: "May", newSubscriptions: 21, renewals: 158 },
  { month: "Jun", newSubscriptions: 26, renewals: 162 },
  { month: "Jul", newSubscriptions: 23, renewals: 165 },
  { month: "Aug", newSubscriptions: 28, renewals: 168 },
  { month: "Sep", newSubscriptions: 25, renewals: 171 },
  { month: "Oct", newSubscriptions: 27, renewals: 174 },
  { month: "Nov", newSubscriptions: 30, renewals: 178 },
  { month: "Dec", newSubscriptions: 24, renewals: 180 },
];

export const SUBSCRIPTION_GROWTH_CONFIG = {
  newSubscriptions: {
    label: "New subscriptions",
    colors: CHART_COLORS.primary,
  },
  renewals: {
    label: "Renewals",
    colors: CHART_COLORS.chart3,
  },
};

/** Active vs suspended tenant accounts */
export const TENANT_STATUS_DATA = [
  { month: "Jan", active: 198, suspended: 12 },
  { month: "Feb", active: 205, suspended: 11 },
  { month: "Mar", active: 212, suspended: 14 },
  { month: "Apr", active: 218, suspended: 13 },
  { month: "May", active: 224, suspended: 15 },
  { month: "Jun", active: 231, suspended: 14 },
  { month: "Jul", active: 236, suspended: 16 },
  { month: "Aug", active: 241, suspended: 15 },
  { month: "Sep", active: 244, suspended: 17 },
  { month: "Oct", active: 246, suspended: 16 },
  { month: "Nov", active: 247, suspended: 18 },
  { month: "Dec", active: 248, suspended: 19 },
];

export const TENANT_STATUS_CONFIG = {
  active: {
    label: "Active tenants",
    colors: CHART_COLORS.chart3,
  },
  suspended: {
    label: "Suspended",
    colors: CHART_COLORS.destructive,
  },
};

/** Platform utilization segments */
export const SYSTEM_HEALTH_DATA = [
  { metric: "api", utilization: 78 },
  { metric: "storage", utilization: 62 },
  { metric: "activeUsers", utilization: 84 },
  { metric: "jobs", utilization: 71 },
];

export const SYSTEM_HEALTH_CONFIG = {
  api: {
    label: "API capacity",
    colors: CHART_COLORS.chart1,
  },
  storage: {
    label: "Storage",
    colors: CHART_COLORS.chart2,
  },
  activeUsers: {
    label: "Active users",
    colors: CHART_COLORS.chart3,
  },
  jobs: {
    label: "Background jobs",
    colors: CHART_COLORS.chart4,
  },
};
