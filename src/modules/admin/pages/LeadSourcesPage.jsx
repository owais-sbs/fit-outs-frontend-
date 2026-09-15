import { useEffect, useState, useMemo } from "react";
import { Search, Globe, Smartphone, Users, BarChart3, Activity, CheckCircle } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchAllLeads } from "../api/leads.api";

const SOURCE_ICONS = {
  Google: Search,
  Website: Globe,
  Social: Smartphone,
  Referral: Users,
  Other: Activity,
  "Walk-in": Users,
};

/** Accent only — cards use theme surfaces so dark mode stays clean. */
const COLOR_MAP = {
  blue: {
    text: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-500/15 dark:bg-sky-400/15",
    bar: "bg-sky-500",
  },
  purple: {
    text: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-500/15 dark:bg-violet-400/15",
    bar: "bg-violet-500",
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-500/15 dark:bg-rose-400/15",
    bar: "bg-rose-500",
  },
  teal: {
    text: "text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-500/15 dark:bg-teal-400/15",
    bar: "bg-teal-500",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/15 dark:bg-amber-400/15",
    bar: "bg-amber-500",
  },
};

const COLORS = ["blue", "purple", "rose", "teal", "amber"];

function SourceCard({ source }) {
  const colors = COLOR_MAP[source.color];
  const Icon = source.icon || Activity;

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardContent className="flex h-full flex-col gap-4 px-5 pb-5 pt-6 md:px-6 md:pb-6 md:pt-6">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              colors.iconBg,
              colors.text
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-base font-semibold text-foreground">{source.name}</h3>
              <Badge
                variant="outline"
                className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                {source.convRate}% conv.
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="text-2xl font-semibold tabular-nums text-foreground">{source.total}</span>
              <span className="ml-1.5">leads</span>
            </p>
          </div>
        </div>

        <div className="mt-auto space-y-2 border-t border-border/50 pt-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Converted</span>
            <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {source.converted}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Pending</span>
            <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {source.pending}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Lost</span>
            <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
              {source.lost}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeadSourcesPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllLeads()
      .then((data) => setLeads(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sourceStats = useMemo(() => {
    if (!leads.length) return [];

    const sourceMap = {};
    leads.forEach((lead) => {
      let source = lead.source || "Other";
      if (source === "—") source = "Other";

      if (!sourceMap[source]) {
        sourceMap[source] = {
          name: source,
          total: 0,
          converted: 0,
          pending: 0,
          lost: 0,
        };
      }

      sourceMap[source].total += 1;

      if (lead.status === "CLIENT" || lead.statusLabel === "Converted") {
        sourceMap[source].converted += 1;
      } else if (lead.status === "LOST") {
        sourceMap[source].lost += 1;
      } else {
        sourceMap[source].pending += 1;
      }
    });

    return Object.values(sourceMap)
      .sort((a, b) => b.total - a.total)
      .map((s, idx) => ({
        ...s,
        convRate: s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0,
        icon: SOURCE_ICONS[s.name] || Activity,
        color: COLORS[idx % COLORS.length],
      }));
  }, [leads]);

  const maxLeads = Math.max(...sourceStats.map((s) => s.total), 1);
  const totalConverted = sourceStats.reduce((acc, s) => acc + s.converted, 0);
  const overallConvRate = leads.length > 0 ? Math.round((totalConverted / leads.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Sources"
        description="Performance breakdown by acquisition channel"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Leads" value={loading ? "..." : leads.length} icon={Users} />
        <StatCard
          title="Converted"
          value={loading ? "..." : totalConverted}
          icon={CheckCircle}
          valueColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Overall Conv. Rate"
          value={loading ? "..." : `${overallConvRate}%`}
          icon={BarChart3}
          valueColor="text-sky-600 dark:text-sky-400"
        />
        <StatCard
          title="Active Sources"
          value={loading ? "..." : sourceStats.length}
          icon={Activity}
        />
      </section>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading source analytics...</div>
      ) : sourceStats.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No leads data available to show sources.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sourceStats.map((source) => (
              <SourceCard key={source.name} source={source} />
            ))}
          </div>

          <Card className="border-border/60 bg-card">
            <CardContent className="p-6">
              <h3 className="mb-6 text-base font-semibold text-foreground">Lead Volume by Source</h3>

              <div className="space-y-8">
                {sourceStats.map((source) => {
                  const Icon = source.icon;
                  const colors = COLOR_MAP[source.color];
                  const totalPct = (source.total / maxLeads) * 100;

                  const convPct = source.total > 0 ? (source.converted / source.total) * 100 : 0;
                  const pendPct = source.total > 0 ? (source.pending / source.total) * 100 : 0;
                  const lostPct = source.total > 0 ? (source.lost / source.total) * 100 : 0;

                  return (
                    <div key={source.name}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Icon className={cn("h-4 w-4", colors.text)} />
                          {source.name}
                        </div>
                        <div className="text-sm font-bold tabular-nums text-foreground">
                          {source.total}
                        </div>
                      </div>

                      <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", colors.bar)}
                          style={{ width: `${totalPct}%` }}
                        />
                      </div>

                      <div
                        className="flex h-1.5 gap-1 bg-transparent"
                        style={{ width: `${totalPct}%` }}
                      >
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${convPct}%` }}
                          title={`Converted: ${source.converted}`}
                        />
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${pendPct}%` }}
                          title={`Pending: ${source.pending}`}
                        />
                        <div
                          className="h-full rounded-full bg-rose-400"
                          style={{ width: `${lostPct}%` }}
                          title={`Lost: ${source.lost}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Converted
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  Pending
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  Lost
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
