import { Link } from "react-router-dom";
import {
  Briefcase, DollarSign, TrendingUp, Warehouse, AlertTriangle,
  Inbox, Users, MapPin, ArrowRight, Package, FileText, ClipboardList,
} from "lucide-react";
import DashboardHeader from "@/modules/super-admin/components/DashboardHeader";
import { PageShell, StatTile } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  EvilBarChart, Bar, Grid, XAxis, Legend, Tooltip,
} from "@/components/evilcharts/charts/bar-chart";
import {
  EvilPieChart, Pie, Legend as PieLegend, Tooltip as PieTooltip,
} from "@/components/evilcharts/charts/pie-chart";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";
import useDirectorDashboard from "../hooks/useDirectorDashboard";
import { formatAed } from "../utils/directorDashboardUtils";
import { BoqStatusBadge } from "@/modules/admin/pages/boq/BoqApprovalTimeline";

const KPI_CONFIG = [
  { key: "activeProjects", label: "Active projects", icon: Briefcase, accent: "from-[#18181B]/[0.06] text-[#18181B]" },
  { key: "contractValue", label: "Contract value", icon: DollarSign, accent: "from-[#C4845A]/[0.10] text-[#C4845A]", format: formatAed },
  { key: "avgProgress", label: "Avg progress", icon: TrendingUp, accent: "from-[#C4845A]/[0.12] text-[#C4845A]", suffix: "%" },
  { key: "stockValue", label: "Stock on hand", icon: Warehouse, accent: "from-[#18181B]/[0.07] text-[#18181B]", format: formatAed },
  { key: "lowStockCount", label: "Low-stock alerts", icon: AlertTriangle, accent: "from-[#C4845A]/[0.10] text-[#C4845A]" },
  { key: "pendingApprovals", label: "BOQ pending approval", icon: Inbox, accent: "from-amber-500/[0.07] text-amber-600" },
  { key: "openLeads", label: "Open leads", icon: Users, accent: "from-sky-500/[0.07] text-sky-600" },
  { key: "siteVisitsThisMonth", label: "Site visits (month)", icon: MapPin, accent: "from-violet-500/[0.07] text-violet-600" },
];

const STATUS_COLORS = {
  Planning: "secondary",
  "In Progress": "default",
  "On Hold": "warning",
  Completed: "success",
  Cancelled: "destructive",
};

const BAR_CONFIG = {
  value: { label: "Stock Value", colors: { light: ["#C4845A", "#18181B"], dark: ["#C4845A", "#18181B"] } },
};

const PIE_COLORS = ["#18181B", "#C4845A", "#A67C5D", "#3F3F46", "#D4A574", "#52525B"];

function StatusBadge({ status }) {
  return <Badge variant={STATUS_COLORS[status] || "outline"}>{status}</Badge>;
}

export default function DirectorDashboard() {
  const { user } = useAuth();
  const {
    loading, kpis, portfolio, stockByCategory, boqFunnel, movements,
    inbox, lowStock, atRisk, leadsPie, reload,
  } = useDirectorDashboard();

  const pieConfig = leadsPie.reduce((acc, item, i) => {
    acc[item.name] = {
      label: item.name,
      colors: { light: [PIE_COLORS[i % PIE_COLORS.length]], dark: [PIE_COLORS[i % PIE_COLORS.length]] },
    };
    return acc;
  }, {});

  return (
    <PageShell className="space-y-8">
      <DashboardHeader
        title={`Good day, ${user?.name?.split(" ")[0] || "Director"}`}
        description="Executive overview — portfolio, procurement, commercial pipeline, and CRM."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.BUSINESS_OWNER.BOQ_INBOX}>
              <Inbox className="h-4 w-4 mr-1" /> BOQ Inbox
              {kpis.pendingApprovals > 0 && (
                <Badge className="ml-1" variant="destructive">{kpis.pendingApprovals}</Badge>
              )}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.ADMIN.PROJECT_CREATE}>New Project</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.ADMIN.PROCUREMENT_RECEIPT}>Stock Receipt</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={reload}>Refresh</Button>
        </div>
      </DashboardHeader>

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CONFIG.map(({ key, label, icon: Icon, format, suffix }) => {
          const raw = kpis[key];
          const value = loading ? "—" : format ? format(raw) : `${raw}${suffix || ""}`;
          return (
            <StatTile key={key} label={label} value={value} icon={Icon} />
          );
        })}
      </div>

      {/* Analytics grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Project portfolio</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to={ROUTES.BUSINESS_OWNER.PROJECTS}>View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : portfolio.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">BOQ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link to={ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", p.id)} className="font-medium hover:underline">
                          {p.projectName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{p.clientName}</p>
                      </TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-xs tabular-nums">{p.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{formatAed(p.budget)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{formatAed(p.boqTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">BOQ approval funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="space-y-2">
                {boqFunnel.filter((f) => f.count > 0).map((f) => (
                  <div key={f.status} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{f.label}</span>
                    <Badge variant="outline">{f.count}</Badge>
                  </div>
                ))}
                {boqFunnel.every((f) => f.count === 0) && (
                  <p className="text-sm text-muted-foreground">No BOQ documents yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Stock value by category</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to={ROUTES.BUSINESS_OWNER.PROCUREMENT}>Procurement <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? <Skeleton className="h-full w-full" /> : stockByCategory.length > 0 ? (
              <EvilBarChart data={stockByCategory} config={BAR_CONFIG} xKey="category" className="h-full w-full">
                <Grid horizontal />
                <XAxis dataKey="category" />
                <Bar dataKey="value" />
                <Tooltip />
                <Legend />
              </EvilBarChart>
            ) : (
              <p className="text-sm text-muted-foreground">No stock data.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent stock movements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : movements.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No recent movements.</p>
            ) : (
              <Table>
                <TableBody>
                  {movements.map((m, i) => (
                    <TableRow key={m.id || i}>
                      <TableCell className="text-xs">{m.materialName || m.materialCode || "—"}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{m.quantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.movementType}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">CRM — leads by status</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to={ROUTES.BUSINESS_OWNER.CRM}>CRM snapshot <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="h-56">
            {loading ? <Skeleton className="h-full w-full" /> : leadsPie.length > 0 ? (
              <EvilPieChart data={leadsPie} config={pieConfig} nameKey="name" dataKey="value" className="h-full w-full">
                <Pie dataKey="value" nameKey="name" />
                <PieTooltip />
                <PieLegend />
              </EvilPieChart>
            ) : (
              <p className="text-sm text-muted-foreground">No leads data.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Commercial pipeline</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to={ROUTES.BUSINESS_OWNER.COMMERCIAL}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : inbox.length > 0 ? (
              <div className="space-y-2">
                {inbox.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{item.projectName}</p>
                      <BoqStatusBadge status={item.status} />
                    </div>
                    <span className="font-mono text-xs tabular-nums">{formatAed(item.grandTotal)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No BOQs awaiting your approval.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attention required */}
      <Card className="border-amber-200/60 bg-amber-50/30 dark:bg-amber-950/10 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Attention required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              {lowStock.slice(0, 3).map((s) => (
                <div key={s.materialId || s.id} className="flex items-center justify-between text-sm">
                  <span>Low stock: <strong>{s.materialName}</strong> ({s.quantityOnHand} {s.unit})</span>
                  <Button asChild size="sm" variant="outline">
                    <Link to={ROUTES.ADMIN.PROCUREMENT_RECEIPT}>Receipt</Link>
                  </Button>
                </div>
              ))}
              {inbox.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>BOQ approval: <strong>{item.projectName}</strong> v{item.version}</span>
                  <Button asChild size="sm" variant="outline">
                    <Link to={ROUTES.BUSINESS_OWNER.BOQ_INBOX}>Review</Link>
                  </Button>
                </div>
              ))}
              {atRisk.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>At-risk project: <strong>{p.projectName}</strong> ({p.status}, {p.progress}%)</span>
                  <Button asChild size="sm" variant="outline">
                    <Link to={ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", p.id)}>Open</Link>
                  </Button>
                </div>
              ))}
              {lowStock.length === 0 && inbox.length === 0 && atRisk.length === 0 && (
                <p className="text-sm text-muted-foreground">All clear — no urgent items.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Footer shortcuts */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Operations modules open in-place — your Command Center sidebar stays visible.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Projects", href: ROUTES.ADMIN.PROJECTS, icon: Briefcase },
            { label: "Procurement", href: ROUTES.ADMIN.PROCUREMENT_STOCK, icon: Package },
            { label: "QAS", href: ROUTES.ADMIN.QAS, icon: ClipboardList },
            { label: "Materials", href: ROUTES.ADMIN.MATERIAL_CONFIG, icon: FileText },
          ].map(({ label, href, icon: Icon }) => (
            <Button key={href} asChild size="sm" variant="ghost">
              <Link to={href}><Icon className="h-3.5 w-3.5 mr-1" />{label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
