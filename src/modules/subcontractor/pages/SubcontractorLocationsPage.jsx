import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchMyScProjects } from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE } from "../utils/subcontractor.utils";

export default function SubcontractorLocationsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchMyScProjects()
      .then((list) => setProjects(Array.isArray(list) ? list : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (!q) return true;
      return (
        p.projectName?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.assignedManager?.toLowerCase().includes(q)
      );
    });
  }, [projects, search]);

  const openMaps = (address) => {
    if (!address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <PageShell>
      <PageTitle
        title="Site Locations"
        subtitle="Project addresses for your appointed work. Open in maps for directions."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.SUBCONTRACTOR.PROJECTS}>My projects</Link>
          </Button>
        }
      />

      <div className="relative max-w-md">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search project, address, or PM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Surface className="px-4 py-16 text-center">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {projects.length === 0 ? "No site locations yet." : "No locations match your search."}
          </p>
        </Surface>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <Surface key={project.projectId} className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{project.projectName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {project.packageCount} package{project.packageCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <Badge className={`${SC_STATUS_BADGE[project.status] || "bg-muted border-none"} shrink-0 text-[10px]`}>
                  {project.status || "Active"}
                </Badge>
              </div>

              <div className="mb-4 flex flex-1 items-start gap-2 rounded-xl bg-secondary/40 p-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed">
                  {project.location || "No address on file for this project"}
                </p>
              </div>

              {project.assignedManager && (
                <p className="mb-4 text-xs text-muted-foreground">
                  Project manager: <span className="font-medium text-foreground">{project.assignedManager}</span>
                </p>
              )}

              <div className="mt-auto flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={!project.location}
                  onClick={() => openMaps(project.location)}
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Open maps
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate(
                    ROUTES.SUBCONTRACTOR.PROJECT_DETAIL.replace(":projectId", project.projectId)
                  )}
                >
                  View project
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </PageShell>
  );
}
