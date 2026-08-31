import { CHART_COLORS } from "@/modules/super-admin/data/analytics-dashboard";

const OPEN_STATUSES = new Set([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "SITE_VISIT_SCHEDULED",
  "FOLLOWUP",
]);

const SOURCE_KEYS = {
  Website: "website",
  WEBSITE: "website",
  Referral: "referral",
  REFERRAL: "referral",
  "Walk-in": "walkIn",
  WALK_IN: "walkIn",
  Social: "social",
  SOCIAL: "social",
  Other: "other",
  OTHER: "other",
  "—": "other",
};

const SOURCE_CONFIG = {
  website: { label: "Website", colors: CHART_COLORS.chart1 },
  referral: { label: "Referral", colors: CHART_COLORS.chart2 },
  walkIn: { label: "Walk-in", colors: CHART_COLORS.chart3 },
  social: { label: "Social", colors: CHART_COLORS.chart4 },
  other: { label: "Other", colors: CHART_COLORS.chart5 },
};

const TYPE_COLORS = [
  CHART_COLORS.chart1,
  CHART_COLORS.chart2,
  CHART_COLORS.chart3,
  CHART_COLORS.chart4,
  CHART_COLORS.chart5,
];

const WON_LOST_CONFIG = {
  won: { label: "Won", colors: { light: ["#18181B", "#3f3f46"], dark: ["#18181B", "#3f3f46"] } },
  lost: { label: "Lost", colors: { light: ["#C4845A", "#a66b45"], dark: ["#C4845A", "#a66b45"] } },
};

const PIPELINE_PERF_CONFIG = {
  value: { label: "Leads created", colors: CHART_COLORS.chart1 },
};

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "short" });
}

function pctChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function formatBudget(amount) {
  const n = Number(amount) || 0;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

function assigneeIdOf(lead) {
  const a = lead?.assignedTo;
  if (!a) return null;
  if (typeof a === "object") return a.id != null ? String(a.id) : null;
  return String(a);
}

function assigneeNameOf(lead) {
  const a = lead?.assignedTo;
  if (!a || typeof a !== "object") return "Unassigned";
  return a.employeeName || a.fullName || a.email || "Unassigned";
}

function leadActivityDate(lead) {
  return parseDate(lead.lastActivityDate || lead.updatedAt || lead.createdAt);
}

function inRange(date, from, to) {
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function resolvePeriodRange(period, dateFrom, dateTo) {
  const now = new Date();
  let from = dateFrom ? startOfDay(new Date(dateFrom)) : null;
  let to = dateTo ? endOfDay(new Date(dateTo)) : endOfDay(now);

  if (!dateFrom) {
    const start = new Date(now);
    if (period === "7d") start.setDate(start.getDate() - 6);
    else if (period === "90d") start.setDate(start.getDate() - 89);
    else if (period === "12m") start.setMonth(start.getMonth() - 11);
    else if (period === "ytd") {
      start.setMonth(0, 1);
    } else {
      start.setDate(start.getDate() - 29);
    }
    from = startOfDay(start);
  }

  return { from, to };
}

function previousRange(from, to) {
  if (!from || !to) return { from: null, to: null };
  const ms = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - ms);
  return { from: prevFrom, to: prevTo };
}

function lastNMonthKeys(n, endingAt = new Date()) {
  const keys = [];
  const cursor = new Date(endingAt.getFullYear(), endingAt.getMonth(), 1);
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

function nextNMonthKeys(n, startingAt = new Date()) {
  const keys = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date(startingAt.getFullYear(), startingAt.getMonth() + i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

function slugType(type) {
  return String(type || "other")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || "other";
}

/**
 * Aggregate live admin dashboard metrics from leads, projects, and site visits.
 * Dollar KPIs use project budgets where available; CRM pipeline is count-based
 * because leads have no deal-value field.
 */
export function buildAdminDashboardAnalytics({
  leads = [],
  projects = [],
  siteVisits = [],
  period = "30d",
  dateFrom,
  dateTo,
  assigneeId = "all",
} = {}) {
  const { from, to } = resolvePeriodRange(period, dateFrom, dateTo);
  const prev = previousRange(from, to);

  const filteredLeads = leads.filter((lead) => {
    if (lead.isdeleted) return false;
    if (assigneeId !== "all" && assigneeIdOf(lead) !== String(assigneeId)) return false;
    return true;
  });

  const periodLeads = filteredLeads.filter((lead) =>
    inRange(parseDate(lead.createdAt), from, to)
  );
  const prevPeriodLeads = filteredLeads.filter((lead) =>
    inRange(parseDate(lead.createdAt), prev.from, prev.to)
  );

  const openLeads = filteredLeads.filter((l) => OPEN_STATUSES.has(l.status));
  const wonInPeriod = filteredLeads.filter(
    (l) => l.status === "CLIENT" && inRange(leadActivityDate(l), from, to)
  );
  const lostInPeriod = filteredLeads.filter(
    (l) => l.status === "LOST" && inRange(leadActivityDate(l), from, to)
  );
  const wonPrev = filteredLeads.filter(
    (l) => l.status === "CLIENT" && inRange(leadActivityDate(l), prev.from, prev.to)
  );
  const lostPrev = filteredLeads.filter(
    (l) => l.status === "LOST" && inRange(leadActivityDate(l), prev.from, prev.to)
  );

  const closedInPeriod = wonInPeriod.length + lostInPeriod.length;
  const winRate = closedInPeriod > 0 ? Math.round((wonInPeriod.length / closedInPeriod) * 100) : 0;
  const prevClosed = wonPrev.length + lostPrev.length;
  const prevWinRate = prevClosed > 0 ? Math.round((wonPrev.length / prevClosed) * 100) : 0;

  const activeProjects = projects.filter((p) => {
    const status = String(p.status || "").toLowerCase();
    return status !== "completed" && status !== "cancelled" && status !== "canceled";
  });
  const budgetTotal = activeProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

  const projectsInPeriod = projects.filter((p) =>
    inRange(parseDate(p.startDate || p.createdAt), from, to)
  );
  const projectsPrev = projects.filter((p) =>
    inRange(parseDate(p.startDate || p.createdAt), prev.from, prev.to)
  );
  const periodBudget = projectsInPeriod.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
  const prevBudget = projectsPrev.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

  const visitsInPeriod = siteVisits.filter((v) => {
    const d = parseDate(v.scheduledDate || v.createdAt);
    return inRange(d, from, to);
  });
  const visitsPrev = siteVisits.filter((v) => {
    const d = parseDate(v.scheduledDate || v.createdAt);
    return inRange(d, prev.from, prev.to);
  });

  const openCreatedInPeriod = periodLeads.filter((l) => OPEN_STATUSES.has(l.status)).length;
  const openCreatedPrev = prevPeriodLeads.filter((l) => OPEN_STATUSES.has(l.status)).length;

  const kpis = [
    {
      id: "pipeline",
      title: "Open pipeline",
      value: String(openLeads.length),
      growth: pctChange(openCreatedInPeriod, openCreatedPrev),
      growthLabel: "new open vs prior",
    },
    {
      id: "won",
      title: "Won this period",
      value: String(wonInPeriod.length),
      growth: pctChange(wonInPeriod.length, wonPrev.length),
      growthLabel: "vs prior period",
    },
    {
      id: "lost",
      title: "Lost this period",
      value: String(lostInPeriod.length),
      growth: pctChange(lostInPeriod.length, lostPrev.length),
      growthLabel: "vs prior period",
    },
    {
      id: "conversion",
      title: "Win rate",
      value: `${winRate}%`,
      growth: Math.round((winRate - prevWinRate) * 10) / 10,
      growthLabel: "won / closed",
    },
    {
      id: "revenue",
      title: "Project budget",
      value: formatBudget(periodBudget || budgetTotal),
      growth: pctChange(periodBudget || budgetTotal, prevBudget || budgetTotal),
      growthLabel: periodBudget ? "started in period" : "active projects",
    },
    {
      id: "visits",
      title: "Site visits",
      value: String(visitsInPeriod.length),
      growth: pctChange(visitsInPeriod.length, visitsPrev.length),
      growthLabel: "in period",
    },
  ];

  // Pipeline / leads created by month
  const monthKeys = lastNMonthKeys(period === "12m" ? 12 : 6, to || new Date());
  const createdByMonth = Object.fromEntries(monthKeys.map((k) => [k, 0]));
  filteredLeads.forEach((lead) => {
    const d = parseDate(lead.createdAt);
    if (!d) return;
    const key = monthKey(d);
    if (key in createdByMonth) createdByMonth[key] += 1;
  });
  const pipelinePerfData = monthKeys.map((key) => ({
    month: monthLabel(key),
    value: createdByMonth[key],
  }));

  // Lead sources
  const sourceCounts = {};
  const sourceSource = periodLeads.length ? periodLeads : filteredLeads;
  sourceSource.forEach((lead) => {
    const key = SOURCE_KEYS[lead.source] || SOURCE_KEYS[lead.sourceRaw] || "other";
    sourceCounts[key] = (sourceCounts[key] || 0) + 1;
  });
  const leadSourceData = Object.entries(sourceCounts).map(([source, count]) => ({
    source,
    count,
  }));
  const leadSourceConfig = { ...SOURCE_CONFIG };

  // Won vs Lost by month
  const wonLostMap = Object.fromEntries(monthKeys.map((k) => [k, { won: 0, lost: 0 }]));
  filteredLeads.forEach((lead) => {
    const d = leadActivityDate(lead);
    if (!d) return;
    const key = monthKey(d);
    if (!(key in wonLostMap)) return;
    if (lead.status === "CLIENT") wonLostMap[key].won += 1;
    if (lead.status === "LOST") wonLostMap[key].lost += 1;
  });
  const wonLostData = monthKeys.map((key) => ({
    month: monthLabel(key),
    won: wonLostMap[key].won,
    lost: wonLostMap[key].lost,
  }));

  // Project type distribution (prefer leads in period, else all; merge with projects)
  const typeCounts = {};
  const typePool = (periodLeads.length ? periodLeads : filteredLeads);
  typePool.forEach((lead) => {
    const label = lead.projectType?.trim() || "Unspecified";
    const key = slugType(label);
    if (!typeCounts[key]) typeCounts[key] = { type: key, label, count: 0 };
    typeCounts[key].count += 1;
  });
  if (!Object.keys(typeCounts).length) {
    projects.forEach((p) => {
      const label = p.projectType && p.projectType !== "—" ? p.projectType : "Unspecified";
      const key = slugType(label);
      if (!typeCounts[key]) typeCounts[key] = { type: key, label, count: 0 };
      typeCounts[key].count += 1;
    });
  }
  const projectTypeEntries = Object.values(typeCounts).sort((a, b) => b.count - a.count);
  const projectTypeData = projectTypeEntries.map((e) => ({ type: e.type, count: e.count }));
  const projectTypeConfig = {};
  projectTypeEntries.forEach((e, i) => {
    projectTypeConfig[e.type] = {
      label: e.label,
      colors: TYPE_COLORS[i % TYPE_COLORS.length],
    };
  });

  // Forecast: next 3 months from recent lead intake average
  const recentMonths = monthKeys.slice(-3);
  const avgIntake =
    recentMonths.reduce((s, k) => s + (createdByMonth[k] || 0), 0) /
    Math.max(recentMonths.length, 1);
  const avgWinRate = Math.max(winRate, 10) / 100;
  const forecastRows = nextNMonthKeys(3, to || new Date()).map((key, idx) => {
    const leadsForecast = Math.round(avgIntake * (1 + idx * 0.05));
    const forecast = Math.round(leadsForecast * avgWinRate);
    const committed =
      idx === 0
        ? wonInPeriod.length
        : 0;
    let status = "pending";
    if (idx === 0) {
      status = committed >= forecast * 0.7 ? "on-track" : "at-risk";
    }
    return {
      month: monthLabel(key),
      leads: leadsForecast,
      forecast,
      committed,
      status,
    };
  });

  // Rep leaderboard
  const byRep = {};
  filteredLeads.forEach((lead) => {
    const id = assigneeIdOf(lead) || "unassigned";
    const name = assigneeNameOf(lead);
    if (!byRep[id]) {
      byRep[id] = { id, name, deals: 0, open: 0, lost: 0, total: 0 };
    }
    byRep[id].total += 1;
    if (lead.status === "CLIENT") byRep[id].deals += 1;
    else if (lead.status === "LOST") byRep[id].lost += 1;
    else if (OPEN_STATUSES.has(lead.status)) byRep[id].open += 1;
  });
  const leaderboard = Object.values(byRep)
    .filter((r) => r.id !== "unassigned" || r.total > 0)
    .sort((a, b) => b.deals - a.deals || b.open - a.open || b.total - a.total)
    .slice(0, 8)
    .map((r) => {
      const closed = r.deals + r.lost;
      const rate = closed > 0 ? Math.round((r.deals / closed) * 100) : 0;
      return {
        name: r.name,
        deals: r.deals,
        open: r.open,
        rate: `${rate}%`,
      };
    });

  return {
    kpis,
    pipelinePerfData,
    pipelinePerfConfig: PIPELINE_PERF_CONFIG,
    leadSourceData,
    leadSourceConfig,
    wonLostData,
    wonLostConfig: WON_LOST_CONFIG,
    projectTypeData,
    projectTypeConfig,
    forecastRows,
    leaderboard,
    meta: {
      leadCount: filteredLeads.length,
      periodLeadCount: periodLeads.length,
      from,
      to,
    },
  };
}

export { SOURCE_CONFIG as LEAD_SOURCE_CONFIG };
