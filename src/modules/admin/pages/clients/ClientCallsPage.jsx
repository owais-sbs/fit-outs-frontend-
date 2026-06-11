import { useMemo, useState } from "react";
import {
  Phone, PhoneIncoming, PhoneOutgoing,
  Plus, Search, Clock,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { INITIAL_CALLS, INITIAL_CLIENTS } from "../../data/clients";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_HEX = ["7C3AED","0284C7","059669","B45309","BE123C","4338CA","0F766E","C2410C"];
function avatarUrl(name = "") {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_HEX.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${AVATAR_HEX[idx]}&color=ffffff&size=64&bold=true&format=svg`;
}
function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Log Call dialog ──────────────────────────────────────────────────────────
function LogCallDialog({ open, onClose, onSave }) {
  const [form, setForm] = useState({ clientId: "", date: "", time: "", duration: "", direction: "outbound", outcome: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const client = INITIAL_CLIENTS.find((c) => c.id === form.clientId);
  const valid = form.clientId && form.date && form.time && form.outcome;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            Log a Call
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Client <span className="text-destructive">*</span></Label>
            <Select value={form.clientId} onValueChange={(v) => set("clientId", v)}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {INITIAL_CLIENTS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} — {c.company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {client && (
            <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2 text-xs text-muted-foreground">
              {client.phone} · {client.email}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Input value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 15 min" />
            </div>
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select value={form.direction} onValueChange={(v) => set("direction", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Call Outcome / Notes <span className="text-destructive">*</span></Label>
            <Input
              value={form.outcome}
              onChange={(e) => set("outcome", e.target.value)}
              placeholder="What was discussed or agreed?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} onClick={() => { onSave({ ...form, clientName: client?.name, company: client?.company, assignee: "Admin" }); onClose(); }}>
            Save Call Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClientCallsPage() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState(INITIAL_CALLS);
  const [search, setSearch] = useState("");
  const [dirFilter, setDirFilter] = useState("all");
  const [logOpen, setLogOpen] = useState(false);

  const stats = useMemo(() => ({
    total:    calls.length,
    outbound: calls.filter((c) => c.direction === "outbound").length,
    inbound:  calls.filter((c) => c.direction === "inbound").length,
  }), [calls]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return calls.filter((c) => {
      const mQ = !q || c.clientName.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.outcome.toLowerCase().includes(q);
      const mD = dirFilter === "all" || c.direction === dirFilter;
      return mQ && mD;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [calls, search, dirFilter]);

  const handleSave = (form) => {
    setCalls((prev) => [{
      id: `call-${Date.now()}`,
      ...form,
    }, ...prev]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Calls"
        description="Track all outbound and inbound client calls."
        actions={
          <Button size="sm" className="gap-2" onClick={() => setLogOpen(true)}>
            <Plus className="h-4 w-4" />
            Log a Call
          </Button>
        }
      />

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Calls"     value={stats.total}    icon={Phone}          growth={8} growthLabel="vs last month" />
        <StatCard title="Outbound"        value={stats.outbound} icon={PhoneOutgoing}  growth={5} growthLabel="vs last month" />
        <StatCard title="Inbound"         value={stats.inbound}  icon={PhoneIncoming}  growth={3} growthLabel="vs last month" />
      </section>

      {/* Filters */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search client, company, outcome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={dirFilter} onValueChange={setDirFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Direction" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All calls</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6 w-12" />
              <TableHead>Client</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Assigned To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-36 text-center">
                  <Phone className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No calls logged yet.</p>
                </TableCell>
              </TableRow>
            ) : filtered.map((call) => (
              <TableRow key={call.id} className="hover:bg-muted/20">
                <TableCell className="pl-6">
                  <Avatar className="h-8 w-8">
                    <img src={avatarUrl(call.clientName)} alt={call.clientName} className="h-full w-full rounded-full object-cover" />
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials(call.clientName)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{call.clientName}</TableCell>
                <TableCell className="text-muted-foreground">{call.company}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{call.date} · {call.time}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />{call.duration || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  {call.direction === "inbound" ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-none gap-1">
                      <PhoneIncoming className="h-3 w-3" />Inbound
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/10 text-primary border-none gap-1">
                      <PhoneOutgoing className="h-3 w-3" />Outbound
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{call.outcome}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{call.assignee}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">{filtered.length} call{filtered.length !== 1 ? "s" : ""} logged</p>
        </div>
      </Card>

      <LogCallDialog open={logOpen} onClose={() => setLogOpen(false)} onSave={handleSave} />
    </div>
  );
}
