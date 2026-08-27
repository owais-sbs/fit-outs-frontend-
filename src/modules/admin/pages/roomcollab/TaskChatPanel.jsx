import { postTaskMessage } from "../../api/room-collab.api";
import CollabChatPanel from "./CollabChatPanel";

/**
 * Chat-first room-task thread. Paperclip attaches a real file (creates a version on send).
 */
export default function TaskChatPanel({
  projectId,
  taskId,
  messages = [],
  onSent,
  disabled = false,
}) {
  return (
    <CollabChatPanel
      messages={messages}
      disabled={disabled}
      onSend={async (body, file) => {
        await postTaskMessage(projectId, taskId, body, file, null);
        onSent?.();
      }}
    />
  );
}
