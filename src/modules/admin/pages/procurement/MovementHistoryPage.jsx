import React, { useEffect, useState } from "react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStockMovements } from "../../api/stock.api";

const MOVEMENT_TYPES = ["All", "RECEIPT", "ISSUE", "ADJUSTMENT", "RETURN"];

const formatCurrency = (val) =>
  val != null ? `AED ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

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

        <Surface>
          <div className="overflow-x-auto p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No movements found.</TableCell></TableRow>
                  ) : filtered.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-xs">{m.movementDate ? new Date(m.movementDate).toLocaleString() : "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{m.movementType}</Badge></TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">{m.materialName}</div>
                        <div className="text-[10px] text-muted-foreground">{m.materialCode}</div>
                      </TableCell>
                      <TableCell className="text-xs">{m.quantity}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(m.unitCost)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(m.totalCost)}</TableCell>
                      <TableCell className="text-xs">{m.projectName || "—"}</TableCell>
                      <TableCell className="text-xs">{m.referenceNo || "—"}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs">{m.notes || "—"}</TableCell>
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
