import { Link } from "react-router-dom";
import {
  Briefcase, DollarSign, TrendingUp, Warehouse, AlertTriangle,
  Inbox, ArrowRight, Package, FileText, ClipboardList,
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
import useDirectorDashboard from "../hooks/useDirectorDashboard";
import { formatAed } from "../utils/directorDashboardUtils";
import { BoqStatusBadge } from "@/modules/admin/pages/boq/BoqApprovalTimeline";
import LoadingPanel from "@/components/shared/LoadingPanel";
import { loadingMessages } from "@/components/shared/loadingMessages";
import { cn } from "@/lib/utils";

const KPI_CONFIG = [
  { key: "activeProjects", label: "Active projects", icon: Briefcase },
  { key: "contractValue", label: "Contract value", icon: DollarSign, format: formatAed },
  { key: "totalCost", label: "Total cost (P&L)", icon: FileText, format: formatAed },
  { key: "margin", label: "Portfolio margin", icon: TrendingUp, format: formatAed },
  { key: "avgProgress", label: "Avg progress", icon: TrendingUp, suffix: "%" },
  { key: "stockValue", label: "Stock on hand", icon: Warehouse, format: formatAed },
  { key: "lowStockCount", label: "Low-stock alerts", icon: AlertTriangle },
  { key: "pendingApprovals", label: "BOQ pending approval", icon: Inbox },
];

const STATUS_COLORS = {
  Planning: "secondary",
  "In Progress": "default",
  "On Hold": "warning",
  Completed: "success",
  Cancelled: "destructive",
};

const BAR_CONFIG = {
  value: {
    label: "Stock Value",
    colors: { light: ["#C9A96E", "#0a1628"], dark: ["#C9A96E", "#0a1628"] },
  },
};

const PIE_COLORS = ["#0a1628", "#C9A96E", "#8a6d3b", "#3F3F46", "#d9be8a", "#52525B"];

const btnPrimary =
  "gap-1.5 border-0 bg-[#0a1628] text-[#FAF7F2] hover:bg-[#081729] hover:text-[#FAF7F2]";
const btnOutline =
  "gap-1.5 border-[#0a1628]/15 bg-card text-foreground hover:bg-[#C9A96E]/15 hover:text-[#8a6d3b] hover:border-[#C9A96E]/35";
const btnGhost =
  "gap-1.5 text-muted-foreground hover:bg-[#C9A96E]/12 hover:text-[#8a6d3b]";

function StatusBadge({ status }) {
  return <Badge variant={STATUS_COLORS[status] || "outline"}>{status}</Badge>;
}

function SectionCard({ title, action, className, children, contentClassName }) {
  return (
    <Card className={cn("border-border/70 bg-card shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        {action || null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

export default function DirectorDashboard() {
  const {
    loading, kpis, portfolio, stockByCategory, boqFunnel, movements,
    inbox, lowStock, atRisk, leadsPie,
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
        title="Project Director"
        description="Executive overview — portfolio, procurement, commercial pipeline, and CRM."
      >
        <Button asChild size="sm" className={btnPrimary}>
          <Link to={ROUTES.BUSINESS_OWNER.FINANCE}>
            <ClipboardList className="h-3.5 w-3.5" />
            Finance / P&L
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className={btnOutline}>
          <Link to={ROUTES.BUSINESS_OWNER.BOQ_INBOX}>
            <Inbox className="h-3.5 w-3.5" />
            BOQ Inbox
            {kpis.pendingApprovals > 0 ? (
              <Badge className="ml-0.5 h-5 min-w-5 justify-center border-none bg-[#C9A96E] px-1 text-[10px] text-[#0a1628]">
                {kpis.pendingApprovals}
              </Badge>
            ) : null}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className={btnOutline}>
          <Link to={ROUTES.ADMIN.PROJECT_CREATE}>New Project</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className={btnOutline}>
          <Link to={ROUTES.ADMIN.PROCUREMENT_RECEIPT}>Stock Receipt</Link>
        </Button>
      </DashboardHeader>

      {loading ? (
        <LoadingPanel size="page" messages={loadingMessages.dashboard} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CONFIG.map(({ key, label, icon: Icon, format, suffix }) => {
          const raw = kpis[key];
          const value = loading ? "—" : format ? format(raw) : `${raw}${suffix || ""}`;
          return <StatTile key={key} label={label} value={value} icon={Icon} />;
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <SectionCard
          className="lg:col-span-3"
          title="Project portfolio"
          contentClassName="p-0 overflow-x-auto"
          action={
            <Button asChild variant="ghost" size="sm" className={btnGhost}>
              <Link to={ROUTES.BUSINESS_OWNER.PROJECTS}>
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        >
          {loading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
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
                      <Link
                        to={ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", p.id)}
                        className="font-medium text-foreground transition-colors hover:text-[#8a6d3b]"
                      >
                        {p.projectName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.clientName}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-[100px] items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[#0a1628]"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums">{p.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatAed(p.budget)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatAed(p.boqTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard className="lg:col-span-2" title="BOQ approval funnel">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="space-y-2">
              {boqFunnel
                .filter((f) => f.count > 0)
                .map((f) => (
                  <div key={f.status} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{f.label}</span>
                    <Badge variant="outline" className="border-[#0a1628]/15 tabular-nums">
                      {f.count}
                    </Badge>
                  </div>
                ))}
              {boqFunnel.every((f) => f.count === 0) ? (
                <p className="text-sm text-muted-foreground">No BOQ documents yet.</p>
              ) : null}
            </div>
          )}
        </SectionCard>

        <SectionCard
          className="lg:col-span-3"
          title="Stock value by category"
          contentClassName="h-64"
          action={
            <Button asChild variant="ghost" size="sm" className={btnGhost}>
              <Link to={ROUTES.BUSINESS_OWNER.PROCUREMENT}>
                Procurement <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        >
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : stockByCategory.length > 0 ? (
            <EvilBarChart
              data={stockByCategory}
              config={BAR_CONFIG}
              xKey="category"
              className="h-full w-full"
            >
              <Grid horizontal />
              <XAxis dataKey="category" />
              <Bar dataKey="value" />
              <Tooltip />
              <Legend />
            </EvilBarChart>
          ) : (
            <p className="text-sm text-muted-foreground">No stock data.</p>
          )}
        </SectionCard>

        <SectionCard className="lg:col-span-2" title="Recent stock movements" contentClassName="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No recent movements.</p>
          ) : (
            <Table>
              <TableBody>
                {movements.map((m, i) => (
                  <TableRow key={m.id || i}>
                    <TableCell className="text-xs">{m.materialName || m.materialCode || "—"}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{m.quantity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.movementType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard
          className="lg:col-span-3"
          title="CRM — leads by status"
          contentClassName="h-56"
          action={
            <Button asChild variant="ghost" size="sm" className={btnGhost}>
              <Link to={ROUTES.BUSINESS_OWNER.CRM}>
                CRM snapshot <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        >
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : leadsPie.length > 0 ? (
            <EvilPieChart
              data={leadsPie}
              config={pieConfig}
              nameKey="name"
              dataKey="value"
              className="h-full w-full"
            >
              <Pie dataKey="value" nameKey="name" />
              <PieTooltip />
              <PieLegend />
            </EvilPieChart>
          ) : (
            <p className="text-sm text-muted-foreground">No leads data.</p>
          )}
        </SectionCard>

        <SectionCard
          className="lg:col-span-2"
          title="Commercial pipeline"
          action={
            <Button asChild variant="ghost" size="sm" className={btnGhost}>
              <Link to={ROUTES.BUSINESS_OWNER.COMMERCIAL}>View all</Link>
            </Button>
          }
        >
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : inbox.length > 0 ? (
            <div className="space-y-2">
              {inbox.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-sm border border-border/70 px-3 py-2 text-sm"
                >
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
        </SectionCard>
      </div>

      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A96E]/15 text-[#8a6d3b]">
              <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
            </span>
            Attention required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              {lowStock.slice(0, 3).map((s) => (
                <div
                  key={s.materialId || s.id}
                  className="flex items-center justify-between gap-3 rounded-sm border border-border/60 px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 text-foreground">
                    Low stock: <span className="font-semibold">{s.materialName}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      ({s.quantityOnHand} {s.unit})
                    </span>
                  </span>
                  <Button asChild size="sm" variant="outline" className={cn(btnOutline, "shrink-0")}>
                    <Link to={ROUTES.ADMIN.PROCUREMENT_RECEIPT}>Receipt</Link>
                  </Button>
                </div>
              ))}
              {inbox.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-sm border border-border/60 px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 text-foreground">
                    BOQ approval: <span className="font-semibold">{item.projectName}</span>
                    <span className="text-muted-foreground"> v{item.version}</span>
                  </span>
                  <Button asChild size="sm" variant="outline" className={cn(btnOutline, "shrink-0")}>
                    <Link to={ROUTES.BUSINESS_OWNER.BOQ_INBOX}>Review</Link>
                  </Button>
                </div>
              ))}
              {atRisk.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-sm border border-border/60 px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 text-foreground">
                    At-risk project: <span className="font-semibold">{p.projectName}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      ({p.status}, {p.progress}%)
                    </span>
                  </span>
                  <Button asChild size="sm" variant="outline" className={cn(btnOutline, "shrink-0")}>
                    <Link to={ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", p.id)}>Open</Link>
                  </Button>
                </div>
              ))}
              {lowStock.length === 0 && inbox.length === 0 && atRisk.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">All clear — no urgent items.</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Quick links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Projects", href: ROUTES.ADMIN.PROJECTS, icon: Briefcase },
              { label: "Procurement", href: ROUTES.ADMIN.PROCUREMENT_STOCK, icon: Package },
              { label: "QAS", href: ROUTES.ADMIN.QAS, icon: ClipboardList },
              { label: "Materials", href: ROUTES.ADMIN.MATERIAL_CONFIG, icon: FileText },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className="flex items-center gap-3 rounded-sm border border-border/70 bg-card px-3 py-3 text-sm font-medium text-foreground transition-colors hover:border-[#C9A96E]/40 hover:bg-[#C9A96E]/10 hover:text-[#8a6d3b]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0a1628]/6 text-[#0a1628]">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                {label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
