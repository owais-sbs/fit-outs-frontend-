/**
 * Usage: <StatusBadge status="APPROVED" /> or <StatusBadge status={row.status} label="Paid" />
 * Maps status strings to Badge variants via STATUS_VARIANT; unknown → secondary. Dot indicator included.
 */
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/** Central status → Badge variant map. Unknown keys fall back to secondary. */
const STATUS_VARIANT = {
  APPROVED: "success",
  ACTIVE: "success",
  PAID: "success",
  COMPLETED: "success",
  SUCCESS: "success",
  CERTIFIED: "success",
  PUBLISHED: "success",
  DONE: "success",

  PENDING: "warning",
  DRAFT: "warning",
  TRIAL: "warning",
  IN_PROGRESS: "warning",
  UNDER_REVIEW: "warning",
  SUBMITTED: "warning",
  REVIEW: "warning",
  PROCESSING: "warning",
  SCHEDULED: "info",

  REJECTED: "danger",
  FAILED: "danger",
  CANCELLED: "danger",
  CANCELED: "danger",
  ERROR: "danger",
  OVERDUE: "danger",
  EXPIRED: "danger",

  NEW: "info",
  INFO: "info",
  OPEN: "info",

  INACTIVE: "secondary",
  ARCHIVED: "secondary",
  UNKNOWN: "secondary",
  CLOSED: "secondary",
  SUSPENDED: "secondary",
  TERMINATED: "danger",
  LOW: "danger",
}

function normalizeStatus(status) {
  if (status === true) return "ACTIVE"
  if (status === false) return "INACTIVE"
  if (status == null || status === "") return "UNKNOWN"
  return String(status).trim().toUpperCase()
}

function humanizeStatus(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function StatusBadge({ status, label, className }) {
  const key = normalizeStatus(status)
  const variant = STATUS_VARIANT[key] || "secondary"
  const text = label ?? humanizeStatus(key)

  return (
    <Badge variant={variant} className={cn("gap-1.5", className)}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" aria-hidden />
      {text}
    </Badge>
  )
}

export { StatusBadge, STATUS_VARIANT }
export default StatusBadge
