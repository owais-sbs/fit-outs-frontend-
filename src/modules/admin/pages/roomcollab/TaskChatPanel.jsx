import { useEffect, useRef, useState } from "react";
import { FileText, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/auth-context";
import { postTaskMessage } from "../../api/room-collab.api";

function formatChatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Simple WhatsApp-style chat for room tasks.
 * Version reference is a one-tap chip under the composer, not a form field.
 */
export default function TaskChatPanel({
  projectId,
  taskId,
  messages = [],
  versions = [],
  onSent,
  disabled = false,
}) {
  const { user } = useAuth();
  const myId = user?.id != null ? Number(user.id) : null;
  const [body, setBody] = useState("");
  const [refVersionId, setRefVersionId] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const selectedVersion = versions.find((v) => v.uuid === refVersionId);

  const send = async () => {
    if (disabled || busy) return;
    if (!body.trim() && !refVersionId) return;
    setBusy(true);
    try {
      await postTaskMessage(projectId, taskId, body.trim(), null, refVersionId || null);
      setBody("");
      setRefVersionId("");
      setShowAttach(false);
      onSent?.();
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[420px] flex-col overflow-hidden rounded-xl border border-border/60 bg-[#e5ddd5]/40 dark:bg-muted/30">
      <div className="border-b border-border/50 bg-card/80 px-3 py-2 text-sm font-medium">
        Chat
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            No messages yet — say hello or attach a file version.
          </p>
        ) : (
          messages.map((m) => {
            const mine = myId != null && Number(m.senderAccountId) === myId;
            return (
              <div key={m.uuid} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                    mine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border/40 bg-card",
                  ].join(" ")}
                >
                  {!mine && (
                    <p className={`mb-0.5 text-[10px] ${mine ? "opacity-80" : "text-muted-foreground"}`}>
                      #{m.senderAccountId}
                    </p>
                  )}
                  {m.body && <p className="whitespace-pre-wrap leading-snug">{m.body}</p>}
                  {m.referencedVersionId && (
                    <a
                      href={m.referencedDownloadUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={[
                        "mt-1.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs",
                        mine ? "bg-black/15 hover:bg-black/20" : "bg-muted hover:bg-muted/80",
                      ].join(" ")}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        v{m.referencedVersionNo} · {m.referencedFileName || "file"}
                      </span>
                    </a>
                  )}
                  {m.attachmentName && (
                    <p className={`mt-1 text-xs ${mine ? "opacity-90" : "text-primary"}`}>
                      {m.attachmentName}
                    </p>
                  )}
                  <p className={`mt-1 text-right text-[10px] ${mine ? "opacity-70" : "text-muted-foreground"}`}>
                    {formatChatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {selectedVersion && (
        <div className="flex items-center gap-2 border-t border-border/40 bg-card/90 px-3 py-1.5 text-xs">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="min-w-0 flex-1 truncate">
            Attaching v{selectedVersion.versionNo} · {selectedVersion.originalName}
          </span>
          <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setRefVersionId("")}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {showAttach && versions.length > 0 && (
        <div className="max-h-32 overflow-y-auto border-t border-border/40 bg-card px-2 py-2">
          <p className="mb-1 px-1 text-[10px] font-medium uppercase text-muted-foreground">Attach a version</p>
          <div className="space-y-0.5">
            {versions.map((v) => (
              <button
                key={v.uuid}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                onClick={() => {
                  setRefVersionId(v.uuid);
                  setShowAttach(false);
                }}
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  v{v.versionNo} · {v.originalName}
                  {v.isFinal ? " ✓" : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-1.5 border-t border-border/50 bg-card p-2">
        {versions.length > 0 && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 shrink-0"
            disabled={disabled || busy}
            onClick={() => setShowAttach((s) => !s)}
            title="Attach file version"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        )}
        <input
          ref={inputRef}
          className="min-h-9 flex-1 rounded-full border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          placeholder="Type a message"
          value={body}
          disabled={disabled || busy}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          disabled={disabled || busy || (!body.trim() && !refVersionId)}
          onClick={send}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
