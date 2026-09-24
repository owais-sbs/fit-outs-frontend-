import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchVariationBoqAudit } from "@/modules/admin/api/variations.api";
import { formatCurrency } from "@/modules/admin/pages/boq/quantityCalcUtils";
import { boqViewPath } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";

function fmtQty(value) {
  if (value == null || value === "") return "—";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function VariationBoqAuditPanel({
  projectId,
  uuid,
  sourceBoqId,
  resultBoqId,
}) {
  const { role } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchVariationBoqAudit(projectId, uuid)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.entries || data?.lines || [];
        setEntries(list);
        setUnavailable(false);
      })
      .catch(() => {
        setEntries([]);
        setUnavailable(true);
      })
      .finally(() => setLoading(false));
  }, [projectId, uuid]);

  const totalDelta = useMemo(
    () => entries.reduce((sum, entry) => sum + Number(entry.deltaAmount || 0), 0),
    [entries],
  );

  const sourceId = sourceBoqId || entries[0]?.sourceBoqUuid;
  const resultId = resultBoqId || entries[0]?.resultingBoqUuid;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">BOQ changes</h3>
        <div className="flex flex-wrap items-center gap-2">
          {sourceId && (
            <Button size="sm" variant="outline" asChild>
              <Link to={boqViewPath(role, sourceId, projectId)}>Previous BOQ</Link>
            </Button>
          )}
          {resultId && (
            <Button size="sm" variant="outline" asChild>
              <Link to={boqViewPath(role, resultId, projectId)}>New BOQ</Link>
            </Button>
          )}
          <Badge variant="outline">
            Delta {formatCurrency(totalDelta)}
          </Badge>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading BOQ change audit…</p>
      ) : entries.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Prev qty</TableHead>
                <TableHead>New qty</TableHead>
                <TableHead>Prev rate</TableHead>
                <TableHead>New rate</TableHead>
                <TableHead>Prev amount</TableHead>
                <TableHead>New amount</TableHead>
                <TableHead>Delta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.uuid}>
                  <TableCell>
                    <Badge variant="outline">{entry.changeType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{entry.description || "—"}</div>
                    {entry.unit && (
                      <div className="text-xs text-muted-foreground">{entry.unit}</div>
                    )}
                  </TableCell>
                  <TableCell>{fmtQty(entry.previousQuantity)}</TableCell>
                  <TableCell>{fmtQty(entry.newQuantity)}</TableCell>
                  <TableCell>
                    {entry.previousRate != null ? formatCurrency(entry.previousRate) : "—"}
                  </TableCell>
                  <TableCell>
                    {entry.newRate != null ? formatCurrency(entry.newRate) : "—"}
                  </TableCell>
                  <TableCell>
                    {entry.previousAmount != null ? formatCurrency(entry.previousAmount) : "—"}
                  </TableCell>
                  <TableCell>
                    {entry.newAmount != null ? formatCurrency(entry.newAmount) : "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(entry.deltaAmount || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {unavailable
            ? "Detailed server audit is not available yet."
            : "No BOQ revision has been applied for this variation yet."}
        </p>
      )}
    </div>
  );
}
