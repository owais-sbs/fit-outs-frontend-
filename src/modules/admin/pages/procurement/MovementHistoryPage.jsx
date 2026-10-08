import React, { useEffect, useState } from "react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStockMovements } from "../../api/stock.api";
import { formatCurrency } from "@/shared/utils/currency";

const MOVEMENT_TYPES = ["All", "RECEIPT", "ISSUE", "ADJUSTMENT", "RETURN"];

const formatCurrencyNullable = (val) =>
  val != null ? formatCurrency(val) : "—";

export default function MovementHistoryPage() {
  const [movements, setMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setIsLoading(true);
    fetchStockMovements(0, 100)
      .then((res) => {
        const list = res?.content ?? (Array.isArray(res) ? res : []);
        setMovements(list);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = movements.filter((m) => {
    if (typeFilter !== "All" && m.movementType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.materialName?.toLowerCase().includes(q) ||
        m.materialCode?.toLowerCase().includes(q) ||
        m.projectName?.toLowerCase().includes(q) ||
        m.referenceNo?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <ConfigurationLayout>
      <PageShell>
        <PageTitle
          title="Movement History"
          subtitle="Filterable ledger of all stock receipts, issues, and adjustments."
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input placeholder="Search material, project, reference..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOVEMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Surface className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="space-y-3 p-6">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Type</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Material</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Qty</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Unit Cost</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Total</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Project</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Reference</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                        No movements found.
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/20">
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {m.movementDate ? new Date(m.movementDate).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {m.movementType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{m.materialName}</div>
                        <div className="text-[11px] text-muted-foreground">{m.materialCode}</div>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{m.quantity}</TableCell>
                      <TableCell className="text-sm tabular-nums">{formatCurrencyNullable(m.unitCost)}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums">{formatCurrencyNullable(m.totalCost)}</TableCell>
                      <TableCell className="text-sm">{m.projectName || "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{m.referenceNo || "—"}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">{m.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Surface>
      </PageShell>
    </ConfigurationLayout>
  );
}
