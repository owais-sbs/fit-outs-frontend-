import { useCallback, useEffect, useState } from "react";
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
import { useSubcontractorPortal } from "../context/SubcontractorPortalContext";

const ROLES = ["SC_ESTIMATOR", "SC_SUPERVISOR", "SC_QS", "SC_DOC_CONTROLLER"];

export default function SubcontractorTeamPage() {
  const { isOrgAdmin, portalRole } = useSubcontractorPortal();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [invite, setInvite] = useState({ fullName: "", email: "", phone: "", portalRole: "SC_SUPERVISOR" });
  const [manual, setManual] = useState({ fullName: "", email: "", phone: "", portalRole: "SC_SUPERVISOR", password: "" });

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
      setInvite({ fullName: "", email: "", phone: "", portalRole: "SC_SUPERVISOR" });
      setMessage("Invite sent");
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
      setManual({ fullName: "", email: "", phone: "", portalRole: "SC_SUPERVISOR", password: "" });
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
      <PageTitle
        title="Portal team"
        subtitle={`Your role: ${portalRole?.replace(/_/g, " ") || "—"}. SC Admin invites estimators, supervisors, QS and document controllers.`}
      />
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
                    <TableCell>{m.portalRole?.replace(/_/g, " ")}</TableCell>
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
              <p className="text-sm font-medium">Add member manually</p>
              <p className="text-xs text-muted-foreground">Set password directly — no invite email. Use for internal onboarding or demo accounts.</p>
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
                <div className="space-y-1">
                  <Label className="text-xs">Portal role</Label>
                  <Select value={manual.portalRole} onValueChange={(v) => setManual((f) => ({ ...f, portalRole: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                      {ROLES.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
