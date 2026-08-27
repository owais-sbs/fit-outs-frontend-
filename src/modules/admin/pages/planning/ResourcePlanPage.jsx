import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle, StatTile } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  fetchLabourCrews,
  createLabourCrew,
  fetchCrewAssignments,
  createCrewAssignment,
  deleteCrewAssignment,
  fetchResourceUtilisation,
} from "../../api/resource.api";
import { ROUTES } from "@/shared/constants/routes";

export default function ResourcePlanPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const detailPath = (isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL)
    .replace(":projectId", projectId);

  const [crews, setCrews] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [utilisation, setUtilisation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [crewForm, setCrewForm] = useState({ name: "", headcount: 4 });
  const [assignForm, setAssignForm] = useState({
    activityUuid: "",
    crewUuid: "",
    startDate: "",
    endDate: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchLabourCrews().catch(() => []),
      fetchCrewAssignments(projectId).catch(() => []),
      fetchResourceUtilisation(projectId).catch(() => null),
    ])
      .then(([c, a, u]) => {
        setCrews(Array.isArray(c) ? c : []);
        setAssignments(Array.isArray(a) ? a : []);
        setUtilisation(u);
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

  const handleCreateCrew = () =>
    run(
      () =>
        createLabourCrew({
          name: crewForm.name.trim(),
          headcount: Number(crewForm.headcount) || 1,
          active: true,
        }),
      "Crew created"
    );

  const handleAssign = () =>
    run(
      () =>
        createCrewAssignment(projectId, {
          activityUuid: assignForm.activityUuid.trim(),
          crewUuid: assignForm.crewUuid,
          startDate: assignForm.startDate,
          endDate: assignForm.endDate,
        }),
      "Crew assigned"
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
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Link to={detailPath}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageTitle title="Resource & Labour Plan" subtitle={`Project #${projectId}`} />
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Labour crews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label className="text-xs">Name</Label>
                <Input
                  value={crewForm.name}
                  onChange={(e) => setCrewForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Crew A"
                />
              </div>
              <div className="space-y-1 w-24">
                <Label className="text-xs">Headcount</Label>
                <Input
                  type="number"
                  min={1}
                  value={crewForm.headcount}
                  onChange={(e) => setCrewForm((f) => ({ ...f, headcount: e.target.value }))}
                />
              </div>
              <Button size="sm" onClick={handleCreateCrew} disabled={busy || !crewForm.name.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="divide-y divide-border/40">
              {crews.map((c) => (
                <div key={c.uuid} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.headcount} people</p>
                  </div>
                  <Badge variant={c.active ? "secondary" : "outline"}>
                    {c.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
              {!crews.length && (
                <p className="text-sm text-muted-foreground py-4 text-center">No crews yet</p>
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
                  <StatTile label="Crew-days" value={utilisation.totalCrewDays ?? 0} />
                  <StatTile label="Assignments" value={utilisation.assignmentCount ?? 0} />
                </div>
                <div className="divide-y divide-border/40">
                  {(utilisation.crews || []).map((c) => (
                    <div key={c.crewUuid} className="flex justify-between py-2 text-sm">
                      <span>{c.crewName}</span>
                      <span className="text-muted-foreground">{c.assignedDays}d · {c.assignmentCount} asgn</span>
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
          <CardTitle className="text-sm font-semibold">Assign crew to activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Activity UUID</Label>
              <Input
                value={assignForm.activityUuid}
                onChange={(e) => setAssignForm((f) => ({ ...f, activityUuid: e.target.value }))}
                placeholder="activity uuid"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Crew</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={assignForm.crewUuid}
                onChange={(e) => setAssignForm((f) => ({ ...f, crewUuid: e.target.value }))}
              >
                <option value="">Select crew</option>
                {crews.map((c) => (
                  <option key={c.uuid} value={c.uuid}>{c.name}</option>
                ))}
              </select>
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
            disabled={busy || !assignForm.activityUuid || !assignForm.crewUuid || !assignForm.startDate || !assignForm.endDate}
          >
            Assign
          </Button>

          <div className="divide-y divide-border/40">
            {assignments.map((a) => (
              <div key={a.uuid} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.crewName || a.crewUuid}</p>
                  <p className="text-xs text-muted-foreground">
                    Activity {String(a.activityUuid || "").slice(0, 8)}… · {a.startDate} → {a.endDate}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  disabled={busy}
                  onClick={() => run(() => deleteCrewAssignment(projectId, a.uuid), "Assignment removed")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {!assignments.length && (
              <p className="text-sm text-muted-foreground py-4 text-center">No assignments yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
