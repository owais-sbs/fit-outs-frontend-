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
