import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal, Plus, Search, Users,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { ROUTES } from "@/shared/constants/routes";
import { fetchAllClients } from "../../api/clients.api";
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
import { Skeleton } from "@/components/ui/skeleton";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_VARIANT = {
  Active: "success", Inactive: "secondary",
};

function getClientStatus(client) {
  return client.active ? "Active" : "Inactive";
}

const AVATAR_HEX = ["7C3AED","0284C7","059669","B45309","BE123C","4338CA","0F766E","C2410C"];
function avatarUrl(name = "") {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_HEX.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${AVATAR_HEX[idx]}&color=ffffff&size=80&bold=true&format=svg`;
}
function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    fetchAllClients()
      .then((data) => { if (!cancelled) setClients(data); })
      .catch((err) => { if (!cancelled) console.error("Failed to fetch clients:", err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter((c) => c.active).length,
    inactive: clients.filter((c) => !c.active).length,
  }), [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      const mQ = !q || c.fullName.toLowerCase().includes(q) || c.companyName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const status = getClientStatus(c);
      const mS = statusFilter === "all" || status === statusFilter;
      return mQ && mS;
    });
  }, [clients, search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage client accounts and communications."
        actions={
          <Button size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.CLIENT_NEW)}>
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No clients found</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map((client) => {
                const status = getClientStatus(client);
                return (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer"
                    onClick={() => navigate(ROUTES.ADMIN.CLIENT_DETAIL.replace(":clientId", client.id))}
                  >
                    <TableCell className="pl-6">
                      <Avatar className="h-9 w-9">
                        <img src={avatarUrl(client.fullName)} alt={client.fullName} className="h-full w-full rounded-full object-cover" />
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {initials(client.fullName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{client.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{client.companyName || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{client.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{client.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
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
                          <DropdownMenuItem onClick={() => navigate(ROUTES.ADMIN.CLIENT_EMAIL + `?to=${client.email}&name=${client.fullName}`)}>
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} client{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>
    </div>
  );
}
