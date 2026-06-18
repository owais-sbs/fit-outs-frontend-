import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Archive, ChevronDown, Circle, Edit, Inbox,
  Paperclip, Reply, Search, Send, Star, Trash2, X,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { INITIAL_EMAIL_THREADS } from "../../data/clients";
import { INITIAL_CLIENTS } from "../../data/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_HEX = ["7C3AED","0284C7","059669","B45309","BE123C","4338CA","0F766E","C2410C"];
function avatarHex(name = "") {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_HEX.length;
  return AVATAR_HEX[idx];
}
function avatarUrl(name = "") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${avatarHex(name)}&color=ffffff&size=64&bold=true&format=svg`;
}
function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}
function fmtTime(date, time) {
  return `${date} ${time}`;
}

const LABEL_COLORS = {
  client:    "bg-blue-500/15 text-blue-700 border-none",
  proposal:  "bg-emerald-500/15 text-emerald-700 border-none",
  "follow-up": "bg-amber-500/15 text-amber-700 border-none",
};

// ─── Compose Modal (Gmail-style floating window) ──────────────────────────────
function ComposeWindow({ initialTo, initialName, onClose, onSent }) {
  const [to, setTo]           = useState(initialTo || "");
  const [subject, setSubject] = useState("");
  const [body, setBody]       = useState("");
  const [minimised, setMin]   = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!to || !subject || !body.trim()) return;
    setSending(true);
    setTimeout(() => {
      onSent({ to, subject, body });
      onClose();
    }, 800);
  };

  if (minimised) {
    return (
      <div
        className="fixed bottom-0 right-6 z-50 w-72 cursor-pointer rounded-t-xl border border-border bg-secondary shadow-2xl"
        onClick={() => setMin(false)}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold truncate">{subject || "New Message"}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setMin(false); }}><ChevronDown className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onClose(); }}><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center justify-between bg-secondary px-4 py-3">
          <span className="text-sm font-semibold">{subject || "New Message"}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setMin(true)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Fields */}
        <div className="border-b border-border/50">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30">
            <span className="text-xs text-muted-foreground w-14">To</span>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipients"
              className="h-7 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 flex-1"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5">
            <span className="text-xs text-muted-foreground w-14">Subject</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="h-7 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 flex-1"
            />
          </div>
        </div>

        {/* Body */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Compose email..."
          className="w-full resize-none bg-transparent px-4 py-3 text-sm outline-none h-56 text-foreground placeholder:text-muted-foreground"
        />

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              className="gap-2 rounded-full px-5"
              disabled={!to || !subject || !body.trim() || sending}
              onClick={handleSend}
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Sending..." : "Send"}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClose}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Thread view (reading a thread) ─────────────────────────────────────────
function ThreadView({ thread, onReply, onClose }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Thread header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border/40">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{thread.subject}</h2>
          <div className="mt-1 flex items-center gap-2">
            <Badge className={LABEL_COLORS[thread.label] || ""}>{thread.label}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Star className={`h-4 w-4 ${thread.starred ? "fill-amber-400 text-amber-400" : ""}`} /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div className="px-6 py-4 space-y-6">
        {[...thread.messages].reverse().map((msg) => (
          <div key={msg.id} className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <img src={avatarUrl(msg.fromName)} alt={msg.fromName} className="h-full w-full rounded-full object-cover" />
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials(msg.fromName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold">{msg.fromName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">&lt;{msg.from}&gt;</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{fmtTime(msg.date, msg.time)}</span>
                </div>
                <p className="text-xs text-muted-foreground">to {msg.to}</p>
              </div>
            </div>
            <div className="ml-12 rounded-lg bg-muted/20 border border-border/40 px-4 py-3">
              <pre className="text-sm whitespace-pre-wrap font-sans text-foreground leading-relaxed">{msg.body}</pre>
            </div>
          </div>
        ))}
      </div>

      {/* Reply strip */}
      <div className="px-6 pb-6">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onReply(thread)}
        >
          <Reply className="h-3.5 w-3.5" />
          Reply
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientEmailPage() {
  const [searchParams] = useSearchParams();
  const initTo   = searchParams.get("to") || "";
  const initName = searchParams.get("name") || "";

  const [threads, setThreads] = useState(INITIAL_EMAIL_THREADS);
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState(null);
  const [compose, setCompose]   = useState(initTo ? { to: initTo, name: initName } : null);

  const filtered = threads.filter((t) => {
    const q = search.trim().toLowerCase();
    return !q || t.subject.toLowerCase().includes(q) || t.clientName.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q);
  });

  const handleSent = ({ to, subject, body }) => {
    const client = INITIAL_CLIENTS.find((c) => c.email === to);
    const newThread = {
      id: `em-${Date.now()}`,
      clientId: client?.id || "unknown",
      clientName: client?.name || to,
      clientEmail: to,
      subject,
      preview: body.slice(0, 80) + "...",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
      read: true,
      starred: false,
      label: "client",
      messages: [{
        id: `m-${Date.now()}`,
        from: "admin@fitouts.com.au",
        fromName: "Admin",
        to,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
        body,
      }],
    };
    setThreads((prev) => [newThread, ...prev]);
  };

  const handleReply = (thread) => {
    setCompose({ to: thread.clientEmail, name: thread.clientName, subject: `RE: ${thread.subject}` });
  };

  const unread = threads.filter((t) => !t.read).length;

  return (
    <div className="space-y-0 -mx-4 md:-mx-6 lg:-mx-8 h-[calc(100vh-7rem)] flex flex-col">
      {/* Page header outside the email chrome */}
      <div className="px-4 md:px-6 lg:px-8 pb-4">
        <PageHeader
          title="Client Email"
          description="Manage all client email communications."
          actions={
            <Button size="sm" className="gap-2" onClick={() => setCompose({ to: "", name: "" })}>
              <Edit className="h-4 w-4" />
              Compose
            </Button>
          }
        />
      </div>

      {/* Gmail-style layout */}
      <div className="flex flex-1 min-h-0 border border-border/50 rounded-xl overflow-hidden mx-4 md:mx-6 lg:mx-8 shadow-sm">
        {/* Left sidebar */}
        <div className="w-56 shrink-0 border-r border-border/40 bg-card flex flex-col">
          <div className="p-3">
            <Button className="w-full gap-2 justify-start rounded-2xl shadow-sm" onClick={() => setCompose({ to: "", name: "" })}>
              <Edit className="h-4 w-4" />
              Compose
            </Button>
          </div>
          <nav className="px-2 space-y-0.5">
            {[
              { icon: Inbox,   label: "Inbox",     count: unread },
              { icon: Star,    label: "Starred" },
              { icon: Send,    label: "Sent" },
              { icon: Archive, label: "All Mail" },
              { icon: Trash2,  label: "Trash" },
            ].map(({ icon: Icon, label, count }) => (
              <button
                key={label}
                className={`w-full flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors ${label === "Inbox" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {count > 0 && <span className="text-xs font-bold">{count}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Thread list */}
        <div className="w-80 shrink-0 border-r border-border/40 flex flex-col bg-background">
          {/* Search */}
          <div className="p-3 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-muted/40 border-transparent"
              />
            </div>
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No messages found.</div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setThreads((prev) => prev.map((th) => th.id === t.id ? { ...th, read: true } : th)); setSelected(t); }}
                  className={`w-full text-left border-b border-border/30 px-4 py-3 transition-colors hover:bg-muted/30 ${selected?.id === t.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                      <img src={avatarUrl(t.clientName)} alt={t.clientName} className="h-full w-full rounded-full object-cover" />
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials(t.clientName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <p className={`text-sm truncate ${!t.read ? "font-bold" : "font-medium"}`}>{t.clientName}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{t.date}</span>
                      </div>
                      <p className={`text-xs truncate ${!t.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{t.subject}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.preview}</p>
                    </div>
                    {!t.read && <Circle className="h-2 w-2 shrink-0 fill-primary text-primary mt-2" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread content */}
        <div className="flex-1 flex flex-col bg-background overflow-hidden">
          {selected ? (
            <ThreadView
              thread={selected}
              onReply={handleReply}
              onClose={() => setSelected(null)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <Inbox className="mx-auto h-12 w-12 opacity-20" />
                <p className="text-sm">Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose floating window */}
      {compose && (
        <ComposeWindow
          initialTo={compose.to}
          initialName={compose.name}
          onClose={() => setCompose(null)}
          onSent={handleSent}
        />
      )}
    </div>
  );
}
