import { useEffect, useMemo, useState } from "react";
import { Download, Filter, Plus, Briefcase } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ProjectFilterBar from "../components/projects/ProjectFilterBar";
import ProjectTable from "../components/projects/ProjectTable";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectDetailDrawer from "../components/projects/ProjectDetailDrawer";
import { MOCK_PROJECTS } from "../data/projects";
import { PROJECT_STATUS } from "../constants/project.constants";

const PAGE_SIZE = 10;

function formatCurrency(n) {
  return n ? `$${n.toLocaleString()}` : "$0";
}

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const stats = useMemo(() => {
    const total = MOCK_PROJECTS.length;
    const active = MOCK_PROJECTS.filter((p) => p.status === PROJECT_STATUS.IN_PROGRESS).length;
    const completed = MOCK_PROJECTS.filter((p) => p.status === PROJECT_STATUS.COMPLETED).length;
    const revenue = MOCK_PROJECTS.reduce((s, p) => s + (p.revenue || 0), 0);
    const pendingPayments = MOCK_PROJECTS.filter(
      (p) => p.paymentStatus === "Pending" || p.paymentStatus === "Partial" || p.paymentStatus === "Overdue",
    ).length;
    const thisMonth = MOCK_PROJECTS.filter((p) => {
      const start = new Date(p.startDate);
      const now = new Date();
      return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
    }).length;
    return { total, active, completed, revenue, pendingPayments, thisMonth };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_PROJECTS.filter((p) => {
      const matchQ =
        !q ||
        p.clientName.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.company && p.company.toLowerCase().includes(q));
      const matchType = typeFilter === "all" || p.projectType === typeFilter;
      const matchManager = managerFilter === "all" || p.manager === managerFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchPayment = paymentFilter === "all" || p.paymentStatus === paymentFilter;
      return matchQ && matchType && matchManager && matchStatus && matchPayment;
    });
  }, [search, typeFilter, managerFilter, statusFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleView = (project) => {
    setSelectedProject(project);
    setDrawerOpen(true);
  };

  const handleMarkCompleted = (project) => {
    const idx = MOCK_PROJECTS.findIndex((p) => p.id === project.id);
    if (idx !== -1) {
      MOCK_PROJECTS[idx].status = PROJECT_STATUS.COMPLETED;
      MOCK_PROJECTS[idx].actualCompletion = new Date().toISOString().split("T")[0];
    }
    setSelectedProject(null);
  };

  const statsConfig = [
    { title: "Total Projects", value: stats.total, icon: Briefcase, growth: 10, growthLabel: "vs last month" },
    { title: "Active Projects", value: stats.active, icon: Briefcase, growth: 5, growthLabel: "vs last month" },
    { title: "Completed", value: stats.completed, icon: Briefcase, growth: 15, growthLabel: "vs last month" },
    { title: "Revenue Generated", value: formatCurrency(stats.revenue), icon: Briefcase, growth: 12, growthLabel: "vs last month" },
    { title: "Pending Payments", value: stats.pendingPayments, icon: Briefcase, growth: -8, growthLabel: "vs last month" },
    { title: "This Month", value: stats.thisMonth, icon: Briefcase, growth: 20, growthLabel: "conversions" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Track converted CRM projects and monitor execution progress."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statsConfig.map((s) => (
          <StatCard
            key={s.title}
            title={s.title}
            value={s.value}
            icon={s.icon}
            growth={s.growth}
            growthLabel={s.growthLabel}
          />
        ))}
      </section>

      <ProjectFilterBar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        managerFilter={managerFilter}
        onManagerChange={setManagerFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        paymentFilter={paymentFilter}
        onPaymentChange={setPaymentFilter}
        onResetPage={() => setPage(1)}
      />

      {/* Desktop table */}
      <Card className="hidden overflow-hidden border-border/60 shadow-sm md:block">
        <div className="max-h-[calc(100vh-26rem)] overflow-auto">
          <ProjectTable
            projects={paginated}
            loading={loading}
            onView={handleView}
            onClientProfile={(p) => {}}
            onViewPayments={(p) => {}}
            onViewProposal={(p) => {}}
            onEdit={(p) => {}}
            onMarkCompleted={handleMarkCompleted}
          />
        </div>
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {filtered.length} project{filtered.length !== 1 ? "s" : ""} &middot; Page {page} of {totalPages}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)} className="cursor-pointer">
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))
          : paginated.length === 0
            ? (
              <div className="py-12 text-center">
                <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium">No projects found</p>
                <p className="text-sm text-muted-foreground">Adjust filters or search terms</p>
              </div>
            )
            : paginated.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onView={handleView}
                  onEdit={() => {}}
                  onMarkCompleted={handleMarkCompleted}
                />
              ))}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-1 py-2">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <ProjectDetailDrawer
        project={selectedProject}
        open={drawerOpen}
        onOpenChange={(o) => { setDrawerOpen(o); if (!o) setSelectedProject(null); }}
      />
    </div>
  );
}
