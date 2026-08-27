import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Loader2, Package, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  fetchPlanningStatus,
  updatePlanningStatus,
  fetchPlanningGates,
  fetchPlanningAudit,
} from "../../api/planning.api";
import { ROUTES } from "@/shared/constants/routes";

const AREAS = [
  { key: "materialStatus", label: "Material", routeKey: "PROJECT_MATERIAL_PLAN", icon: Package, gateKey: "requireMaterial" },
  { key: "resourceStatus", label: "Resource", routeKey: "PROJECT_RESOURCE_PLAN", icon: Users, gateKey: "requireResource" },
  { key: "labourStatus", label: "Labour", routeKey: "PROJECT_RESOURCE_PLAN", icon: Users, gateKey: "requireLabour" },
  { key: "subcontractorStatus", label: "Subcontractor", routeKey: "PROJECT_SUBCONTRACTORS", icon: null, gateKey: "requireSubcontractor" },
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
  const [audit, setAudit] = useState([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
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

  const toggleAudit = async () => {
    const next = !auditOpen;
    setAuditOpen(next);
    if (!next || audit.length > 0) return;
    setAuditLoading(true);
    try {
      const list = await fetchPlanningAudit(projectId);
      setAudit(Array.isArray(list) ? list : list?.items || []);
    } catch {
      setAudit([]);
    } finally {
      setAuditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading planning readiness…
      </div>
    );
  }

  const requireReady = gates?.requirePlanningReady !== false;

  return (
    <div className="rounded-2xl bg-secondary/50 px-4 py-3 space-y-3">
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

      <div className="flex flex-wrap gap-2">
        {AREAS.map(({ key, label, routeKey, icon: Icon, gateKey }) => {
          const required = !!gates?.[gateKey];
          const body = (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-card px-2.5 py-1.5 text-xs font-medium">
              {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" /> : null}
              {label}
              {required && (
                <Badge className="border-none bg-amber-500/15 text-amber-800 text-[9px] px-1.5 py-0">
                  Required
                </Badge>
              )}
              {chip(planning?.[key])}
            </span>
          );
          if (!routeKey || !routes[routeKey]) return <span key={key}>{body}</span>;
          return (
            <Link
              key={key}
              to={routes[routeKey].replace(":projectId", projectId)}
              className="hover:opacity-90"
            >
              {body}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-border/40 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={toggleAudit}
        >
          <ClipboardList className="h-3.5 w-3.5 mr-1" />
          Audit
          {auditOpen ? <ChevronDown className="h-3.5 w-3.5 ml-1" /> : <ChevronRight className="h-3.5 w-3.5 ml-1" />}
        </Button>
        {auditOpen && (
          <div className="mt-2 max-h-40 overflow-auto rounded-xl bg-card/80 px-3 py-2 text-xs space-y-1.5">
            {auditLoading ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading audit…
              </p>
            ) : audit.length === 0 ? (
              <p className="text-muted-foreground">No planning decisions recorded yet.</p>
            ) : (
              audit.map((row) => (
                <div key={row.uuid || `${row.decisionType}-${row.decidedAt}`} className="flex flex-wrap gap-x-2 gap-y-0.5 border-b border-border/30 pb-1.5 last:border-0">
                  <span className="font-medium">{row.decisionType || "UPDATE"}</span>
                  <span className="text-muted-foreground">
                    {row.fromValue ?? "—"} → {row.toValue ?? "—"}
                  </span>
                  <span className="text-muted-foreground ml-auto">
                    {row.decidedAt ? new Date(row.decidedAt).toLocaleString() : ""}
                    {row.decidedBy != null ? ` · #${row.decidedBy}` : ""}
                  </span>
                  {row.notes && <p className="w-full text-muted-foreground">{row.notes}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
