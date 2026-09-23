import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowRight, FileText, MailX } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchMyScAwardPacks, fetchScRfqs } from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return `AED ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SubcontractorAwardPacksPage() {
  const [packs, setPacks] = useState([]);
  const [regrets, setRegrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchMyScAwardPacks().catch(() => []),
      fetchScRfqs().catch(() => []),
    ])
      .then(([packList, rfqList]) => {
        setPacks(Array.isArray(packList) ? packList : []);
        const regretRows = (Array.isArray(rfqList) ? rfqList : []).filter(
          (r) => String(r.bidderStatus || "").toUpperCase() === "REGRET"
        );
        setRegrets(regretRows);
      })
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load award packs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasAnything = packs.length > 0 || regrets.length > 0;

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-6">
      <PageTitle
        title="Award Packs"
        subtitle="Winning awards for contract/mobilisation, plus regret notices for unsuccessful tenders"
      />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      {!hasAnything ? (
        <Surface className="px-4 py-16 text-center text-sm text-muted-foreground">
          No award packs or regret notices yet — results appear here after the main contractor awards a package.
        </Surface>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Winning awards ({packs.length})</h2>
            {packs.length === 0 ? (
              <Surface className="px-4 py-8 text-center text-sm text-muted-foreground">
                No winning awards for your company yet.
              </Surface>
            ) : (
              packs.map((pack) => (
                <Surface key={pack.packageUuid || pack.uuid} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{pack.packageName}</h3>
                    <Badge className={`${SC_STATUS_BADGE.AWARDED || SC_STATUS_BADGE.APPROVED} text-[10px]`}>
                      {formatScStatus(pack.packageStatus || "AWARDED")}
                    </Badge>
                    {pack.contractStatus && (
                      <Badge variant="outline" className="text-[10px]">{formatScStatus(pack.contractStatus)}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {pack.projectName || `Project #${pack.projectId}`}
                    {pack.tradePackageCode ? ` · ${pack.tradePackageCode}` : ""}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-4 text-xs">
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-[10px] uppercase text-muted-foreground">Awarded value</p>
                      <p className="font-medium">{formatMoney(pack.awardedValue)}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-[10px] uppercase text-muted-foreground">Awarded at</p>
                      <p className="font-medium">{formatDate(pack.awardedAt)}</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="gap-1">
                    <Link to={ROUTES.SUBCONTRACTOR.RFQ_DETAIL.replace(":packageUuid", pack.packageUuid)}>
                      <FileText className="h-3.5 w-3.5" /> Open pack <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </Surface>
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MailX className="h-4 w-4" /> Unsuccessful tenders — regret notices ({regrets.length})
            </h2>
            {regrets.length === 0 ? (
              <Surface className="px-4 py-8 text-center text-sm text-muted-foreground">
                No regret notices. If you lose a tender after award, the message appears here.
              </Surface>
            ) : (
              regrets.map((r) => (
                <Surface
                  key={r.packageUuid}
                  className="p-5 space-y-3 border-amber-500/30 bg-amber-500/5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{r.packageName}</h3>
                    <Badge className={`${SC_STATUS_BADGE.REGRET} text-[10px]`}>Regret</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.projectName || `Project #${r.projectId}`}
                    {r.regretSentAt ? ` · Notified ${formatDate(r.regretSentAt)}` : ""}
                  </p>
                  <p className="text-sm leading-relaxed">
                    {r.regretMessage
                      || "Thank you for your tender. We regret to inform you that your bid was not successful on this occasion."}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to={ROUTES.SUBCONTRACTOR.RFQ_DETAIL.replace(":packageUuid", r.packageUuid)}>
                      View RFQ
                    </Link>
                  </Button>
                </Surface>
              ))
            )}
          </section>
        </>
      )}
    </PageShell>
  );
}
