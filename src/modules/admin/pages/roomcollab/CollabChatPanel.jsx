import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/auth-context";

export function formatChatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function fileHref(message) {
  return message.referencedDownloadUrl || message.attachmentUrl || "";
}

export function fileLabel(message) {
  if (message.referencedVersionNo != null) {
    return `v${message.referencedVersionNo} · ${message.referencedFileName || message.attachmentName || "file"}`;
  }
  return message.attachmentName || message.referencedFileName || "file";
}

export function hasFileAttachment(message) {
  return Boolean(
    message.referencedVersionId || message.attachmentName || message.referencedFileName
  );
}

/**
 * Shared chat panel for room/task threads: bubbles, file attachments, paperclip composer.
 */
export default function CollabChatPanel({
  messages = [],
  onSend,
  disabled = false,
  title = "Conversation",
  linkedTaskRoute,
  className = "",
}) {
  const { user } = useAuth();
  const myId = user?.id != null ? Number(user.id) : null;
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (disabled || busy) return;
    if (!body.trim() && !file) return;
    setBusy(true);
    setError("");
    try {
      await onSend(body.trim(), file);
      setBody("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      inputRef.current?.focus();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={["admin-chat-shell flex-1", className].filter(Boolean).join(" ")}>
      <div className="admin-chat-header">
        <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
      </div>

      <div className="admin-chat-thread space-y-2.5">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-1 px-6 text-center">
            <p className="text-sm font-medium text-foreground/80">No messages yet</p>
            <p className="text-xs text-muted-foreground">
              Send a note or attach a file to start this conversation.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = myId != null && Number(m.senderAccountId) === myId;
            const href = fileHref(m);
            const hasFile = hasFileAttachment(m);
            return (
              <div key={m.uuid} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "admin-chat-bubble",
                    mine ? "admin-chat-bubble-mine" : "admin-chat-bubble-theirs",
                  ].join(" ")}
                >
                  {!mine && (
                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                      {m.senderName || `#${m.senderAccountId}`}
                    </p>
                  )}
                  {m.body && <p className="whitespace-pre-wrap leading-snug">{m.body}</p>}
                  {hasFile &&
                    (href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className={[
                          "mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium",
                          mine
                            ? "bg-white/15 hover:bg-white/20"
                            : "bg-muted hover:bg-muted/80 text-foreground",
                        ].join(" ")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{fileLabel(m)}</span>
                      </a>
                    ) : (
                      <p
                        className={`mt-2 flex items-center gap-1.5 text-xs ${mine ? "opacity-90" : "text-muted-foreground"}`}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{fileLabel(m)}</span>
                      </p>
                    ))}
                  {m.linkedTaskId && linkedTaskRoute && (
                    <Link
                      className={`mt-1.5 inline-block text-xs font-medium underline underline-offset-2 ${mine ? "opacity-90" : "text-primary"}`}
                      to={linkedTaskRoute(m.linkedTaskId)}
                    >
                      Open linked task
                    </Link>
                  )}
                  <p
                    className={`mt-1.5 text-right text-[10px] tabular-nums ${mine ? "opacity-70" : "text-muted-foreground"}`}
                  >
                    {formatChatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="border-t border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {error}
        </p>
      )}

      {file && (
        <div className="flex items-center gap-2 border-t border-border/50 bg-muted/40 px-3 py-2 text-xs">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
          <button
            type="button"
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            aria-label="Remove attachment"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="admin-chat-composer">
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
          className="h-10 w-10 shrink-0"
          disabled={disabled || busy}
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          ref={inputRef}
          className="admin-chat-input"
          placeholder="Write a message…"
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
          className="h-10 w-10 shrink-0"
          disabled={disabled || busy || (!body.trim() && !file)}
          onClick={send}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
