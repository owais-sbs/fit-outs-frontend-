import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

const ROLES = [
  { value: "SC_ESTIMATOR", label: "Estimator" },
  { value: "SC_SUPERVISOR", label: "Supervisor / Foreman" },
  { value: "SC_QS", label: "QS / Accounts" },
  { value: "SC_DOC_CONTROLLER", label: "Document Controller" },
];

const ROLE_PERMISSIONS = {
  SC_ESTIMATOR: {
    allow: ["View RFQs", "View tender BOQ", "Draft quote", "Submit quote", "Raise clarifications", "View addenda", "My bids"],
    deny: ["Progress entry", "Claims", "Payment certificates", "Tender evaluation (main contractor)"],
  },
  SC_SUPERVISOR: {
    allow: ["View awarded package", "Enter progress", "Enter manpower", "Material requests", "Snags", "Inspection request", "HSE (where available)"],
    deny: ["Quote submission", "Claim / payment"],
  },
  SC_QS: {
    allow: ["View awarded commercial BOQ", "Submit claim", "View certificates", "Retention", "Back charges", "Payment status"],
    deny: ["Daily progress entry", "Tender evaluation"],
  },
  SC_DOC_CONTROLLER: {
    allow: ["Method statements", "Shop drawings", "Material submittals", "Revisions", "As-builts", "O&M / warranty docs"],
    deny: ["Claims", "Quote pricing"],
  },
};

function PermissionPreview({ role }) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2 text-xs">
      <p className="font-medium">Predefined permissions — {roleLabel(role)}</p>
      <ul className="space-y-0.5">
        {perms.allow.map((p) => <li key={p} className="text-emerald-800">✓ {p}</li>)}
        {perms.deny.map((p) => <li key={p} className="text-muted-foreground">✕ {p}</li>)}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Permissions are fixed by portal role. Team members cannot receive main-contractor tender evaluation rights.
      </p>
    </div>
  );
}

export default function SubcontractorTeamPage() {
  const { isOrgAdmin, portalRole } = useSubcontractorPortal();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [invite, setInvite] = useState({ fullName: "", email: "", phone: "", portalRole: "SC_ESTIMATOR" });
  const [manual, setManual] = useState({ fullName: "", email: "", phone: "", portalRole: "SC_ESTIMATOR", password: "" });

  const load = useCallback(() => {
    setLoading(true);
    fetchScTeamMembers()
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load team"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async () => {
    if (!invite.email.trim()) {
      setMessage("Email is required");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await inviteScTeamMember(invite);
      setInvite({ fullName: "", email: "", phone: "", portalRole: "SC_ESTIMATOR" });
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
      setManual({ fullName: "", email: "", phone: "", portalRole: "SC_ESTIMATOR", password: "" });
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

  const invitePreview = useMemo(() => invite.portalRole, [invite.portalRole]);
  const manualPreview = useMemo(() => manual.portalRole, [manual.portalRole]);

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
              setManual({ ...DEMO.scTeamManual });
              setInvite({ ...DEMO.scTeamInvite });
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
                  <Select value={manual.portalRole} onValueChange={(v) => setManual((f) => ({ ...f, portalRole: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <PermissionPreview role={manualPreview} />
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
                  <Select value={invite.portalRole} onValueChange={(v) => setInvite((f) => ({ ...f, portalRole: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <PermissionPreview role={invitePreview} />
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
