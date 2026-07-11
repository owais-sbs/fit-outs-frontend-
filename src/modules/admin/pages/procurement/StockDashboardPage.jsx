import React, { useEffect, useState } from "react";
import { Package, AlertTriangle, TrendingUp, History } from "lucide-react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import PageHeader from "../../components/shared/configuration/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="space-y-6">
        <PageHeader
          title="Stock Dashboard"
          description="Company-wide warehouse balances, stock value, and recent activity."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Total Stock Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{isLoading ? "—" : formatCurrency(totalValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" /> Materials Tracked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{isLoading ? "—" : balances.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Below Min Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{isLoading ? "—" : lowStockItems.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button asChild size="sm"><Link to={ROUTES.ADMIN.PROCUREMENT_RECEIPT}>Goods Receipt</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to={ROUTES.ADMIN.PROCUREMENT_ISSUE}>Stock Issue</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to={ROUTES.ADMIN.PROCUREMENT_MOVEMENTS}>Movement History</Link></Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Balances</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
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
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No stock records yet.</TableCell></TableRow>
                  ) : balances.map((b) => (
                    <TableRow key={b.materialId}>
                      <TableCell>
                        <div className="font-medium text-sm">{b.materialName}</div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" /> Recent Movements</CardTitle>
            <Button asChild variant="link" size="sm"><Link to={ROUTES.ADMIN.PROCUREMENT_MOVEMENTS}>View all</Link></Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
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
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No movements recorded.</TableCell></TableRow>
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
          </CardContent>
        </Card>
      </div>
    </ConfigurationLayout>
  );
}
