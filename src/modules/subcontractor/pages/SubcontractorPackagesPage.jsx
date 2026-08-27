import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchMyScPackages } from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";

export default function SubcontractorPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchMyScPackages()
      .then((list) => setPackages(Array.isArray(list) ? list : []))
      .catch((e) => {
        setPackages([]);
        setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to load packages");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <PageShell className="mx-auto max-w-4xl">
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="mx-auto max-w-4xl">
      <PageTitle
        title="My Packages"
        subtitle="Assigned subcontractor work packages"
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.SUBCONTRACTOR.CLAIMS}>Claims</Link>
          </Button>
        }
      />

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Surface className="p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Package className="h-4 w-4" /> Packages ({packages.length})
        </h2>
        {packages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No packages assigned</p>
        ) : (
          <div className="divide-y divide-border/30">
            {packages.map((p) => (
              <div key={p.uuid} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Project #{p.projectId}
                    {p.boqSectionCode ? ` · ${p.boqSectionCode}` : ""}
                  </p>
                </div>
                <Badge variant="secondary">{p.status || "OPEN"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
