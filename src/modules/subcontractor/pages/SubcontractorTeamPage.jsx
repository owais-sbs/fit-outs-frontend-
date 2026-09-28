import { useCallback, useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchScTeamMembers,
  inviteScTeamMember,
  addScTeamMemberManually,
  updateScTeamMember,
} from "@/modules/admin/api/subcontractor.api";
import { FillDemoDataButton } from "@/components/shared/FillDemoDataButton";
import { DEMO } from "@/shared/demo/formDemoData";
import { useSubcontractorPortal } from "../context/SubcontractorPortalContext";
import { roleLabel } from "../utils/scPortalRoles";
import {
  SC_PERMISSION_CATALOG,
  defaultPermissionsForRole,
  togglePermission,
} from "../utils/scPortalPermissions";

const ROLES = [
  { value: "SC_ESTIMATOR", label: "Estimator" },
  { value: "SC_SUPERVISOR", label: "Supervisor / Foreman" },
  { value: "SC_QS", label: "QS / Accounts" },
  { value: "SC_DOC_CONTROLLER", label: "Document Controller" },
];

function PermissionToggles({ role, selected, onChange }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
      <div>
        <p className="text-sm font-medium">Permissions — {roleLabel(role)}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Role defaults are on. Toggle to add more or remove access. Main-contractor tender evaluation cannot be granted.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {SC_PERMISSION_CATALOG.map((perm) => {
          const active = selected.includes(perm.key);
          const id = `sc-perm-${perm.key}`;
          return (
            <div
              key={perm.key}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                active ? "border-primary/30 bg-primary/5" : "border-border/50 bg-background"
              }`}
            >
              <Label
                htmlFor={id}
                className={`cursor-pointer text-xs font-medium leading-snug ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {perm.label}
              </Label>
              <Switch
                id={id}
                checked={active}
                onCheckedChange={(checked) => onChange(togglePermission(selected, perm.key, checked))}
                className="border border-border/80 data-[state=unchecked]:bg-slate-300 data-[state=checked]:bg-primary data-[state=unchecked]:shadow-sm"
              />
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {selected.length} permission{selected.length === 1 ? "" : "s"} enabled
      </p>
    </div>
  );
}

const emptyInvite = () => ({
  fullName: "",
  email: "",
  phone: "",
  portalRole: "SC_ESTIMATOR",
  permissions: defaultPermissionsForRole("SC_ESTIMATOR"),
});

const emptyManual = () => ({
  fullName: "",
  email: "",
  phone: "",
  portalRole: "SC_ESTIMATOR",
  password: "",
  permissions: defaultPermissionsForRole("SC_ESTIMATOR"),
});

export default function SubcontractorTeamPage() {
  const { isOrgAdmin, portalRole } = useSubcontractorPortal();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [invite, setInvite] = useState(emptyInvite);
  const [manual, setManual] = useState(emptyManual);

  const load = useCallback(() => {
    setLoading(true);
    fetchScTeamMembers()
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load team"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const setInviteRole = (portalRoleValue) => {
    setInvite((f) => ({
      ...f,
      portalRole: portalRoleValue,
      permissions: defaultPermissionsForRole(portalRoleValue),
    }));
  };

  const setManualRole = (portalRoleValue) => {
    setManual((f) => ({
      ...f,
      portalRole: portalRoleValue,
      permissions: defaultPermissionsForRole(portalRoleValue),
    }));
  };

  const handleInvite = async () => {
    if (!invite.email.trim()) {
      setMessage("Email is required");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await inviteScTeamMember(invite);
      setInvite(emptyInvite());
      setMessage("Invite sent to the real email address entered.");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || "Invite failed");
    } finally {
      setBusy(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manual.email.trim() || !manual.password.trim()) {
      setMessage("Email and password are required");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await addScTeamMemberManually(manual);
      setManual(emptyManual());
      setMessage("Team member added — they can log in immediately.");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || "Failed to add member");
    } finally {
      setBusy(false);
    }
  };

  const handleStatus = async (uuid, status) => {
    setBusy(true);
    try {
      await updateScTeamMember(uuid, { status });
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Manage portal users"
          subtitle={`Your role: ${roleLabel(portalRole)}. SC Admin invites specialists. Workers (site roster) remain separate and do not get login accounts.`}
        />
        {isOrgAdmin && (
          <FillDemoDataButton
            onClick={() => {
              const demoRole = DEMO.scTeamManual?.portalRole || "SC_ESTIMATOR";
              setManual({
                ...DEMO.scTeamManual,
                permissions: defaultPermissionsForRole(demoRole),
              });
              const inviteRole = DEMO.scTeamInvite?.portalRole || "SC_ESTIMATOR";
              setInvite({
                ...DEMO.scTeamInvite,
                permissions: defaultPermissionsForRole(inviteRole),
              });
            }}
          />
        )}
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Surface>
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  {isOrgAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.uuid}>
                    <TableCell>{m.fullName || "—"}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>{roleLabel(m.portalRole)}</TableCell>
                    <TableCell><Badge variant="outline">{m.status}</Badge></TableCell>
                    {isOrgAdmin && m.portalRole !== "SC_ADMIN" && (
                      <TableCell className="text-right">
                        {m.status === "ACTIVE" ? (
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => handleStatus(m.uuid, "DISABLED")}>Disable</Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => handleStatus(m.uuid, "ACTIVE")}>Enable</Button>
                        )}
                      </TableCell>
                    )}
                    {isOrgAdmin && m.portalRole === "SC_ADMIN" && <TableCell />}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Surface>

      {isOrgAdmin && (
        <>
        <Surface>
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm font-medium">Add team member</p>
              <p className="text-xs text-muted-foreground">
                Use the person&apos;s real email. For demo/non-production @fitouts.demo accounts only, the configured demo password behaviour may apply when using direct add.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Full name</Label>
                  <Input value={manual.fullName} onChange={(e) => setManual((f) => ({ ...f, fullName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" value={manual.email} onChange={(e) => setManual((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input value={manual.phone} onChange={(e) => setManual((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Password *</Label>
                  <Input type="password" value={manual.password} onChange={(e) => setManual((f) => ({ ...f, password: e.target.value }))} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Portal role</Label>
                  <Select value={manual.portalRole} onValueChange={setManualRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <PermissionToggles
                role={manual.portalRole}
                selected={manual.permissions}
                onChange={(permissions) => setManual((f) => ({ ...f, permissions }))}
              />
              <Button disabled={busy} className="gap-2" onClick={handleManualAdd}>
                <UserPlus className="h-4 w-4" /> Add member
              </Button>
            </CardContent>
          </Card>
        </Surface>

        <Surface>
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm font-medium">Send email invite</p>
              <p className="text-xs text-muted-foreground">Member receives a password-setup link by email.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Full name</Label>
                  <Input value={invite.fullName} onChange={(e) => setInvite((f) => ({ ...f, fullName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" value={invite.email} onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input value={invite.phone} onChange={(e) => setInvite((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Portal role</Label>
                  <Select value={invite.portalRole} onValueChange={setInviteRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <PermissionToggles
                role={invite.portalRole}
                selected={invite.permissions}
                onChange={(permissions) => setInvite((f) => ({ ...f, permissions }))}
              />
              <Button disabled={busy} className="gap-2" onClick={handleInvite}>
                <UserPlus className="h-4 w-4" /> Send invite
              </Button>
            </CardContent>
          </Card>
        </Surface>
        </>
      )}
    </PageShell>
  );
}
