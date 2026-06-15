import { useState } from "react";
import { ArrowLeft, Printer, Download, Mail, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InvoiceStep({ prevStep, flowData }) {
  const [invoiceType, setInvoiceType] = useState("Advance");
  
  const quotationAmount = 16102.50;
  const advanceAmount = quotationAmount * 0.4;
  
  const [amount, setAmount] = useState(advanceAmount);
  const tax = amount * 0.05;
  const grandTotal = amount + tax;

  const handleTypeChange = (val) => {
    setInvoiceType(val);
    if (val === "Advance") setAmount(quotationAmount * 0.4);
    if (val === "Final") setAmount(quotationAmount * 0.2);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold">10. Invoice Generator</h2>
          <p className="text-muted-foreground">Generate standard and milestone invoices linked directly to the approved BOQ.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/40 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Invoice Details</CardTitle>
              <Badge variant="outline" className="bg-slate-50 text-slate-500">Status: Draft</Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2"><Label>Client</Label><Input value={flowData.clientName || "Omar Farooq"} readOnly className="bg-muted/30" /></div>
                <div className="space-y-2"><Label>Project</Label><Input value={flowData.projectName || "Sunset Boulevard Villa"} readOnly className="bg-muted/30" /></div>
                <div className="space-y-2"><Label>Linked Quotation</Label><Input value="QT-2026-0042" readOnly className="bg-muted/30 text-blue-600 font-medium" /></div>
                <div className="space-y-2">
                  <Label>Invoice Type</Label>
                  <Select value={invoiceType} onValueChange={handleTypeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Advance">Advance Invoice</SelectItem>
                      <SelectItem value="Milestone">Milestone Invoice</SelectItem>
                      <SelectItem value="Progress">Progress Invoice</SelectItem>
                      <SelectItem value="Final">Final Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Invoice Date</Label><Input type="date" defaultValue={new Date().toISOString().split('T')[0]} /></div>
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} /></div>
              </div>

              <div className="bg-muted/10 border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="font-medium text-slate-600">Base Amount ({invoiceType})</span>
                  <div className="flex items-center"><span className="mr-2 text-muted-foreground">$</span><Input type="number" value={amount.toFixed(2)} onChange={(e) => setAmount(Number(e.target.value))} className="w-32 text-right font-medium"/></div>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="font-medium text-slate-600">Tax (VAT 5%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold">Grand Total</span>
                  <span className="text-xl font-bold text-slate-900">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/60 shadow-sm bg-slate-50">
            <CardHeader className="pb-3 border-b border-border/40 bg-white rounded-t-xl"><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-slate-500" /> Actions</CardTitle></CardHeader>
            <CardContent className="pt-6 space-y-3">
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 mb-2"><CheckCircle2 className="w-4 h-4 mr-2" /> Save as Pending</Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-white"><FileText className="w-4 h-4 mr-3 text-blue-500" /> View PDF Invoice</Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-white"><Download className="w-4 h-4 mr-3 text-emerald-500" /> Download PDF</Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-white"><Printer className="w-4 h-4 mr-3 text-slate-500" /> Print Invoice</Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-white border-primary text-primary hover:bg-primary/5"><Mail className="w-4 h-4 mr-3" /> Email to Client</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-start pt-4 border-t">
        <Button variant="outline" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      </div>
    </div>
  );
}
