import { useEffect, useRef, useState } from "react";
import { FileText, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/auth-context";
import { postRoomMessage, postTaskMessage } from "../../api/room-collab.api";
import { sendChannelMessage } from "../../api/communications.api";
import {
  fileHref,
  fileLabel,
  formatChatTime,
  hasFileAttachment,
} from "../roomcollab/CollabChatPanel";

export default function ChannelChatPanel({
  channelUuid,
  channelType,
  messages = [],
  onSent,
  onIncoming,
  disabled = false,
  readOnly = false,
  projectId,
  projectRoomId,
  roomTaskId,
}) {
  const { user } = useAuth();
  const myId = user?.id != null ? Number(user.id) : null;
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const isProjectRoom = channelType === "PROJECT_ROOM" && projectId && projectRoomId;
  const isRoomTask = channelType === "ROOM_TASK" && projectId && roomTaskId;
  const canSend =
    !readOnly
    && !disabled
    && channelType !== "EMAIL"
    && (channelType !== "PROJECT_ROOM" && channelType !== "ROOM_TASK"
      || isProjectRoom
      || isRoomTask);

  const send = async () => {
    if (!canSend || busy || (!body.trim() && !file)) return;
    setBusy(true);
    try {
      let msg;
      if (isProjectRoom) {
        msg = await postRoomMessage(projectId, projectRoomId, body.trim(), file);
      } else if (isRoomTask) {
        msg = await postTaskMessage(projectId, roomTaskId, body.trim(), file, null);
      } else {
        msg = await sendChannelMessage(channelUuid, body.trim());
      }
      setBody("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onIncoming?.(msg);
      onSent?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/20">
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const mine = myId != null && Number(m.senderAccountId) === myId;
            const href = fileHref(m);
            const hasFile = hasFileAttachment(m);
            return (
              <div key={m.uuid} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                    mine ? "bg-primary text-primary-foreground" : "bg-card border border-border/60"
                  }`}
                >
                  {!mine && m.senderName && (
                    <p className="mb-0.5 text-[10px] font-medium opacity-70">{m.senderName}</p>
                  )}
                  {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                  {hasFile &&
                    (href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className={[
                          "mt-1.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs",
                          mine ? "bg-black/15 hover:bg-black/20" : "bg-muted hover:bg-muted/80",
                        ].join(" ")}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{fileLabel(m)}</span>
                      </a>
                    ) : (
                      <p
                        className={`mt-1.5 flex items-center gap-1.5 text-xs ${mine ? "opacity-90" : "text-muted-foreground"}`}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{fileLabel(m)}</span>
                      </p>
                    ))}
                  <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {formatChatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {file && (
        <div className="flex items-center gap-2 border-t border-border/40 bg-card/90 px-3 py-1.5 text-xs">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {canSend ? (
        <div className="flex items-end gap-1.5 border-t border-border/60 bg-card p-3">
          {(isProjectRoom || isRoomTask) && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </>
          )}
          <input
            className="min-h-9 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          />
          <Button size="icon" disabled={busy || (!body.trim() && !file)} onClick={send}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : readOnly || channelType === "EMAIL" ? (
        <div className="border-t border-border/60 bg-card p-3 text-xs text-muted-foreground">
          {channelType === "EMAIL" ? "Sent emails are read-only." : "Open the linked project room or task to reply."}
        </div>
      ) : null}
    </div>
  );
}
