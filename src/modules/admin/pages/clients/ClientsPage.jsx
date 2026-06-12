import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal, Plus, Search, UserCheck, UserPlus, Users,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { INITIAL_CLIENTS, CLIENT_STATUSES } from "../../data/clients";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_VARIANT = {
  Active: "success", Inactive: "secondary", Prospect: "warning", VIP: "default",
};

const AVATAR_HEX = ["7C3AED","0284C7","059669","B45309","BE123C","4338CA","0F766E","C2410C"];
function avatarUrl(name = "") {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_HEX.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${AVATAR_HEX[idx]}&color=ffffff&size=80&bold=true&format=svg`;
}
function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Convert Lead dialog ──────────────────────────────────────────────────────
const LEADS_FOR_CONVERT = [
  { id: "l4", name: "Helen Frost",  company: "Frost & Co Legal",     email: "helen@frostandco.com.au",  phone: "+61 456 789 012" },
  { id: "l5", name: "Oliver Grant", company: "Grant Hospitality",     email: "oliver@granthospitality.com", phone: "+61 467 890 123" },
  { id: "l6", name: "Yuki Tanaka",  company: "Tanaka Foods",          email: "yuki.tanaka@tanakafoods.com.au", phone: "+61 478 901 234" },
];

function ConvertLeadDialog({ open, onClose, onSave }) {
  const [selected, setSelected] = useState("");
  const lead = LEADS_FOR_CONVERT.find((l) => l.id === selected);

  const handleSave = () => {
    if (!selected) return;
    onSave({ lead });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert Lead to Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Select Lead <span className="text-destructive">*</span></Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger><SelectValue placeholder="Choose a qualified lead" /></SelectTrigger>
              <SelectContent>
                {LEADS_FOR_CONVERT.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name} — {l.company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {lead && (
            <div className="rounded-lg bg-muted/30 border border-border/50 p-4 space-y-1.5">
              <p className="font-medium">{lead.name}</p>
              <p className="text-sm text-muted-foreground">{lead.company}</p>
              <p className="text-xs text-muted-foreground">{lead.email}</p>
              <p className="text-xs text-muted-foreground">{lead.phone}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!selected} onClick={handleSave}>
            Convert to Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [convertOpen, setConvertOpen] = useState(false);

  const stats = useMemo(() => ({
    total:   clients.length,
    active:  clients.filter((c) => c.status === "Active" || c.status === "VIP").length,
    vip:     clients.filter((c) => c.status === "VIP").length,
    revenue: clients.reduce((s, c) => s + (c.totalSpend || 0), 0),
  }), [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      const mQ = !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const mS = statusFilter === "all" || c.status === statusFilter;
      return mQ && mS;
    });
  }, [clients, search, statusFilter]);

  const handleConvert = ({ lead }) => {
    const newClient = {
      id: `cl-${Date.now()}`,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      location: "—",
      status: "Active",
      joinedDate: new Date().toISOString().split("T")[0],
      projectCount: 0,
      totalSpend: 0,
      assignee: "Admin",
      notes: "Converted from lead.",
      lastContact: new Date().toISOString().split("T")[0],
    };
    setClients((prev) => [newClient, ...prev]);
  };

  const handleStatusChange = (clientId, status) => {
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, status } : c));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage client accounts, statuses and communications."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setConvertOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Convert Lead to Client
            </Button>
            <Button size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.CLIENT_NEW)}>
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, company, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {CLIENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 w-12" />
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-40 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No clients found</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer"
                  onClick={() => navigate(ROUTES.ADMIN.CLIENT_DETAIL.replace(":clientId", client.id))}
                >
                  <TableCell className="pl-6">
                    <Avatar className="h-9 w-9">
                      <img src={avatarUrl(client.name)} alt={client.name} className="h-full w-full rounded-full object-cover" />
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {initials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{client.company}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{client.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{client.phone}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[client.status]}>{client.status}</Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => navigate(ROUTES.ADMIN.CLIENT_DETAIL.replace(":clientId", client.id))}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(ROUTES.ADMIN.CLIENT_EMAIL + `?to=${client.email}&name=${client.name}`)}>
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {CLIENT_STATUSES.filter((s) => s !== client.status).map((s) => (
                          <DropdownMenuItem key={s} onClick={() => handleStatusChange(client.id, s)}>
                            Mark as {s}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} client{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      <ConvertLeadDialog open={convertOpen} onClose={() => setConvertOpen(false)} onSave={handleConvert} />
    </div>
  );
}
