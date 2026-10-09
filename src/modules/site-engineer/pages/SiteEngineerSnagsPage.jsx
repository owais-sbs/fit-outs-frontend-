import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Plus } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingPanel from "@/components/shared/LoadingPanel";
import { loadingMessages } from "@/components/shared/loadingMessages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttachmentList, AttachmentUploadField } from "@/components/shared/AttachmentField";
import { fetchProjectRooms } from "@/modules/admin/api/room-collab.api";
import { fetchProjectSchedule } from "@/modules/admin/api/schedule.api";
import { fetchMySiteEngineerProjects } from "@/modules/site-engineer/api/projects.api";
import {
  createSnag,
  fetchMySnags,
  updateMySnagStatus,
  SNAG_SEVERITIES,
  SNAG_STATUSES,
} from "@/modules/site-engineer/api/snags.api";

const statusClass = {
  OPEN: "bg-amber-500/15 text-amber-700",
  IN_PROGRESS: "bg-blue-500/15 text-blue-700",
  READY_FOR_INSPECTION: "bg-violet-500/15 text-violet-700",
  RESOLVED: "bg-emerald-500/15 text-emerald-700",
  CLOSED: "bg-muted text-muted-foreground",
};

const emptyForm = {
  projectId: "",
  title: "",
  description: "",
  location: "",
  projectRoomId: "",
  activityUuid: "",
  severity: "MEDIUM",
  dueDate: "",
  clientVisible: false,
  photos: [],
};

export default function SiteEngineerSnagsPage() {
  const [projects, setProjects] = useState([]);
  const [snags, setSnags] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      fetchMySnags().catch((e) => {
        throw e;
      }),
      fetchMySiteEngineerProjects().catch(() => []),
    ])
      .then(([list, projs]) => {
        setSnags(Array.isArray(list) ? list : []);
        setProjects(Array.isArray(projs) ? projs : []);
      })
      .catch((e) =>
        setError(e?.response?.data?.error || e?.response?.data?.message || e.message || "Failed to load snags")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!form.projectId) {
      setRooms([]);
      setActivities([]);
      return;
    }
    Promise.all([
      fetchProjectRooms(form.projectId).catch(() => []),
      fetchProjectSchedule(form.projectId).catch(() => ({ activities: [] })),
    ]).then(([roomList, schedule]) => {
      setRooms(Array.isArray(roomList) ? roomList : []);
      setActivities(Array.isArray(schedule?.activities) ? schedule.activities : []);
    });
  }, [form.projectId]);

  const filteredActivities = useMemo(() => {
    if (!form.projectRoomId) return activities;
    return activities.filter(
      (a) => !a.projectRoomId || String(a.projectRoomId) === String(form.projectRoomId)
    );
  }, [activities, form.projectRoomId]);

  const handleCreate = async () => {
    if (!form.projectId) {
      setError("Select a project first.");
      return;
    }
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await createSnag(form.projectId, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        projectRoomId: form.projectRoomId || null,
        activityUuid: form.activityUuid || null,
        severity: form.severity,
        dueDate: form.dueDate || null,
        clientVisible: !!form.clientVisible,
        photos: form.photos,
      });
      setForm((f) => ({ ...emptyForm, projectId: f.projectId }));
      setMessage("Snag raised.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e.message || "Failed to raise snag");
    } finally {
      setBusy(false);
    }
  };

  const onStatus = async (snag, status) => {
    setBusyId(snag.uuid);
    setError("");
    try {
      await updateMySnagStatus(snag.projectId, snag.uuid, status);
      load();
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageShell className="max-w-4xl">
      <PageTitle
        title="Snags"
        subtitle="Raise defects on your projects and update snags assigned to you"
      />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" /> Raise snag
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Project *</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.projectId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    projectId: e.target.value,
                    projectRoomId: "",
                    activityUuid: "",
                  }))
                }
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.projectName || `Project #${p.id}`}
                  </option>
                ))}
              </select>
              {!projects.length && (
                <p className="text-[11px] text-muted-foreground">
                  No projects assigned yet. Ask your PM to add you as Site Engineer on the project team.
                </p>
              )}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Paint touch-up required"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location notes</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Optional free-text location"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Severity</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              >
                {SNAG_SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Room</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.projectRoomId}
                disabled={!form.projectId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, projectRoomId: e.target.value, activityUuid: "" }))
                }
              >
                <option value="">No room linked</option>
                {rooms.map((r) => (
                  <option key={r.uuid || r.id} value={r.uuid || r.id}>
                    {[r.floorLabel, r.name].filter(Boolean).join(" / ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Activity</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.activityUuid}
                disabled={!form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, activityUuid: e.target.value }))}
              >
                <option value="">No activity linked</option>
                {filteredActivities.map((a) => (
                  <option key={a.uuid} value={a.uuid}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-xs sm:col-span-2">
              <input
                type="checkbox"
                checked={form.clientVisible}
                onChange={(e) => setForm((f) => ({ ...f, clientVisible: e.target.checked }))}
              />
              Visible to client
            </label>
            <div className="sm:col-span-2">
              <AttachmentUploadField
                files={form.photos}
                onFilesChange={(photos) => setForm((f) => ({ ...f, photos }))}
                disabled={busy}
                hint="Attach site photos of the defect."
              />
            </div>
          </div>
          <Button
            size="sm"
            disabled={busy || !form.projectId || !form.title.trim()}
            onClick={handleCreate}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Raise snag
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <LoadingPanel size="inline" messages={loadingMessages.projects} />
      )}

      {!loading && snags.length === 0 && (
        <Surface className="px-4 py-10 text-center text-sm text-muted-foreground">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          No snags on your projects yet. Raise one above.
        </Surface>
      )}

      <div className="grid gap-3">
        {snags.map((s) => (
          <Surface key={s.uuid} className="p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">{s.title || s.description || "Snag"}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Project #{s.projectId}
                  {s.roomName || s.location ? ` · ${s.roomName || s.location}` : ""}
                  {s.severity ? ` · ${s.severity}` : ""}
                </p>
              </div>
              <Badge className={statusClass[s.status] || "bg-muted text-muted-foreground"}>
                {s.status || "OPEN"}
              </Badge>
            </div>
            {s.description && (
              <p className="mb-3 text-sm text-muted-foreground whitespace-pre-wrap">{s.description}</p>
            )}
            <AttachmentList paths={s.photoPaths} className="mb-3" />
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={s.status || "OPEN"}
                onValueChange={(v) => onStatus(s, v)}
                disabled={busyId === s.uuid}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SNAG_STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {busyId === s.uuid && (
                <Button size="sm" variant="ghost" disabled>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </Button>
              )}
            </div>
          </Surface>
        ))}
      </div>
    </PageShell>
  );
}
