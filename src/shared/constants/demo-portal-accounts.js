/**
 * Demo-only roster for the Puma portal switcher. Emails here must stay in sync
 * with the backend whitelist in DemoPortalAccounts.java.
 */
export const DEMO_TENANT_NAME = "puma";

export const DEMO_PORTAL_GROUPS = [
  {
    label: "Admin",
    accounts: [
      { email: "kiran@puma.com", name: "Kiran", role: "Admin" },
      { email: "director@fitouts.demo", name: "Project Director", role: "Command Center" },
    ],
  },
  {
    label: "Company portals",
    accounts: [
      { email: "humaidmn.4910@gmail.com", name: "Humaid", role: "Client" },
      { email: "designer@fitouts.demo", name: "Designer", role: "Designer" },
      { email: "employee@fitouts.demo", name: "Employee", role: "Employee" },
      { email: "finance@fitouts.demo", name: "Finance User", role: "Finance" },
      { email: "pm@fitouts.demo", name: "Project Manager", role: "Project Manager" },
      { email: "qas@fitouts.demo", name: "QAS Inspector", role: "QAS" },
      { email: "qs@fitouts.demo", name: "Quantity Surveyor", role: "QS" },
      { email: "sales@fitouts.demo", name: "Sales User", role: "Sales" },
      { email: "seniorqs@fitouts.demo", name: "Senior QS", role: "Senior QS" },
      { email: "siteengineer@fitouts.demo", name: "Site Engineer", role: "Site Engineer" },
    ],
  },
  {
    label: "Subcontractor",
    accounts: [
      { email: "moid@fitouts.demo", name: "Moid", role: "SC Admin" },
      { email: "nameera@fitouts.demo", name: "Nameera", role: "SC Admin" },
      { email: "doccontroller@fitouts.demo", name: "SC Doc Controller", role: "Doc Controller" },
      { email: "estimator@fitouts.demo", name: "SC Estimator", role: "Estimator" },
      { email: "scqs@fitouts.demo", name: "SC Quantity Surveyor", role: "SC QS" },
      { email: "supervisor@fitouts.demo", name: "SC Supervisor", role: "Supervisor" },
    ],
  },
];

const DEMO_EMAILS = new Set(
  DEMO_PORTAL_GROUPS.flatMap((group) => group.accounts.map((account) => account.email))
);

export function isDemoPortalAccount(email) {
  return !!email && DEMO_EMAILS.has(String(email).trim().toLowerCase());
}

export function isDemoTenant(companyName) {
  return String(companyName || "").trim().toLowerCase() === DEMO_TENANT_NAME;
}
