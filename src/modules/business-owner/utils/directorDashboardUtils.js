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

export function latestBoqTotal(boqs = []) {
  const list = Array.isArray(boqs) ? boqs : [];
  const live = list.filter((b) => String(b.status || "").toUpperCase() !== "OBSOLETE");
  const approved = live.filter((b) => {
    const status = String(b.status || "").toUpperCase();
    return status === "APPROVED" || status === "FINAL";
  });
  const pool = approved.length ? approved : live;
  const sorted = [...pool].sort((a, b) => {
    const tb = new Date(b.createdAt || b.updatedAt || 0).getTime();
    const ta = new Date(a.createdAt || a.updatedAt || 0).getTime();
    return tb - ta;
  });
  const top = sorted[0];
  return Number(top?.grandTotal ?? top?.subtotal ?? 0);
}

export function latestApprovedBoqTotal(boqs = []) {
  return latestBoqTotal(boqs);
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
    if (key === "OBSOLETE") return;
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
