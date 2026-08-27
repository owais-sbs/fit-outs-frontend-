import axiosInstance from "@/lib/axiosInstance";

export function normalizeInboxItem(item = {}) {
  return {
    channelUuid: item.channelUuid,
    channelType: item.channelType || "INTERNAL",
    name: item.name || "Conversation",
    lastMessage: item.lastMessage || "",
    lastMessageAt: item.lastMessageAt || null,
    unreadCount: item.unreadCount ?? 0,
    projectId: item.projectId ?? null,
    projectRoomId: item.projectRoomId || null,
    roomTaskId: item.roomTaskId || null,
    contextLabel: item.contextLabel || "",
  };
}

export function normalizeChannelMessage(item = {}) {
  return {
    uuid: item.uuid,
    channelUuid: item.channelUuid,
    senderAccountId: item.senderAccountId,
    senderName: item.senderName || "",
    body: item.body || "",
    attachmentUrl: item.attachmentUrl || "",
    attachmentName: item.attachmentName || "",
    createdAt: item.createdAt,
  };
}

export const fetchCommunicationsInbox = (filter = "ALL") =>
  axiosInstance
    .get("/communications/inbox", { params: filter && filter !== "ALL" ? { filter } : {} })
    .then((r) => {
      const data = r.data?.data ?? r.data;
      return Array.isArray(data) ? data.map(normalizeInboxItem) : [];
    });

export const fetchChannelMessages = (channelUuid) =>
  axiosInstance
    .get(`/communications/channels/${channelUuid}/messages`)
    .then((r) => {
      const data = r.data?.data ?? r.data;
      return Array.isArray(data) ? data.map(normalizeChannelMessage) : [];
    });

export const sendChannelMessage = (channelUuid, body) =>
  axiosInstance
    .post(`/communications/channels/${channelUuid}/messages`, { body })
    .then((r) => normalizeChannelMessage(r.data?.data ?? r.data));

export const createCommunicationChannel = (payload) =>
  axiosInstance.post("/communications/channels", payload).then((r) => r.data?.data ?? r.data);

export const markChannelRead = (channelUuid) =>
  axiosInstance.patch(`/communications/channels/${channelUuid}/read`);

export const resolveCommunicationChannel = ({ projectRoomId, roomTaskId } = {}) =>
  axiosInstance
    .get("/communications/channels/resolve", {
      params: {
        ...(projectRoomId ? { projectRoomId } : {}),
        ...(roomTaskId ? { roomTaskId } : {}),
      },
    })
    .then((r) => r.data?.data ?? r.data);
