import { useEffect, useState } from "react";
import { useAuth } from "@/shared/context/auth-context";
import { resolveCommunicationChannel } from "@/modules/admin/api/communications.api";
import { useCommunicationsSocket } from "./useCommunicationsSocket";

function normalizeSocketMessage(msg) {
  return {
    uuid: msg.uuid,
    senderAccountId: msg.senderAccountId,
    senderName: msg.senderName || "",
    body: msg.body || "",
    attachmentName: msg.attachmentName || "",
    attachmentUrl: msg.attachmentUrl || "",
    linkedTaskId: msg.linkedTaskId || null,
    referencedVersionId: msg.referencedVersionId || null,
    referencedVersionNo: msg.referencedVersionNo ?? null,
    referencedFileName: msg.referencedFileName || "",
    referencedDownloadUrl: msg.referencedDownloadUrl || msg.attachmentUrl || "",
    createdAt: msg.createdAt,
  };
}

/** Subscribe to the communications channel backing a room or task thread. */
export function useCollabChatSocket({ projectRoomId, roomTaskId, setMessages }) {
  const { user } = useAuth();
  const accountId = user?.id != null ? Number(user.id) : null;
  const [channelUuid, setChannelUuid] = useState(null);

  useEffect(() => {
    let cancelled = false;
    resolveCommunicationChannel({ projectRoomId, roomTaskId })
      .then((uuid) => {
        if (!cancelled) setChannelUuid(uuid);
      })
      .catch(() => {
        if (!cancelled) setChannelUuid(null);
      });
    return () => {
      cancelled = true;
    };
  }, [projectRoomId, roomTaskId]);

  useCommunicationsSocket({
    channelUuid,
    accountId,
    onMessage: (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.uuid === msg.uuid)) return prev;
        return [...prev, normalizeSocketMessage(msg)];
      });
    },
  });

  return channelUuid;
}
