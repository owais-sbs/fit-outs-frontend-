import React, { useEffect, useState } from "react";
import { Package, AlertTriangle, TrendingUp, History } from "lucide-react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import { fetchStockBalances, fetchStockMovements } from "../../api/stock.api";

const formatCurrency = (val) =>
  `AED ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function StockDashboardPage() {
  const [balances, setBalances] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [balRes, movRes] = await Promise.all([
          fetchStockBalances(),
          fetchStockMovements(0, 20),
        ]);
        setBalances(Array.isArray(balRes) ? balRes : []);
        const movements = movRes?.content ?? (Array.isArray(movRes) ? movRes : []);
        setRecentMovements(movements.slice(0, 10));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const totalValue = balances.reduce((sum, b) => sum + Number(b.stockValue || 0), 0);
  const lowStockItems = balances.filter((b) => b.lowStock);

  return (
    <ConfigurationLayout>
      <PageShell>
        <PageTitle
          title="Stock Dashboard"
          subtitle="Company-wide warehouse balances, stock value, and recent activity."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm"><Link to={ROUTES.ADMIN.PROCUREMENT_RECEIPT}>Goods Receipt</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to={ROUTES.ADMIN.PROCUREMENT_ISSUE}>Stock Issue</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to={ROUTES.ADMIN.PROCUREMENT_MOVEMENTS}>Movement History</Link></Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatTile
            label="Total Stock Value"
            value={isLoading ? "—" : formatCurrency(totalValue)}
            icon={TrendingUp}
          />
          <StatTile
            label="Materials Tracked"
            value={isLoading ? "—" : balances.length}
            icon={Package}
          />
          <StatTile
            label="Below Min Stock"
            value={isLoading ? "—" : lowStockItems.length}
            icon={AlertTriangle}
            hint={lowStockItems.length ? "Needs replenishment" : "All within range"}
          />
        </div>

        <Surface>
          <div className="px-5 pt-5 md:px-6 md:pt-6">
            <h2 className="text-base font-semibold tracking-tight">Stock Balances</h2>
          </div>
          <div className="overflow-x-auto p-0 pt-3">
            {isLoading ? (
              <div className="space-y-3 p-6">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Qty On Hand</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Stock Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No stock records yet.</TableCell></TableRow>
                  ) : balances.map((b) => (
                    <TableRow key={b.materialId}>
                      <TableCell>
                        <div className="text-sm font-medium">{b.materialName}</div>
                        <div className="text-[10px] text-muted-foreground">{b.materialCode}</div>
                      </TableCell>
                      <TableCell className="text-xs">{b.materialCategoryName || "—"}</TableCell>
                      <TableCell className="text-xs font-medium">{b.quantityOnHand}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(b.costPrice)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(b.stockValue)}</TableCell>
                      <TableCell>
                        {b.lowStock ? <Badge variant="destructive" className="text-[10px]">Low Stock</Badge> : <Badge variant="secondary" className="text-[10px]">OK</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Surface>

        <Surface>
          <div className="flex items-center justify-between px-5 pt-5 md:px-6 md:pt-6">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <History className="h-4 w-4" /> Recent Movements
            </h2>
            <Button asChild variant="link" size="sm"><Link to={ROUTES.ADMIN.PROCUREMENT_MOVEMENTS}>View all</Link></Button>
          </div>
          <div className="overflow-x-auto p-0 pt-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Project</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovements.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No movements recorded.</TableCell></TableRow>
                ) : recentMovements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{m.movementDate ? new Date(m.movementDate).toLocaleString() : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{m.movementType}</Badge></TableCell>
                    <TableCell className="text-xs">{m.materialName}</TableCell>
                    <TableCell className="text-xs">{m.quantity}</TableCell>
                    <TableCell className="text-xs">{m.projectName || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Surface>
      </PageShell>
    </ConfigurationLayout>
  );
}
