import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, GanttChart, Loader2, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchPlanningStatus, updatePlanningStatus } from "../../api/planning.api";
import { ROUTES } from "@/shared/constants/routes";

const AREA_LABELS = [
  { key: "materialStatus", label: "Material plan", routeKey: "PROJECT_MATERIAL_PLAN", icon: Package },
  { key: "resourceStatus", label: "Resource plan", routeKey: "PROJECT_RESOURCE_PLAN", icon: Users },
  { key: "labourStatus", label: "Labour plan", routeKey: "PROJECT_RESOURCE_PLAN", icon: Users },
  { key: "subcontractorStatus", label: "Subcontractor plan", routeKey: "PROJECT_SUBCONTRACTORS", icon: null },
];

function statusBadge(status) {
  const s = status || "NOT_STARTED";
  const map = {
    NOT_REQUIRED: "bg-muted text-muted-foreground",
    NOT_STARTED: "bg-amber-500/15 text-amber-700",
    IN_PROGRESS: "bg-blue-500/15 text-blue-700",
    READY: "bg-emerald-500/15 text-emerald-700",
  };
  return (
    <Badge className={`border-none font-medium ${map[s] || ""}`}>
      {String(s).replace(/_/g, " ")}
    </Badge>
  );
}

export default function ProjectPlanningSection({ projectId }) {
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const routes = isPm ? ROUTES.PROJECT_MANAGER : ROUTES.ADMIN;
  const schedulePath = routes.PROJECT_SCHEDULE.replace(":projectId", projectId);

  const [planning, setPlanning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchPlanningStatus(projectId)
      .then(setPlanning)
      .catch(() => setPlanning(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleReady = async (checked) => {
    setSaving(true);
    setMessage("");
    try {
      const updated = await updatePlanningStatus(projectId, { planningReady: checked });
      setPlanning(updated);
      setMessage(checked ? "Planning marked ready — Gantt publish unlocked." : "Planning ready cleared.");
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to update planning.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-semibold">Project Planning Hub</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={routes.PROJECT_MATERIAL_PLAN.replace(":projectId", projectId)}>
              <Package className="h-4 w-4 mr-1" /> Materials
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={routes.PROJECT_RESOURCE_PLAN.replace(":projectId", projectId)}>
              <Users className="h-4 w-4 mr-1" /> Resources
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={schedulePath}>
              <GanttChart className="h-4 w-4 mr-1" /> Open Gantt
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AREA_LABELS.map(({ key, label, routeKey }) => {
            const tile = (
              <div className="stat-tile h-full p-3">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                {statusBadge(planning?.[key])}
              </div>
            );
            if (!routeKey || !routes[routeKey]) return <div key={key}>{tile}</div>;
            return (
              <Link
                key={key}
                to={routes[routeKey].replace(":projectId", projectId)}
                className="block hover:bg-muted/20 rounded-lg transition-colors"
              >
                {tile}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-secondary/50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <CheckCircle2 className={`h-5 w-5 mt-0.5 ${planning?.planningReady ? "text-emerald-600" : "text-muted-foreground"}`} />
            <div>
              <Label htmlFor="planning-ready" className="text-sm font-medium">Planning ready</Label>
              <p className="text-xs text-muted-foreground">
                Unlocks Gantt publish when material/resource gates are satisfied.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="planning-ready"
              checked={!!planning?.planningReady}
              onCheckedChange={toggleReady}
              disabled={saving}
            />
            {planning?.ganttPublishAllowed && (
              <Badge className="border-none bg-emerald-500/15 text-emerald-700">Publish allowed</Badge>
            )}
          </div>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
