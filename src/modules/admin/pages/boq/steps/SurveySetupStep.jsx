import { ArrowRight, ArrowLeft, Layers, MapPin, User, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SurveySetupStep({ nextStep, prevStep, flowData }) {
  // Mock data based on selection
  const projectInfo = {
    name: flowData.projectName || "Sunset Boulevard Villa",
    client: flowData.clientName || "Omar Farooq",
    location: "123 Sunset Blvd, Dubai",
    floors: 3,
    engineer: "Sarah K.",
    floorList: ["Ground Floor", "First Floor", "Second Floor"]
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">2. Survey Setup</h2>
        <p className="text-muted-foreground">Review project details and initialized floors before proceeding.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-lg">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex gap-3">
              <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Project Name</p>
                <p className="font-medium">{projectInfo.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{projectInfo.client}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{projectInfo.location}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Assigned Engineer</p>
                <p className="font-medium">{projectInfo.engineer}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Floor Configuration</CardTitle>
              <div className="text-sm font-medium bg-muted/50 px-2.5 py-1 rounded-md text-muted-foreground flex items-center">
                <Layers className="w-4 h-4 mr-1.5" />
                {projectInfo.floors} Floors
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Floors auto-generated from project configuration:
            </p>
            <div className="space-y-2">
              {projectInfo.floorList.map((floor, index) => (
                <div key={index} className="flex items-center p-3 border rounded-lg bg-muted/10">
                  <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs mr-3">
                    {index === 0 ? "G" : index}
                  </div>
                  <span className="font-medium">{floor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={nextStep}>
          Proceed To Rooms <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
