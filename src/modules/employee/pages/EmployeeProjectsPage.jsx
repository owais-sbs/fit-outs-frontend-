import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, CalendarDays, MapPin, Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchMySiteVisits } from "@/modules/admin/api/site-visits.api";
import { ROUTES } from "@/shared/constants/routes";

const STATUS_BADGE = {
  "In Progress": "bg-blue-500/15 text-blue-700 border-none",
  Completed: "bg-emerald-500/15 text-emerald-700 border-none",
  Planning: "bg-amber-500/15 text-amber-700 border-none",
  "On Hold": "bg-orange-500/15 text-orange-700 border-none",
  Cancelled: "bg-destructive/15 text-destructive border-none",
  Active: "bg-blue-500/15 text-blue-700 border-none",
};

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/30 py-2 last:border-0">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export default function EmployeeProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchAllProjects().catch(() => []),
      fetchMySiteVisits().catch(() => []),
    ]).then(([projs, mine]) => {
      if (cancelled) return;
      const list = Array.isArray(projs) ? projs : [];
      setProjects(list);
      setVisits(Array.isArray(mine) ? mine : []);
      setSelected(list[0] || null);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      <PageTitle
        title="My Projects"
        subtitle="Company projects linked to your workspace. Open site visits to start QAS."
        actions={<Button onClick={() => navigate(ROUTES.EMPLOYEE.SITE_VISITS)}>My Site Visits</Button>}
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {!loading && projects.length === 0 ? (
            <Surface className="px-4 py-16 text-center">
              <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No projects available yet.</p>
            </Surface>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className={`w-full space-y-3 rounded-2xl p-4 text-left transition-all ${
                  selected?.id === p.id
                    ? "bg-primary/5 ring-1 ring-primary/25"
                    : "bg-secondary/50 hover:bg-secondary"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold leading-tight">{p.name || p.projectName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.clientName || "—"}</p>
                  </div>
                  <Badge className={`${STATUS_BADGE[p.status] || "bg-muted border-none"} shrink-0 text-[10px]`}>
                    {p.status || "Active"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {p.location || "—"}
                </div>
              </button>
            ))
          )}
        </div>

        <Surface className="p-5">
          <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">
            {selected ? selected.name || selected.projectName : "Select a project"}
          </h2>
          {!selected ? (
            <p className="text-sm text-muted-foreground">Choose a project from the list.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-secondary/40 px-4">
                <InfoRow label="Client" value={selected.clientName} />
                <InfoRow label="Location" value={selected.location} />
                <InfoRow label="Type" value={selected.projectType} />
                <InfoRow label="Status" value={selected.status} />
              </div>
              <Separator className="opacity-40" />
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="h-4 w-4" /> Your assigned visits
                </p>
                {visits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No visits assigned to you.</p>
                ) : (
                  <div className="space-y-2">
                    {visits.slice(0, 8).map((v) => (
                      <div
                        key={v.uuid}
                        className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">Visit {v.uuid?.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.scheduledDate || "—"} · {v.scheduledTime || ""}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(ROUTES.EMPLOYEE.SITE_VISIT_REPORT.replace(":visitId", v.uuid))
                          }
                        >
                          Open report
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Surface>
      </div>
    </PageShell>
  );
}
