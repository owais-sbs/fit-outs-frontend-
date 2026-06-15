import { useState } from "react";
import { ArrowRight, ArrowLeft, Send, FileCheck, FileSignature, Receipt, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function QuotationStep({ nextStep, prevStep, flowData }) {
  const [proposalIntro, setProposalIntro] = useState("Thank you for the opportunity to provide a quotation for the fit-out works at your property. We are pleased to submit the following proposal based on the agreed scope of work and site assessment.");
  
  const [milestones, setMilestones] = useState([
    { id: 1, name: "Advance Payment", percentage: 40, amount: 6441.00 },
    { id: 2, name: "Material Delivery", percentage: 40, amount: 6441.00 },
    { id: 3, name: "Handover", percentage: 20, amount: 3220.50 }
  ]);

  const totalAmount = 16102.50; // Mock calculation based on BOQ step
  const tax = totalAmount * 0.05; // 5% VAT
  const grandTotal = totalAmount + tax;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold">9. Quotation Generator</h2>
          <p className="text-muted-foreground">Configure and generate the final client quotation proposal.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <Tabs defaultValue="summary" className="w-full">
              <CardHeader className="pb-0 border-b border-border/40 px-4 pt-4">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 border-none p-0">
                  <TabsTrigger value="summary" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full text-base">Summary</TabsTrigger>
                  <TabsTrigger value="proposal" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full text-base">Proposal Text</TabsTrigger>
                  <TabsTrigger value="milestones" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full text-base">Payment Milestones</TabsTrigger>
                  <TabsTrigger value="terms" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full text-base">T&C</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-6">
                <TabsContent value="summary" className="m-0 space-y-6">
                  <div className="grid grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border border-border/40">
                    <div><p className="text-sm text-muted-foreground mb-1">Client Name</p><p className="font-semibold">{flowData.clientName || "Omar Farooq"}</p></div>
                    <div><p className="text-sm text-muted-foreground mb-1">Project</p><p className="font-semibold">{flowData.projectName || "Sunset Boulevard Villa"}</p></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b"><span className="text-slate-600">Total Project Value (BOQ)</span><span className="font-semibold">${totalAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center py-2 border-b"><span className="text-slate-600">VAT (5%)</span><span className="font-semibold text-muted-foreground">${tax.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center py-3"><span className="text-lg font-bold">Grand Total</span><span className="text-xl font-bold text-slate-900">${grandTotal.toFixed(2)}</span></div>
                  </div>
                </TabsContent>
                <TabsContent value="proposal" className="m-0 space-y-4">
                  <Label>Proposal Introduction Text</Label>
                  <Textarea className="min-h-[150px]" value={proposalIntro} onChange={(e) => setProposalIntro(e.target.value)} />
                </TabsContent>
                <TabsContent value="milestones" className="m-0 space-y-4">
                  {milestones.map((ms, i) => (
                    <div key={ms.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">{i+1}</div>
                      <div className="flex-1"><Label>Name</Label><Input value={ms.name} readOnly className="mt-1" /></div>
                      <div className="w-24"><Label>%</Label><Input value={ms.percentage} readOnly className="mt-1" /></div>
                      <div className="w-32"><Label>Amount</Label><Input value={`$${ms.amount.toFixed(2)}`} readOnly className="mt-1 bg-slate-50" /></div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="terms" className="m-0 space-y-4">
                  <Textarea className="min-h-[200px]" defaultValue="1. Validity 30 days.\n2. Payment per milestones.\n3. Variations charged extra." />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/60 shadow-sm bg-slate-50">
            <CardHeader className="pb-3 border-b border-border/40 bg-white rounded-t-xl"><CardTitle className="text-lg flex items-center gap-2"><FileCheck className="w-5 h-5 text-slate-500" /> Documents</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Button variant="outline" className="w-full justify-start h-12 bg-white"><FileText className="w-4 h-4 mr-3 text-blue-500" /> BOQ Sheet</Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-white"><Receipt className="w-4 h-4 mr-3 text-emerald-500" /> Payment Schedule</Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-white"><FileSignature className="w-4 h-4 mr-3 text-purple-500" /> Proposal PDF Preview</Button>
              <div className="pt-6 mt-4 border-t border-slate-200">
                <Button className="w-full mb-3 bg-slate-900 hover:bg-slate-800 text-white h-12"><FileCheck className="w-4 h-4 mr-2" /> Generate Quotation</Button>
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 h-12"><Send className="w-4 h-4 mr-2" /> Send To Client</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={nextStep}>Proceed To Invoice <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
