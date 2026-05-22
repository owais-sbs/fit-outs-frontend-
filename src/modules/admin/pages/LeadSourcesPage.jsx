import { useEffect, useMemo, useState } from "react";
import { Search, Globe, Share2, MessageCircle, Camera, ExternalLink, Link, BarChart3 } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { getAllLeads, LEAD_SOURCES } from "../data/leads";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const SOURCE_ICONS = {
  "Walk-in": MessageCircle,
  Referral: Share2,
  Website: Globe,
  "Social Media": ExternalLink,
  "Facebook Ads": BarChart3,
  Instagram: Camera,
  "Google Ads": Link,
};

const SOURCE_COLORS = {
  "Walk-in": "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Referral: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Website: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "Social Media": "border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "Facebook Ads": "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  Instagram: "border-pink-500/20 bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "Google Ads": "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function formatCurrency(n) {
  return n ? `$${n.toLocaleString()}` : "$0";
}

function getSourceStats() {
  const allLeads = getAllLeads();
  return LEAD_SOURCES.map((source) => {
    const fromSource = allLeads.filter((l) => l.source === source);
    const qualified = fromSource.filter((l) => l.stage === "qualified" || l.stage === "siteVisit" || l.stage === "proposalSent");
    const won = fromSource.filter((l) => l.stage === "won");
    const totalBudget = fromSource.reduce((s, l) => s + (l.budget || 0), 0);
    return {
      name: source,
      total: fromSource.length,
      qualified: qualified.length,
      won: won.length,
      conversionRate: fromSource.length > 0
        ? Math.round((won.length / fromSource.length) * 100)
        : 0,
      revenue: won.reduce((s, l) => s + (l.budget || 0), 0),
      totalBudget,
    };
  });
}

export default function LeadSourcesPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("total");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const sourceStats = useMemo(() => getSourceStats(), []);

  const totals = useMemo(() => ({
    totalLeads: sourceStats.reduce((s, src) => s + src.total, 0),
    totalWon: sourceStats.reduce((s, src) => s + src.won, 0),
    totalRevenue: sourceStats.reduce((s, src) => s + src.revenue, 0),
    avgConversion: sourceStats.length > 0
      ? Math.round(sourceStats.reduce((s, src) => s + src.conversionRate, 0) / sourceStats.length)
      : 0,
  }), [sourceStats]);

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = sourceStats.filter((s) => !q || s.name.toLowerCase().includes(q));
    return [...filtered].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [search, sortBy, sourceStats]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Sources"
        description="Analyse performance across all lead acquisition channels."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Leads" value={totals.totalLeads} icon={Globe} growth={12} growthLabel="vs last month" />
        <StatCard title="Total Won" value={totals.totalWon} icon={Share2} growth={8} growthLabel="vs last month" />
        <StatCard title="Total Revenue" value={formatCurrency(totals.totalRevenue)} icon={Link} growth={15} growthLabel="vs last month" />
        <StatCard title="Avg Conversion" value={`${totals.avgConversion}%`} icon={MessageCircle} growth={totals.avgConversion > 20 ? 5 : -3} growthLabel="vs last month" />
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {sourceStats.map((src) => {
          const Icon = SOURCE_ICONS[src.name] || Globe;
          const colorClass = SOURCE_COLORS[src.name] || "border-border/60 bg-muted/30 text-muted-foreground";
          return (
            <Card key={src.name} className="border-border/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold leading-tight">{src.name}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight">{src.total}</p>
                    <p className="text-[11px] text-muted-foreground">leads</p>
                  </div>
                  <div className="flex w-full items-center justify-center gap-2 text-[11px] text-muted-foreground">
                    <span className="tabular-nums"><span className="font-medium text-foreground">{src.qualified}</span> qualified</span>
                    <span className="text-border">|</span>
                    <span className="tabular-nums"><span className="font-medium text-foreground">{src.won}</span> won</span>
                  </div>
                  <Badge variant={src.conversionRate >= 30 ? "success" : src.conversionRate >= 15 ? "warning" : "secondary"} className="mt-1 text-[10px]">
                    {src.conversionRate}% conversion
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Source comparison</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search sources..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 w-[200px]"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total leads</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="conversionRate">Conversion rate</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Source</TableHead>
                <TableHead>Total Leads</TableHead>
                <TableHead>Qualified</TableHead>
                <TableHead>Won</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Total Budget</TableHead>
                <TableHead className="pr-6">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : sorted.map((src) => {
                    const Icon = SOURCE_ICONS[src.name] || Globe;
                    return (
                      <TableRow key={src.name}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${SOURCE_COLORS[src.name] || "border-border/60 bg-muted/30"}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{src.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums font-medium">{src.total}</TableCell>
                        <TableCell className="tabular-nums">{src.qualified}</TableCell>
                        <TableCell className="tabular-nums">{src.won}</TableCell>
                        <TableCell>
                          <Badge variant={src.conversionRate >= 30 ? "success" : src.conversionRate >= 15 ? "warning" : "secondary"}>
                            {src.conversionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums">{formatCurrency(src.totalBudget)}</TableCell>
                        <TableCell className="pr-6 tabular-nums font-medium">{formatCurrency(src.revenue)}</TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>
        {!loading && sorted.length === 0 && (
          <div className="py-12 text-center">
            <Globe className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">No sources found</p>
            <p className="text-sm text-muted-foreground">Adjust your search terms</p>
          </div>
        )}
      </Card>
    </div>
  );
}
