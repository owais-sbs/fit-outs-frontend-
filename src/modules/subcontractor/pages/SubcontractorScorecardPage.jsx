import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fetchLatestScScorecard, fetchScScorecards } from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE } from "../utils/subcontractor.utils";

const DIMENSIONS = [
  { key: "qualityScore", label: "Quality" },
  { key: "programmeScore", label: "Programme" },
  { key: "safetyScore", label: "Safety" },
  { key: "commercialScore", label: "Commercial" },
  { key: "responsivenessScore", label: "Responsiveness" },
];

function scoreColor(score) {
  const n = Number(score);
  if (Number.isNaN(n)) return "text-muted-foreground";
  if (n >= 80) return "text-emerald-700";
  if (n >= 60) return "text-amber-700";
  return "text-destructive";
}

function formatScore(v) {
  if (v == null || v === "") return "—";
  return Number(v).toFixed(1);
}

export default function SubcontractorScorecardPage() {
  const [scores, setScores] = useState([]);
  const [active, setActive] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState("all");
  const [loading, setLoading] = useState(true);

  const packageOptions = useMemo(() => {
    const map = new Map();
    scores.forEach((s) => {
      if (s.packageUuid) map.set(s.packageUuid, s.packageUuid);
    });
    return Array.from(map.keys());
  }, [scores]);

  const load = useCallback(() => {
    setLoading(true);
    const pkg = selectedPackage === "all" ? undefined : selectedPackage;
    Promise.all([
      fetchScScorecards().catch(() => []),
      fetchLatestScScorecard(pkg).catch(() => null),
    ])
      .then(([list, latest]) => {
        setScores(Array.isArray(list) ? list : []);
        setActive(latest);
      })
      .finally(() => setLoading(false));
  }, [selectedPackage]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </PageShell>
    );
  }

  const hasScore = active && active.totalScore != null;

  return (
    <PageShell>
      <PageTitle
        title="Performance scorecard"
        subtitle="Auto-computed rating across quality, safety, programme, commercial and responsiveness (Part C9)"
      />

      <div className="max-w-sm space-y-1.5">
        <p className="text-xs text-muted-foreground">Package scope</p>
        <Select value={selectedPackage} onValueChange={setSelectedPackage}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Company-wide" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Company-wide (latest)</SelectItem>
            {packageOptions.map((id) => (
              <SelectItem key={id} value={id}>{id.slice(0, 8)}…</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Surface className="p-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DIMENSIONS.map(({ key, label }) => (
            <div key={key} className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className={`mt-2 text-2xl font-semibold tabular-nums ${scoreColor(active?.[key])}`}>
                {formatScore(active?.[key])}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-secondary/40 p-4 text-center">
          <p className="text-[10px] uppercase text-muted-foreground">Overall score</p>
          <p className={`mt-1 text-3xl font-bold tabular-nums ${scoreColor(active?.totalScore)}`}>
            {formatScore(active?.totalScore)}
          </p>
          {hasScore ? (
            <Badge className={`${SC_STATUS_BADGE.APPROVED} mt-2 text-[10px]`}>
              Published {active.computedAt ? new Date(active.computedAt).toLocaleDateString() : ""}
            </Badge>
          ) : (
            <Badge className={`${SC_STATUS_BADGE.DRAFT} mt-2 text-[10px]`}>Awaiting publication</Badge>
          )}
        </div>
      </Surface>

      {scores.length > 1 && (
        <Surface className="p-5">
          <h2 className="mb-3 text-sm font-semibold">History</h2>
          <div className="divide-y divide-border/30 text-sm">
            {scores.slice(0, 10).map((s) => (
              <div key={s.uuid} className="flex justify-between py-2">
                <span className="text-muted-foreground">
                  {s.computedAt ? new Date(s.computedAt).toLocaleString() : "—"}
                  {s.packageUuid ? ` · pkg ${String(s.packageUuid).slice(0, 8)}` : " · company"}
                </span>
                <span className="font-medium tabular-nums">{formatScore(s.totalScore)}</span>
              </div>
            ))}
          </div>
        </Surface>
      )}
    </PageShell>
  );
}
