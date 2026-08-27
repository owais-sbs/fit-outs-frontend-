import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Loader2, ExternalLink } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchMySiteVisits } from "@/modules/admin/api/site-visits.api";
import { ROUTES } from "@/shared/constants/routes";

export default function EmployeeSiteVisitsPage() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMySiteVisits()
      .then((data) => {
        if (!cancelled) setVisits(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.message || e.message || "Failed to load visits");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      <PageTitle
        title="My Site Visits"
        subtitle="Visits assigned to you"
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && visits.length === 0 && (
        <Surface className="px-4 py-10 text-center text-sm text-muted-foreground">
          No site visits assigned yet.
        </Surface>
      )}

      <div className="grid gap-3">
        {visits.map((v) => {
          const reportHref = ROUTES.EMPLOYEE.SITE_VISIT_REPORT.replace(":visitId", v.uuid);
          return (
            <Surface key={v.uuid} className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Visit {v.uuid?.slice(0, 8)}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {v.scheduledDate || "—"} {v.scheduledTime || ""}
                  </p>
                </div>
                <Badge variant="secondary">{v.status || "SCHEDULED"}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {v.notes || v.propertyType || "Assigned site visit"}
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to={reportHref}>
                    Open report <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </Surface>
          );
        })}
      </div>
    </PageShell>
  );
}
