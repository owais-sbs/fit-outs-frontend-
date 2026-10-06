/** Shared status vocabulary for the approvals screens. */

export const STATUS_LABELS = {
  NOT_STARTED: "Not started",
  PACK_IN_PREPARATION: "Pack in preparation",
  READY_TO_SUBMIT: "Ready to submit",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  COMMENTS_RECEIVED: "Comments received",
  RESUBMITTED: "Resubmitted",
  APPROVED: "Approved",
  ISSUED: "Issued",
  EXPIRING_SOON: "Expiring soon",
  RENEWAL_IN_PROGRESS: "Renewal in progress",
  EXPIRED: "Expired",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

const TONES = {
  NOT_STARTED: "bg-secondary text-muted-foreground",
  PACK_IN_PREPARATION: "bg-amber-500/15 text-amber-800",
  READY_TO_SUBMIT: "bg-sky-500/15 text-sky-800",
  SUBMITTED: "bg-sky-500/15 text-sky-800",
  UNDER_REVIEW: "bg-sky-500/15 text-sky-800",
  COMMENTS_RECEIVED: "bg-amber-500/15 text-amber-800",
  RESUBMITTED: "bg-sky-500/15 text-sky-800",
  APPROVED: "bg-emerald-500/15 text-emerald-800",
  ISSUED: "bg-emerald-500/15 text-emerald-800",
  EXPIRING_SOON: "bg-amber-500/15 text-amber-800",
  RENEWAL_IN_PROGRESS: "bg-copper/15 text-copper-foreground",
  EXPIRED: "bg-red-500/15 text-red-800",
  CLOSED: "bg-secondary text-muted-foreground",
  REJECTED: "bg-red-500/15 text-red-800",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || String(status || "").replace(/_/g, " ");
}

export function statusTone(status) {
  return TONES[status] || TONES.NOT_STARTED;
}

/**
 * Red when the date has passed, amber inside a week, otherwise plain.
 * Used for both SLA due dates and permit expiry.
 */
export function urgencyTone(days) {
  if (days == null) return "text-muted-foreground";
  if (days < 0) return "text-red-700 font-semibold";
  if (days <= 7) return "text-amber-700 font-semibold";
  if (days <= 30) return "text-amber-700";
  return "text-muted-foreground";
}

export function daysLabel(days, pastWord = "overdue", futureWord = "left") {
  if (days == null) return "—";
  if (days < 0) return `${Math.abs(days)}d ${pastWord}`;
  if (days === 0) return "today";
  return `${days}d ${futureWord}`;
}

export const money = (amount, currency = "AED") =>
  amount == null ? "—" : `${currency} ${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const LIVE_STATUSES = new Set(["APPROVED", "ISSUED", "EXPIRING_SOON"]);
const AWAITING_STATUSES = new Set(["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED"]);
const TERMINAL_STATUSES = new Set(["REJECTED", "CLOSED"]);
const ATTENTION_SKIP_STATUSES = new Set(["CLOSED"]);

export function isLiveCase(c) {
  return LIVE_STATUSES.has(c?.status);
}

export function isBlockedCase(c) {
  return Boolean(c?.blockReason);
}

export function isAwaitingCase(c) {
  return AWAITING_STATUSES.has(c?.status);
}

export function isExpiringCase(c) {
  if (c?.status === "EXPIRING_SOON") return true;
  const days = c?.daysToExpiry;
  return days != null && days >= 0 && days <= 30;
}

export function isUnresolvedAuthorityCase(c) {
  if (TERMINAL_STATUSES.has(c?.status)) return false;
  return !c?.authorityCode && !c?.authorityName;
}

export function isNotStartedCase(c) {
  return c?.status === "NOT_STARTED";
}

export function matchesApprovalListFilter(c, listFilter) {
  if (listFilter === "not_started") return isNotStartedCase(c);
  if (listFilter === "blocked") return isBlockedCase(c);
  if (listFilter === "with_authority") return isAwaitingCase(c);
  if (listFilter === "approved") return isLiveCase(c);
  return true;
}

function permitLabel(c) {
  return c?.permitTypeName || c?.permitTypeCode || "Permit";
}

function attentionForCase(c) {
  if (!c || ATTENTION_SKIP_STATUSES.has(c.status)) return null;
  if (isUnresolvedAuthorityCase(c)) {
    return { priority: 0, text: `${permitLabel(c)}: Authority not resolved` };
  }
  if (c.status === "EXPIRED" || (c.daysToExpiry != null && c.daysToExpiry < 0)) {
    return { priority: 1, text: `${permitLabel(c)}: Expired` };
  }
  if (isExpiringCase(c)) {
    const days = c.daysToExpiry;
    const reason = days === 0 ? "Expires today" : days != null ? `Expires in ${days}d` : "Expiring soon";
    return { priority: 2, text: `${permitLabel(c)}: ${reason}` };
  }
  if (isBlockedCase(c)) {
    return { priority: 3, text: `${permitLabel(c)}: ${c.blockReason}` };
  }
  if (c.status === "COMMENTS_RECEIVED") {
    return { priority: 4, text: `${permitLabel(c)}: Comments received` };
  }
  if (c.daysToSlaDue != null && c.daysToSlaDue < 0) {
    return { priority: 5, text: `${permitLabel(c)}: SLA overdue` };
  }
  return null;
}

/** Counts and top attention lines for a project's approval cases. */
export function summarizeApprovalCases(cases) {
  const list = Array.isArray(cases) ? cases : [];
  const attention = list
    .map(attentionForCase)
    .filter(Boolean)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 2)
    .map((row) => row.text);

  return {
    total: list.length,
    live: list.filter(isLiveCase).length,
    blocked: list.filter(isBlockedCase).length,
    awaiting: list.filter(isAwaitingCase).length,
    expiring: list.filter(isExpiringCase).length,
    notStarted: list.filter(isNotStartedCase).length,
    unresolvedAuthority: list.filter(isUnresolvedAuthorityCase).length,
    attention,
  };
}

const BOARD_CLOSED = new Set(["EXPIRED", "REJECTED", "CLOSED"]);
const BOARD_LIVE = new Set(["APPROVED", "ISSUED", "EXPIRING_SOON", "RENEWAL_IN_PROGRESS"]);
const BOARD_AUTHORITY = new Set(["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED", "COMMENTS_RECEIVED"]);
const BOARD_PREP = new Set(["NOT_STARTED", "PACK_IN_PREPARATION"]);

/** One column per permit on the portfolio board. Blocked work wins over its status. */
export const BOARD_COLUMNS = [
  { id: "preparation", label: "In preparation", emphasis: false },
  { id: "documents", label: "Documents required", emphasis: true },
  { id: "ready", label: "Ready to submit", emphasis: true },
  { id: "authority", label: "With the authority", emphasis: false },
  { id: "live", label: "Live", emphasis: false },
  { id: "closed", label: "Closed", emphasis: false },
];

export function boardColumnId(row) {
  if (BOARD_CLOSED.has(row?.status)) return "closed";
  if (row?.blockReason) return "documents";
  if (row?.status === "READY_TO_SUBMIT") return "ready";
  if (BOARD_AUTHORITY.has(row?.status)) return "authority";
  if (BOARD_LIVE.has(row?.status)) return "live";
  if (BOARD_PREP.has(row?.status)) return "preparation";
  return "preparation";
}

export function approvalWorkbenchFilters(cases) {
  const summary = summarizeApprovalCases(cases);
  return [
    { id: "all", label: "All", count: summary.total },
    { id: "not_started", label: "Not started", count: summary.notStarted },
    { id: "blocked", label: "Blocked", count: summary.blocked },
    { id: "with_authority", label: "With authority", count: summary.awaiting },
    { id: "approved", label: "Approved", count: summary.live },
  ];
}

const PREP_STATUSES = new Set(["NOT_STARTED", "PACK_IN_PREPARATION", "RENEWAL_IN_PROGRESS"]);
const SUBMITTED_STATUSES = new Set(["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED", "COMMENTS_RECEIVED"]);
const APPROVED_STATUSES = new Set(["APPROVED", "ISSUED", "EXPIRING_SOON"]);
const AUTHORITY_ROW_STATUSES = new Set(["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED"]);

const TONE_RANK = { attention: 0, ready: 1, authority: 2, prep: 3, complete: 4, closed: 5 };

export const ATTENTION_PREVIEW_LIMIT = 6;

export const PROJECT_FILTERS = [
  { id: "all", label: "All" },
  { id: "attention", label: "Needs attention" },
  { id: "ready", label: "Ready" },
  { id: "authority", label: "With authority" },
  { id: "prep", label: "In prep" },
  { id: "complete", label: "Complete" },
];

export const PROJECT_COUNT_COLUMNS = [
  { key: "required", label: "Required", variant: "secondary", hint: "Open permits, excluding closed" },
  { key: "prep", label: "In prep", variant: "warning", hint: "Not started, pack in preparation, or renewal in progress" },
  { key: "ready", label: "Ready", variant: "info", hint: "Ready to submit" },
  { key: "submitted", label: "Submitted", variant: "info", hint: "Submitted, under review, resubmitted, or comments received" },
  { key: "approved", label: "Approved", variant: "success", hint: "Approved, issued, or expiring soon" },
  { key: "rejected", label: "Rejected", variant: "danger", hint: "Rejected" },
];

const PROJECT_TONE_META = {
  attention: {
    label: "Attention",
    badge: "danger",
    row: "border-l-[3px] border-l-destructive bg-destructive/5",
  },
  complete: {
    label: "Complete",
    badge: "success",
    row: "border-l-[3px] border-l-success bg-success/5",
  },
  ready: {
    label: "Ready",
    badge: "info",
    row: "border-l-[3px] border-l-info bg-info/5",
  },
  authority: {
    label: "With authority",
    badge: "warning",
    row: "border-l-[3px] border-l-warning bg-warning/5",
  },
  prep: {
    label: "In prep",
    badge: "secondary",
    row: "border-l-[3px] border-l-muted-foreground/40 bg-muted/40",
  },
  closed: {
    label: "Closed",
    badge: "secondary",
    row: "border-l-[3px] border-l-muted-foreground/30 bg-muted/20",
  },
};

function isExpiredCase(c) {
  return c?.status === "EXPIRED" || (c?.daysToExpiry != null && c.daysToExpiry < 0);
}

function slaAttentionReason(days) {
  if (days < 0) return "SLA overdue";
  if (days === 0) return "SLA due today";
  return `SLA due in ${days}d`;
}

function expiryAttentionReason(c) {
  const days = c?.daysToExpiry;
  if (days === 0) return "Expires today";
  if (days != null) return `Expires in ${days}d`;
  return "Expiring soon";
}

/** One entry per permit that needs a person, highest severity first. */
export function portfolioAttentionItems(cases) {
  const items = [];
  for (const permit of Array.isArray(cases) ? cases : []) {
    if (!permit || permit.status === "CLOSED") continue;
    if (permit.status === "REJECTED") {
      items.push({ permit, priority: 0, kind: "danger", reason: "Rejected" });
      continue;
    }
    if (isExpiredCase(permit)) {
      items.push({ permit, priority: 1, kind: "danger", reason: "Expired" });
      continue;
    }
    if (permit.status === "COMMENTS_RECEIVED") {
      items.push({ permit, priority: 2, kind: "warning", reason: "Comments received" });
      continue;
    }
    if (permit.daysToSlaDue != null && permit.daysToSlaDue <= 7) {
      items.push({ permit, priority: 3, kind: "warning", reason: slaAttentionReason(permit.daysToSlaDue) });
      continue;
    }
    if (isExpiringCase(permit)) {
      items.push({ permit, priority: 4, kind: "warning", reason: expiryAttentionReason(permit) });
    }
  }
  items.sort((a, b) => a.priority - b.priority || permitLabel(a.permit).localeCompare(permitLabel(b.permit)));
  return items;
}

function projectDisplayName(projectId, projectName) {
  if (projectName) return projectName;
  if (projectId != null) return `Project ${projectId}`;
  return "Project";
}

/** Counts and row tone for one project's permits. First matching tone wins. */
export function projectRollup(cases, meta = {}) {
  const list = Array.isArray(cases) ? cases : [];
  const counts = { required: 0, prep: 0, ready: 0, submitted: 0, approved: 0, rejected: 0 };
  let rejected = false;
  let expired = false;
  let comments = false;
  let authority = false;

  for (const permit of list) {
    const status = permit?.status;
    if (status === "CLOSED") continue;
    counts.required += 1;
    if (PREP_STATUSES.has(status)) counts.prep += 1;
    else if (status === "READY_TO_SUBMIT") counts.ready += 1;
    else if (SUBMITTED_STATUSES.has(status)) counts.submitted += 1;
    else if (APPROVED_STATUSES.has(status)) counts.approved += 1;
    else if (status === "REJECTED") counts.rejected += 1;

    if (status === "REJECTED") rejected = true;
    if (isExpiredCase(permit)) expired = true;
    if (status === "COMMENTS_RECEIVED") comments = true;
    if (AUTHORITY_ROW_STATUSES.has(status)) authority = true;
  }

  const allClosed = list.length > 0 && counts.required === 0;
  let tone = "prep";
  if (allClosed) tone = "closed";
  else if (rejected || expired || comments) tone = "attention";
  else if (counts.required > 0 && counts.approved === counts.required) tone = "complete";
  else if (counts.ready > 0) tone = "ready";
  else if (authority) tone = "authority";

  const style = PROJECT_TONE_META[tone];
  return {
    projectId: meta.projectId ?? null,
    projectName: projectDisplayName(meta.projectId, meta.projectName),
    counts,
    tone,
    label: style.label,
    badgeVariant: style.badge,
    rowClass: style.row,
  };
}

/** One row per project, attention first and complete or closed last. */
export function groupProjectRollups(cases) {
  const groups = new Map();
  for (const permit of Array.isArray(cases) ? cases : []) {
    const projectId = permit?.projectId ?? null;
    const key = projectId != null ? `id:${projectId}` : `name:${permit?.projectName || "Project"}`;
    if (!groups.has(key)) {
      groups.set(key, { projectId, projectName: permit?.projectName || "", cases: [] });
    }
    const group = groups.get(key);
    if (permit?.projectName) group.projectName = permit.projectName;
    group.cases.push(permit);
  }

  return [...groups.values()]
    .map((group) => projectRollup(group.cases, group))
    .sort((a, b) => {
      const rank = (TONE_RANK[a.tone] ?? 9) - (TONE_RANK[b.tone] ?? 9);
      if (rank !== 0) return rank;
      return a.projectName.localeCompare(b.projectName);
    });
}

export function summarizePortfolio(cases) {
  const list = Array.isArray(cases) ? cases : [];
  let ready = 0;
  let withAuthority = 0;
  let approved = 0;
  let open = 0;
  for (const permit of list) {
    if (!permit || permit.status === "CLOSED") continue;
    open += 1;
    if (permit.status === "READY_TO_SUBMIT") ready += 1;
    if (SUBMITTED_STATUSES.has(permit.status)) withAuthority += 1;
    if (APPROVED_STATUSES.has(permit.status)) approved += 1;
  }
  const attention = portfolioAttentionItems(list);
  return {
    needsAttention: attention.length,
    ready,
    withAuthority,
    approved,
    open,
    approvedShare: open ? Math.round((approved / open) * 100) : 0,
    attention,
    projects: groupProjectRollups(list),
  };
}
