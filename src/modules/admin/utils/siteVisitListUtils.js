/** Shared enrichment for site-visit list pages */

export function enrichSiteVisits(visits = [], leads = []) {
  const leadMap = new Map(leads.map((l) => [String(l.id), l]));

  return visits.map((v) => {
    const lead = leadMap.get(String(v.leadId));
    const loc = v.locationDetails || {};
    const locationStr =
      [loc.addressLine1, loc.buildingName, loc.area, loc.city, loc.state]
        .filter(Boolean)
        .join(", ") || "Location not specified";

    const dateTime =
      v.scheduledDate && v.scheduledTime
        ? `${v.scheduledDate}T${v.scheduledTime}`
        : v.scheduledDate || v.createdAt || new Date().toISOString();

    const scheduledMs = new Date(dateTime).getTime();
    const countdownHours = Number.isFinite(scheduledMs)
      ? Math.max(0, Math.round((scheduledMs - Date.now()) / 3_600_000))
      : 0;

    const status = String(v.status || "").toUpperCase();
    const isCompleted = status === "COMPLETED";
    const isCancelled = status === "CANCELLED" || status === "CANCELED";

    const assignee =
      Array.isArray(v.employeeNames) && v.employeeNames.length > 0
        ? v.employeeNames.join(", ")
        : Array.isArray(v.employeeIds) && v.employeeIds.length > 0
          ? v.employeeIds.map((id) => `Staff #${id}`).join(", ")
          : v.assignedTo
            ? `Staff #${v.assignedTo}`
            : "Unassigned";

    return {
      ...v,
      client: lead?.clientName || `Lead #${v.leadId}`,
      company: lead?.company || loc.buildingName || loc.area || "—",
      date: dateTime,
      location: locationStr,
      assignee,
      isCompleted,
      isCancelled,
      countdownHours,
    };
  });
}

export function isAbortError(err) {
  return (
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    err?.name === "AbortError" ||
    String(err?.message || "").toLowerCase().includes("canceled")
  );
}
