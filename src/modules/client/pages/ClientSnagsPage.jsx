import { AlertTriangle, Check, Loader2, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttachmentList, AttachmentUploadField } from "@/components/shared/AttachmentField";
import {
  approveClientSnag,
  createClientSnag,
  fetchClientSnags,
  SNAG_SEVERITIES,
} from "@/modules/admin/api/snags.api";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchProjectRooms } from "@/modules/admin/api/room-collab.api";
import { fetchProjectSchedule } from "@/modules/admin/api/schedule.api";

const statusClass = {
  OPEN: "bg-amber-500/15 text-amber-700",
  IN_PROGRESS: "bg-blue-500/15 text-blue-700",
  READY_FOR_INSPECTION: "bg-violet-500/15 text-violet-700",
  RESOLVED: "bg-emerald-500/15 text-emerald-700",
  CLOSED: "bg-muted text-muted-foreground",
};

function formatDate(d) {
  if (!d) return null;
  try {
    return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
  } catch {
    return String(d).slice(0, 10);
  }
}

const emptyForm = {
  title: "",
  description: "",
  location: "",
  projectRoomId: "",
  activityUuid: "",
  severity: "MEDIUM",
  dueDate: "",
  photos: [],
};

export default function ClientSnagsPage() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [snags, setSnags] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snagsLoading, setSnagsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setLoading(true);
    fetchAllProjects()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setProjects(arr);
        if (arr[0]?.id) setProjectId(String(arr[0].id));
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const loadSnags = useCallback(() => {
    if (!projectId) {
      setSnags([]);
      setRooms([]);
      setActivities([]);
      return;
    }
    setSnagsLoading(true);
    Promise.all([
      fetchClientSnags(projectId).catch(() => []),
      fetchProjectRooms(projectId).catch(() => []),
      fetchProjectSchedule(projectId).catch(() => ({ activities: [] })),
    ])
      .then(([snagList, roomList, schedule]) => {
        setSnags(Array.isArray(snagList) ? snagList : []);
        setRooms(Array.isArray(roomList) ? roomList : []);
        setActivities(Array.isArray(schedule?.activities) ? schedule.activities : []);
      })
      .finally(() => setSnagsLoading(false));
  }, [projectId]);

  useEffect(() => {
    loadSnags();
  }, [loadSnags]);

  const filteredActivities = useMemo(() => {
    if (!form.projectRoomId) return activities;
    return activities.filter(
      (a) => !a.projectRoomId || String(a.projectRoomId) === String(form.projectRoomId)
    );
  }, [activities, form.projectRoomId]);

  const filtered = snags.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(s.title || "").toLowerCase().includes(q) ||
      String(s.location || "").toLowerCase().includes(q) ||
      String(s.roomName || "").toLowerCase().includes(q) ||
      String(s.activityName || "").toLowerCase().includes(q) ||
      String(s.status || "").toLowerCase().includes(q) ||
      String(s.severity || "").toLowerCase().includes(q)
    );
  });

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await loadSnags();
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () => {
    if (!projectId || !form.title.trim()) return;
    run(async () => {
      await createClientSnag(projectId, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        projectRoomId: form.projectRoomId || null,
        activityUuid: form.activityUuid || null,
        severity: form.severity,
        dueDate: form.dueDate || null,
        photos: form.photos,
      });
      setForm(emptyForm);
    }, "Snag raised");
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title="Snags"
        subtitle="Raise defects and approve items ready for inspection."
      />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full space-y-1 sm:max-w-xs">
          <Label className="text-xs">Project</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.projectName || p.name}</option>
            ))}
          </select>
        </div>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search snags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {projectId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Raise a snag</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Describe the defect"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location notes</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Optional notes"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Room</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={form.projectRoomId}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    projectRoomId: e.target.value,
                    activityUuid: "",
                  }))}
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
                  onChange={(e) => setForm((f) => ({ ...f, activityUuid: e.target.value }))}
                >
                  <option value="">No activity linked</option>
                  {filteredActivities.map((a) => (
                    <option key={a.uuid} value={a.uuid}>{a.name}</option>
                  ))}
                </select>
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
                <Label className="text-xs">Due date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <AttachmentUploadField
              label="Photos"
              hint="Attach photos of the issue."
              files={form.photos}
              onFilesChange={(photos) => setForm((f) => ({ ...f, photos }))}
              disabled={busy}
              accept="image/*"
            />
            <Button size="sm" onClick={handleCreate} disabled={busy || !form.title.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Raise snag
            </Button>
          </CardContent>
        </Card>
      )}

      <Surface className="overflow-hidden">
        {snagsLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <AlertTriangle className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">No snags found</p>
            <p className="mt-1 text-xs">
              {projectId ? "Nothing visible for this project yet." : "Select a project to view snags."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((s) => (
              <div key={s.uuid || s.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <Badge className={`border-none ${statusClass[s.status] || ""}`}>
                      {String(s.status || "OPEN").replace(/_/g, " ")}
                    </Badge>
                    {s.severity && <Badge variant="secondary">{s.severity}</Badge>}
                    {s.raisedByClient && (
                      <Badge variant="outline" className="text-[10px]">Raised by you</Badge>
                    )}
                    {s.clientApprovedAt && (
                      <Badge className="border-none bg-emerald-500/15 text-emerald-700 text-[10px]">
                        Approved {formatDate(s.clientApprovedAt)}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.roomName || s.location || "—"}
                    {s.activityName ? ` · ${s.activityName}` : ""}
                    {s.dueDate ? ` · Due ${formatDate(s.dueDate)}` : ""}
                    {s.assigneeName ? ` · Assigned to ${s.assigneeName}` : ""}
                  </p>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                  )}
                  <AttachmentList paths={s.photoPaths} className="mt-2" inlinePreview={false} />
                </div>
                {(s.status === "READY_FOR_INSPECTION" || s.status === "RESOLVED") && !s.clientApprovedAt && (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      run(() => approveClientSnag(projectId, s.uuid), "Snag approved and closed")
                    }
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve & close
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
