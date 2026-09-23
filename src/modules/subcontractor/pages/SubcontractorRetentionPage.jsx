import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchScRetention } from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SubcontractorRetentionPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchScRetention()
      .then((list) => setEntries(Array.isArray(list) ? list : []))
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load retention ledger"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => {
    let held = 0;
    let released = 0;
    let outstanding = 0;
    let eligible = 0;
    for (const e of entries) {
      held += Number(e.amountHeld ?? 0);
      released += Number(e.amountReleased ?? 0);
      outstanding += Number(
        e.outstandingBalance ?? Math.max(0, Number(e.amountHeld ?? 0) - Number(e.amountReleased ?? 0))
      );
      if (String(e.status || "").toUpperCase() === "ELIGIBLE_FOR_RELEASE") {
        eligible += Number(
          e.outstandingBalance ?? Math.max(0, Number(e.amountHeld ?? 0) - Number(e.amountReleased ?? 0))
        );
      }
    }
    return { held, released, outstanding, eligible };
  }, [entries]);

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
        title="Retention Ledger"
        subtitle="Retention held against certificates, releases and outstanding balance"
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Total held</p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(summary.held)}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Released</p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(summary.released)}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(summary.outstanding)}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Eligible</p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(summary.eligible)}</p>
        </Surface>
      </div>

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      <Surface className="p-0 overflow-hidden">
        {entries.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No retention entries yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Held</TableHead>
                <TableHead>Released</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.uuid}>
                  <TableCell className="font-mono text-xs">
                    {e.certificateUuid ? String(e.certificateUuid).slice(0, 8) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{e.packageName || "—"}</TableCell>
                  <TableCell className="tabular-nums font-medium">{formatMoney(e.amountHeld)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(e.amountReleased)}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatMoney(
                      e.outstandingBalance ?? Math.max(0, Number(e.amountHeld ?? 0) - Number(e.amountReleased ?? 0))
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${SC_STATUS_BADGE[e.status] || "bg-muted border-none"} text-[10px]`}>
                      {formatScStatus(e.status)}
                    </Badge>
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
