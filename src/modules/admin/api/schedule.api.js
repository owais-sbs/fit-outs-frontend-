import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

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
