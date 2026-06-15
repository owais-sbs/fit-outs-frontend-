import { useState } from "react";
import { Search, Briefcase, MapPin, Layers, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MOCK_PROJECTS = [
  { id: 1, name: "Sunset Boulevard Villa", client: "Omar Farooq", address: "123 Sunset Blvd, Dubai", floors: 3, status: "Active", date: "10 Jun 2026" },
  { id: 2, name: "Downtown Office Fit-out", client: "Tech Corp", address: "45 Sheikh Zayed Rd, Dubai", floors: 1, status: "Planning", date: "12 Jun 2026" },
  { id: 3, name: "Palm Jumeirah Residence", client: "Sarah K.", address: "Villa 14, Palm Jumeirah", floors: 2, status: "Active", date: "14 Jun 2026" },
];

export default function ProjectSelectionStep({ nextStep, updateData }) {
  const [search, setSearch] = useState("");

  const filtered = MOCK_PROJECTS.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.client.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (project) => {
    updateData({ projectId: project.id, projectName: project.name, clientName: project.client });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold">1. Select Project</h2>
          <p className="text-muted-foreground">Choose an active project to begin the BOQ and QAS flow.</p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects or clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/30"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(project => (
          <Card key={project.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {project.status}
                </Badge>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {project.date}
                </div>
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
              <p className="text-sm font-medium text-slate-600 mb-4">{project.client}</p>
              
              <div className="space-y-2 mt-auto mb-6">
                <div className="flex items-start text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-2">{project.address}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Layers className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                  {project.floors} {project.floors === 1 ? 'Floor' : 'Floors'}
                </div>
              </div>
              
              <Button 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white" 
                onClick={() => handleSelect(project)}
              >
                Select Project
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
