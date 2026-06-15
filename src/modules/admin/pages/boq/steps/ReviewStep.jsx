import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReviewStep({ nextStep, prevStep, flowData }) {
  const m = flowData.measurements || {};
  const wi = flowData.workItems || [];
  
  const totalFloorItems = wi.filter(i => i.categoryId === 'floor').length;
  const totalWallItems = wi.filter(i => i.categoryId === 'wall').length;
  const totalCeilingItems = wi.filter(i => i.categoryId === 'ceiling').length;
  
  // Calculate total cost for the room
  const totalCost = wi.reduce((sum, item) => {
    let area = 0;
    if (item.categoryId === 'floor') area = m.floorArea || 0;
    if (item.categoryId === 'wall') area = m.wallArea || 0;
    if (item.categoryId === 'ceiling') area = m.ceilingArea || 0;
    return sum + (item.rate * area);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold">7. Review & Save Room</h2>
          <p className="text-muted-foreground">Validate room configurations before finalizing quantities.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm bg-slate-50">
          <CardHeader className="pb-3 border-b border-border/40 bg-white rounded-t-xl">
            <CardTitle className="text-lg">Validation Checklist</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              {m.floorArea > 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />}
              <div>
                <p className="font-medium text-sm">Room Dimensions Captured</p>
                <p className="text-xs text-muted-foreground">{m.floorArea > 0 ? "All basic dimensions entered." : "Missing required measurements."}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              {wi.length > 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />}
              <div>
                <p className="font-medium text-sm">Work Items Assigned</p>
                <p className="text-xs text-muted-foreground">{wi.length} items configured across surfaces.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Room Summary</CardTitle>
              <Badge variant="secondary" className="bg-slate-100">{flowData.selectedRoom?.name || "Room"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-muted-foreground">Floor Area</span>
              <span className="font-medium">{m.floorArea?.toFixed(2) || 0} Sq Ft</span>
            </div>
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-muted-foreground">Wall Area</span>
              <span className="font-medium">{m.wallArea?.toFixed(2) || 0} Sq Ft</span>
            </div>
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-muted-foreground">Ceiling Area</span>
              <span className="font-medium">{m.ceilingArea?.toFixed(2) || 0} Sq Ft</span>
            </div>
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-muted-foreground">Work Items</span>
              <span className="font-medium">{wi.length} Total</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="font-semibold text-slate-900">Estimated Items Total</span>
              <span className="font-bold text-lg text-blue-600">${totalCost.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div className="flex gap-3">
          <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <Save className="w-4 h-4 mr-2" /> Save & Add Another Room
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={nextStep}>
            Calculate BOQ <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
