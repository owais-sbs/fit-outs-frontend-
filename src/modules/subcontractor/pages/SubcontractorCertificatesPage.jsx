import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchScCertificates } from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

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
        subtitle="Certificates issued against measured and certified claims"
      />

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
                <TableHead>Project</TableHead>
                <TableHead>Certified</TableHead>
                <TableHead>Retention</TableHead>
                <TableHead>Back-charges</TableHead>
                <TableHead>Net payable</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((c) => (
                <TableRow key={c.uuid}>
                  <TableCell>#{c.projectId}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(c.certifiedValue)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(c.retentionHeld)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(c.backChargesApplied)}</TableCell>
                  <TableCell className="tabular-nums font-medium">{formatMoney(c.netPayable)}</TableCell>
                  <TableCell>
                    <Badge className={`${SC_STATUS_BADGE[c.status] || "bg-muted border-none"} text-[10px]`}>
                      {formatScStatus(c.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(c.paidDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Surface>
    </PageShell>
  );
}
