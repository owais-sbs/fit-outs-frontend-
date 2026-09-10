import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchScRfqs } from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function SubcontractorRfqInboxPage() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchScRfqs()
      .then((list) => setRfqs(Array.isArray(list) ? list : []))
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load RFQs"))
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
        title="RFQ Inbox"
        subtitle="Open tenders invited to your company — view scope, enter rates and submit before the deadline"
      />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      <Surface className="p-0 overflow-hidden">
        {rfqs.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No open RFQs in your inbox</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqs.map((rfq) => (
                <TableRow key={rfq.packageUuid}>
                  <TableCell className="font-medium">{rfq.packageName}</TableCell>
                  <TableCell className="text-muted-foreground">{rfq.projectName || `Project #${rfq.projectId}`}</TableCell>
                  <TableCell className="text-xs tabular-nums">{formatDate(rfq.tenderDeadline)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge className={`${SC_STATUS_BADGE[rfq.bidderStatus] || "bg-muted border-none"} text-[10px]`}>
                        {formatScStatus(rfq.bidderStatus)}
                      </Badge>
                      {rfq.sealed && (
                        <Badge variant="outline" className="text-[10px]">Sealed</Badge>
                      )}
                      {rfq.deadlinePassed && (
                        <Badge variant="secondary" className="text-[10px]">Closed</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to={ROUTES.SUBCONTRACTOR.RFQ_DETAIL.replace(":packageUuid", rfq.packageUuid)}>
                        Open
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
