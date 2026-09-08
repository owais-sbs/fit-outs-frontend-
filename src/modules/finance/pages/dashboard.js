import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote, Briefcase, CircleDollarSign, Loader2, RefreshCw, Wallet,
} from "lucide-react";
import DashboardHeader from "@/modules/super-admin/components/DashboardHeader";
import { PageShell, StatTile } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchBillingMilestones } from "@/modules/admin/api/billing.api";
import { ROUTES } from "@/shared/constants/routes";
import { formatAed } from "@/shared/utils/currency";
import { BillingApprovalPipeline } from "@/modules/admin/pages/billing/BillingApprovalPipeline";

const PAID_STATUSES = new Set(["PAID", "PART_PAID"]);

function paymentStatus(milestone) {
  return (
    milestone?.paymentRequest?.status ||
    milestone?.latestPaymentRequest?.status ||
    milestone?.status ||
    "DRAFT"
  );
}

export default function FinanceDashboard() {
  const [projects, setProjects] = useState([]);
  const [milestoneRows, setMilestoneRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const projectData = await fetchAllProjects();
      const list = Array.isArray(projectData) ? projectData : [];
      setProjects(list);

      const groups = await Promise.all(
        list.map(async (project) => {
          const milestones = await fetchBillingMilestones(project.id).catch(() => []);
          return {
            project,
            milestones: Array.isArray(milestones) ? milestones : [],
          };
        })
      );

      const rows = groups.flatMap(({ project, milestones }) =>
        milestones.map((m) => ({
          ...m,
          projectId: project.id,
          projectName: project.projectName,
        }))
      );
      rows.sort((a, b) => new Date(b.dueDate || b.updatedAt || 0) - new Date(a.dueDate || a.updatedAt || 0));
      setMilestoneRows(rows);
      setRefreshedAt(new Date());
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load finance dashboard");
      setProjects([]);
      setMilestoneRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(() => {
    const budget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    const billed = milestoneRows.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const paid = milestoneRows
      .filter((m) => PAID_STATUSES.has(String(paymentStatus(m)).toUpperCase()))
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);
    return {
      budget,
      billed,
      paid,
      outstanding: Math.max(0, billed - paid),
      projectCount: projects.length,
      milestoneCount: milestoneRows.length,
    };
  }, [projects, milestoneRows]);

  return (
    <PageShell className="space-y-8">
      <DashboardHeader
        title="Finance Dashboard"
        description="Billing, milestones, and commercial health across projects."
      >
        <div className="flex items-center gap-2">
          {refreshedAt && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Updated {refreshedAt.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </DashboardHeader>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading finance dashboard…
        </div>
      )}

      {!loading && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Project budget" value={formatAed(kpis.budget)} icon={Wallet} />
            <StatTile label="Milestones billed" value={formatAed(kpis.billed)} icon={CircleDollarSign} />
            <StatTile label="Collected" value={formatAed(kpis.paid)} icon={Banknote} />
            <StatTile
              label="Outstanding"
              value={formatAed(kpis.outstanding)}
              icon={Briefcase}
              hint={`${kpis.milestoneCount} milestone${kpis.milestoneCount === 1 ? "" : "s"} · ${kpis.projectCount} projects`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Projects</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {projects.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">No projects yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="pr-6 text-right">Budget</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.slice(0, 8).map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="pl-6">
                            <Link
                              className="font-medium text-primary hover:underline"
                              to={ROUTES.FINANCE.PROJECT_BILLING.replace(":projectId", project.id)}
                            >
                              {project.projectName}
                            </Link>
                            <p className="text-xs text-muted-foreground">{project.clientName}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-[10px]">
                              {project.status || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-right font-medium">
                            {formatAed(project.budget || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billing milestones</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {milestoneRows.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No billing milestones yet. Open a project to add them.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Milestone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="pr-6 text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {milestoneRows.slice(0, 8).map((row) => (
                        <TableRow key={row.uuid || `${row.projectId}-${row.name}`}>
                          <TableCell className="pl-6">
                            <p className="font-medium">{row.name || "Milestone"}</p>
                            <p className="text-xs text-muted-foreground">{row.projectName}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="mb-2 text-[10px]">
                              {paymentStatus(row)}
                            </Badge>
                            <BillingApprovalPipeline status={paymentStatus(row)} compact className="max-w-[200px]" />
                          </TableCell>
                          <TableCell className="pr-6 text-right font-medium">
                            {formatAed(row.amount || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PageShell>
  );
}
