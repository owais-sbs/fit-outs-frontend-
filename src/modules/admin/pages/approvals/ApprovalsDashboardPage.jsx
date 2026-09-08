import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, BookOpen, Coins, Loader2, Search } from "lucide-react";
import { PageShell, PageTitle, StatTile } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { portalRoutesFromPath } from "@/shared/constants/routes";
import { fetchApprovalDashboard, fetchDeposits } from "../../api/approvals.api";
import { daysLabel, money, statusLabel, statusTone, urgencyTone } from "./approvalStatus";

/** Cases the PRO should act on today: blocked, overdue, or expiring. */
function needsAttention(row) {
  return (
    (row.daysToSlaDue != null && row.daysToSlaDue < 0) ||
    (row.daysToExpiry != null && row.daysToExpiry <= 30) ||
    row.status === "EXPIRED"
  );
}

export default function ApprovalsDashboardPage() {
  const location = useLocation();
  const routes = portalRoutesFromPath(location.pathname);

  const [cases, setCases] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const statuses = useMemo(
    () => Array.from(new Set(cases.map((c) => c.status))).sort(),
    [cases]
  );

  const needle = search.trim().toLowerCase();
  const visible = cases
    .filter((c) => !statusFilter || c.status === statusFilter)
    .filter(
      (c) =>
        !needle ||
        [c.caseNumber, c.permitTypeName, c.authorityName, c.projectName].some(
          (f) => f && f.toLowerCase().includes(needle)
        )
    );

  const attention = cases.filter(needsAttention).length;
  const outstandingTotal = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const awaitingAuthority = cases.filter((c) =>
    ["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED"].includes(c.status)
  ).length;

  return (
    <PageShell>
      <PageTitle
        title="Approvals"
        subtitle="Every live authority case across every project."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link to={routes.DEPOSIT_LEDGER}>
                <Coins className="h-4 w-4 mr-1" /> Deposit ledger
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={routes.AUTHORITY_LIBRARY}>
                <BookOpen className="h-4 w-4 mr-1" /> Authority library
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Live cases" value={cases.length} />
        <StatTile label="Awaiting authority" value={awaitingAuthority} />
        <StatTile
          label="Need attention"
          value={attention}
          icon={attention ? AlertTriangle : undefined}
          hint={attention ? "Overdue SLA, expiring or expired" : "Nothing overdue"}
        />
        <StatTile
          label="Deposits held by others"
          value={money(outstandingTotal)}
          icon={Coins}
          hint={`${deposits.length} outstanding`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8 w-72"
            placeholder="Search case, permit, authority or project"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading cases
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{visible.length} cases</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <th className="px-4 py-2 font-semibold">Project</th>
                    <th className="px-4 py-2 font-semibold">Case</th>
                    <th className="px-4 py-2 font-semibold">Authority</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2 font-semibold">Owner</th>
                    <th className="px-4 py-2 font-semibold">SLA due</th>
                    <th className="px-4 py-2 font-semibold">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {visible.map((c) => (
                    <tr key={c.uuid} className="hover:bg-secondary/40">
                      <td className="px-4 py-2">
                        <Link
                          className="text-sm hover:underline"
                          to={routes.PROJECT_APPROVALS.replace(":projectId", c.projectId)}
                        >
                          {c.projectName || `Project ${c.projectId}`}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-mono text-xs text-muted-foreground">{c.caseNumber}</div>
                        <div>{c.permitTypeName}</div>
                        {c.blockReason && (
                          <div className="text-xs text-amber-700">{c.blockReason}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs">{c.authorityName || c.authorityCode || "—"}</td>
                      <td className="px-4 py-2">
                        <Badge className={statusTone(c.status)}>{statusLabel(c.status)}</Badge>
                      </td>
                      <td className="px-4 py-2 text-xs">{c.assignedToName || "Unassigned"}</td>
                      <td className={`px-4 py-2 text-xs ${urgencyTone(c.daysToSlaDue)}`}>
                        {c.slaDueDate ? `${c.slaDueDate} · ${daysLabel(c.daysToSlaDue)}` : "—"}
                      </td>
                      <td className={`px-4 py-2 text-xs ${urgencyTone(c.daysToExpiry)}`}>
                        {c.expiryDate ? `${c.expiryDate} · ${daysLabel(c.daysToExpiry, "ago")}` : "—"}
                      </td>
                    </tr>
                  ))}
                  {!visible.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No cases yet. Open a project&rsquo;s Approvals tab and generate its case set.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
