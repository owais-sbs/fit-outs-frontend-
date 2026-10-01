import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, ChevronRight, HardHat, Loader2, Package, Users, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  fetchPlanningStatus,
  updatePlanningStatus,
  fetchPlanningGates,
} from "../../api/planning.api";
import { ROUTES, SCHEDULE_NAV_STATE } from "@/shared/constants/routes";

const AREAS = [
  { key: "materialStatus", label: "Material", routeKey: "PROJECT_MATERIAL_PLAN", icon: Package, gateKey: "requireMaterial" },
  { key: "resourceStatus", label: "Resource", routeKey: "PROJECT_RESOURCE_PLAN", icon: Wrench, gateKey: "requireResource" },
  { key: "labourStatus", label: "Labour", routeKey: "PROJECT_LABOUR_PLAN", icon: Users, gateKey: "requireLabour" },
  { key: "subcontractorStatus", label: "Subcontractor", routeKey: "PROJECT_SUBCONTRACTORS", icon: HardHat, gateKey: "requireSubcontractor" },
];

function chip(status) {
  const s = status || "NOT_STARTED";
  const map = {
    NOT_REQUIRED: "bg-secondary text-muted-foreground",
    NOT_STARTED: "bg-amber-500/15 text-amber-800",
    IN_PROGRESS: "bg-sky-500/15 text-sky-800",
    READY: "bg-emerald-500/15 text-emerald-800",
  };
  return (
    <Badge className={map[s] || map.NOT_STARTED}>
      {String(s).replace(/_/g, " ")}
    </Badge>
  );
}

/**
 * Compact readiness strip for the unified Schedule workspace.
 * onChange notifies parent so Publish button can refresh allow flag.
 */
export default function ScheduleReadinessStrip({ projectId, onChanged }) {
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const routes = isPm ? ROUTES.PROJECT_MANAGER : ROUTES.ADMIN;

  const [planning, setPlanning] = useState(null);
  const [gates, setGates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchPlanningStatus(projectId),
      fetchPlanningGates().catch(() => null),
    ])
      .then(([data, gateCfg]) => {
        setPlanning(data);
        setGates(gateCfg);
        onChanged?.(data);
      })
      .catch(() => setPlanning(null))
      .finally(() => setLoading(false));
  }, [projectId, onChanged]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleReady = async (checked) => {
    setSaving(true);
    try {
      const updated = await updatePlanningStatus(projectId, { planningReady: checked });
      setPlanning(updated);
      onChanged?.(updated);
    } catch {
      /* parent can show errors via schedule messages */
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading planning readiness…
        </CardContent>
      </Card>
    );
  }

  const requireReady = gates?.requirePlanningReady !== false;

  return (
    <Card className="bg-card">
      <CardContent className="space-y-4 pt-5 md:pt-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-2 min-w-0">
            <CheckCircle2
              className={`h-5 w-5 mt-0.5 shrink-0 ${planning?.planningReady ? "text-emerald-600" : "text-muted-foreground"}`}
            />
            <div>
              <Label htmlFor="schedule-planning-ready" className="text-sm font-semibold">
                Planning ready
                {requireReady && (
                  <span className="ml-2 text-[10px] font-normal uppercase tracking-wide text-amber-700">
                    Required gate
                  </span>
                )}
              </Label>
              <p className="text-xs text-muted-foreground">
                Unlock publish when the plan is set. Open material/resource plans from the chips.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              id="schedule-planning-ready"
              checked={!!planning?.planningReady}
              onCheckedChange={toggleReady}
              disabled={saving}
            />
            {planning?.ganttPublishAllowed ? (
              <Badge className="bg-emerald-500/15 text-emerald-800">Publish unlocked</Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-800">Publish locked</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
          {AREAS.map(({ key, label, routeKey, icon: Icon, gateKey }) => {
            const required = !!gates?.[gateKey];
            const to = routes[routeKey]?.replace(":projectId", projectId);
            const body = (
              <span className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/50 bg-background px-3 py-3 text-sm font-medium transition-colors hover:bg-secondary/60">
                <span className="min-w-0 flex-1 flex flex-col gap-1.5">
                  <span className="inline-flex items-center gap-2 min-w-0">
                    {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
                    <span className="truncate">{label}</span>
                    {required && (
                      <Badge className="border-none bg-amber-500/15 text-amber-800 text-[9px] px-1.5 py-0 shrink-0">
                        Required
                      </Badge>
                    )}
                  </span>
                  <span className="pl-6">{chip(planning?.[key])}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </span>
            );
            if (!to) return <span key={key}>{body}</span>;
            return (
              <Link
                key={key}
                to={to}
                state={SCHEDULE_NAV_STATE}
                className="block w-full hover:opacity-95"
              >
                {body}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
