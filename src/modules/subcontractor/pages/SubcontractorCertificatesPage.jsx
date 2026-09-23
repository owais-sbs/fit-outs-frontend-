import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchScCertificates } from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SubcontractorCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchScCertificates()
      .then((list) => setCertificates(Array.isArray(list) ? list : []))
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load certificates"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const statusOf = (c) => String(c.status || "").toUpperCase();
    const paidList = certificates.filter((c) => statusOf(c) === "PAID");
    return {
      awaiting: certificates.filter((c) => ["DRAFT", "ISSUED"].includes(statusOf(c))).length,
      payable: certificates.filter((c) => statusOf(c) === "PAYABLE").length,
      paid: paidList.length,
      receivedTotal: paidList.reduce(
        (s, c) => s + Number(c.paidAmount ?? c.netPayable ?? 0),
        0
      ),
    };
  }, [certificates]);

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
        title="Payment Certificates"
        subtitle="Read-only for subcontractors. ISSUED = waiting for JCT to mark PAYABLE. PAYABLE = you may raise an invoice. PAID = payment recorded."
      />

      {stats.awaiting > 0 && (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {stats.awaiting} certificate(s) are <strong>ISSUED / DRAFT</strong> — no SC action yet.
          JCT Finance/QS must mark them <strong>PAYABLE</strong> before you can invoice under Invoices &amp; Payments.
        </p>
      )}
      {stats.payable > 0 && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {stats.payable} certificate(s) are <strong>PAYABLE</strong> — go to <strong>Invoices &amp; Payments</strong> to submit your invoice.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-4">
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Awaiting (Draft / Issued)</p>
          <p className="text-2xl font-semibold tabular-nums">{stats.awaiting}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Payable</p>
          <p className="text-2xl font-semibold tabular-nums">{stats.payable}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-2xl font-semibold tabular-nums">{stats.paid}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Amount received</p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(stats.receivedTotal)}</p>
        </Surface>
      </div>

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      <Surface className="p-0 overflow-hidden">
        {certificates.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No payment certificates yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cert #</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Claim</TableHead>
                <TableHead>Certified</TableHead>
                <TableHead>Retention</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((c) => (
                <TableRow key={c.uuid}>
                  <TableCell className="font-mono text-xs">
                    {c.certificateNumber || String(c.uuid).slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-sm">{c.packageName || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {c.claimNumber || (c.claimUuid ? String(c.claimUuid).slice(0, 8) : "—")}
                  </TableCell>
                  <TableCell className="tabular-nums">{formatMoney(c.certifiedValue)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(c.retentionHeld)}</TableCell>
                  <TableCell className="tabular-nums font-medium">{formatMoney(c.netPayable)}</TableCell>
                  <TableCell className="tabular-nums">
                    {String(c.status || "").toUpperCase() === "PAID"
                      ? formatMoney(c.paidAmount ?? c.netPayable)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${SC_STATUS_BADGE[c.status] || "bg-muted border-none"} text-[10px]`}>
                      {formatScStatus(c.status)}
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
