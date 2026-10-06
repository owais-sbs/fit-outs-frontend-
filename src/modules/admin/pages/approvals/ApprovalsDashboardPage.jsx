import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Coins } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { portalRoutesFromPath } from "@/shared/constants/routes";
import { fetchApprovalDashboard, fetchDeposits } from "../../api/approvals.api";
import {
  ATTENTION_PREVIEW_LIMIT,
  PROJECT_COUNT_COLUMNS,
  PROJECT_FILTERS,
  daysLabel,
  money,
  statusLabel,
  statusTone,
  summarizePortfolio,
  urgencyTone,
} from "./approvalStatus";

function projectLabel(row) {
  return row.projectName || (row.projectId != null ? `Project ${row.projectId}` : "Project");
}

function CountValue({ value, variant }) {
  if (!value) {
    return <span className="text-muted-foreground">0</span>;
  }
  return <Badge variant={variant}>{value}</Badge>;
}

function MetricCard({ label, value, detail, loading }) {
  return (
    <Card>
      <CardHeader className="space-y-1 p-4 md:p-4">
        <CardDescription>{label}</CardDescription>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
        )}
        {loading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null
        )}
      </CardHeader>
    </Card>
  );
}

export default function ApprovalsDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const routes = portalRoutesFromPath(location.pathname);
  const tableRef = useRef(null);

  const [cases, setCases] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [c, d] = await Promise.allSettled([fetchApprovalDashboard(), fetchDeposits()]);
    setCases(c.status === "fulfilled" && Array.isArray(c.value) ? c.value : []);
    setDeposits(d.status === "fulfilled" && Array.isArray(d.value) ? d.value : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const portfolio = useMemo(() => summarizePortfolio(cases), [cases]);
  const outstanding = deposits.filter((d) => !d.refundReceivedDate);
  const outstandingTotal = outstanding.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const currency = outstanding[0]?.currency || "AED";

  const attentionProjectKeys = useMemo(() => {
    const keys = new Set();
    for (const item of portfolio.attention) {
      const id = item.permit.projectId;
      keys.add(id != null ? `id:${id}` : `name:${item.permit.projectName || projectLabel(item.permit)}`);
    }
    return keys;
  }, [portfolio.attention]);

  const visibleProjects = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return portfolio.projects.filter((project) => {
      const key = project.projectId != null ? `id:${project.projectId}` : `name:${project.projectName}`;
      if (filter === "attention" && !attentionProjectKeys.has(key)) return false;
      if (filter !== "all" && filter !== "attention" && project.tone !== filter) return false;
      if (!needle) return true;
      return project.projectName.toLowerCase().includes(needle);
    });
  }, [portfolio.projects, attentionProjectKeys, filter, query]);

  const attentionPreview = portfolio.attention.slice(0, ATTENTION_PREVIEW_LIMIT);
  const attentionOverflow = portfolio.attention.length - attentionPreview.length;

  const projectHref = preview?.projectId
    ? `${routes.PROJECT_APPROVALS.replace(":projectId", preview.projectId)}?case=${encodeURIComponent(preview.uuid)}`
    : null;

  const openProject = (project) => {
    if (project.projectId == null) return;
    navigate(routes.PROJECT_APPROVALS.replace(":projectId", project.projectId));
  };

  const showAttentionProjects = () => {
    setFilter("attention");
    setQuery("");
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const emptyCaption = portfolio.projects.length === 0
    ? "No permits yet."
    : "No projects match this view.";

  const approvedDetail = portfolio.open
    ? `${portfolio.approvedShare}% of open permits`
    : "No open permits";

  return (
    <PageShell>
      <PageTitle
        title="Approvals & Permits"
        subtitle="Permit progress across every project."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Needs attention"
          value={portfolio.needsAttention}
          detail="Permits that need a person"
          loading={loading}
        />
        <MetricCard
          label="Ready to submit"
          value={portfolio.ready}
          detail="Packs waiting to go out"
          loading={loading}
        />
        <MetricCard
          label="With the authority"
          value={portfolio.withAuthority}
          detail="Submitted or under review"
          loading={loading}
        />
        <MetricCard
          label="Approved"
          value={portfolio.approved}
          detail={approvedDetail}
          loading={loading}
        />
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-4 md:p-4">
            <div className="min-w-0 space-y-1">
              <CardDescription className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5" />
                Deposit ledger
              </CardDescription>
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <CardTitle className="text-2xl tabular-nums">{money(outstandingTotal, currency)}</CardTitle>
              )}
              {loading ? (
                <Skeleton className="h-4 w-36" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {outstanding.length
                    ? `${outstanding.length} still held by others`
                    : "Nothing outstanding"}
                </p>
              )}
            </div>
            <Button asChild size="sm">
              <Link to={routes.DEPOSIT_LEDGER}>
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-4 md:p-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-sm">Needs attention</CardTitle>
            <CardDescription>The permits that need a person, most urgent first.</CardDescription>
          </div>
          {!loading && attentionOverflow > 0 && (
            <Button variant="outline" size="sm" onClick={showAttentionProjects}>
              Show all {portfolio.attention.length}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-1 p-4 pt-0 md:p-4 md:pt-0">
          {loading ? (
            Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))
          ) : attentionPreview.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
          ) : (
            attentionPreview.map((item) => (
              <Button
                key={item.permit.uuid}
                type="button"
                variant="ghost"
                className="h-auto w-full justify-between gap-3 px-2 py-2 text-left font-normal"
                onClick={() => setPreview(item.permit)}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {item.permit.permitTypeName || "Permit"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {projectLabel(item.permit)}
                  </span>
                </span>
                <Badge variant={item.kind === "danger" ? "danger" : "warning"} className="shrink-0">
                  {item.reason}
                </Badge>
              </Button>
            ))
          )}
        </CardContent>
      </Card>

      <section ref={tableRef} className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
            className="lg:max-w-xs"
            disabled={loading}
          />
          <div className="flex flex-wrap gap-2">
            {PROJECT_FILTERS.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={filter === item.id ? "secondary" : "outline"}
                onClick={() => setFilter(item.id)}
                disabled={loading}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <Table framed stickyHeader className="min-w-[880px]">
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              {PROJECT_COUNT_COLUMNS.map((column) => (
                <TableHead key={column.key} numeric>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">{column.label}</span>
                    </TooltipTrigger>
                    <TooltipContent>{column.hint}</TooltipContent>
                  </Tooltip>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }, (_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={2 + PROJECT_COUNT_COLUMNS.length}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
              : visibleProjects.map((project) => {
                const interactive = project.projectId != null;
                return (
                  <TableRow
                    key={project.projectId ?? project.projectName}
                    className={`${project.rowClass}${interactive ? " cursor-pointer" : ""}`}
                    onClick={() => openProject(project)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openProject(project);
                      }
                    }}
                    tabIndex={interactive ? 0 : undefined}
                    role={interactive ? "link" : undefined}
                    aria-label={interactive ? `Open approvals for ${project.projectName}` : undefined}
                  >
                    <TableCell>
                      <div className="font-medium">{project.projectName}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {project.tone === "closed"
                          ? "All permits closed"
                          : `${project.counts.approved}/${project.counts.required} approved`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.badgeVariant}>{project.label}</Badge>
                    </TableCell>
                    {PROJECT_COUNT_COLUMNS.map((column) => (
                      <TableCell key={column.key} numeric>
                        <CountValue value={project.counts[column.key]} variant={column.variant} />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
          </TableBody>
          {!loading && visibleProjects.length === 0 && (
            <TableCaption>{emptyCaption}</TableCaption>
          )}
        </Table>
      </section>

      <Sheet open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          {preview && (
            <>
              <SheetHeader className="pr-8 text-left">
                <SheetDescription>{projectLabel(preview)}</SheetDescription>
                <SheetTitle>{preview.permitTypeName || "Permit"}</SheetTitle>
              </SheetHeader>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={statusTone(preview.status)}>{statusLabel(preview.status)}</Badge>
                {preview.caseNumber && (
                  <span className="font-mono text-xs text-muted-foreground">{preview.caseNumber}</span>
                )}
              </div>
              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Authority</dt>
                  <dd className="mt-0.5">{preview.authorityName || preview.authorityCode || "Not resolved"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Owner</dt>
                  <dd className="mt-0.5">{preview.assignedToName || "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">SLA due</dt>
                  <dd className={`mt-0.5 ${urgencyTone(preview.daysToSlaDue)}`}>
                    {preview.slaDueDate ? `${preview.slaDueDate} · ${daysLabel(preview.daysToSlaDue)}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Expiry</dt>
                  <dd className={`mt-0.5 ${urgencyTone(preview.daysToExpiry)}`}>
                    {preview.expiryDate ? `${preview.expiryDate} · ${daysLabel(preview.daysToExpiry, "ago")}` : "—"}
                  </dd>
                </div>
                {preview.blockReason && (
                  <div className="rounded-lg bg-warning/10 px-3 py-2 text-warning-foreground">
                    <dt className="text-xs font-medium">Needs attention</dt>
                    <dd className="mt-0.5">{preview.blockReason}</dd>
                  </div>
                )}
              </dl>
              {projectHref && (
                <Button asChild className="mt-auto">
                  <Link to={projectHref}>
                    Go to project
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
