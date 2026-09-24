import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Phone, User } from "lucide-react";
import { Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ChannelChatPanel from "@/modules/admin/pages/communications/ChannelChatPanel";
import {
  ensureProjectClientChannel,
  fetchChannelMessages,
  markChannelRead,
} from "@/modules/admin/api/communications.api";
import { useCommunicationsSocket } from "@/shared/hooks/useCommunicationsSocket";
import { useAuth } from "@/shared/context/auth-context";
import { fetchProjectClientContacts } from "@/modules/site-engineer/api/projects.api";
import {
  createCommunicationLog,
  fetchProjectCommunicationLogs,
} from "@/modules/site-engineer/api/communication-logs.api";

const CHANNELS = ["CALL", "MEETING", "CHAT", "EMAIL", "OTHER"];

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProjectClientCommsPanel({ projectId }) {
  const { user } = useAuth();
  const accountId = user?.id != null ? Number(user.id) : null;
  const [contacts, setContacts] = useState([]);
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    channel: "MEETING",
    summary: "",
    clientRequests: "",
    agreedChanges: "",
    occurredAt: "",
  });

  const loadMessages = useCallback(async (channelUuid) => {
    if (!channelUuid) return;
    try {
      const msgs = await fetchChannelMessages(channelUuid);
      setMessages(msgs);
      await markChannelRead(channelUuid).catch(() => {});
    } catch {
      setMessages([]);
    }
  }, []);

  const loadLogs = useCallback(() => {
    if (!projectId) return;
    fetchProjectCommunicationLogs(projectId)
      .then((list) => setLogs(Array.isArray(list) ? list : []))
      .catch(() => setLogs([]));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([
      fetchProjectClientContacts(projectId).catch(() => []),
      ensureProjectClientChannel(projectId),
      fetchProjectCommunicationLogs(projectId).catch(() => []),
    ])
      .then(async ([contactList, ch, logList]) => {
        if (cancelled) return;
        setContacts(Array.isArray(contactList) ? contactList : []);
        setChannel(ch || null);
        setLogs(Array.isArray(logList) ? logList : []);
        if (ch?.channelUuid) {
          await loadMessages(ch.channelUuid);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.response?.data?.message || e.message || "Failed to open client chat");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, loadMessages]);

  useCommunicationsSocket({
    accountId,
    channelUuid: channel?.channelUuid || null,
    onMessage: (msg) => {
      if (!msg) return;
      setMessages((prev) => {
        if (prev.some((m) => m.uuid === msg.uuid)) return prev;
        return [...prev, msg];
      });
    },
  });

  const submitLog = async () => {
    if (!projectId || !form.summary.trim()) {
      setMessage("Enter a summary of what was discussed.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await createCommunicationLog({
        projectId: Number(projectId),
        channel: form.channel,
        summary: form.summary.trim(),
        clientRequests: form.clientRequests.trim() || null,
        agreedChanges: form.agreedChanges.trim() || null,
        occurredAt: form.occurredAt ? new Date(form.occurredAt).toISOString() : null,
        relatedChannelId: channel?.channelUuid || null,
      });
      setForm({
        channel: "MEETING",
        summary: "",
        clientRequests: "",
        agreedChanges: "",
        occurredAt: "",
      });
      setMessage("Communication log saved. The client can see this on their portal.");
      loadLogs();
    } catch (e) {
      setMessage(e?.response?.data?.message || e.message || "Failed to save log");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Opening client communication…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive py-4">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <Surface className="p-5">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Client contacts</h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No client contacts for this project.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((c) => (
              <div key={c.accountId || c.email} className="rounded-xl bg-secondary/40 p-4 space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {c.displayName || c.fullName || "Client"}
                </p>
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {c.phone}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Surface>

      <Surface className="p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            {channel?.name || "Client chat"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Two-way chat with this project&apos;s client
          </p>
        </div>
        {channel?.channelUuid ? (
          <ChannelChatPanel
            channelUuid={channel.channelUuid}
            channelType={channel.channelType || "CLIENT"}
            messages={messages}
            projectId={Number(projectId)}
            onIncoming={(msg) => {
              if (!msg) return;
              setMessages((prev) => {
                if (prev.some((m) => m.uuid === msg.uuid)) return prev;
                return [...prev, msg];
              });
            }}
            onSent={() => loadMessages(channel.channelUuid)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Unable to open chat channel.</p>
        )}
      </Surface>

      <Surface className="p-5 space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Log communication outcome</h2>
        <p className="text-xs text-muted-foreground">
          Record what was discussed and any changes the client requested. Visible on the client portal.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Channel</Label>
            <Select
              value={form.channel}
              onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((ch) => (
                  <SelectItem key={ch} value={ch}>
                    {ch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">When</Label>
            <Input
              type="datetime-local"
              value={form.occurredAt}
              onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Summary</Label>
          <Textarea
            rows={3}
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            placeholder="What was discussed…"
          />
        </div>
        <div>
          <Label className="text-xs">Client requests / wanted changes</Label>
          <Textarea
            rows={2}
            value={form.clientRequests}
            onChange={(e) => setForm((f) => ({ ...f, clientRequests: e.target.value }))}
          />
        </div>
        <div>
          <Label className="text-xs">Agreed changes</Label>
          <Textarea
            rows={2}
            value={form.agreedChanges}
            onChange={(e) => setForm((f) => ({ ...f, agreedChanges: e.target.value }))}
          />
        </div>
        <Button size="sm" disabled={busy} onClick={submitLog}>
          Save log
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        <div className="mt-4 space-y-2 border-t border-border/40 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recent logs
          </h3>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No logs yet for this project.</p>
          ) : (
            logs.slice(0, 10).map((log) => (
              <div key={log.uuid} className="rounded-xl bg-secondary/40 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{log.channel}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDateTime(log.occurredAt || log.createdAt)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{log.summary}</p>
                {log.clientRequests && (
                  <p className="mt-1 text-xs">
                    <span className="font-medium">Requests:</span> {log.clientRequests}
                  </p>
                )}
                {log.agreedChanges && (
                  <p className="mt-1 text-xs">
                    <span className="font-medium">Agreed:</span> {log.agreedChanges}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </Surface>
    </div>
  );
}
