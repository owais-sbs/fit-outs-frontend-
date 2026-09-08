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
  WITHDRAWN: "Withdrawn",
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
  WITHDRAWN: "bg-secondary text-muted-foreground",
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
