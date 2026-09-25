import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { fetchMyScheduleActivities } from "@/modules/admin/api/schedule.api";
import { fetchMySiteEngineerProjects } from "@/modules/site-engineer/api/projects.api";
import AssignedProgrammeView from "@/modules/shared/schedule/AssignedProgrammeView";

export default function SiteEngineerActivitiesPage() {
  const [projects, setProjects] = useState([]);
  const [activityProjectIds, setActivityProjectIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchMySiteEngineerProjects().catch(() => []),
      fetchMyScheduleActivities().catch(() => []),
    ])
      .then(([projs, acts]) => {
        if (cancelled) return;
        setProjects(Array.isArray(projs) ? projs : []);
        const ids = [
          ...new Set(
            (Array.isArray(acts) ? acts : [])
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
        title="Construction programme"
        subtitle="Published Gantt for your assigned projects — click a bar to update progress"
      />
      <AssignedProgrammeView
        projectOptions={projectOptions}
        progressMode="immediate"
        allowProgress
        emptyMessage="No published activities on your assigned projects yet. Ask your PM to publish the schedule and assign you as Site Engineer on the project team."
      />
    </PageShell>
  );
}
