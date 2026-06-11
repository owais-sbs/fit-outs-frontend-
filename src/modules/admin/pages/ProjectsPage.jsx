import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Plus, Briefcase, CheckCircle, Clock, AlertTriangle, Sliders, Edit2, Eye, Search, MapPin } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectStore } from "@/shared/store/projectStore";
import { ROUTES } from "@/shared/constants/routes";
import { INITIAL_EMPLOYEES } from "@/modules/admin/data/employees";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Quick Action States
  const [progressModalProj, setProgressModalProj] = useState(null);
  const [newProgress, setNewProgress] = useState(0);

  const [editModalProj, setEditModalProj] = useState(null);
  const [editForm, setEditForm] = useState({ status: "", assignedManager: "", budget: "" });

  const loadProjects = useCallback(() => {
    setProjects(projectStore.getProjects());
  }, []);

  useEffect(() => {
    loadProjects();
    const timer = setTimeout(() => setLoading(false), 500);
    
    // Listen for storage changes to sync
    window.addEventListener("storage_update", loadProjects);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage_update", loadProjects);
    };
  }, [loadProjects]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "In Progress").length;
    const completed = projects.filter((p) => p.status === "Completed").length;
    const pending = projects.filter((p) => p.status === "Planning" || p.status === "On Hold").length;
    return { total, active, completed, pending };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesSearch =
        !query ||
        p.id.toLowerCase().includes(query) ||
        p.projectName.toLowerCase().includes(query) ||
        p.clientName.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesType = typeFilter === "all" || p.projectType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [projects, search, statusFilter, typeFilter]);

  const handleUpdateProgressSubmit = (e) => {
    e.preventDefault();
    if (!progressModalProj) return;
    projectStore.updateProject(progressModalProj.id, { progress: newProgress });
    loadProjects();
    setProgressModalProj(null);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editModalProj) return;
    projectStore.updateProject(editModalProj.id, editForm);
    loadProjects();
    setEditModalProj(null);
  };

  const openProgressModal = (e, proj) => {
    e.stopPropagation();
    setProgressModalProj(proj);
    setNewProgress(proj.progress);
  };

  const openEditModal = (e, proj) => {
    e.stopPropagation();
    setEditModalProj(proj);
    setEditForm({
      status: proj.status,
      assignedManager: proj.assignedManager,
      budget: proj.budget,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "In Progress":
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border-none font-medium">In Progress</Badge>;
      case "Completed":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-none font-medium">Completed</Badge>;
      case "Planning":
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-none font-medium">Planning</Badge>;
      case "On Hold":
        return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20 border-none font-medium">On Hold</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects Management"
        description="Monitor construction execution, track timelines, documents and update progress."
        actions={
          <Button onClick={() => navigate(ROUTES.ADMIN.PROJECT_CREATE)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        }
      />

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Projects" value={stats.total} icon={Briefcase} growth={8} growthLabel="vs last month" />
        <StatCard title="Active Projects" value={stats.active} icon={Sliders} growth={12} growthLabel="vs last month" />
        <StatCard title="Completed Projects" value={stats.completed} icon={CheckCircle} growth={15} growthLabel="vs last month" />
        <StatCard title="Pending / Planning" value={stats.pending} icon={Clock} growth={-5} growthLabel="vs last month" />
      </section>

      {/* Filters Bar */}
      <Card className="border-border/60 shadow-sm bg-card/65 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search project ID, name, client..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Residential">Residential</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Interior">Interior</SelectItem>
                <SelectItem value="Renovation">Renovation</SelectItem>
                <SelectItem value="Construction">Construction</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card className="overflow-hidden border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4 pl-6">Project ID</th>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Manager</th>
                <th className="py-3 px-4 w-[150px]">Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 pl-6"><div className="h-4 w-12 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-full bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="py-4 px-4 pr-6 text-right"><div className="h-8 w-20 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No projects found</p>
                    <p className="text-xs">Try adjusting your filters or search terms</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", p.id))}
                  >
                    <td className="py-4 px-4 pl-6 font-mono text-xs font-semibold text-muted-foreground group-hover:text-primary">
                      {p.id}
                    </td>
                    <td className="py-4 px-4 font-medium max-w-[200px] truncate">
                      {p.projectName}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{p.clientName}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="text-xs font-normal bg-background/50">{p.projectType}</Badge>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        <span className="truncate max-w-[120px]">{p.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{p.assignedManager || "Unassigned"}</td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                          <span>{p.progress}%</span>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="View Details"
                          onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", p.id))}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Update Progress"
                          onClick={(e) => openProgressModal(e, p)}
                        >
                          <Sliders className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Quick Edit"
                          onClick={(e) => openEditModal(e, p)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Progress Dialog Overlay */}
      {progressModalProj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md border-border/80 shadow-2xl p-6 relative">
            <h3 className="text-lg font-semibold mb-1">Update Progress</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Set the current execution completion percentage for <span className="font-semibold text-foreground">{progressModalProj.projectName}</span>.
            </p>

            <form onSubmit={handleUpdateProgressSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <Label>Completion Percentage</Label>
                  <span className="text-primary">{newProgress}%</span>
                </div>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newProgress}
                  onChange={(e) => setNewProgress(parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer accent-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setProgressModalProj(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Quick Edit Dialog Overlay */}
      {editModalProj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md border-border/80 shadow-2xl p-6 relative">
            <h3 className="text-lg font-semibold mb-1">Quick Edit Project</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Modify status, budget or project manager for <span className="font-semibold text-foreground">{editModalProj.projectName}</span>.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-status" className="text-xs font-semibold">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(val) => setEditForm((f) => ({ ...f, status: val }))}
                >
                  <SelectTrigger id="edit-status" className="h-9">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-manager" className="text-xs font-semibold">Project Manager</Label>
                <Select
                  value={editForm.assignedManager}
                  onValueChange={(val) => setEditForm((f) => ({ ...f, assignedManager: val }))}
                >
                  <SelectTrigger id="edit-manager" className="h-9">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {INITIAL_EMPLOYEES.map((emp) => (
                      <SelectItem key={emp.id} value={emp.firstName + " " + emp.lastName}>
                        {emp.firstName} {emp.lastName} ({emp.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-budget" className="text-xs font-semibold">Budget ($)</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  className="h-9"
                  value={editForm.budget}
                  onChange={(e) => setEditForm((f) => ({ ...f, budget: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditModalProj(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
