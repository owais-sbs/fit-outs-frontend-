import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MoreHorizontal, UserRound } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { PageShell, FilterToolbar, SearchInput } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import axiosInstance from "@/lib/axiosInstance";

const PAGE_SIZE = 8;
const FILTERS = {
  ALL: "all",
  SUBSCRIBERS: "subscribers",
  DELETION_QUEUE: "deletion_queue",
  DEVELOPER_SEED: "developer_seed",
};

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  BUSINESS_OWNER: "Business Owner",
  PROJECT_MANAGER: "Project Manager",
  DESIGNER: "Designer",
  QAS: "QAS",
  QS: "QS",
  SENIOR_QS: "Senior QS",
  FINANCE: "Finance",
  SUBCONTRACTOR: "Subcontractor",
  CLIENT: "Client",
  SALES: "Sales",
  EMPLOYEE: "Employee",
  SITE_ENGINEER: "Site Engineer",
  SC_ESTIMATOR: "SC Estimator",
  SC_SUPERVISOR: "SC Supervisor",
  SC_QS: "SC QS",
  SC_DOC_CONTROLLER: "SC Doc Controller",
};

function formatRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return "N/A";
  return roles.map((role) => ROLE_LABELS[role] || role.replaceAll("_", " ")).join(", ");
}

function formatDate(value) {
  if (!value) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "N/A";
  }
}

function normalizeUser(row) {
  return {
    id: row.id,
    name: row.fullName || row.email,
    email: row.email,
    company: row.companyName || "",
    companyUuid: row.companyUuid,
    createdAt: row.createdAt,
    subscriber: Boolean(row.subscriber),
    latestPaymentStatus: row.latestPaymentStatus,
    deletionScheduledAt: row.deletionScheduledAt,
    purgeAt: row.purgeAt,
    daysUntilPurge: row.daysUntilPurge,
    affectedAccountCount: row.affectedAccountCount ?? 1,
    roles: Array.isArray(row.roles) ? row.roles : [],
    deletable: Boolean(row.deletable),
  };
}

export default function UsersPage() {
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [ackDataLoss, setAckDataLoss] = useState(false);
  const [ackGracePeriod, setAckGracePeriod] = useState(false);

  const [reactivateTarget, setReactivateTarget] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get("/platform-users", {
        params: { filter },
      });
      const list = Array.isArray(data?.data) ? data.data : [];
      setUsers(list.map(normalizeUser));
    } catch (err) {
      setUsers([]);
      setError(err?.response?.data?.message || err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setUsers([]);
    setPage(1);
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const companyLabel = user.company || "no company";
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        companyLabel.toLowerCase().includes(query)
      );
    });
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isDeletionQueue = filter === FILTERS.DELETION_QUEUE;
  const isDeveloperSeed = filter === FILTERS.DEVELOPER_SEED;
  const tableColumnCount = isDeletionQueue ? 7 : isDeveloperSeed ? 5 : 6;

  const openDeleteFlow = (user) => {
    setDeleteTarget(user);
    setDeleteStep(0);
    setConfirmEmail("");
    setAckDataLoss(false);
    setAckGracePeriod(false);
  };

  const closeDeleteFlow = () => {
    setDeleteTarget(null);
    setDeleteStep(0);
    setConfirmEmail("");
    setAckDataLoss(false);
    setAckGracePeriod(false);
  };

  const runScheduleDeletion = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setError(null);
    try {
      await axiosInstance.post(`/platform-users/${deleteTarget.id}/schedule-deletion`);
      closeDeleteFlow();
      await loadUsers();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to schedule deletion");
    } finally {
      setBusy(false);
    }
  };

  const runReactivate = async () => {
    if (!reactivateTarget) return;
    setBusy(true);
    setError(null);
    try {
      await axiosInstance.post(`/platform-users/${reactivateTarget.id}/reactivate`);
      setReactivateTarget(null);
      await loadUsers();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to reactivate account");
    } finally {
      setBusy(false);
    }
  };

  const canProceedDeleteStep2 =
    ackDataLoss &&
    ackGracePeriod &&
    confirmEmail.trim().toLowerCase() === (deleteTarget?.email || "").toLowerCase();

  return (
    <PageShell>
      <PageHeader
        title="Users"
        description="Company administrators across the platform, including landing signups and provisioned admins."
      />

      <FilterToolbar>
        <SearchInput
          placeholder="Search users..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="shrink-0">
          <Select
            value={filter}
            onValueChange={setFilter}>
            <SelectTrigger className="h-8 w-[180px] rounded-sm border-border bg-card shadow-sm">
              <SelectValue placeholder="Filter users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTERS.ALL}>All</SelectItem>
              <SelectItem value={FILTERS.SUBSCRIBERS}>Subscribers</SelectItem>
              <SelectItem value={FILTERS.DEVELOPER_SEED}>Developer seed</SelectItem>
              <SelectItem value={FILTERS.DELETION_QUEUE}>Deletion queue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterToolbar>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="max-h-[calc(100vh-22rem)] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Created</TableHead>
                {!isDeletionQueue && !isDeveloperSeed && <TableHead>Subscriber</TableHead>}
                {!isDeletionQueue && isDeveloperSeed && <TableHead>Role</TableHead>}
                {isDeletionQueue && <TableHead>Scheduled</TableHead>}
                {isDeletionQueue && <TableHead>Deletes in</TableHead>}
                {!isDeveloperSeed && (
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Array.from({ length: tableColumnCount }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-full max-w-[120px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : paginated.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={tableColumnCount} className="h-48 text-center">
                        <UserRound className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="font-medium">No users found</p>
                        <p className="text-sm text-muted-foreground">
                          Adjust filters or search terms
                        </p>
                      </TableCell>
                    </TableRow>
                  )
                  : paginated.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="pl-6 font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.company || "No company"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      {!isDeletionQueue && !isDeveloperSeed && (
                        <TableCell>
                          <Badge variant={user.subscriber ? "success" : "secondary"}>
                            {user.subscriber ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                      )}
                      {!isDeletionQueue && isDeveloperSeed && (
                        <TableCell className="text-muted-foreground">
                          {formatRoles(user.roles)}
                        </TableCell>
                      )}
                      {isDeletionQueue && (
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.deletionScheduledAt)}
                        </TableCell>
                      )}
                      {isDeletionQueue && (
                        <TableCell>
                          {user.daysUntilPurge == null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <Badge variant="warning">
                              {user.daysUntilPurge} day{user.daysUntilPurge === 1 ? "" : "s"}
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {!isDeveloperSeed && (
                        <TableCell className="pr-6 text-right">
                          {(isDeletionQueue || user.deletable) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isDeletionQueue ? (
                                  <DropdownMenuItem onClick={() => setReactivateTarget(user)}>
                                    Reactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => openDeleteFlow(user)}>
                                    Delete account
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {filtered.length} user{filtered.length !== 1 ? "s" : ""} · Page {page} of {totalPages}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      isActive={page === index + 1}
                      onClick={() => setPage(index + 1)}
                      className="cursor-pointer">
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && closeDeleteFlow()}>
        <DialogContent className="max-w-lg">
          {deleteStep === 0 && (
            <>
              <DialogHeader>
                <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
                <DialogDescription>
                  This schedules permanent deletion of this admin account
                  {deleteTarget?.company ? ` and the entire "${deleteTarget.company}" tenant` : ""}.
                  {deleteTarget?.affectedAccountCount > 1 && (
                    <>
                      {" "}
                      <strong>
                        {deleteTarget.affectedAccountCount} accounts
                      </strong>{" "}
                      linked to this company will lose access immediately.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                All company data (projects, leads, payments, files, and staff accounts) will be
                permanently wiped after a 7-day grace period. Super admins can reactivate during
                that window from the Deletion queue tab.
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDeleteFlow}>Cancel</Button>
                <Button variant="destructive" onClick={() => setDeleteStep(1)}>
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {deleteStep === 1 && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm you understand the impact</DialogTitle>
                <DialogDescription>
                  Review the warnings below, then type the admin email to continue.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Company: </span>
                  <span className="font-medium">{deleteTarget?.company || "No company"}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Admin email: </span>
                  <span className="font-medium">{deleteTarget?.email}</span>
                </p>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="ack-data-loss"
                    checked={ackDataLoss}
                    onCheckedChange={(checked) => setAckDataLoss(checked === true)}
                  />
                  <Label htmlFor="ack-data-loss" className="leading-snug">
                    I understand all data for this company will be permanently deleted after 7 days.
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="ack-grace"
                    checked={ackGracePeriod}
                    onCheckedChange={(checked) => setAckGracePeriod(checked === true)}
                  />
                  <Label htmlFor="ack-grace" className="leading-snug">
                    I understand this action cannot be undone after the grace period ends.
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-email">Type admin email to confirm</Label>
                  <Input
                    id="confirm-email"
                    className="rounded-sm"
                    value={confirmEmail}
                    onChange={(event) => setConfirmEmail(event.target.value)}
                    placeholder={deleteTarget?.email}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteStep(0)}>Back</Button>
                <Button
                  variant="destructive"
                  disabled={!canProceedDeleteStep2}
                  onClick={() => setDeleteStep(2)}>
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {deleteStep === 2 && (
            <>
              <DialogHeader>
                <DialogTitle>Final confirmation</DialogTitle>
                <DialogDescription>
                  You are about to schedule deletion for <strong>{deleteTarget?.email}</strong>.
                  The account will be deactivated immediately and purged in 7 days.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteStep(1)}>Back</Button>
                <Button variant="destructive" disabled={busy} onClick={runScheduleDeletion}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule deletion
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reactivateTarget)} onOpenChange={(open) => !open && setReactivateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate account</DialogTitle>
            <DialogDescription>
              Restore access for {reactivateTarget?.name} and cancel the scheduled purge
              {reactivateTarget?.company ? ` for "${reactivateTarget.company}"` : ""}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateTarget(null)}>Cancel</Button>
            <Button disabled={busy} onClick={runReactivate}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
