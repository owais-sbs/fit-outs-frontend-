import BoqApprovalPipeline, { pipelineStepState as boqPipelineStepState } from "../boq/BoqApprovalPipeline";
import BoqApprovalTimeline from "../boq/BoqApprovalTimeline";

export const BILLING_PIPELINE_STEPS = [
  { key: "FINANCE", label: "Finance", short: "Fin", pending: "DRAFT" },
  { key: "PM", label: "PM", short: "PM", pending: "PENDING_PM" },
  { key: "DIRECTOR", label: "Director", short: "Dir", pending: "PENDING_DIRECTOR" },
  { key: "CLIENT", label: "Client", short: "Client", pending: "ISSUED" },
];

export const BILLING_PENDING_INDEX = {
  DRAFT: 0,
  PENDING_PM: 1,
  PENDING_DIRECTOR: 2,
  ISSUED: 3,
  PART_PAID: 3,
};

export const BILLING_DONE_STATUSES = ["PAID"];

export function billingPipelineStepState(status, index) {
  return boqPipelineStepState(status, index, {
    pendingIndex: BILLING_PENDING_INDEX,
    doneStatuses: BILLING_DONE_STATUSES,
  });
}

export function BillingApprovalPipeline({ status, compact = false, className = "" }) {
  return (
    <BoqApprovalPipeline
      status={status}
      compact={compact}
      className={className}
      steps={BILLING_PIPELINE_STEPS}
      pendingIndex={BILLING_PENDING_INDEX}
      doneStatuses={BILLING_DONE_STATUSES}
      ariaLabel="Billing milestone approval checkpoints"
    />
  );
}

function fallbackLog(item) {
  if (!item) return [];
  const status = String(item.status || "").toUpperCase();
  if (status === "DRAFT") return [];
  const log = [];
  if (item.requestedByName || item.createdAt) {
    log.push({
      id: `${item.uuid || "pr"}-submitted`,
      action: "SUBMITTED",
      step: "FINANCE",
      actorName: item.requestedByName || "Finance",
      actorRole: "FINANCE",
      comments: null,
      createdAt: item.createdAt,
    });
  }
  const pastPm = ["PENDING_DIRECTOR", "ISSUED", "PAID", "PART_PAID"].includes(status);
  if (pastPm) {
    log.push({
      id: `${item.uuid || "pr"}-pm`,
      action: "APPROVED",
      step: "PM",
      actorName: item.pmApprovedByName || "Project Manager",
      actorRole: "PROJECT_MANAGER",
      comments: item.pmComments || null,
      createdAt: item.pmApprovedAt || item.updatedAt,
    });
  }
  const pastDirector = ["ISSUED", "PAID", "PART_PAID"].includes(status);
  if (pastDirector) {
    log.push({
      id: `${item.uuid || "pr"}-director`,
      action: "APPROVED",
      step: "DIRECTOR",
      actorName: item.directorApprovedByName || "Director",
      actorRole: "BUSINESS_OWNER",
      comments: item.directorComments || null,
      createdAt: item.directorApprovedAt || item.decidedAt || item.updatedAt,
    });
  }
  if (status === "PAID" || status === "PART_PAID") {
    log.push({
      id: `${item.uuid || "pr"}-client`,
      action: "APPROVED",
      step: "CLIENT",
      actorName: "Client payment",
      actorRole: "CLIENT",
      createdAt: item.updatedAt,
    });
  }
  return log;
}

export function billingApprovalHistory(item) {
  const log = Array.isArray(item?.approvalLog) && item.approvalLog.length > 0
    ? item.approvalLog
    : fallbackLog(item);
  return { log, versions: [] };
}

export function BillingApprovalTimeline({ item, loading }) {
  return (
    <BoqApprovalTimeline
      history={billingApprovalHistory(item)}
      loading={loading}
      emptyMessage="No approval actions yet. Finance submits this milestone to start the chain."
    />
  );
}
