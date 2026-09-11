import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchScSnags } from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default function SubcontractorSnagsPage() {
  const [snags, setSnags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchScSnags()
      .then((list) => setSnags(Array.isArray(list) ? list : []))
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load snags"))
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
        title="Snags"
        subtitle="Trade-filtered snags assigned to your packages with due dates"
      />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      <Surface className="p-0 overflow-hidden">
        {snags.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No snags assigned to your trade</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snags.map((s) => (
                <TableRow key={s.uuid}>
                  <TableCell>
                    <p className="font-medium">{s.title}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{s.projectName || `#${s.projectId}`}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.location || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`${SC_STATUS_BADGE[s.severity] || "bg-muted border-none"} text-[10px]`}>
                      {formatScStatus(s.severity)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${SC_STATUS_BADGE[s.status] || "bg-muted border-none"} text-[10px]`}>
                      {formatScStatus(s.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">{formatDate(s.dueDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Surface>
    </PageShell>
  );
}
