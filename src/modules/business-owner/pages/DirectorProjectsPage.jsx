import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import DashboardHeader from "@/modules/super-admin/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { fetchCompanyBoqPortfolio } from "@/modules/admin/api/boq.api";
import { formatAed, latestBoqTotal } from "../utils/directorDashboardUtils";

const STATUSES = ["All", "Planning", "In Progress", "On Hold", "Completed", "Cancelled"];

function StatusBadge({ status }) {
  const variants = {
    "In Progress": "default",
    Completed: "success",
    Planning: "secondary",
    "On Hold": "warning",
    Cancelled: "destructive",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function mapPortfolioRow(row) {
  const id = String(row.projectId ?? row.id ?? "");
  const boqs = Array.isArray(row.boqs) ? row.boqs : [];
  const boqFromDocs = latestBoqTotal(boqs);
  const boq = Number(row.boqTotal ?? row.grandTotal ?? boqFromDocs ?? 0);
  const budget = Number(row.budget ?? 0) || boq;
  return {
    id,
    projectName: row.projectName || row.name || "",
    projectType: row.projectType || "—",
    location: row.location || "—",
    status: row.status || "Planning",
    progress: row.progress ?? 0,
    budget,
    boqTotal: boq,
  };
}

export default function DirectorProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCompanyBoqPortfolio()
      .then((rows) => {
        if (cancelled) return;
        setProjects(Array.isArray(rows) ? rows.map(mapPortfolioRow) : []);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = statusFilter === "All"
    ? projects
    : projects.filter((p) => normalizeStatus(p.status) === normalizeStatus(statusFilter));

  return (
    <PageShell>
      <DashboardHeader
        title="Project Portfolio"
        description="Execution progress, budgets, and BOQ variance across all projects."
      >
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button asChild size="sm" className="gap-2">
            <Link to={ROUTES.ADMIN.PROJECT_CREATE}>
              <Plus className="h-4 w-4" />
              Add new project
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.ADMIN.PROJECTS}>Admin projects</Link>
          </Button>
        </div>
      </DashboardHeader>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">BOQ Total</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const boq = Number(p.boqTotal || 0);
                  const budget = Number(p.budget || 0);
                  const variance = budget - boq;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium">{p.projectName}</p>
                        <p className="text-xs text-muted-foreground">{p.location}</p>
                      </TableCell>
                      <TableCell className="text-sm">{p.projectType}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[90px]">
                          <div className="flex-1 h-1.5 rounded-full bg-muted">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-xs">{p.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{formatAed(budget)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{formatAed(boq)}</TableCell>
                      <TableCell className={`text-right tabular-nums text-sm ${variance < 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {formatAed(variance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild size="sm" variant="ghost">
                            <Link to={ROUTES.BUSINESS_OWNER.PROJECT_BILLING.replace(":projectId", p.id)}>
                              Billing
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link to={ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", p.id)}>Open</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No projects match this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
