import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { fetchMineAssignedProjects } from "@/modules/admin/api/projects.api";
import { fetchMyScheduleActivities } from "@/modules/admin/api/schedule.api";
import AssignedProgrammeView from "@/modules/shared/schedule/AssignedProgrammeView";
import { useAuth } from "@/shared/context/auth-context";

export default function EmployeeMyActivitiesPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myActivityUuids, setMyActivityUuids] = useState(() => new Set());
  const [activityProjectIds, setActivityProjectIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchMineAssignedProjects().catch(() => []),
      fetchMyScheduleActivities().catch(() => []),
    ])
      .then(([projs, acts]) => {
        if (cancelled) return;
        setProjects(Array.isArray(projs) ? projs : []);
        const list = Array.isArray(acts) ? acts : [];
        setMyActivityUuids(new Set(list.map((a) => String(a.uuid))));
        const ids = [
          ...new Set(
            list
              .map((a) => a.projectId)
              .filter((id) => id != null)
              .map(String)
          ),
        ];
        setActivityProjectIds(ids);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const projectOptions = useMemo(() => {
    const fromTeam = Array.isArray(projects) ? projects : [];
    if (fromTeam.length) return fromTeam;
    return activityProjectIds.map((id) => ({ id, name: `Project #${id}` }));
  }, [projects, activityProjectIds]);

  const accountId = user?.accountId ?? user?.id;

  if (loading) {
    return (
      <PageShell className="mx-auto max-w-[1400px]">
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="mx-auto max-w-[1400px]">
      <PageTitle
        title="My programme"
        subtitle="Published Gantt for projects you are assigned to — click your bars to report progress"
      />
      <AssignedProgrammeView
        projectOptions={projectOptions}
        progressMode="validation"
        allowProgress
        canUpdateActivity={(a) => {
          if (myActivityUuids.has(String(a.uuid))) return true;
          if (accountId != null && String(a.assigneeAccountId) === String(accountId)) return true;
          return false;
        }}
        emptyMessage="No published programme on your assigned projects yet. Ask your PM to publish the schedule and add you to the project team or assign you activities."
      />
    </PageShell>
  );
}
