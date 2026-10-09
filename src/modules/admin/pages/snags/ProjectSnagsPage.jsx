import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import ProjectPageFrame from "@/components/layout/ProjectPageFrame";
import ProjectPathLine from "@/components/shared/ProjectPathLine";
import { useProjectName } from "../../hooks/useProjectName";
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
import { fetchScPackages } from "../../api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { FillDemoDataButton } from "@/components/shared/FillDemoDataButton";
import { buildDemoSnagForm } from "@/shared/demo/formDemoData";
import ProjectLifecycleBanner from "../../components/projects/ProjectLifecycleBanner";
import { useProjectLifecycle } from "../../hooks/useProjectLifecycle";
import { notify } from "@/lib/notify";
import LoadingPanel from "@/components/shared/LoadingPanel";
import { loadingMessages } from "@/components/shared/loadingMessages";

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
  scVisible: false,
  scRecipientAccountIds: [],
  photos: [],
};

/** Unique appointed SC accounts from project packages. */
function appointedScOptions(packages = []) {
  const map = new Map();
  for (const pkg of packages) {
    const id = pkg.appointedAccountId;
    if (id == null || id === "") continue;
    const key = String(id);
    const company = pkg.appointedCompanyName || pkg.name || `Account #${id}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        accountId: Number(id),
        label: company,
        packageNames: pkg.name ? [pkg.name] : [],
      });
    } else if (pkg.name && !existing.packageNames.includes(pkg.name)) {
      existing.packageNames.push(pkg.name);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function toggleId(list, id, on) {
  const n = Number(id);
  const set = new Set((list || []).map(Number));
  if (on) set.add(n);
  else set.delete(n);
  return Array.from(set);
}

export default function ProjectSnagsPage() {
  const { projectId } = useParams();
  const { name: projectName } = useProjectName(projectId);
  const location = useLocation();
  const { commercialStage, archived } = useProjectLifecycle(projectId);
  const isPm = location.pathname.startsWith("/project-manager");
  const detailPath = (isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL)
    .replace(":projectId", projectId);

  const [snags, setSnags] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projectScs, setProjectScs] = useState([]);
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
      fetchScPackages(projectId).catch(() => []),
    ])
      .then(([snagList, empList, roomList, schedule, packages]) => {
        setSnags(Array.isArray(snagList) ? snagList : []);
        setEmployees((Array.isArray(empList) ? empList : []).filter((e) => e.isActive !== false));
        setRooms(Array.isArray(roomList) ? roomList : []);
        setActivities(Array.isArray(schedule?.activities) ? schedule.activities : []);
        setProjectScs(appointedScOptions(Array.isArray(packages) ? packages : []));
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
    if (archived) {
      setMessage("This project is archived and read-only.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await load();
      if (okMsg) notify.success(okMsg);
    } catch (e) {
      const errMsg = e?.response?.data?.error || e?.response?.data?.message || e?.message || "Request failed";
      setMessage(errMsg);
      notify.error(errMsg);
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
        scVisible: !!form.scVisible,
        scRecipientAccountIds: form.scVisible
          ? (form.scRecipientAccountIds || []).map(Number)
          : [],
        photos: form.photos,
      });
      setForm(emptyForm);
    }, "Snag raised");

  if (loading) {
    return (
      <PageShell className="max-w-4xl">
        <LoadingPanel size="page" messages={loadingMessages.projects} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ProjectPageFrame>
      <ProjectPathLine projectId={projectId} initialName={projectName} />
      <PageHeader title="Snags" subtitle={projectName} />

      <ProjectLifecycleBanner commercialStage={commercialStage} />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      {!archived && (
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-sm font-semibold">Raise snag</CardTitle>
          <FillDemoDataButton
            disabled={busy}
            onClick={() =>
              setForm(
                buildDemoSnagForm({ rooms, activities, employees, withAssignee: true })
              )
            }
          />
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
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.clientVisible}
                  onChange={(e) => setForm((f) => ({ ...f, clientVisible: e.target.checked }))}
                />
                Visible in client portal
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.scVisible}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setForm((f) => ({
                      ...f,
                      scVisible: on,
                      scRecipientAccountIds: on
                        ? (projectScs.length === 1
                          ? [projectScs[0].accountId]
                          : f.scRecipientAccountIds)
                        : [],
                    }));
                  }}
                />
                Visible in subcontractor portal
              </label>
              {form.scVisible && (
                <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Choose which appointed subcontractors can see this snag.
                  </p>
                  {projectScs.length === 0 ? (
                    <p className="text-xs text-amber-700">
                      No appointed subcontractors on this project yet. Appoint an SC under Subcontractors first.
                    </p>
                  ) : (
                    projectScs.map((sc) => {
                      const checked = (form.scRecipientAccountIds || [])
                        .map(Number)
                        .includes(sc.accountId);
                      return (
                        <label key={sc.accountId} className="flex items-start gap-2 text-xs">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={checked}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                scRecipientAccountIds: toggleId(
                                  f.scRecipientAccountIds,
                                  sc.accountId,
                                  e.target.checked
                                ),
                              }))
                            }
                          />
                          <span>
                            <span className="font-medium">{sc.label}</span>
                            {sc.packageNames?.length > 0 && (
                              <span className="text-muted-foreground">
                                {" "}· {sc.packageNames.join(", ")}
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
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
      )}

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
                          <Badge variant="secondary" className="text-xs">Client visible</Badge>
                        )}
                        {s.scVisible && (
                          <Badge variant="secondary" className="text-xs">
                            SC visible
                            {Array.isArray(s.scRecipientNames) && s.scRecipientNames.length > 0
                              ? ` · ${s.scRecipientNames.join(", ")}`
                              : ""}
                          </Badge>
                        )}
                        {s.raisedByClient && (
                          <Badge variant="outline" className="text-xs">Client raised</Badge>
                        )}
                        {s.clientApprovedAt && (
                          <Badge className="border-none bg-emerald-500/15 text-emerald-700 text-xs">
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
                    <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-[13.5rem] sm:items-stretch">
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Status
                        </p>
                        <select
                          className="h-9 w-full appearance-none rounded-md border border-border bg-background bg-[length:12px] bg-[right_0.65rem_center] bg-no-repeat px-2.5 pr-8 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/35"
                          style={{
                            backgroundImage:
                              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                          }}
                          value={s.status || "OPEN"}
                          disabled={busy || archived}
                          onChange={(e) =>
                            run(() => updateSnagStatus(projectId, s.uuid, e.target.value), "Status updated")
                          }
                        >
                          {SNAG_STATUSES.map((st) => (
                            <option key={st} value={st}>{st.replace(/_/g, " ")}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Assignee
                        </p>
                        <select
                          className="h-9 w-full appearance-none rounded-md border border-border bg-background bg-[length:12px] bg-[right_0.65rem_center] bg-no-repeat px-2.5 pr-8 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/35"
                          style={{
                            backgroundImage:
                              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                          }}
                          value={s.assigneeAccountId || ""}
                          disabled={busy || archived}
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
                      </div>
                      <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2">
                        <label className="flex items-center gap-2 text-xs text-foreground/80">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-border"
                            checked={!!s.clientVisible}
                            disabled={busy || archived}
                            onChange={(e) =>
                              run(
                                () => updateSnag(projectId, s.uuid, { clientVisible: e.target.checked }),
                                "Visibility updated"
                              )
                            }
                          />
                          Client portal
                        </label>
                        <label className="flex items-center gap-2 text-xs text-foreground/80">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-border"
                            checked={!!s.scVisible}
                            disabled={busy || archived || projectScs.length === 0}
                            onChange={(e) => {
                              const on = e.target.checked;
                              const recipients = on
                                ? (projectScs.length === 1
                                  ? [projectScs[0].accountId]
                                  : (s.scRecipientAccountIds || []).map(Number))
                                : [];
                              run(
                                () => updateSnag(projectId, s.uuid, {
                                  scVisible: on,
                                  scRecipientAccountIds: recipients,
                                }),
                                "SC visibility updated"
                              );
                            }}
                          />
                          SC portal
                        </label>
                      </div>
                      {!!s.scVisible && projectScs.length > 0 && (
                        <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border/60 bg-background px-2.5 py-2">
                          {projectScs.map((sc) => {
                            const checked = (s.scRecipientAccountIds || [])
                              .map(Number)
                              .includes(sc.accountId);
                            return (
                              <label key={sc.accountId} className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 rounded border-border"
                                  disabled={busy || archived}
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = toggleId(
                                      s.scRecipientAccountIds || [],
                                      sc.accountId,
                                      e.target.checked
                                    );
                                    run(
                                      () => updateSnag(projectId, s.uuid, {
                                        scVisible: true,
                                        scRecipientAccountIds: next,
                                      }),
                                      "SC recipients updated"
                                    );
                                  }}
                                />
                                <span className="truncate">{sc.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {(s.status === "OPEN" || s.status === "IN_PROGRESS" || s.status === "READY_FOR_INSPECTION") && !archived && (
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
      </ProjectPageFrame>
    </PageShell>
  );
}
