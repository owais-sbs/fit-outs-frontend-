import { Send, Paperclip } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const THREADS = [
  {
    id: "t1",
    project: "Luxury Penthouse Fit-Out",
    lastMessage: "The revised material palette looks great. Can we schedule a site visit next week?",
    from: "Sarah Mitchell",
    time: "Today, 10:32 AM",
    unread: 2,
    avatar: "SM",
  },
  {
    id: "t2",
    project: "Corporate HQ Office Fit-Out",
    lastMessage: "We've updated the executive floor layout based on your feedback. Please review the attached drawings.",
    from: "James Al-Farsi",
    time: "Yesterday, 3:15 PM",
    unread: 0,
    avatar: "JA",
  },
  {
    id: "t3",
    project: "High-End Villa Interior",
    lastMessage: "FF&E schedule has been sent to your email. Please confirm the marble selection by Friday.",
    from: "Priya Sharma",
    time: "2 Jun",
    unread: 1,
    avatar: "PS",
  },
];

const MESSAGES = [
  { id: "m1", from: "Sarah Mitchell", avatar: "SM", text: "Good morning! We've completed the schematic design for the penthouse master suite.", time: "9:00 AM", mine: false },
  { id: "m2", from: "You", avatar: "ME", text: "Thank you Sarah. The layout looks great. Can we discuss the terrace furniture arrangement?", time: "9:14 AM", mine: true },
  { id: "m3", from: "Sarah Mitchell", avatar: "SM", text: "Absolutely. I'll prepare two options — one maximising the skyline view and another with a more sheltered seating zone. I'll share renders by EOD.", time: "9:18 AM", mine: false },
  { id: "m4", from: "You", avatar: "ME", text: "Perfect. Also, please change the master bedroom palette — we'd like something more dramatic, perhaps charcoal and gold tones.", time: "9:25 AM", mine: true },
  { id: "m5", from: "Sarah Mitchell", avatar: "SM", text: "Noted! The revised material palette will include Nero Marquina marble, charcoal plaster walls, and brushed gold fixtures. The updated concept will be uploaded for your approval shortly.", time: "10:32 AM", mine: false },
];

export default function ClientCommsPage() {
  const [activeThread, setActiveThread] = useState("t1");
  const [newMsg, setNewMsg] = useState("");
  const [messages, setMessages] = useState(MESSAGES);

  const handleSend = () => {
    if (!newMsg.trim()) return;
    setMessages((prev) => [...prev, {
      id: `m${Date.now()}`,
      from: "You",
      avatar: "ME",
      text: newMsg.trim(),
      time: new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" }).format(new Date()),
      mine: true,
    }]);
    setNewMsg("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications"
        description="Direct messages with your design team about your fit-out projects."
      />

      <div className="grid gap-4 lg:grid-cols-3" style={{ height: "calc(100vh - 240px)", minHeight: "500px" }}>
        {/* Thread list */}
        <Card className="border-border/60 shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border/40 px-4 py-3">
            <p className="font-semibold text-sm">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/30">
            {THREADS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThread(t.id)}
                className={`flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors ${activeThread === t.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold truncate">{t.project}</p>
                    <p className="text-[10px] text-muted-foreground shrink-0">{t.time.split(",")[0]}</p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.lastMessage}</p>
                </div>
                {t.unread > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0 mt-0.5">
                    {t.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Chat window */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm overflow-hidden flex flex-col">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-border/40 px-5 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">SM</div>
            <div>
              <p className="text-sm font-semibold">{THREADS.find((t) => t.id === activeThread)?.project}</p>
              <p className="text-xs text-muted-foreground">Sarah Mitchell · Interior Designer</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.mine ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold shrink-0 ${msg.mine ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                  {msg.avatar}
                </div>
                <div className={`max-w-[72%] space-y-1 ${msg.mine ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.mine
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/60 text-foreground rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-border/40 p-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="flex-1"
              />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={!newMsg.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
