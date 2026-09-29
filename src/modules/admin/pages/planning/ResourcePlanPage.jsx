import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle, StatTile } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  fetchResourceTypes,
  createResourceType,
  fetchResourceAssignments,
  createResourceAssignment,
  deleteResourceAssignment,
  fetchPlantToolUtilisation,
} from "../../api/resource.api";
import { fetchProjectSchedule } from "../../api/schedule.api";
import { projectPlanningBackPath } from "@/shared/constants/routes";

const PLANT_TOOL_KINDS = ["PLANT", "TOOL"];

function activityLabel(a) {
  if (!a) return "Activity";
  const name = a.name || a.title || "Untitled activity";
  const start = a.plannedStart || a.startDate || a.start || "";
  const end = a.plannedEnd || a.endDate || a.end || "";
  const range = start && end ? ` · ${String(start).slice(0, 10)} → ${String(end).slice(0, 10)}` : "";
  return `${name}${range}`;
}

export default function ResourcePlanPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const backPath = projectPlanningBackPath(location, projectId);
  const backLabel = location.state?.from === "detail" ? "Project" : "Schedule";

  const [types, setTypes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [utilisation, setUtilisation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [typeForm, setTypeForm] = useState({ name: "", kind: "TOOL" });
  const [assignForm, setAssignForm] = useState({
    activityUuid: "",
    resourceTypeUuid: "",
    quantity: 1,
    startDate: "",
    endDate: "",
  });

  const activeTypes = useMemo(
    () => (Array.isArray(types) ? types.filter((t) => t.active !== false) : []),
    [types]
  );

  const activityByUuid = useMemo(() => {
    const map = new Map();
    for (const a of activities) {
      if (a?.uuid) map.set(String(a.uuid), a);
    }
    return map;
  }, [activities]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      Promise.all([
        fetchResourceTypes("PLANT").catch(() => []),
        fetchResourceTypes("TOOL").catch(() => []),
      ]).then(([plant, tool]) => [...(Array.isArray(plant) ? plant : []), ...(Array.isArray(tool) ? tool : [])]),
      fetchResourceAssignments(projectId).catch(() => []),
      fetchPlantToolUtilisation(projectId).catch(() => null),
      fetchProjectSchedule(projectId).catch(() => null),
    ])
      .then(([t, a, u, schedule]) => {
        setTypes(Array.isArray(t) ? t : []);
        setAssignments(Array.isArray(a) ? a : []);
        setUtilisation(u);
        const acts = Array.isArray(schedule?.activities) ? schedule.activities : [];
        setActivities(acts);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await load();
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateType = () =>
    run(
      () =>
        createResourceType({
          name: typeForm.name.trim(),
          kind: typeForm.kind,
          active: true,
        }),
      "Resource type created"
    );

  const handleAssign = () =>
    run(
      () =>
        createResourceAssignment(projectId, {
          activityUuid: assignForm.activityUuid.trim(),
          resourceTypeUuid: assignForm.resourceTypeUuid,
          quantity: Number(assignForm.quantity) || 1,
          startDate: assignForm.startDate,
          endDate: assignForm.endDate,
        }),
      "Resource assigned"
    );

  if (loading) {
    return (
      <PageShell className="max-w-5xl mx-auto flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title={`Back to ${backLabel}`}>
          <Link to={backPath}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageTitle
          className="flex-1"
          title="Resource Plan"
          subtitle={`Plant & tools · Project #${projectId}`}
        />
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Plant & tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label className="text-xs">Name</Label>
                <Input
                  value={typeForm.name}
                  onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Scaffold tower"
                />
              </div>
              <div className="space-y-1 w-28">
                <Label className="text-xs">Kind</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={typeForm.kind}
                  onChange={(e) => setTypeForm((f) => ({ ...f, kind: e.target.value }))}
                >
                  {PLANT_TOOL_KINDS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <Button size="sm" onClick={handleCreateType} disabled={busy || !typeForm.name.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="divide-y divide-border/40">
              {types.map((t) => (
                <div key={t.uuid} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.kind}</p>
                  </div>
                  <Badge variant={t.active ? "secondary" : "outline"}>
                    {t.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
              {!types.length && (
                <p className="text-sm text-muted-foreground py-4 text-center">No plant or tools yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Utilisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {utilisation ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <StatTile label="Resource-days" value={utilisation.totalResourceDays ?? 0} />
                  <StatTile label="Assignments" value={utilisation.assignmentCount ?? 0} />
                </div>
                <div className="divide-y divide-border/40">
                  {(utilisation.resources || []).map((r) => (
                    <div key={r.resourceTypeUuid} className="flex justify-between py-2 text-sm">
                      <span>{r.resourceTypeName}</span>
                      <span className="text-muted-foreground">
                        {r.quantityDays}d · {r.assignmentCount} asgn
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No utilisation data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Assign resource to activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-xs">Schedule activity</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={assignForm.activityUuid}
                onChange={(e) => {
                  const uuid = e.target.value;
                  const act = activityByUuid.get(uuid);
                  const start = act?.plannedStart || act?.startDate || act?.start || "";
                  const end = act?.plannedEnd || act?.endDate || act?.end || "";
                  setAssignForm((f) => ({
                    ...f,
                    activityUuid: uuid,
                    startDate: f.startDate || (start ? String(start).slice(0, 10) : ""),
                    endDate: f.endDate || (end ? String(end).slice(0, 10) : ""),
                  }));
                }}
              >
                <option value="">
                  {activities.length ? "Select activity" : "No schedule activities — create them on Schedule first"}
                </option>
                {activities.map((a) => (
                  <option key={a.uuid} value={a.uuid}>{activityLabel(a)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Resource</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={assignForm.resourceTypeUuid}
                onChange={(e) => setAssignForm((f) => ({ ...f, resourceTypeUuid: e.target.value }))}
              >
                <option value="">Select plant/tool</option>
                {activeTypes.map((t) => (
                  <option key={t.uuid} value={t.uuid}>{t.name} ({t.kind})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Qty</Label>
              <Input
                type="number"
                min={1}
                value={assignForm.quantity}
                onChange={(e) => setAssignForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start</Label>
              <Input
                type="date"
                value={assignForm.startDate}
                onChange={(e) => setAssignForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End</Label>
              <Input
                type="date"
                value={assignForm.endDate}
                onChange={(e) => setAssignForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={
              busy
              || !assignForm.activityUuid
              || !assignForm.resourceTypeUuid
              || !assignForm.startDate
              || !assignForm.endDate
            }
          >
            Assign
          </Button>

          <div className="divide-y divide-border/40">
            {assignments.map((a) => {
              const act = activityByUuid.get(String(a.activityUuid || ""));
              return (
              <div key={a.uuid} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {a.resourceTypeName || a.resourceTypeUuid}
                    {a.kind ? ` · ${a.kind}` : ""}
                    {a.quantity > 1 ? ` ×${a.quantity}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {act ? activityLabel(act) : "Activity"} · {a.startDate} → {a.endDate}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  disabled={busy}
                  onClick={() => run(() => deleteResourceAssignment(projectId, a.uuid), "Assignment removed")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              );
            })}
            {!assignments.length && (
              <p className="text-sm text-muted-foreground py-4 text-center">No assignments yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
