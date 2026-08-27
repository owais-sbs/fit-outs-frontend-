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

export function sortVisitsLatestFirst(visits = []) {
  return [...visits].sort((a, b) => {
    const aMs = new Date(a.date).getTime();
    const bMs = new Date(b.date).getTime();
    const aTime = Number.isFinite(aMs) ? aMs : 0;
    const bTime = Number.isFinite(bMs) ? bMs : 0;
    if (bTime !== aTime) return bTime - aTime;
    const aCreated = new Date(a.createdAt || 0).getTime();
    const bCreated = new Date(b.createdAt || 0).getTime();
    return bCreated - aCreated;
  });
}

export function formatVisitSchedule(dateTime) {
  const d = new Date(dateTime);
  if (Number.isNaN(d.getTime())) return { dateLabel: "Date TBC", timeLabel: "" };
  return {
    dateLabel: d.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    timeLabel: d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }),
  };
}

export function formatCountdownLabel(hours, upcoming = true) {
  if (!upcoming) return "Completed";
  if (!Number.isFinite(hours) || hours <= 0) return "Today";
  if (hours < 24) return `In ${hours}h`;
  if (hours < 48) return "Tomorrow";
  const days = Math.floor(hours / 24);
  return `In ${days}d`;
}

export function isAbortError(err) {
  return (
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    err?.name === "AbortError" ||
    String(err?.message || "").toLowerCase().includes("canceled")
  );
}
