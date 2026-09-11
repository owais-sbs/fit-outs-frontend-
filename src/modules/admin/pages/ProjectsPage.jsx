import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowUpDown, Briefcase, Plus } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { PageShell, StatTile, SearchInput, FilterToolbar } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAllProjects } from "../api/projects.api";
import { fetchAllClients } from "../api/clients.api";
import { ROUTES, portalRoutesFromPath } from "@/shared/constants/routes";

const SORT_ID = "id";
const SORT_NEW_FIRST = "new-first";
const SORT_OLD_FIRST = "old-first";

function projectCreatedMs(p) {
  if (!p?.createdAt) return 0;
  const ms = new Date(p.createdAt).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const portalRoutes = portalRoutesFromPath(location.pathname);
  const isFinance = location.pathname.startsWith("/finance");
  const detailRoute = portalRoutes.PROJECT_DETAIL;
  const createRoute = location.pathname.startsWith("/project-manager")
    ? `${ROUTES.PROJECT_MANAGER.PROJECTS}/new`
    : ROUTES.ADMIN.PROJECT_CREATE;
  const [projects, setProjects] = useState([]);
  const [clientMap, setClientMap] = useState(new Map());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(SORT_ID);
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
    const matched = projects.filter((p) => {
      if (!q) return true;
      const clientName = clientMap.get(String(p.clientId))?.fullName || "";
      return (
        String(p.id).includes(q) ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.leadReferenceNo || "").toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q)
      );
    });

    return [...matched].sort((a, b) => {
      if (sort === SORT_NEW_FIRST) {
        const byDate = projectCreatedMs(b) - projectCreatedMs(a);
        return byDate !== 0 ? byDate : Number(b.id) - Number(a.id);
      }
      if (sort === SORT_OLD_FIRST) {
        const byDate = projectCreatedMs(a) - projectCreatedMs(b);
        return byDate !== 0 ? byDate : Number(a.id) - Number(b.id);
      }
      return Number(a.id) - Number(b.id);
    });
  }, [projects, search, clientMap, sort]);

  return (
    <PageShell>
      <PageHeader
        title="Projects"
        description="All projects in your company."
        actions={
          !isFinance ? (
            <Button size="sm" className="gap-2" onClick={() => navigate(createRoute)}>
              <Plus className="h-4 w-4" />
              Add new project
            </Button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total" value={stats.total} />
        <StatTile label="Active" value={stats.active} />
        <StatTile label="Inactive" value={stats.inactive} />
      </div>

      <FilterToolbar>
        <SearchInput
          placeholder="Search project ID, lead ref, name, client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-8 w-[160px] rounded-lg gap-2" aria-label="Sort projects">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SORT_ID}>By ID</SelectItem>
            <SelectItem value={SORT_NEW_FIRST}>New first</SelectItem>
            <SelectItem value={SORT_OLD_FIRST}>Old first</SelectItem>
          </SelectContent>
        </Select>
      </FilterToolbar>

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
