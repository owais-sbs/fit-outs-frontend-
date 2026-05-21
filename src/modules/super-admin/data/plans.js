export const PLAN_TYPES = [
  {
    id: "basic",
    name: "Basic",
    displayName: "Starter",
    price: 299,
    annualPrice: 2990,
    seats: 10,
    modules: ["crm", "dashboard", "site-visits"],
    limits: { projects: 25, storage: "10 GB", apiCalls: "10k/mo" },
    published: true,
  },
  {
    id: "professional",
    name: "Professional",
    displayName: "Pro",
    price: 990,
    annualPrice: 9900,
    seats: 50,
    modules: ["crm", "dashboard", "site-visits", "reports", "users"],
    limits: { projects: 100, storage: "50 GB", apiCalls: "50k/mo" },
    published: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    displayName: "Enterprise",
    price: 4800,
    annualPrice: 48000,
    seats: 500,
    modules: ["crm", "dashboard", "site-visits", "reports", "users", "billing"],
    limits: { projects: "Unlimited", storage: "500 GB", apiCalls: "Unlimited" },
    published: true,
  },
];

export const ALL_MODULES = [
  { id: "crm", label: "CRM", features: ["Leads", "Contacts", "Pipeline"] },
  { id: "site-visits", label: "Site Visits", features: ["Scheduling", "Checklists"] },
  { id: "reports", label: "Reports", features: ["Dashboards", "Export"] },
  { id: "billing", label: "Billing", features: ["Invoices", "Payments"] },
  { id: "users", label: "Users", features: ["RBAC", "Invites"] },
  { id: "dashboard", label: "Dashboard", features: ["KPIs", "Widgets"] },
];
