import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { fetchScRfqs } from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function SubcontractorAwardPacksPage() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchScRfqs()
      .then((list) => setRfqs(Array.isArray(list) ? list : []))
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load award packs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const wins = useMemo(
    () => rfqs.filter((r) => String(r.bidderStatus || "").toUpperCase() === "AWARDED"),
    [rfqs]
  );

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title="Award Packs"
        subtitle="Read-only scope, priced BOQ and contract details for packages you have won"
      />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      {wins.length === 0 ? (
        <Surface className="px-4 py-16 text-center text-sm text-muted-foreground">
          No award packs yet — winning bids appear here after the main contractor awards the package.
        </Surface>
      ) : (
        <div className="space-y-3">
          {wins.map((win) => (
            <Surface key={win.packageUuid} className="p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{win.packageName}</h3>
                <Badge className={`${SC_STATUS_BADGE.AWARDED || SC_STATUS_BADGE.APPROVED} text-[10px]`}>
                  {formatScStatus(win.bidderStatus || "AWARDED")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {win.projectName || `Project #${win.projectId}`}
              </p>
              {win.tenderDescription && (
                <p className="text-sm text-muted-foreground">{win.tenderDescription}</p>
              )}
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Payment terms</p>
                  <p className="font-medium">{win.paymentTerms || "—"}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Retention</p>
                  <p className="font-medium">{win.retentionPct != null ? `${win.retentionPct}%` : "—"}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Issued</p>
                  <p className="font-medium">{formatDate(win.tenderIssuedAt)}</p>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </PageShell>
  );
}
