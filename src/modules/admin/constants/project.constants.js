export const PROJECT_STATUS = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
};

export const PROJECT_STATUS_LIST = Object.values(PROJECT_STATUS);

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
};

export const PAYMENT_STATUS_VARIANTS = {
  [PAYMENT_STATUS.PENDING]: "secondary",
  [PAYMENT_STATUS.PARTIAL]: "warning",
  [PAYMENT_STATUS.PAID]: "success",
  [PAYMENT_STATUS.OVERDUE]: "destructive",
};
