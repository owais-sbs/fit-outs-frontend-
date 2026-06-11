import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Sliders, CheckCircle, MapPin, Eye, Search } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { projectStore } from "@/shared/store/projectStore";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";

export default function MyProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Filter projects by current logged-in client name/ID
  // In mock data, the current client user name might be "Claire Moss" or "client-001"
  const loadClientProjects = useCallback(() => {
    const allProjects = projectStore.getProjects();
    const clientName = user?.name || "Claire Moss";
    const clientProjects = allProjects.filter(
      (p) => p.clientName.toLowerCase() === clientName.toLowerCase() || p.clientId === "client-001"
    );
    setProjects(clientProjects);
  }, [user]);

  useEffect(() => {
    loadClientProjects();
    const timer = setTimeout(() => setLoading(false), 500);
    
    window.addEventListener("storage_update", loadClientProjects);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage_update", loadClientProjects);
    };
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
        p.id.toLowerCase().includes(query) ||
        p.projectName.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query)
      );
    });
  }, [projects, search]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "In Progress":
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-none font-medium">In Progress</Badge>;
      case "Completed":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-none font-medium">Completed</Badge>;
      case "Planning":
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-none font-medium">Planning</Badge>;
      case "On Hold":
        return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-none font-medium">On Hold</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Projects"
        description="Track your fit-out and construction project execution progress, timeline, and site audits."
      />

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Assigned Projects" value={stats.total} icon={Briefcase} growth={0} growthLabel="Total contracted" />
        <StatCard title="Active In Execution" value={stats.active} icon={Sliders} growth={0} growthLabel="Underway" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} growth={0} growthLabel="Delivered" />
      </section>

      {/* Search Filter */}
      <Card className="border-border/60 shadow-sm bg-card/65 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project name, ID..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4 pl-6">Project ID</th>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Project Manager</th>
                <th className="py-3 px-4 w-[200px]">Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 pl-6"><div className="h-4 w-12 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-40 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-full bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="py-4 px-4 pr-6 text-right"><div className="h-8 w-16 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No projects linked to your account</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", p.id))}
                  >
                    <td className="py-4 px-4 pl-6 font-mono text-xs font-semibold text-muted-foreground group-hover:text-primary">
                      {p.id}
                    </td>
                    <td className="py-4 px-4 font-semibold text-foreground">
                      {p.projectName}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="text-xs font-normal bg-background/50">{p.projectType}</Badge>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        <span>{p.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{p.assignedManager || "Unassigned"}</td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>{p.progress}% Completed</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-4 px-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
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
      </Card>
    </div>
  );
}
