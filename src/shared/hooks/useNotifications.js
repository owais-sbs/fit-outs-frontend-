import { useCallback, useEffect, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/shared/api/notifications.api";

const CATEGORY_TYPE = {
  APPROVAL_EXPIRY: "warning",
  APPROVAL_SLA: "warning",
  SCHEDULE_CONSTRAINT: "warning",
  DEPOSIT_OUTSTANDING: "warning",
  APPROVAL_STATUS: "approved",
  APPROVAL_ISSUED: "approved",
  APPROVAL_REJECTED: "revision",
  APPROVAL_APPROVED: "approved",
  APPROVAL_COMMENTS: "revision",
  BOQ_PENDING: "upload",
  BOQ_APPROVED: "approved",
  BOQ_REJECTED: "revision",
  VARIATION_PENDING: "upload",
  VARIATION_APPROVED: "approved",
  VARIATION_REJECTED: "revision",
  VARIATION_TRIAGE: "warning",
  VARIATION_APPROVAL_REMINDER: "warning",
  VARIATION_APPROVAL_ESCALATION: "warning",
  DESIGN_UPLOADED: "upload",
  CLIENT_APPROVED: "approved",
  REVISION_REQUESTED: "revision",
};

function mapCategoryToType(category, severity) {
  if (category && CATEGORY_TYPE[category]) return CATEGORY_TYPE[category];
  if (severity === "CRITICAL" || severity === "WARNING") return "warning";
  return "upload";
}

function mapApiNotification(n) {
  const title = (n.title || "").trim();
  const body = (n.body || "").trim();
  return {
    id: n.uuid,
    type: mapCategoryToType(n.category, n.severity),
    message: title || body || "Notification",
    time: n.createdAt,
    read: Boolean(n.read),
    linkPath: n.linkPath || null,
    category: n.category || null,
  };
}

/**
 * Loads in-app notifications for the signed-in account (plus company-wide alerts).
 */
export default function useNotifications({ pollMs = 60_000 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await fetchNotifications(50);
      const rows = Array.isArray(list) ? list : [];
      setNotifications(rows.map(mapApiNotification));
    } catch {
      // Keep last good list; empty inbox is fine when API is unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!pollMs || pollMs < 5_000) return undefined;
    const id = window.setInterval(refresh, pollMs);
    return () => window.clearInterval(id);
  }, [refresh, pollMs]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await markNotificationRead(id);
    } catch {
      refresh();
    }
  }, [refresh]);

  const clearAll = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      refresh();
    }
  }, [refresh]);

  return { notifications, loading, markRead, clearAll, refresh };
}
