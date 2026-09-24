import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { fetchAllEmployees } from "@/modules/admin/api/employees.api";
import { fetchProjectTeamAssignments } from "@/modules/admin/api/project-team.api";
import {
  createSiteEngineerTask,
  fetchProjectSiteEngineerTasks,
} from "@/modules/site-engineer/api/site-engineer-tasks.api";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function isSiteEngineerRole(role) {
  return role === "SITE_ENGINEER" || role === "site-engineer";
}

export default function SiteEngineerTaskAssignSection({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [teamSeIds, setTeamSeIds] = useState(new Set());
  const [engineers, setEngineers] = useState([]);
  const [form, setForm] = useState({
    assigneeAccountId: "",
    title: "",
    description: "",
    deadline: "",
    priority: "MEDIUM",
  });

  const load = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    fetchProjectSiteEngineerTasks(projectId)
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!dialogOpen || !projectId) return;
    Promise.all([
      fetchProjectTeamAssignments(projectId).catch(() => []),
      fetchAllEmployees().catch(() => []),
    ]).then(([team, employees]) => {
      const seOnTeam = new Set(
        (Array.isArray(team) ? team : [])
          .filter((a) => a.role === "SITE_ENGINEER")
          .map((a) => String(a.accountId))
      );
      setTeamSeIds(seOnTeam);
      const ses = (Array.isArray(employees) ? employees : []).filter(
        (e) => e.accountId && e.isActive !== false && isSiteEngineerRole(e.role)
      );
      setEngineers(ses);
      const preferred = ses.find((e) => seOnTeam.has(String(e.accountId)));
      setForm((f) => ({
        ...f,
        assigneeAccountId: preferred
          ? String(preferred.accountId)
          : ses[0]
            ? String(ses[0].accountId)
            : "",
      }));
    });
  }, [dialogOpen, projectId]);

  const sortedEngineers = useMemo(() => {
    return [...engineers].sort((a, b) => {
      const aTeam = teamSeIds.has(String(a.accountId)) ? 0 : 1;
      const bTeam = teamSeIds.has(String(b.accountId)) ? 0 : 1;
      if (aTeam !== bTeam) return aTeam - bTeam;
      return String(a.employeeName || "").localeCompare(String(b.employeeName || ""));
    });
  }, [engineers, teamSeIds]);

  const openCreate = () => {
    setError("");
    setForm({
      assigneeAccountId: "",
      title: "",
      description: "",
      deadline: "",
      priority: "MEDIUM",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.assigneeAccountId || !form.title.trim()) {
      setError("Assignee and title are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let deadline = null;
      if (form.deadline) {
        deadline = new Date(form.deadline).toISOString();
      }
      await createSiteEngineerTask({
        projectId: Number(projectId),
        assigneeAccountId: Number(form.assigneeAccountId),
        title: form.title.trim(),
        description: form.description.trim() || null,
        deadline,
        priority: form.priority,
      });
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4 text-primary" />
            Site Engineer Tasks
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={openCreate}>
            Assign task
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              No site engineer tasks for this project yet.
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <div
                  key={t.uuid}
                  className="flex items-start justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {t.deadline ? String(t.deadline).slice(0, 10) : "—"} · {t.priority}
                    </p>
                  </div>
                  <Badge variant="secondary">{t.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign site engineer task</DialogTitle>
            <DialogDescription>
              Prefer the site engineer on this project team, or pick any other site engineer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Site engineer</Label>
              <Select
                value={form.assigneeAccountId}
                onValueChange={(v) => setForm((f) => ({ ...f, assigneeAccountId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select site engineer" />
                </SelectTrigger>
                <SelectContent>
                  {sortedEngineers.map((e) => (
                    <SelectItem key={e.accountId} value={String(e.accountId)}>
                      {e.employeeName}
                      {teamSeIds.has(String(e.accountId)) ? " (project team)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Deadline</Label>
                <Input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
