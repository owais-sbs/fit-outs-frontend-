import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ClipboardList, Loader2, Package } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchMyScheduleActivities } from "@/modules/admin/api/schedule.api";
import { fetchMyScPackages } from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

export default function SubcontractorTasksPage() {
  const [activities, setActivities] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchMyScheduleActivities().catch(() => []),
      fetchMyScPackages().catch(() => []),
    ])
      .then(([actList, pkgList]) => {
        setActivities(Array.isArray(actList) ? actList : []);
        setPackages((Array.isArray(pkgList) ? pkgList : []).filter((p) => p.status !== "OPEN"));
      })
      .finally(() => setLoading(false));
  }, []);

  const activePackages = useMemo(
    () => packages.filter((p) => p.status === "IN_PROGRESS" || p.status === "APPOINTED" || p.status === "COMPLETE"),
    [packages]
  );

  const stats = useMemo(() => {
    const total = activities.length + activePackages.length;
    const inProgress = activities.filter((a) => (a.percentComplete ?? 0) > 0 && (a.percentComplete ?? 0) < 100).length
      + activePackages.filter((p) => p.status === "IN_PROGRESS").length;
    const complete = activities.filter((a) => (a.percentComplete ?? 0) >= 100).length
      + activePackages.filter((p) => p.status === "COMPLETE").length;
    return { total, inProgress, complete };
  }, [activities, activePackages]);

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
        title="My Tasks"
        subtitle="Schedule programme tasks and your appointed BOQ packages."
        actions={
          <Button asChild size="sm">
            <Link to={ROUTES.SUBCONTRACTOR.PROGRESS_LOGS}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Log progress
            </Link>
          </Button>
        }
      />

      <Surface className="border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Schedule tasks</strong> come from the project programme (Gantt).
        <strong className="text-foreground"> Package tasks</strong> are your BOQ work items — use <Link className="text-primary underline" to={ROUTES.SUBCONTRACTOR.CLAIMS}>Claims</Link> to report quantities completed.
      </Surface>

      <div className="grid gap-3 sm:grid-cols-3">
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Total work items</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">In progress</p>
          <p className="text-2xl font-semibold">{stats.inProgress}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Complete</p>
          <p className="text-2xl font-semibold">{stats.complete}</p>
        </Surface>
      </div>

      {activities.length > 0 && (
        <Surface className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Programme tasks ({activities.length})</h2>
          <div className="divide-y divide-border/30">
            {activities.map((task) => (
              <div key={task.uuid} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{task.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {task.projectName || `Project #${task.projectId}`}
                    {task.startDate ? ` · ${task.startDate}` : ""}
                    {task.endDate ? ` → ${task.endDate}` : ""}
                  </p>
                  {task.delayReason && (
                    <p className="mt-1 text-xs text-amber-700">Delay: {task.delayReason}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold tabular-nums">{task.percentComplete ?? 0}%</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to={ROUTES.SUBCONTRACTOR.PROGRESS_LOGS}>Log progress</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      )}

      {activePackages.length > 0 && (
        <Surface className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4" />
            Package tasks ({activePackages.length})
          </h2>
          <div className="divide-y divide-border/30">
            {activePackages.map((pkg) => (
              <div key={pkg.uuid} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pkg.projectName} · Planned {pkg.boqPlannedQty ?? 0} · Approved {pkg.approvedClaimedQty ?? 0}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${SC_STATUS_BADGE[pkg.status] || "bg-muted border-none"} text-[10px]`}>
                    {formatScStatus(pkg.status)}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link to={ROUTES.SUBCONTRACTOR.CLAIMS}>Submit claim</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      )}

      {activities.length === 0 && activePackages.length === 0 && (
        <Surface className="px-4 py-16 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No tasks yet</p>
          <p className="mt-2 max-w-md mx-auto">
            Your PM must appoint you to packages first. Programme tasks also require a published project schedule with activities assigned to you.
          </p>
        </Surface>
      )}
    </PageShell>
  );
}
