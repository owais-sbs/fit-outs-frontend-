import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Sliders, CheckCircle, MapPin, Eye, Search, Loader2 } from "lucide-react";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/shared/constants/routes";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";

export default function MyProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClientProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchAllProjects();
      setProjects(list);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClientProjects();
  }, [loadClientProjects]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "In Progress").length;
    const completed = projects.filter((p) => p.status === "Completed").length;
    return { total, active, completed };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((p) => {
      return (
        !query ||
        String(p.id).toLowerCase().includes(query) ||
        (p.projectName || "").toLowerCase().includes(query) ||
        (p.location || "").toLowerCase().includes(query)
      );
    });
  }, [projects, search]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "In Progress":
        return <Badge className="border-none bg-blue-500/15 font-medium text-blue-700 dark:text-blue-400">In Progress</Badge>;
      case "Completed":
        return <Badge className="border-none bg-emerald-500/15 font-medium text-emerald-700 dark:text-emerald-400">Completed</Badge>;
      case "Planning":
        return <Badge className="border-none bg-amber-500/15 font-medium text-amber-700 dark:text-amber-400">Planning</Badge>;
      case "On Hold":
        return <Badge className="border-none bg-orange-500/15 font-medium text-orange-700 dark:text-orange-400">On Hold</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageShell>
      <PageTitle
        title="My Projects"
        subtitle="Track your fit-out and construction project execution progress, timeline, and approvals."
      />

      {error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total Assigned Projects" value={stats.total} icon={Briefcase} hint="Total contracted" />
        <StatTile label="Active In Execution" value={stats.active} icon={Sliders} hint="Underway" />
        <StatTile label="Completed" value={stats.completed} icon={CheckCircle} hint="Delivered" />
      </div>

      <Surface className="p-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by project name, ID..."
            className="h-9 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 pl-6">Project ID</th>
                <th className="px-4 py-3">Project Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Project Manager</th>
                <th className="w-[200px] px-4 py-3">Progress</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="font-medium">No projects linked to your account</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="group cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", p.id))}
                  >
                    <td className="px-4 py-4 pl-6 font-mono text-xs font-semibold text-muted-foreground group-hover:text-primary">
                      {p.id}
                    </td>
                    <td className="px-4 py-4 font-semibold text-foreground">
                      {p.projectName}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className="bg-background/50 text-xs font-normal">{p.projectType}</Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                        <span>{p.location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{p.assignedManager || "Unassigned"}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>{p.progress}% Completed</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(p.status)}</td>
                    <td className="px-4 py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", p.id))}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Track</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Surface>
    </PageShell>
  );
}
