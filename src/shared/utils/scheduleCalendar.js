/**
 * Utilities for merging published schedule activities into calendar grids.
 */

export function formatDateKey(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).slice(0, 10).split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

/** Expand a schedule activity across each calendar day in its range. */
export function expandActivityToDays(activity) {
  const start = parseDateKey(activity.startDate);
  const end = parseDateKey(activity.endDate);
  if (!start || !end) return [];
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(formatDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function mapScheduleActivityToCalendarEvent(activity, projectName = "") {
  return {
    id: activity.uuid,
    type: "schedule_activity",
    title: activity.name || "Activity",
    date: String(activity.startDate || "").slice(0, 10),
    endDate: String(activity.endDate || "").slice(0, 10),
    projectId: activity.projectId,
    project: projectName || activity.projectName || `Project #${activity.projectId}`,
    assignee: activity.assigneeName || "",
    assigneeAccountId: activity.assigneeAccountId,
    status: `${activity.percentComplete ?? 0}%`,
    percentComplete: activity.percentComplete ?? 0,
    roomName: activity.roomName,
    roomTaskTitle: activity.roomTaskTitle,
    meta: activity,
  };
}

export function mapSiteVisitToCalendarEvent(visit) {
  return {
    ...visit,
    type: visit.type || "site_visit",
    title: visit.project || visit.title || "Site visit",
  };
}

/** Build { 'YYYY-MM-DD': Event[] } from flat events (each event must have `date`). */
export function buildEventsByDate(events, { expandMultiDay = false } = {}) {
  const map = {};
  const add = (dateKey, event) => {
    if (!dateKey) return;
    if (!map[dateKey]) map[dateKey] = [];
    map[dateKey].push(event);
  };

  events.forEach((event) => {
    if (expandMultiDay && event.type === "schedule_activity" && event.endDate && event.date !== event.endDate) {
      const days = expandActivityToDays({ startDate: event.date, endDate: event.endDate });
      days.forEach((d) => add(d, { ...event, date: d, isMultiDaySpan: true }));
    } else {
      add(event.date, event);
    }
  });
  return map;
}

export function monthDateRange(year, month) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate: start, endDate: end };
}
