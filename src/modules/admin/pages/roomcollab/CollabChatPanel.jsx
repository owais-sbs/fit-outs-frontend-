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
    <div
      className={[
        "flex min-h-[480px] flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-[#e5ddd5]/40 dark:bg-muted/30",
        className,
      ].join(" ")}
    >
      <div className="border-b border-border/50 bg-card/80 px-3 py-2 text-sm font-medium">
        {title}
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            No messages yet — type a note or attach a file.
          </p>
        ) : (
          messages.map((m) => {
            const mine = myId != null && Number(m.senderAccountId) === myId;
            const href = fileHref(m);
            const hasFile = hasFileAttachment(m);
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
                    <p className="mb-0.5 text-[10px] text-muted-foreground">
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
                          "mt-1.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs",
                          mine ? "bg-black/15 hover:bg-black/20" : "bg-muted hover:bg-muted/80",
                        ].join(" ")}
                        onClick={(e) => e.stopPropagation()}
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
                  {m.linkedTaskId && linkedTaskRoute && (
                    <Link
                      className={`mt-1 inline-block text-xs underline ${mine ? "text-primary-foreground/90" : "text-primary"}`}
                      to={linkedTaskRoute(m.linkedTaskId)}
                    >
                      Open linked task
                    </Link>
                  )}
                  <p
                    className={`mt-1 text-right text-[10px] ${mine ? "opacity-70" : "text-muted-foreground"}`}
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

      <div className="flex items-end gap-1.5 border-t border-border/50 bg-card p-2">
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
          disabled={disabled || busy}
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
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
          disabled={disabled || busy || (!body.trim() && !file)}
          onClick={send}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
