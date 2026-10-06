import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchBillingMilestoneInbox } from "@/modules/admin/api/billing.api";
import { fetchBoqInbox } from "@/modules/admin/api/boq.api";
import { fetchCommercialApprovalInbox } from "@/modules/admin/api/commercial-approvals.api";
import { fetchVariationTriageInbox } from "@/modules/admin/api/variations.api";
import { ROUTES } from "@/shared/constants/routes";
import { filterBoqInboxForRole } from "@/shared/constants/roles";
import { useAuth } from "@/shared/context/auth-context";

const PM_TASK_ROLE = "PROJECT_MANAGER";
const PM_BILLING_STATUS = "PENDING_PM";

const EVENT_TYPE_LABELS = {
  VARIATION: "Variation",
  CREDIT_NOTE: "Credit note",
  SC_CERTIFICATE: "SC certificate",
};

/** Pages that action these queues — re-fetch when entering or leaving one. */
const APPROVAL_ROUTES = [
  ROUTES.PROJECT_MANAGER.AWAITING_APPROVALS,
  ROUTES.PROJECT_MANAGER.VARIATIONS_INBOX,
  ROUTES.PROJECT_MANAGER.BOQ_INBOX,
  ROUTES.PROJECT_MANAGER.BILLING_MILESTONE_INBOX,
];

const EMPTY = { variations: [], boqs: [], billing: [] };

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function upper(value) {
  return String(value || "").toUpperCase();
}

function approvalRouteKey(pathname) {
  const match = APPROVAL_ROUTES.find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  return match || "other";
}

function variationDetailHref(projectId, uuid) {
  if (projectId == null || !uuid) return null;
  return ROUTES.PROJECT_MANAGER.PROJECT_VARIATION_DETAIL.replace(
    ":projectId",
    projectId
  ).replace(":uuid", uuid);
}

/** Client-raised CRs the PM still has to accept or decline. */
function normaliseTriage(items) {
  return asList(items).map((item) => ({
    key: `triage:${item.uuid}`,
    kind: "TRIAGE",
    kindLabel: "Client request",
    projectId: item.projectId,
    projectName: item.projectName,
    reference: item.crNumber,
    title: item.title,
    amount: item.sellDelta,
    statusLabel: "Awaiting triage",
    dueAt: null,
    href: ROUTES.PROJECT_MANAGER.VARIATIONS_INBOX,
    detailHref: variationDetailHref(item.projectId, item.uuid),
  }));
}

/** Matrix approval steps assigned to the PM role (variations only — do not promote credit notes). */
function normaliseCommercialTasks(items) {
  return asList(items)
    .filter((item) => upper(item.role) === PM_TASK_ROLE)
    .filter((item) => upper(item.status) === "PENDING")
    .filter((item) => upper(item.eventType) === "VARIATION")
    .map((item) => {
      const eventType = upper(item.eventType);
      return {
        key: `task:${item.taskUuid}`,
        kind: eventType || "VARIATION",
        kindLabel: EVENT_TYPE_LABELS[eventType] || "Variation",
        projectId: item.projectId,
        projectName: null,
        reference: item.title,
        title: null,
        amount: item.amount,
        statusLabel: "Pending your approval",
        dueAt: item.dueAt,
        href: ROUTES.PROJECT_MANAGER.VARIATIONS_INBOX,
        detailHref: variationDetailHref(item.projectId, item.entityUuid),
      };
    });
}

function normaliseBoqs(items, role) {
  return filterBoqInboxForRole(items, role).map((item) => ({
    key: `boq:${item.id}`,
    kind: "BOQ",
    kindLabel: "BOQ",
    projectId: item.projectId,
    projectName: item.projectName,
    reference: item.version ? `Version ${item.version}` : "BOQ",
    title: null,
    amount: item.grandTotal,
    statusLabel: "Pending your approval",
    dueAt: null,
    href: ROUTES.PROJECT_MANAGER.BOQ_INBOX,
    detailHref: ROUTES.PROJECT_MANAGER.BOQ_VIEW.replace(":boqId", item.id),
  }));
}

function billingDetailHref(projectId) {
  if (projectId == null) return null;
  return ROUTES.PROJECT_MANAGER.PROJECT_BILLING.replace(":projectId", projectId);
}

function normaliseBilling(items) {
  return asList(items)
    .filter((item) => upper(item.status) === PM_BILLING_STATUS)
    .map((item) => ({
      key: `payment:${item.uuid}`,
      kind: "BILLING",
      kindLabel: "Billing milestone",
      projectId: item.projectId,
      projectName: item.projectName,
      reference: item.milestoneName || "Milestone",
      title: null,
      amount: item.amount,
      statusLabel: "Pending your approval",
      dueAt: item.dueDate,
      href: ROUTES.PROJECT_MANAGER.BILLING_MILESTONE_INBOX,
      detailHref: billingDetailHref(item.projectId),
    }));
}

/**
 * Aggregates the commercial queues that sit on the Project Manager so the sidebar
 * and the awaiting-approvals hub can show them without opening each project.
 */
export default function usePmAwaitingApprovalCounts() {
  const { role } = useAuth();
  const { pathname } = useLocation();
  const routeKey = approvalRouteKey(pathname);

  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const [triage, tasks, boqs, billing] = await Promise.all([
          fetchVariationTriageInbox().catch(() => []),
          fetchCommercialApprovalInbox().catch(() => []),
          fetchBoqInbox(role).catch(() => []),
          fetchBillingMilestoneInbox().catch(() => []),
        ]);

        if (signal?.aborted) return;

        setData({
          variations: [
            ...normaliseTriage(triage),
            ...normaliseCommercialTasks(tasks),
          ],
          boqs: normaliseBoqs(boqs, role),
          billing: normaliseBilling(billing),
        });
      } catch (e) {
        if (signal?.aborted) return;
        setData(EMPTY);
        setError(e?.message || "Failed to load pending approvals");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [role]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, routeKey]);

  const counts = {
    variations: data.variations.length,
    boqs: data.boqs.length,
    billing: data.billing.length,
  };

  return {
    loading,
    error,
    reload: () => load(),
    variations: data.variations,
    boqs: data.boqs,
    billing: data.billing,
    counts,
    total: counts.variations + counts.boqs + counts.billing,
  };
}
