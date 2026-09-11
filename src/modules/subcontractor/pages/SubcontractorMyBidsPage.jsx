import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchScMyBids } from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SubcontractorMyBidsPage() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchScMyBids()
      .then((list) => setBids(Array.isArray(list) ? list : []))
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load bids"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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
        title="My Bids"
        subtitle="Submitted quotes and draft bids across all tender packages"
      />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      <Surface className="p-0 overflow-hidden">
        {bids.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No bids yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Lead time</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">RFQ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.map((bid) => (
                <TableRow key={bid.uuid}>
                  <TableCell className="font-medium font-mono text-xs">{String(bid.packageUuid).slice(0, 8)}…</TableCell>
                  <TableCell>v{bid.version}</TableCell>
                  <TableCell className="tabular-nums">{bid.ratesVisible ? formatMoney(bid.totalValue) : "Sealed"}</TableCell>
                  <TableCell>{bid.leadTimeDays != null ? `${bid.leadTimeDays}d` : "—"}</TableCell>
                  <TableCell className="text-xs">{formatDate(bid.submittedAt)}</TableCell>
                  <TableCell>
                    <Badge className={`${SC_STATUS_BADGE[bid.status] || "bg-muted border-none"} text-[10px]`}>
                      {formatScStatus(bid.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={ROUTES.SUBCONTRACTOR.RFQ_DETAIL.replace(":packageUuid", bid.packageUuid)}>
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Surface>
    </PageShell>
  );
}
