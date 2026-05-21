export const PLANS = ["Starter", "Pro", "Enterprise"];
export const STATUSES = ["active", "trial", "suspended", "expired"];
export const RENEWAL_STATES = ["auto", "manual", "overdue", "cancelled"];

export const TENANTS_LIST = [
  { id: "t1", company: "Apex Fitouts Pty Ltd", plan: "Enterprise", status: "active", activeUsers: 42, renewalDate: "2026-12-15", revenue: 4800, renewalState: "auto", mrr: 4800 },
  { id: "t2", company: "Urban Build Co", plan: "Pro", status: "trial", activeUsers: 18, renewalDate: "2026-06-02", revenue: 890, renewalState: "manual", mrr: 890 },
  { id: "t3", company: "Coastal Projects", plan: "Starter", status: "active", activeUsers: 6, renewalDate: "2026-09-20", revenue: 299, renewalState: "auto", mrr: 299 },
  { id: "t4", company: "Metro Interiors", plan: "Pro", status: "expired", activeUsers: 0, renewalDate: "2026-04-01", revenue: 0, renewalState: "overdue", mrr: 0 },
  { id: "t5", company: "Summit Construction", plan: "Enterprise", status: "active", activeUsers: 56, renewalDate: "2027-01-30", revenue: 6200, renewalState: "auto", mrr: 6200 },
  { id: "t6", company: "Harbour Design Group", plan: "Starter", status: "trial", activeUsers: 4, renewalDate: "2026-05-28", revenue: 0, renewalState: "manual", mrr: 0 },
  { id: "t7", company: "Northern Fitouts", plan: "Pro", status: "active", activeUsers: 22, renewalDate: "2026-11-10", revenue: 1290, renewalState: "auto", mrr: 1290 },
  { id: "t8", company: "Pacific Commercial", plan: "Enterprise", status: "suspended", activeUsers: 31, renewalDate: "2026-03-15", revenue: 0, renewalState: "cancelled", mrr: 0 },
  { id: "t9", company: "Brick & Beam", plan: "Starter", status: "active", activeUsers: 8, renewalDate: "2026-08-22", revenue: 349, renewalState: "auto", mrr: 349 },
  { id: "t10", company: "Skyline Developments", plan: "Pro", status: "active", activeUsers: 15, renewalDate: "2026-10-05", revenue: 990, renewalState: "auto", mrr: 990 },
  { id: "t11", company: "CoreSpace Interiors", plan: "Enterprise", status: "trial", activeUsers: 12, renewalDate: "2026-07-18", revenue: 0, renewalState: "manual", mrr: 0 },
  { id: "t12", company: "Westfield Projects", plan: "Pro", status: "active", activeUsers: 19, renewalDate: "2026-12-01", revenue: 1190, renewalState: "auto", mrr: 1190 },
];

export function getTenantById(id) {
  return TENANTS_LIST.find((t) => t.id === id);
}

export const MODULES = [
  { id: "crm", name: "CRM", description: "Leads, contacts, and pipeline" },
  { id: "site-visits", name: "Site Visits", description: "Scheduling and field reports" },
  { id: "reports", name: "Reports", description: "Analytics and exports" },
  { id: "billing", name: "Billing", description: "Invoices and payments" },
  { id: "users", name: "Users", description: "Team and access management" },
  { id: "dashboard", name: "Dashboard", description: "Executive overview" },
];

export const PLAN_MODULES = {
  Starter: ["crm", "dashboard", "site-visits"],
  Pro: ["crm", "dashboard", "site-visits", "reports", "users"],
  Enterprise: ["crm", "dashboard", "site-visits", "reports", "users", "billing"],
};

export const TENANT_DETAIL = {
  t1: {
    enabledModules: PLAN_MODULES.Enterprise,
    loginActivity: [
      { user: "Sarah Chen", action: "Signed in", time: "2 hours ago", ip: "203.45.12.8" },
      { user: "James Wu", action: "Exported CRM report", time: "5 hours ago", ip: "203.45.12.19" },
      { user: "Sarah Chen", action: "Updated project budget", time: "Yesterday", ip: "203.45.12.8" },
    ],
    billing: { lastInvoice: "$4,800", nextBilling: "2026-04-15", paymentMethod: "Visa •••• 4242", outstanding: "$0" },
  },
};
