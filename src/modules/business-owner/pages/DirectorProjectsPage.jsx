import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { ROUTES } from "@/shared/constants/routes";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchBoqsByProject } from "@/modules/admin/api/boq.api";
import { formatAed } from "../utils/directorDashboardUtils";

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

export default function DirectorProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [boqTotals, setBoqTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    setLoading(true);
    fetchAllProjects()
      .then(async (list) => {
        setProjects(list);
        const totals = {};
        await Promise.all(
          list.map((p) =>
            fetchBoqsByProject(p.id)
              .then((boqs) => {
                const approved = (Array.isArray(boqs) ? boqs : [])
                  .filter((b) => ["APPROVED", "FINAL"].includes(String(b.status).toUpperCase()))
                  .sort((a, b) => (b.version || 0) - (a.version || 0));
                totals[p.id] = approved[0]?.grandTotal || 0;
              })
              .catch(() => { totals[p.id] = 0; })
          )
        );
        setBoqTotals(totals);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter === "All"
    ? projects
    : projects.filter((p) => p.status === statusFilter);

  return (
    <div className="space-y-6">
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
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.ADMIN.PROJECTS}>Admin projects</Link>
          </Button>
        </div>
      </DashboardHeader>

      <Card className="border-border/60 shadow-sm">
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
                  const boq = Number(boqTotals[p.id] || 0);
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
                        <Button asChild size="sm" variant="ghost">
                          <Link to={ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", p.id)}>Open</Link>
                        </Button>
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
    </div>
  );
}
