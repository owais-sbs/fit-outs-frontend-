import { useState } from "react";
import { ArrowRight, ArrowLeft, Camera, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PhotosStep({ nextStep, prevStep }) {
  const [photos, setPhotos] = useState([
    { id: 1, url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80", label: "Existing Ceiling" }
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">5. Add Photos (Optional)</h2>
        <p className="text-muted-foreground">Capture and upload site photos for reference.</p>
      </div>

      <Card className="border-border/60 shadow-sm border-dashed bg-muted/10">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border mb-4">
            <Camera className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-lg">Upload Site Photos</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-6">
            Drag and drop images here, or click to browse files. Support for JPEG, PNG formats.
          </p>
          <div className="flex gap-3">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white">
              <Upload className="w-4 h-4 mr-2" /> Browse Files
            </Button>
            <Button variant="outline" className="bg-white">
              <Camera className="w-4 h-4 mr-2" /> Use Camera
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {photos.map(p => (
          <div key={p.id} className="relative group border rounded-xl overflow-hidden shadow-sm aspect-square bg-slate-100">
            <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-white text-sm font-medium">{p.label}</p>
            </div>
            <button className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={nextStep}>Proceed To Work Items <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
