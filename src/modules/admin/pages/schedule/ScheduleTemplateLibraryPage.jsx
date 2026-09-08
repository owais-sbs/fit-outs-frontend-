import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, GanttChart, Loader2, Search } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchScheduleTemplate, fetchScheduleTemplates } from "../../api/schedule.api";

function lengthBadge(template) {
  const computed = template.computedWorkingDays;
  const target = template.targetWorkingDays;
  if (computed == null) return null;
  if (target != null && target !== computed) {
    return (
      <Badge className="bg-amber-500/15 text-amber-800">
        {computed} WD computed (source says {target})
      </Badge>
    );
  }
  return <Badge className="bg-emerald-500/15 text-emerald-800">{computed} WD</Badge>;
}

export default function ScheduleTemplateLibraryPage() {
  const [templates, setTemplates] = useState([]);
  const [selectedUuid, setSelectedUuid] = useState(null);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const rows = await fetchScheduleTemplates();
      setTemplates(rows || []);
      if (rows?.length && !selectedUuid) setSelectedUuid(rows[0].uuid);
    } catch (e) {
      setMessage(e?.message || "Could not load templates");
    } finally {
      setLoading(false);
    }
  }, [selectedUuid]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!selectedUuid) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    fetchScheduleTemplate(selectedUuid)
      .then(setDetail)
      .catch((e) => setMessage(e?.message || "Could not load template detail"))
      .finally(() => setDetailLoading(false));
  }, [selectedUuid]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        (t.code || "").toLowerCase().includes(q) ||
        (t.name || "").toLowerCase().includes(q) ||
        (t.projectType || "").toLowerCase().includes(q)
    );
  }, [templates, search]);

  const header = detail?.header;
  const activities = detail?.activities || [];
  const warnings = detail?.incompleteLogicWarnings || [];

  return (
    <PageShell>
      <PageTitle
        title="Schedule templates"
        description="Baseline programme skeletons. Computed lengths come from CPM over the seed's predecessor logic, not the published start/finish columns."
        icon={GanttChart}
      />

      {message && <p className="mb-4 text-sm text-destructive">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Library</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search templates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {loading ? (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !filtered.length ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">
                No templates yet. Import the seed file from the authority library.
              </p>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.uuid}
                  type="button"
                  onClick={() => setSelectedUuid(t.uuid)}
                  className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                    selectedUuid === t.uuid ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  <div className="text-sm font-semibold">{t.code}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{t.name}</div>
                  <div className="mt-1">{lengthBadge(t)}</div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {detailLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {!detailLoading && header && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle>{header.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{header.code}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lengthBadge(header)}
                      {header.fastTrack && (
                        <Badge className="bg-violet-500/15 text-violet-800">Fast track</Badge>
                      )}
                      {header.systemTemplate && (
                        <Badge variant="secondary">System template</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {header.description && <p>{header.description}</p>}
                  {header.dataQualityNotes && (
                    <p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-900">
                      {header.dataQualityNotes}
                    </p>
                  )}
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground">Activities</span>
                      <div className="font-medium">{header.activityCount}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dependencies</span>
                      <div className="font-medium">{header.dependencyCount}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Long-lead items</span>
                      <div className="font-medium">{header.procurementItemCount}</div>
                    </div>
                  </div>
                  {header.fastTrack && header.fastTrackConditions?.length > 0 && (
                    <div>
                      <p className="mb-1 font-medium">Fast-track conditions</p>
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {header.fastTrackConditions.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {warnings.length > 0 && (
                <Card className="border-amber-500/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-amber-900">
                      <AlertTriangle className="h-4 w-4" />
                      Incomplete predecessor logic
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3 text-sm text-muted-foreground">
                      These activities start far earlier on the Gantt than the seed&apos;s
                      start_wd column suggests. They are not silently patched — the finish date
                      is unaffected when they are off the critical path.
                    </p>
                    <ul className="space-y-2 text-sm">
                      {warnings.map((w) => (
                        <li key={w} className="rounded-md bg-amber-500/10 px-3 py-2">{w}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activities</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Dur</th>
                        <th className="px-3 py-2">Seed start</th>
                        <th className="px-3 py-2">CPM start</th>
                        <th className="px-3 py-2">Trade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((a) => (
                        <tr
                          key={a.activityCode}
                          className={`border-b ${a.varianceNote ? "bg-amber-500/5" : ""}`}
                        >
                          <td className="px-3 py-2 font-mono text-xs">{a.activityCode}</td>
                          <td className="px-3 py-2">
                            <div>{a.name}</div>
                            {a.varianceNote && (
                              <div className="text-xs text-amber-800">{a.varianceNote}</div>
                            )}
                            {a.constraintNote && (
                              <div className="text-xs text-muted-foreground">{a.constraintNote}</div>
                            )}
                          </td>
                          <td className="px-3 py-2">{a.baseDurationDays}</td>
                          <td className="px-3 py-2">{a.seedStartWd ?? "—"}</td>
                          <td className="px-3 py-2">{a.computedStartWd ?? "—"}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {a.tradeLabel || a.tradePackageCode || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
