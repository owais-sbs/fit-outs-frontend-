import axiosInstance from "@/lib/axiosInstance";

export function normalizeRoom(item = {}) {
  return {
    uuid: item.uuid,
    projectId: item.projectId,
    name: item.name || "",
    floorLabel: item.floorLabel || "General",
    roomTypeId: item.roomTypeId || null,
    source: item.source || "MANUAL",
    sortOrder: item.sortOrder ?? 0,
    taskCount: item.taskCount ?? 0,
    openTaskCount: item.openTaskCount ?? 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function normalizeVersion(item = {}) {
  return {
    uuid: item.uuid,
    taskId: item.taskId,
    versionNo: item.versionNo,
    uploadedBy: item.uploadedBy,
    uploaderRole: item.uploaderRole,
    originalName: item.originalName || "",
    contentType: item.contentType || "",
    fileSize: item.fileSize,
    changeNotes: item.changeNotes || "",
    isFinal: Boolean(item.isFinal),
    status: item.status,
    createdAt: item.createdAt,
    downloadUrl: item.downloadUrl || "",
  };
}

export function normalizeTask(item = {}) {
  return {
    uuid: item.uuid,
    projectRoomId: item.projectRoomId,
    projectId: item.projectId,
    roomName: item.roomName || "",
    floorLabel: item.floorLabel || "",
    title: item.title || "",
    taskType: item.taskType || "OTHER",
    typeLabel: item.typeLabel || "",
    status: item.status || "OPEN",
    clientDeadline: item.clientDeadline || null,
    createdBy: item.createdBy,
    assigneeAccountId: item.assigneeAccountId,
    firstSentToClientAt: item.firstSentToClientAt,
    approvedAt: item.approvedAt,
    clientApprovalDays: item.clientApprovalDays,
    revisionCount: item.revisionCount ?? 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    versions: Array.isArray(item.versions) ? item.versions.map(normalizeVersion) : [],
  };
}

export function normalizeMessage(item = {}) {
  return {
    uuid: item.uuid,
    projectRoomId: item.projectRoomId,
    taskId: item.taskId,
    senderAccountId: item.senderAccountId,
    senderName: item.senderName || "",
    body: item.body || "",
    attachmentName: item.attachmentName || "",
    attachmentUrl: item.attachmentUrl || "",
    linkedTaskId: item.linkedTaskId || null,
    referencedVersionId: item.referencedVersionId || null,
    referencedVersionNo: item.referencedVersionNo ?? null,
    referencedFileName: item.referencedFileName || "",
    referencedDownloadUrl: item.referencedDownloadUrl || "",
    createdAt: item.createdAt,
  };
}

export function normalizeEvent(item = {}) {
  return {
    uuid: item.uuid,
    taskId: item.taskId,
    eventType: item.eventType,
    actorAccountId: item.actorAccountId,
    message: item.message || "",
    metadataJson: item.metadataJson,
    createdAt: item.createdAt,
  };
}

export const fetchProjectRooms = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/rooms`).then((r) => {
    const data = r.data?.data ?? r.data;
    return (Array.isArray(data) ? data : []).map(normalizeRoom);
  });

export const createProjectRoom = (projectId, form) =>
  axiosInstance
    .post(`/projects/${projectId}/rooms`, {
      name: form.name,
      floorLabel: form.floorLabel || "General",
      roomTypeId: form.roomTypeId || null,
      sortOrder: form.sortOrder ?? 0,
    })
    .then((r) => normalizeRoom(r.data?.data ?? r.data));

export const syncRoomsFromBoq = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/rooms/sync-from-boq`).then((r) => r.data?.data ?? 0);

export const fetchRoomTasks = (projectId, roomId) =>
  axiosInstance.get(`/projects/${projectId}/rooms/${roomId}/tasks`).then((r) => {
    const data = r.data?.data ?? r.data;
    return (Array.isArray(data) ? data : []).map(normalizeTask);
  });

export const fetchProjectRoomTasks = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/room-tasks`).then((r) => {
    const data = r.data?.data ?? r.data;
    return (Array.isArray(data) ? data : []).map(normalizeTask);
  });

export const fetchPendingClientTasks = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/room-tasks/pending-client`).then((r) => {
    const data = r.data?.data ?? r.data;
    return (Array.isArray(data) ? data : []).map(normalizeTask);
  });

export const fetchRoomTask = (projectId, taskId) =>
  axiosInstance
    .get(`/projects/${projectId}/room-tasks/${taskId}`)
    .then((r) => normalizeTask(r.data?.data ?? r.data));

export const createRoomTask = (projectId, form) =>
  axiosInstance
    .post(`/projects/${projectId}/room-tasks`, {
      projectRoomId: form.projectRoomId,
      title: form.title,
      taskType: form.taskType || "OTHER",
      typeLabel: form.typeLabel || null,
      clientDeadline: form.clientDeadline || null,
      assigneeAccountId: form.assigneeAccountId || null,
    })
    .then((r) => normalizeTask(r.data?.data ?? r.data));

export const updateRoomTask = (projectId, taskId, form) =>
  axiosInstance
    .patch(`/projects/${projectId}/room-tasks/${taskId}`, form)
    .then((r) => normalizeTask(r.data?.data ?? r.data));

export const uploadTaskVersion = (projectId, taskId, file, changeNotes = "") => {
  const fd = new FormData();
  fd.append("file", file);
  if (changeNotes) fd.append("changeNotes", changeNotes);
  return axiosInstance
    .post(`/projects/${projectId}/room-tasks/${taskId}/versions`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => normalizeVersion(r.data?.data ?? r.data));
};

export const submitTaskToClient = (projectId, taskId) =>
  axiosInstance
    .post(`/projects/${projectId}/room-tasks/${taskId}/submit`)
    .then((r) => normalizeTask(r.data?.data ?? r.data));

export const requestTaskChanges = (projectId, taskId, notes) =>
  axiosInstance
    .post(`/projects/${projectId}/room-tasks/${taskId}/request-changes`, { notes })
    .then((r) => normalizeTask(r.data?.data ?? r.data));

export const approveRoomTask = (projectId, taskId) =>
  axiosInstance
    .post(`/projects/${projectId}/room-tasks/${taskId}/approve`)
    .then((r) => normalizeTask(r.data?.data ?? r.data));

export const closeRoomTask = (projectId, taskId) =>
  axiosInstance
    .post(`/projects/${projectId}/room-tasks/${taskId}/close`)
    .then((r) => normalizeTask(r.data?.data ?? r.data));

export const fetchTaskTimeline = (projectId, taskId) =>
  axiosInstance.get(`/projects/${projectId}/room-tasks/${taskId}/timeline`).then((r) => {
    const data = r.data?.data ?? r.data;
    return (Array.isArray(data) ? data : []).map(normalizeEvent);
  });

export const fetchTaskMessages = (projectId, taskId) =>
  axiosInstance.get(`/projects/${projectId}/room-tasks/${taskId}/messages`).then((r) => {
    const data = r.data?.data ?? r.data;
    return (Array.isArray(data) ? data : []).map(normalizeMessage);
  });

export const postTaskMessage = (projectId, taskId, body, file, referencedVersionId) => {
  const fd = new FormData();
  if (body) fd.append("body", body);
  if (file) fd.append("file", file);
  if (referencedVersionId) fd.append("referencedVersionId", referencedVersionId);
  return axiosInstance
    .post(`/projects/${projectId}/room-tasks/${taskId}/messages`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => normalizeMessage(r.data?.data ?? r.data));
};

export const fetchRoomMessages = (projectId, roomId) =>
  axiosInstance.get(`/projects/${projectId}/rooms/${roomId}/messages`).then((r) => {
    const data = r.data?.data ?? r.data;
    return (Array.isArray(data) ? data : []).map(normalizeMessage);
  });

export const postRoomMessage = (projectId, roomId, body, file, linkedTaskId) => {
  const fd = new FormData();
  if (body) fd.append("body", body);
  if (file) fd.append("file", file);
  if (linkedTaskId) fd.append("linkedTaskId", linkedTaskId);
  return axiosInstance
    .post(`/projects/${projectId}/rooms/${roomId}/messages`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => normalizeMessage(r.data?.data ?? r.data));
};

export const fetchFinalReport = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/final-report`).then((r) => r.data?.data ?? r.data);
