import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  BookOpenCheck,
  CheckCircle2,
  Circle,
  CreditCard,
  GitBranch,
  Loader2,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchFinalAccount } from "../../api/closeout.api";
import { portalRoutesFromPath, PROJECT_DETAIL_NAV_STATE } from "@/shared/constants/routes";
import { formatAed } from "@/shared/utils/currency";

function formatWhen(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
}

function MoneyRow({ label, value, emphasize = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`tabular-nums text-sm ${emphasize ? "font-semibold" : "font-medium"}`}>
        {formatAed(value ?? 0)}
      </span>
    </div>
  );
}

function StatusPill({ ok, label }) {
  return (
    <Badge variant={ok ? "success" : "warning"}>
      {ok ? "Confirmed" : "Outstanding"}
      {label ? ` · ${label}` : ""}
    </Badge>
  );
}

/**
 * Final Account summary panel (Module 27 Part 2). Read-only aggregation.
 */
export default function FinalAccountPanel({ onOpenChecklist } = {}) {
  const { projectId } = useParams();
  const location = useLocation();
  const routes = portalRoutesFromPath(location.pathname);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const variationDetailPath = (uuid) => {
    const template = routes?.PROJECT_VARIATION_DETAIL;
    if (!template) return null;
    return template.replace(":projectId", projectId).replace(":uuid", uuid);
  };

  const billingPath = routes?.PROJECT_BILLING
    ? routes.PROJECT_BILLING.replace(":projectId", projectId)
    : null;
  const variationsPath = routes?.PROJECT_VARIATIONS
    ? routes.PROJECT_VARIATIONS.replace(":projectId", projectId)
    : null;

  const load = useCallback(() => {
    setLoading(true);
    setMessage("");
    fetchFinalAccount(projectId)
      .then(setData)
      .catch((e) => {
        setData(null);
        setMessage(e?.response?.data?.message || e?.message || "Failed to load final account");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
        {message || "Final account is unavailable."}
      </p>
    );
  }

  const { contract, variations, billing, closeOut, checklistAllSatisfied } = data;
  const lines = variations?.lines || [];

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      {checklistAllSatisfied && (
        <Card>
          <CardContent className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-700 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Ready for commercial close review</p>
                <p className="text-xs text-muted-foreground">
                  All close-out checklist items are satisfied. Review this Final Account before
                  commercially closing the project.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="h-4 w-4 text-primary" />
            Contract
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!contract?.hasApprovedBoq && (
            <p className="mb-2 text-xs text-amber-700">No approved BOQ — original contract shown as zero.</p>
          )}
          <MoneyRow label="Original Contract" value={contract?.originalContractValue} />
          <MoneyRow label="Approved Variations" value={contract?.approvedVariationsTotal} />
          <MoneyRow label="Final Contract" value={contract?.finalContractValue} emphasize />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <GitBranch className="h-4 w-4 text-primary" />
            Variations
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={variations?.closeoutSatisfied ? "success" : "warning"}>
              {variations?.closeoutSatisfied ? "Closed" : "Open items"}
            </Badge>
            {variationsPath && (
              <Button asChild size="sm" variant="outline">
                <Link to={variationsPath} state={PROJECT_DETAIL_NAV_STATE}>Open variations</Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <MoneyRow label="Approved Variations Total" value={variations?.approvedTotal} emphasize />
          {variations?.closeoutDetail && (
            <p className="text-xs text-muted-foreground">{variations.closeoutDetail}</p>
          )}
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved variations on this project.</p>
          ) : (
            <ul className="rounded-lg border border-border/60 divide-y divide-border/60">
              {lines.map((line) => {
                const path = variationDetailPath(line.uuid);
                const row = (
                  <div className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-muted-foreground">{line.crNumber}</span>
                      <span className="ml-2 font-medium">{line.title}</span>
                    </div>
                    <span className="tabular-nums font-medium shrink-0">
                      {Number(line.sellDelta) >= 0 ? "+" : ""}
                      {formatAed(line.sellDelta)}
                    </span>
                  </div>
                );
                return (
                  <li key={line.uuid}>
                    {path ? (
                      <Link
                        to={path}
                        state={PROJECT_DETAIL_NAV_STATE}
                        className="block hover:bg-secondary/40 transition-colors"
                      >
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Receipt className="h-4 w-4 text-primary" />
            Billing
          </CardTitle>
          {billingPath && (
            <Button asChild size="sm" variant="outline">
              <Link to={billingPath} state={PROJECT_DETAIL_NAV_STATE}>Open billing</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <MoneyRow label="Total Scheduled" value={billing?.totalScheduled} />
          <MoneyRow label="Total Issued" value={billing?.totalIssued} />
          <MoneyRow label="Total Paid" value={billing?.totalPaid} />
          <MoneyRow label="Outstanding" value={billing?.outstanding} emphasize />
          <MoneyRow label="Remaining to bill" value={billing?.unbilledRemaining} emphasize />
          <p className="mt-2 text-xs text-muted-foreground">
            Outstanding is issued/accepted (or part-paid) amounts not yet paid. Remaining to bill is
            contract value not yet represented by issued payment requests.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BookOpenCheck className="h-4 w-4 text-primary" />
            Close-out confirmations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-border/40">
            <div className="flex items-center gap-2 text-sm">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Final invoice issued
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusPill ok={!!closeOut?.finalInvoiceConfirmed} />
              {closeOut?.finalInvoiceConfirmedAt && (
                <span className="text-xs text-muted-foreground">
                  {formatWhen(closeOut.finalInvoiceConfirmedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 py-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Circle className="h-4 w-4 text-muted-foreground" />
              Accounting synchronized
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusPill ok={!!closeOut?.accountingSynced} />
              {closeOut?.accountingSyncedAt && (
                <span className="text-xs text-muted-foreground">
                  {formatWhen(closeOut.accountingSyncedAt)}
                </span>
              )}
            </div>
          </div>
          {onOpenChecklist && (
            <Button size="sm" variant="outline" onClick={onOpenChecklist}>
              Open close-out checklist
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
