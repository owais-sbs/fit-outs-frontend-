import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Ruler, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function MeasurementsStep({ nextStep, prevStep, flowData, updateData }) {
  const [l, setL] = useState(flowData.measurements?.l || "");
  const [w, setW] = useState(flowData.measurements?.w || "");
  const [h, setH] = useState(flowData.measurements?.h || "");
  
  const [floorArea, setFloorArea] = useState(0);
  const [wallArea, setWallArea] = useState(0);
  const [ceilingArea, setCeilingArea] = useState(0);

  useEffect(() => {
    const numL = Number(l) || 0;
    const numW = Number(w) || 0;
    const numH = Number(h) || 0;

    setFloorArea(numL * numW);
    setCeilingArea(numL * numW);
    setWallArea(2 * (numL * numH + numW * numH));
  }, [l, w, h]);

  const handleNext = () => {
    updateData({ measurements: { l, w, h, floorArea, wallArea, ceilingArea } });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold">4. Capture Dimensions</h2>
          <p className="text-muted-foreground">Enter room dimensions to auto-calculate surface areas.</p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1 bg-slate-50">
          {flowData.selectedFloor || "Ground Floor"} - {flowData.selectedRoom?.name || "Room"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ruler className="w-5 h-5 text-slate-500" /> Room Dimensions (ft)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Length (L)</Label>
                <Input type="number" placeholder="0.00" value={l} onChange={(e) => setL(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Width (W)</Label>
                <Input type="number" placeholder="0.00" value={w} onChange={(e) => setW(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Height (H)</Label>
                <Input type="number" placeholder="0.00" value={h} onChange={(e) => setH(e.target.value)} />
              </div>
            </div>
            
            <div className="bg-slate-50 border rounded-lg p-6 flex justify-center items-center">
              <div className="relative w-48 h-32 border-2 border-slate-300 bg-white">
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">H</div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500">W</div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500">L</div>
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Calculator className="w-16 h-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-slate-50">
          <CardHeader className="pb-3 border-b border-border/40 bg-white rounded-t-xl">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-slate-500" /> Auto Calculations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-900">Floor Area</p>
                <p className="text-xs text-muted-foreground">L × W</p>
              </div>
              <div className="text-xl font-bold text-blue-600">{floorArea.toFixed(2)} <span className="text-sm font-normal text-slate-500">Sq Ft</span></div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-900">Ceiling Area</p>
                <p className="text-xs text-muted-foreground">L × W</p>
              </div>
              <div className="text-xl font-bold text-blue-600">{ceilingArea.toFixed(2)} <span className="text-sm font-normal text-slate-500">Sq Ft</span></div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-900">Total Wall Area</p>
                <p className="text-xs text-muted-foreground">2 × (L×H + W×H)</p>
              </div>
              <div className="text-xl font-bold text-blue-600">{wallArea.toFixed(2)} <span className="text-sm font-normal text-slate-500">Sq Ft</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={handleNext}>Proceed To Photos <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
