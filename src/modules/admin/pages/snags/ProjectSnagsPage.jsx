import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AttachmentList, AttachmentUploadField } from "@/components/shared/AttachmentField";
import {
  fetchProjectSnags,
  createSnag,
  updateSnag,
  updateSnagStatus,
  uploadSnagPhoto,
  SNAG_STATUSES,
  SNAG_SEVERITIES,
} from "../../api/snags.api";
import { fetchAllEmployees } from "../../api/employees.api";
import { fetchProjectRooms } from "../../api/room-collab.api";
import { fetchProjectSchedule } from "../../api/schedule.api";
import { ROUTES } from "@/shared/constants/routes";

const statusClass = {
  OPEN: "bg-amber-500/15 text-amber-700",
  IN_PROGRESS: "bg-blue-500/15 text-blue-700",
  READY_FOR_INSPECTION: "bg-violet-500/15 text-violet-700",
  RESOLVED: "bg-emerald-500/15 text-emerald-700",
  CLOSED: "bg-muted text-muted-foreground",
};

const severityClass = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-amber-500/15 text-amber-700",
  HIGH: "bg-orange-500/15 text-orange-700",
  CRITICAL: "bg-red-500/15 text-red-700",
};

const emptyForm = {
  title: "",
  description: "",
  location: "",
  projectRoomId: "",
  activityUuid: "",
  severity: "MEDIUM",
  dueDate: "",
  assigneeAccountId: "",
  clientVisible: true,
  photos: [],
};

export default function ProjectSnagsPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const detailPath = (isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL)
    .replace(":projectId", projectId);

  const [snags, setSnags] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchProjectSnags(projectId).catch(() => []),
      fetchAllEmployees().catch(() => []),
      fetchProjectRooms(projectId).catch(() => []),
      fetchProjectSchedule(projectId).catch(() => ({ activities: [] })),
    ])
      .then(([snagList, empList, roomList, schedule]) => {
        setSnags(Array.isArray(snagList) ? snagList : []);
        setEmployees((Array.isArray(empList) ? empList : []).filter((e) => e.isActive !== false));
        setRooms(Array.isArray(roomList) ? roomList : []);
        setActivities(Array.isArray(schedule?.activities) ? schedule.activities : []);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredActivities = useMemo(() => {
    if (!form.projectRoomId) return activities;
    return activities.filter(
      (a) => !a.projectRoomId || String(a.projectRoomId) === String(form.projectRoomId)
    );
  }, [activities, form.projectRoomId]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await load();
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () =>
    run(async () => {
      await createSnag(projectId, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        projectRoomId: form.projectRoomId || null,
        activityUuid: form.activityUuid || null,
        severity: form.severity,
        dueDate: form.dueDate || null,
        assigneeAccountId: form.assigneeAccountId ? Number(form.assigneeAccountId) : null,
        clientVisible: !!form.clientVisible,
        photos: form.photos,
      });
      setForm(emptyForm);
    }, "Snag raised");

  if (loading) {
    return (
      <PageShell className="max-w-4xl mx-auto flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Link to={detailPath}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageTitle title="Snags" subtitle={`Project #${projectId}`} />
      </div>

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Raise snag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
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
            <div className="space-y-1">
              <Label className="text-xs">Assignee</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.assigneeAccountId}
                onChange={(e) => setForm((f) => ({ ...f, assigneeAccountId: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeName || emp.fullName || emp.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.clientVisible}
                  onChange={(e) => setForm((f) => ({ ...f, clientVisible: e.target.checked }))}
                />
                Visible in client portal
              </label>
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
            hint="Attach site photos of the defect."
            files={form.photos}
            onFilesChange={(photos) => setForm((f) => ({ ...f, photos }))}
            disabled={busy}
            accept="image/*"
          />
          <Button size="sm" onClick={handleCreate} disabled={busy || !form.title.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">All snags ({snags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {snags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No snags yet</p>
          ) : (
            <div className="divide-y divide-border/40">
              {snags.map((s) => (
                <div key={s.uuid} className="flex flex-col gap-3 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{s.title}</p>
                        <Badge className={`border-none ${statusClass[s.status] || ""}`}>
                          {String(s.status || "OPEN").replace(/_/g, " ")}
                        </Badge>
                        {s.severity && (
                          <Badge className={`border-none ${severityClass[s.severity] || ""}`}>
                            {s.severity}
                          </Badge>
                        )}
                        {s.clientVisible && (
                          <Badge variant="secondary" className="text-[10px]">Client visible</Badge>
                        )}
                        {s.raisedByClient && (
                          <Badge variant="outline" className="text-[10px]">Client raised</Badge>
                        )}
                        {s.clientApprovedAt && (
                          <Badge className="border-none bg-emerald-500/15 text-emerald-700 text-[10px]">
                            Client approved
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.roomName || s.location || "—"}
                        {s.activityName ? ` · ${s.activityName}` : ""}
                        {s.dueDate ? ` · due ${String(s.dueDate).slice(0, 10)}` : ""}
                        {s.assigneeName ? ` · assigned to ${s.assigneeName}` : ""}
                        {s.raisedByName ? ` · raised by ${s.raisedByName}` : ""}
                      </p>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                      )}
                      <AttachmentList paths={s.photoPaths} className="mt-2" inlinePreview={false} />
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <select
                        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                        value={s.status || "OPEN"}
                        disabled={busy}
                        onChange={(e) =>
                          run(() => updateSnagStatus(projectId, s.uuid, e.target.value), "Status updated")
                        }
                      >
                        {SNAG_STATUSES.map((st) => (
                          <option key={st} value={st}>{st.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                      <select
                        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                        value={s.assigneeAccountId || ""}
                        disabled={busy}
                        onChange={(e) =>
                          run(
                            () => updateSnag(projectId, s.uuid, {
                              assigneeAccountId: e.target.value ? Number(e.target.value) : 0,
                            }),
                            "Assignee updated"
                          )
                        }
                      >
                        <option value="">Unassigned</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.employeeName || emp.fullName || emp.email}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={!!s.clientVisible}
                          disabled={busy}
                          onChange={(e) =>
                            run(
                              () => updateSnag(projectId, s.uuid, { clientVisible: e.target.checked }),
                              "Visibility updated"
                            )
                          }
                        />
                        Client portal
                      </label>
                    </div>
                  </div>
                  {(s.status === "OPEN" || s.status === "IN_PROGRESS" || s.status === "READY_FOR_INSPECTION") && (
                    <AttachmentUploadField
                      label="Add photos"
                      hint="Uploads immediately to this snag."
                      files={[]}
                      disabled={busy}
                      accept="image/*"
                      onFilesChange={(picked) =>
                        run(async () => {
                          for (const file of picked) {
                            await uploadSnagPhoto(projectId, s.uuid, file);
                          }
                        }, "Photo(s) uploaded")
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
