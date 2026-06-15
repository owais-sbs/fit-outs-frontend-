import { useState } from "react";
import { ArrowRight, ArrowLeft, BarChart3, Settings, Save, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function ProcessingStep({ nextStep, prevStep, flowData }) {
  const [markupPercent, setMarkupPercent] = useState(25);

  const m = flowData.measurements || {};
  const wi = flowData.workItems || [];

  const rawTotalCost = wi.reduce((sum, item) => {
    let area = 0;
    if (item.categoryId === 'floor') area = m.floorArea || 0;
    if (item.categoryId === 'wall') area = m.wallArea || 0;
    if (item.categoryId === 'ceiling') area = m.ceilingArea || 0;
    return sum + (item.rate * area);
  }, 0);

  const totalArea = (m.floorArea || 0) + (m.wallArea || 0) + (m.ceilingArea || 0);
  const markupAmount = rawTotalCost * (markupPercent / 100);
  const finalCost = rawTotalCost + markupAmount;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold">8. BOQ Processing</h2>
          <p className="text-muted-foreground">System auto-calculation of quantities, costs, and markups.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9"><Download className="w-4 h-4 mr-2" /> Excel</Button>
          <Button variant="outline" size="sm" className="h-9"><FileText className="w-4 h-4 mr-2" /> PDF</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card className="border-border/60 shadow-sm overflow-hidden h-full">
            <CardHeader className="pb-3 bg-slate-50 border-b border-border/40">
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-slate-500" /> Itemized Bill of Quantities
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Item</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate ($)</TableHead>
                    <TableHead className="text-right">Amount ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wi.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground h-24">No items calculated yet.</TableCell></TableRow>
                  )}
                  {wi.map((item, idx) => {
                    let area = 0;
                    if (item.categoryId === 'floor') area = m.floorArea || 0;
                    if (item.categoryId === 'wall') area = m.wallArea || 0;
                    if (item.categoryId === 'ceiling') area = m.ceilingArea || 0;
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                        <TableCell className="text-right">{area.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">{(area * item.rate).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-lg">Calculation Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Project Area</span>
                <span className="font-semibold">{totalArea.toFixed(2)} Sq Ft</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Raw Cost</span>
                <span className="font-semibold">${rawTotalCost.toFixed(2)}</span>
              </div>
              
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-slate-600">Apply Markup (%)</Label>
                  <Input 
                    type="number" 
                    value={markupPercent} 
                    onChange={(e) => setMarkupPercent(Number(e.target.value))}
                    className="w-20 h-8 text-right"
                  />
                </div>
                <div className="flex justify-between items-center text-sm text-amber-600 font-medium">
                  <span>Markup Value</span>
                  <span>+ ${markupAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-lg font-bold">Total (Selling)</span>
                <span className="text-xl font-bold text-slate-900">${finalCost.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={nextStep}>
          Generate Quotation <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
