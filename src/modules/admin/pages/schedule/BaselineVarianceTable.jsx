const DAY_MS = 86400000;

function parseDate(d) {
  if (!d) return null;
  const parts = String(d).slice(0, 10).split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

export default function BaselineVarianceTable({ activities, baselineActivities }) {
  const baselineByUuid = new Map();
  (baselineActivities || []).forEach((b) => {
    const id = b.activityUuid || b.uuid;
    if (id) baselineByUuid.set(String(id), b);
  });

  const rows = (activities || [])
    .map((a) => {
      const base = baselineByUuid.get(String(a.uuid));
      if (!base) return null;
      const curStart = parseDate(a.startDate);
      const curEnd = parseDate(a.endDate);
      const baseStart = parseDate(base.startDate);
      const baseEnd = parseDate(base.endDate);
      const startDelta = daysBetween(baseStart, curStart);
      const endDelta = daysBetween(baseEnd, curEnd);
      const pctDelta = (a.percentComplete || 0) - (base.percentComplete || 0);
      return {
        key: a.uuid,
        name: a.name,
        baseStart: String(base.startDate).slice(0, 10),
        baseEnd: String(base.endDate).slice(0, 10),
        curStart: String(a.startDate).slice(0, 10),
        curEnd: String(a.endDate).slice(0, 10),
        startDelta,
        endDelta,
        pctDelta,
      };
    })
    .filter(Boolean);

  if (!rows.length) {
    return (
      <p className="text-xs text-muted-foreground px-1">
        No overlapping activities between current schedule and selected baseline.
      </p>
    );
  }

  const fmtDelta = (n) => {
    if (n == null) return "—";
    if (n === 0) return "0";
    return n > 0 ? `+${n}` : String(n);
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/40">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/40 bg-secondary/50 text-left text-muted-foreground">
            <th className="px-3 py-2 font-semibold">Activity</th>
            <th className="px-3 py-2 font-semibold">Baseline</th>
            <th className="px-3 py-2 font-semibold">Current</th>
            <th className="px-3 py-2 font-semibold">Start Δ</th>
            <th className="px-3 py-2 font-semibold">End Δ</th>
            <th className="px-3 py-2 font-semibold">% Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-border/30 last:border-0">
              <td className="px-3 py-2 font-medium">{r.name}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.baseStart} → {r.baseEnd}</td>
              <td className="px-3 py-2">{r.curStart} → {r.curEnd}</td>
              <td className={`px-3 py-2 ${r.startDelta > 0 ? "text-amber-700" : ""}`}>{fmtDelta(r.startDelta)}</td>
              <td className={`px-3 py-2 ${r.endDelta > 0 ? "text-amber-700" : ""}`}>{fmtDelta(r.endDelta)}</td>
              <td className={`px-3 py-2 ${r.pctDelta > 0 ? "text-emerald-700" : ""}`}>{fmtDelta(r.pctDelta)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
