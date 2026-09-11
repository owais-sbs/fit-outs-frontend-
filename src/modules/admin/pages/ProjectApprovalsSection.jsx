import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProjectApprovals } from "../api/approvals.api";
import { summarizeApprovalCases } from "./approvals/approvalStatus";

function CountCell({ label, value, tone }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold tabular-nums tracking-tight ${tone || "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function OpenApprovalsButton({ href }) {
  return (
    <Button asChild size="sm" variant="outline" className="shrink-0">
      <Link to={href}>
        Open approvals
        <ChevronRight className="ml-1 h-4 w-4" />
      </Link>
    </Button>
  );
}

export default function ProjectApprovalsSection({ href, projectId }) {
  const [loadState, setLoadState] = useState("loading");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!projectId) return undefined;
    let cancelled = false;
    setLoadState("loading");
    setSummary(null);
    fetchProjectApprovals(projectId)
      .then((list) => {
        if (cancelled) return;
        setSummary(summarizeApprovalCases(Array.isArray(list) ? list : []));
        setLoadState("loaded");
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(null);
          setLoadState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (!href) return null;

  const counts = [
    { label: "Live", value: summary?.live, tone: summary?.live ? "text-emerald-700" : undefined },
    { label: "Blocked", value: summary?.blocked, tone: summary?.blocked ? "text-amber-800" : undefined },
    { label: "Awaiting", value: summary?.awaiting, tone: summary?.awaiting ? "text-sky-800" : undefined },
    { label: "Expiring", value: summary?.expiring, tone: summary?.expiring ? "text-amber-800" : undefined },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Authority approvals
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loadState === "loading" && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {["Live", "Blocked", "Awaiting", "Expiring"].map((label) => (
              <div key={label} className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <Skeleton className="mt-1.5 h-7 w-10" />
              </div>
            ))}
          </div>
        )}

        {loadState === "loaded" && summary?.total > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {counts.map((item) => (
              <CountCell key={item.label} label={item.label} value={item.value} tone={item.tone} />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            {loadState === "error" && (
              <p className="text-sm text-muted-foreground">Could not load approvals.</p>
            )}
            {loadState === "loaded" && summary?.total === 0 && (
              <p className="text-sm text-muted-foreground">No permits generated yet.</p>
            )}
            {loadState === "loaded" && summary?.total > 0 && summary.attention.length > 0 && (
              <ul className="space-y-0.5">
                {summary.attention.map((line, index) => (
                  <li key={`${index}-${line}`} className="text-sm text-amber-800">
                    {line}
                  </li>
                ))}
              </ul>
            )}
            {loadState === "loaded" && summary?.total > 0 && summary.attention.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {summary.total} {summary.total === 1 ? "permit" : "permits"} on this project.
              </p>
            )}
          </div>
          <OpenApprovalsButton href={href} />
        </div>
      </CardContent>
    </Card>
  );
}
