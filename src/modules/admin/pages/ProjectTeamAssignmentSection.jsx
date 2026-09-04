import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchAllClients } from "../api/clients.api";
import { fetchAllEmployees } from "../api/employees.api";
import {
  fetchProjectTeamAssignments,
  PROJECT_TEAM_ROLES,
  syncProjectTeamAssignments,
} from "../api/project-team.api";
import { fetchAllSubcontractors } from "../api/subcontractor.api";

function assignmentKey(role, accountId) {
  return `${role}:${accountId}`;
}

function buildCandidates(employees, clients, subcontractors) {
  const withAccount = (accountId, name, email, extra = "") => ({
    accountId: String(accountId),
    name,
    email,
    subtitle: extra,
  });

  const qs = employees
    .filter((e) => e.accountId && (e.role === "QS" || e.role === "SENIOR_QS"))
    .map((e) =>
      withAccount(e.accountId, e.employeeName, e.email, e.roleLabel || e.role)
    );

  const pms = employees
    .filter((e) => e.accountId && e.role === "PROJECT_MANAGER")
    .map((e) => withAccount(e.accountId, e.employeeName, e.email));

  const finance = employees
    .filter((e) => e.accountId && e.role === "FINANCE")
    .map((e) => withAccount(e.accountId, e.employeeName, e.email));

  const clientList = clients
    .filter((c) => c.active !== false)
    .map((c) => withAccount(c.id, c.fullName, c.email, c.companyName));

  const subs = subcontractors
    .filter((s) => s.active !== false)
    .map((s) => withAccount(s.id, s.fullName, s.email, s.companyName));

  return {
    QS_SENIOR_QS: qs,
    PROJECT_MANAGER: pms,
    FINANCE: finance,
    CLIENT: clientList,
    SUBCONTRACTOR: subs,
  };
}

function RoleCheckboxGroup({ roleKey, label, candidates, selected, onToggle }) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      {candidates.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">No eligible people in this category.</p>
      ) : (
        <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
          {candidates.map((person) => {
            const key = assignmentKey(roleKey, person.accountId);
            const checked = selected.has(key);
            return (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onToggle(roleKey, person.accountId)}
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-tight">{person.name}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {person.email}
                    {person.subtitle ? ` · ${person.subtitle}` : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProjectTeamAssignmentSection({ projectId, onSaved }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [draftSelected, setDraftSelected] = useState(new Set());

  const loadAssignments = useCallback(() => {
    setLoading(true);
    fetchProjectTeamAssignments(projectId)
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    if (!dialogOpen) return;
    Promise.all([
      fetchAllEmployees().catch(() => []),
      fetchAllClients().catch(() => []),
      fetchAllSubcontractors().catch(() => []),
    ]).then(([emp, cli, sub]) => {
      setEmployees(Array.isArray(emp) ? emp.filter((e) => e.isActive !== false) : []);
      setClients(Array.isArray(cli) ? cli : []);
      setSubcontractors(Array.isArray(sub) ? sub : []);
    });
  }, [dialogOpen]);

  const candidatesByRole = useMemo(
    () => buildCandidates(employees, clients, subcontractors),
    [employees, clients, subcontractors]
  );

  const groupedAssignments = useMemo(() => {
    const groups = {};
    PROJECT_TEAM_ROLES.forEach(({ key }) => {
      groups[key] = [];
    });
    assignments.forEach((a) => {
      if (groups[a.role]) {
        groups[a.role].push(a);
      }
    });
    return groups;
  }, [assignments]);

  const openEditor = () => {
    const selected = new Set(assignments.map((a) => assignmentKey(a.role, a.accountId)));
    setDraftSelected(selected);
    setError("");
    setDialogOpen(true);
  };

  const toggleDraft = (role, accountId) => {
    const key = assignmentKey(role, accountId);
    setDraftSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const payload = [];
    draftSelected.forEach((key) => {
      const [role, accountId] = key.split(":");
      payload.push({ role, accountId: Number(accountId) });
    });
    try {
      const updated = await syncProjectTeamAssignments(projectId, payload);
      setAssignments(updated);
      setDialogOpen(false);
      onSaved?.(updated);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to save team assignments.");
    } finally {
      setSaving(false);
    }
  };

  const hasAssignments = assignments.length > 0;

  return (
    <>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            Project Team
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={openEditor}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Assign team
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : !hasAssignments ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              No project team assigned yet. Click &quot;Assign team&quot; to add QS, project manager, finance,
              client contacts, and subcontractors.
            </p>
          ) : (
            <div className="space-y-4">
              {PROJECT_TEAM_ROLES.map(({ key, label }) => {
                const members = groupedAssignments[key] || [];
                if (members.length === 0) return null;
                return (
                  <div key={key}>
                    <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {members.map((member) => {
                        const inits = (member.displayName || "")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();
                        return (
                          <div
                            key={member.uuid || assignmentKey(member.role, member.accountId)}
                            className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {inits || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{member.displayName}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign project team</DialogTitle>
            <DialogDescription>
              Select one or more people for each position. You can assign multiple people to the same role.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {PROJECT_TEAM_ROLES.map(({ key, label }) => (
              <RoleCheckboxGroup
                key={key}
                roleKey={key}
                label={label}
                candidates={candidatesByRole[key] || []}
                selected={draftSelected}
                onToggle={toggleDraft}
              />
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
