const ACTIVE_STATUSES = ["Planning", "In Progress", "On Hold"];

export { formatAed } from "@/shared/utils/currency";

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export function isThisMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function countByField(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field] || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export function latestApprovedBoqTotal(boqs = []) {
  const approved = boqs
    .filter((b) => String(b.status).toUpperCase() === "APPROVED" || String(b.status).toUpperCase() === "FINAL")
    .sort((a, b) => (b.version || 0) - (a.version || 0));
  return approved[0]?.grandTotal || 0;
}

export function sumApprovedBoqTotals(projectBoqMap) {
  return Object.values(projectBoqMap).reduce((sum, boqs) => sum + Number(latestApprovedBoqTotal(boqs)), 0);
}

export function avgProgress(projects = []) {
  if (!projects.length) return 0;
  const total = projects.reduce((s, p) => s + Number(p.progress || 0), 0);
  return Math.round(total / projects.length);
}

export function activeProjects(projects = []) {
  return projects.filter((p) => ACTIVE_STATUSES.includes(p.status));
}

export function atRiskProjects(projects = []) {
  return projects.filter((p) => p.status === "On Hold" || (p.progress < 30 && p.status === "In Progress"));
}

export function stockValueByCategory(balances = []) {
  const byCat = {};
  balances.forEach((b) => {
    const cat = b.categoryName || b.category || "Uncategorized";
    byCat[cat] = (byCat[cat] || 0) + Number(b.stockValue || 0);
  });
  return Object.entries(byCat)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function boqFunnelCounts(allBoqs = []) {
  const statuses = ["DRAFT", "PENDING_SENIOR_QS", "PENDING_PM", "PENDING_DIRECTOR", "PENDING_CLIENT", "APPROVED"];
  const counts = {};
  statuses.forEach((s) => { counts[s] = 0; });
  allBoqs.forEach((b) => {
    const key = String(b.status || "DRAFT").toUpperCase().replace(/-/g, "_");
    if (counts[key] !== undefined) counts[key] += 1;
    else if (key === "FINAL") counts.APPROVED += 1;
    else counts.DRAFT += 1;
  });
  return statuses.map((status) => ({
    status,
    count: counts[status],
    label: status.replace(/_/g, " ").replace("PENDING ", ""),
  }));
}

export function openLeads(leads = []) {
  return leads.filter((l) => !["LOST", "Lost"].includes(l.status) && l.status !== "QUALIFIED");
}

export function leadsByStatusPie(leads = []) {
  const counts = countByField(leads, "statusLabel");
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}
