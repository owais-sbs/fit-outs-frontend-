import axiosInstance from "@/lib/axiosInstance";
import { multipartConfig } from "@/lib/multipart";

const unwrap = (r) => {
  const body = r.data;
  if (body && body.isSuccess === false) {
    const err = new Error(body.error || body.message || "Request failed");
    err.response = r;
    throw err;
  }
  return body?.data ?? body;
};

export const fetchProjectSchedule = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/schedule`).then(unwrap);

export const createScheduleActivity = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/schedule/activities`, payload).then(unwrap);

export const createScheduleActivityFromRoomTask = (projectId, roomTaskId) =>
  axiosInstance
    .post(`/projects/${projectId}/schedule/activities/from-room-task`, { roomTaskId })
    .then(unwrap);

export const updateScheduleActivity = (activityUuid, payload) =>
  axiosInstance.put(`/schedule/activities/${activityUuid}`, payload).then(unwrap);

export const deleteScheduleActivity = (activityUuid) =>
  axiosInstance.delete(`/schedule/activities/${activityUuid}`).then(unwrap);

export const addScheduleDependency = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/schedule/dependencies`, payload).then(unwrap);

export const deleteScheduleDependency = (dependencyUuid) =>
  axiosInstance.delete(`/schedule/dependencies/${dependencyUuid}`).then(unwrap);

export const publishSchedule = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/schedule/publish`).then(unwrap);

export const createScheduleBaseline = (projectId, name) =>
  axiosInstance.post(`/projects/${projectId}/schedule/baseline`, { name }).then(unwrap);

/** Fetch a baseline with snapshotted activities (for Gantt overlay). */
export const fetchScheduleBaseline = (projectId, baselineUuid) =>
  axiosInstance.get(`/projects/${projectId}/schedule/baselines/${baselineUuid}`).then(unwrap);

export const postActivityProgress = (activityUuid, payload) =>
  axiosInstance.post(`/schedule/activities/${activityUuid}/progress`, payload).then(unwrap);

export const fetchActivityProgress = (activityUuid) =>
  axiosInstance.get(`/schedule/activities/${activityUuid}/progress`).then(unwrap);

export const fetchMyScheduleActivities = () =>
  axiosInstance.get(`/schedule/my-activities`).then(unwrap);

export const fetchScheduleCalendarEvents = ({ startDate, endDate, projectId, assigneeAccountId } = {}) =>
  axiosInstance
    .get("/schedule/calendar-events", {
      params: {
        startDate,
        endDate,
        ...(projectId != null ? { projectId } : {}),
        ...(assigneeAccountId != null ? { assigneeAccountId } : {}),
      },
    })
    .then(unwrap);

// --- Module 43: template engine, CPM preview/apply, procurement deadlines ---

export const fetchScheduleTemplates = () =>
  axiosInstance.get("/schedule/templates").then(unwrap);

export const fetchScheduleTemplate = (templateUuid) =>
  axiosInstance.get(`/schedule/templates/${templateUuid}`).then(unwrap);

export const fetchWorkCalendars = () =>
  axiosInstance.get("/schedule/work-calendars").then(unwrap);

/** Solves the template against these parameters. Writes nothing. */
export const previewSchedule = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/schedule/preview`, payload).then(unwrap);

/** Writes the programme and cascades to packages, billing, holds and approvals. */
export const applySchedule = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/schedule/apply`, payload).then(unwrap);

export const fetchOrderByDates = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/schedule/order-by-dates`).then(unwrap);

/**
 * Re-runs CPM on the server. The client never computes successor dates itself, because a
 * local date edit would silently desynchronise the rest of the network.
 */
export const rescheduleProject = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/schedule/reschedule`, payload || {}).then(unwrap);

export const uploadProgressAttachment = (progressUuid, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post(`/schedule/progress/${progressUuid}/attachments`, fd, multipartConfig({ timeout: 120000 }))
    .then((r) => {
      if (r.data?.isSuccess === false) {
        const err = new Error(r.data?.error || r.data?.message || "Upload failed");
        err.response = r;
        throw err;
      }
      return r.data?.data ?? r.data;
    });
};
