export const PROJECT_STATUS = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PROJECT_STATUS_LIST = Object.values(PROJECT_STATUS);

/** Module 27 commercial lifecycle — independent of PROJECT_STATUS. */
export const COMMERCIAL_LIFECYCLE = {
  NOT_READY: "NOT_READY",
  READY_FOR_COMMERCIAL_CLOSE: "READY_FOR_COMMERCIAL_CLOSE",
  DEFECTS_LIABILITY: "DEFECTS_LIABILITY",
  ARCHIVE_ELIGIBLE: "ARCHIVE_ELIGIBLE",
  ARCHIVED: "ARCHIVED",
};

export const COMMERCIAL_LIFECYCLE_LABELS = {
  [COMMERCIAL_LIFECYCLE.NOT_READY]: "Not ready",
  [COMMERCIAL_LIFECYCLE.READY_FOR_COMMERCIAL_CLOSE]: "Ready for commercial close",
  [COMMERCIAL_LIFECYCLE.DEFECTS_LIABILITY]: "Defects liability",
  [COMMERCIAL_LIFECYCLE.ARCHIVE_ELIGIBLE]: "Archive eligible",
  [COMMERCIAL_LIFECYCLE.ARCHIVED]: "Archived",
};

export const COMMERCIAL_LIFECYCLE_LIST = Object.values(COMMERCIAL_LIFECYCLE);

/** True once commercially closed (DLP, archive-eligible, or archived). */
export function isCommercialFrozen(stage) {
  return (
    stage === COMMERCIAL_LIFECYCLE.DEFECTS_LIABILITY ||
    stage === COMMERCIAL_LIFECYCLE.ARCHIVE_ELIGIBLE ||
    stage === COMMERCIAL_LIFECYCLE.ARCHIVED
  );
}

export function isProjectArchived(stage) {
  return stage === COMMERCIAL_LIFECYCLE.ARCHIVED;
}

export const COMMERCIAL_LIFECYCLE_COLORS = {
  [COMMERCIAL_LIFECYCLE.NOT_READY]: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  [COMMERCIAL_LIFECYCLE.READY_FOR_COMMERCIAL_CLOSE]: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  [COMMERCIAL_LIFECYCLE.DEFECTS_LIABILITY]: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  [COMMERCIAL_LIFECYCLE.ARCHIVE_ELIGIBLE]: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  [COMMERCIAL_LIFECYCLE.ARCHIVED]: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400",
};

export const PAYMENT_STATUS = {
  PENDING: "Pending",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

export const PAYMENT_STATUS_LIST = Object.values(PAYMENT_STATUS);

export const PROJECT_TYPES = [
  "Residential",
  "Commercial",
  "Interior",
  "Renovation",
  "Construction",
];

export const PROJECT_STATUS_VARIANTS = {
  [PROJECT_STATUS.PLANNING]: "secondary",
  [PROJECT_STATUS.IN_PROGRESS]: "default",
  [PROJECT_STATUS.ON_HOLD]: "warning",
  [PROJECT_STATUS.COMPLETED]: "success",
  [PROJECT_STATUS.CANCELLED]: "destructive",
};

/** Tailwind classes for workflow status pills — shared by list badges and detail dropdown. */
export const PROJECT_STATUS_COLORS = {
  [PROJECT_STATUS.PLANNING]: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  [PROJECT_STATUS.IN_PROGRESS]: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  [PROJECT_STATUS.ON_HOLD]: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  [PROJECT_STATUS.COMPLETED]: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  [PROJECT_STATUS.CANCELLED]: "bg-red-500/15 text-red-700 dark:text-red-400",
};

export const PAYMENT_STATUS_VARIANTS = {
  [PAYMENT_STATUS.PENDING]: "secondary",
  [PAYMENT_STATUS.PARTIAL]: "warning",
  [PAYMENT_STATUS.PAID]: "success",
  [PAYMENT_STATUS.OVERDUE]: "destructive",
};
