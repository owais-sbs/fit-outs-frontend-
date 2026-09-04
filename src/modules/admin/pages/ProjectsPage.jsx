import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Briefcase, Search, Plus } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { PageShell, StatTile } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchAllProjects } from "../api/projects.api";
import { fetchAllClients } from "../api/clients.api";
import { ROUTES } from "@/shared/constants/routes";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const detailRoute = isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL;
  const createRoute = isPm
    ? `${ROUTES.PROJECT_MANAGER.PROJECTS}/new`
    : ROUTES.ADMIN.PROJECT_CREATE;
  const [projects, setProjects] = useState([]);
  const [clientMap, setClientMap] = useState(new Map());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    Promise.all([fetchAllProjects(), fetchAllClients().catch(() => [])])
      .then(([projs, clients]) => {
        setProjects(projs);
        setClientMap(new Map(clients.map((c) => [String(c.id), c])));
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.isActive).length;
    const inactive = projects.filter((p) => !p.isActive).length;
    return { total, active, inactive };
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (!q) return true;
      const clientName = clientMap.get(String(p.clientId))?.fullName || "";
      return (
        String(p.id).includes(q) ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.leadReferenceNo || "").toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q)
      );
    });
  }, [projects, search, clientMap]);

  return (
    <PageShell>
      <PageHeader
        title="Projects"
        description="All projects in your company."
        actions={
          <Button size="sm" className="gap-2" onClick={() => navigate(createRoute)}>
            <Plus className="h-4 w-4" />
            Add new project
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total" value={stats.total} />
        <StatTile label="Active" value={stats.active} />
        <StatTile label="Inactive" value={stats.inactive} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search project ID, lead ref, name, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4 pl-6">ID</th>
                <th className="py-3 px-4">Lead Ref</th>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 pl-6"><div className="h-4 w-10 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-36 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-14 bg-muted rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No projects found</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4 gap-2"
                      onClick={() => navigate(createRoute)}
                    >
                      <Plus className="h-4 w-4" />
                      Add new project
                    </Button>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const clientName = clientMap.get(String(p.clientId))?.fullName || "—";
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                      onClick={() => navigate(detailRoute.replace(":projectId", p.id))}
                    >
                      <td className="py-4 px-4 pl-6 font-mono text-xs font-semibold text-muted-foreground group-hover:text-primary">
                        {p.id}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                        {p.leadReferenceNo ? (
                          p.leadId ? (
                            <Link
                              to={ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", p.leadId)}
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {p.leadReferenceNo}
                            </Link>
                          ) : (
                            p.leadReferenceNo
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium">{p.name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{clientName}</td>
                      <td className="py-4 px-4">
                        <Badge variant={p.isActive ? "success" : "secondary"}>
                          {p.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground text-xs">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-AU") : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border/40 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>
    </PageShell>
  );
}
