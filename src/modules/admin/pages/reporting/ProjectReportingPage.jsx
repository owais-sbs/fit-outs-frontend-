import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle, StatTile } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchProgressReport } from "../../api/reporting.api";
import { ROUTES } from "@/shared/constants/routes";

export default function ProjectReportingPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const detailPath = (isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL)
    .replace(":projectId", projectId);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setMessage("");
    fetchProgressReport(projectId)
      .then(setReport)
      .catch((e) => {
        setReport(null);
        setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to load report");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <PageShell className="max-w-4xl mx-auto flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  const pct = report?.weightedCompletionPercent ?? report?.completionPercent ?? 0;
  const activities = report?.activities || [];
  const delayCodes = report?.delayReasonCodes || [];
  const activityDelays = activities.filter((a) => a.delayReason);

  return (
    <PageShell className="max-w-4xl mx-auto print:max-w-none">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #progress-report-print, #progress-report-print * { visibility: visible !important; }
          #progress-report-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 16px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex items-center gap-2 no-print">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Link to={detailPath}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageTitle
          className="flex-1"
          title="Progress Report"
          subtitle={`Project #${projectId}`}
          actions={
            report ? (
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" /> Print / PDF
              </Button>
            ) : null
          }
        />
      </div>

      {message && <p className="text-sm text-muted-foreground no-print">{message}</p>}

      {!report ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No progress report available yet.
          </CardContent>
        </Card>
      ) : (
        <div id="progress-report-print" className="space-y-4">
          <div className="hidden print:block mb-4">
            <h1 className="text-xl font-semibold">Progress Report — Project #{projectId}</h1>
            <p className="text-sm text-muted-foreground">
              Generated {new Date().toLocaleString()}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Weighted completion" value={`${Number(pct).toFixed(1)}%`} />
            <StatTile label="Activities" value={activities.length} />
            <StatTile
              label="Delay codes"
              value={delayCodes.length ? delayCodes.join(", ") : "None"}
            />
          </div>

          {(delayCodes.length > 0 || activityDelays.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Delay reasons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {delayCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {delayCodes.map((code) => (
                      <Badge key={code} variant="secondary">{code}</Badge>
                    ))}
                  </div>
                )}
                {activityDelays.length > 0 && (
                  <div className="divide-y divide-border/40">
                    {activityDelays.map((a, i) => (
                      <div key={a.uuid || i} className="py-2">
                        <p className="text-sm font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.delayReason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(report.summary || report.summaryText) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {report.summary || report.summaryText}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No activities</p>
              ) : (
                <div className="divide-y divide-border/40">
                  {activities.map((a, i) => (
                    <div key={a.uuid || i} className="flex items-center gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.start || a.startDate} → {a.end || a.endDate}
                          {a.baselineStart ? ` · baseline ${a.baselineStart}→${a.baselineEnd}` : ""}
                          {a.delayReason ? ` · delay: ${a.delayReason}` : ""}
                        </p>
                      </div>
                      <Badge variant="secondary">{a.percent ?? a.percentComplete ?? 0}%</Badge>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        w {a.weight ?? 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
