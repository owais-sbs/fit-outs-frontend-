import { useEffect, useMemo, useState } from "react";
import { Mail, MoreHorizontal, Search, UserPlus } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { PLATFORM_USERS, BASE_ROLES } from "../data/users";
import { PERMISSION_MODULES, PERMISSION_ACTIONS } from "../data/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PLATFORM_USERS.filter((u) => {
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchQ && matchRole;
    });
  }, [search, roleFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Invite users, assign roles, and configure per-user module access."
        actions={
          <Button size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite user
          </Button>
        }
      />

      {saved && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
          Permissions saved successfully.
        </div>
      )}

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {BASE_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow>
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}</TableRow>
                  ))
                : filtered.map((u) => (
                    <TableRow key={u.id} className="cursor-pointer" onClick={() => setEditUser(u)}>
                      <TableCell className="pl-6 font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">{u.modules.join(", ")}</TableCell>
                      <TableCell><Badge variant={u.status === "active" ? "success" : "secondary"}>{u.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.lastActive}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditUser(u); }}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Deactivate</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Email</Label><Input type="email" placeholder="name@company.com" className="mt-1" /></div>
            <div>
              <Label>Role</Label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{BASE_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button className="gap-2" onClick={() => setInviteOpen(false)}><Mail className="h-4 w-4" />Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>Edit {editUser?.name}</SheetTitle></SheetHeader>
          {editUser && (
            <Tabs defaultValue="access" className="mt-6">
              <TabsList><TabsTrigger value="access">Module access</TabsTrigger><TabsTrigger value="profile">Profile</TabsTrigger></TabsList>
              <TabsContent value="access" className="space-y-4">
                {PERMISSION_MODULES.map((mod) => (
                  <div key={mod.id} className="rounded-lg border border-border/60 p-3">
                    <p className="mb-2 text-sm font-medium">{mod.label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PERMISSION_ACTIONS.slice(0, 4).map((action) => (
                        <label key={action} className="flex items-center gap-2 text-xs">
                          <Checkbox defaultChecked={action === "view" || action === "edit"} />
                          <span className="capitalize">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <Button className="w-full" onClick={() => { setSaved(true); setEditUser(null); setTimeout(() => setSaved(false), 3000); }}>
                  Save permissions
                </Button>
              </TabsContent>
              <TabsContent value="profile" className="space-y-3 text-sm">
                <p><span className="text-muted-foreground">Tenant:</span> {editUser.tenant}</p>
                <p><span className="text-muted-foreground">Email:</span> {editUser.email}</p>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
