import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "@/modules/super-admin/components/DashboardHeader";
import { PageShell, StatTile } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ROUTES, boqViewPath } from "@/shared/constants/routes";
import { filterBoqInboxForRole } from "@/shared/constants/roles";
import { useAuth } from "@/shared/context/auth-context";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchBoqsByProject, fetchBoqInbox } from "@/modules/admin/api/boq.api";
import { BoqStatusBadge } from "@/modules/admin/pages/boq/BoqApprovalTimeline";
import { formatCurrency } from "@/modules/admin/pages/boq/quantityCalcUtils";
import { formatAed } from "../utils/directorDashboardUtils";
import { boqFunnelCounts } from "../utils/directorDashboardUtils";

export default function DirectorCommercialPage() {
  const { role } = useAuth();
  const [rows, setRows] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAllProjects(), fetchBoqInbox(role)])
      .then(async ([projects, inboxItems]) => {
        setInbox(filterBoqInboxForRole(inboxItems, role));
        const allBoqs = [];
        const tableRows = [];
        for (const p of projects) {
          const boqs = await fetchBoqsByProject(p.id).catch(() => []);
          const list = Array.isArray(boqs) ? boqs : [];
          allBoqs.push(...list);
          list.forEach((b) => {
            tableRows.push({
              ...b,
              projectId: p.id,
              projectName: p.projectName,
            });
          });
        }
        tableRows.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        setRows(tableRows);
        setFunnel(boqFunnelCounts(allBoqs));
      })
      .catch(() => {
        setRows([]);
        setInbox([]);
      })
      .finally(() => setLoading(false));
  }, [role]);

  const approvedTotal = rows
    .filter((r) => ["APPROVED", "FINAL"].includes(String(r.status).toUpperCase()))
    .reduce((s, r) => s + Number(r.grandTotal || 0), 0);

  return (
    <PageShell>
      <DashboardHeader
        title="Commercial / BOQ Pipeline"
        description="All BOQ versions, approval status, and director sign-off queue."
      >
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.BUSINESS_OWNER.BOQ_INBOX}>BOQ Inbox</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.ADMIN.BOQ}>BOQ workspace</Link>
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total BOQs" value={loading ? "—" : rows.length} />
        <StatTile label="Pending your approval" value={loading ? "—" : inbox.length} />
        <StatTile label="Approved value (sum)" value={loading ? "—" : formatAed(approvedTotal)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-base">Approval funnel</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? <Skeleton className="h-32 w-full" /> : funnel.map((f) => (
              <div key={f.status} className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">{f.label}</span>
                <span className="font-medium">{f.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">All BOQ documents</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No BOQs found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.projectName}</TableCell>
                      <TableCell className="font-mono text-xs">v{r.version}</TableCell>
                      <TableCell><BoqStatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(r.grandTotal)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link to={boqViewPath(role, r.id, r.projectId)}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
