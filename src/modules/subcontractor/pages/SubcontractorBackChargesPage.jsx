import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { acknowledgeScBackCharge, fetchScBackCharges } from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SubcontractorBackChargesPage() {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchScBackCharges()
      .then((list) => setCharges(Array.isArray(list) ? list : []))
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load back-charges"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (uuid, dispute) => {
    setBusy(true);
    setMessage("");
    try {
      await acknowledgeScBackCharge(uuid, dispute);
      await load();
      setMessage(dispute ? "Charge disputed" : "Charge acknowledged");
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

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
        title="Back-charges"
        subtitle="View and acknowledge charges raised against your company"
      />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      <Surface className="p-0 overflow-hidden">
        {charges.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No back-charges on record</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.map((c) => (
                <TableRow key={c.uuid}>
                  <TableCell>#{c.projectId}</TableCell>
                  <TableCell className="text-xs">{formatScStatus(c.chargeType)}</TableCell>
                  <TableCell className="max-w-[240px] text-sm">{c.description || "—"}</TableCell>
                  <TableCell className="tabular-nums font-medium">{formatMoney(c.amount)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge className={`${SC_STATUS_BADGE[c.status] || "bg-muted border-none"} text-[10px]`}>
                        {formatScStatus(c.status)}
                      </Badge>
                      {c.disputed && (
                        <Badge variant="destructive" className="text-[10px]">Disputed</Badge>
                      )}
                    </div>
                    {c.acknowledgedAt && (
                      <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(c.acknowledgedAt)}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!c.acknowledgedAt && c.status !== "ACKNOWLEDGED" && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => run(c.uuid, false)}>
                          Acknowledge
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(c.uuid, true)}>
                          Dispute
                        </Button>
                      </div>
                    )}
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
