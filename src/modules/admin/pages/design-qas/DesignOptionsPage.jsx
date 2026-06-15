import { useState } from "react";
import { Search, Grid, Clock, Plus } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MOCK_OPTIONS = [
  { id: "OPT-001", request: "REQ-001", project: "Sunset Boulevard Villa", variant: "Modern Minimalist", date: "15 Jun 2026", status: "Reviewing" },
  { id: "OPT-002", request: "REQ-001", project: "Sunset Boulevard Villa", variant: "Classic Luxury", date: "16 Jun 2026", status: "Draft" },
  { id: "OPT-003", request: "REQ-002", project: "Downtown Office Fit-out", variant: "Industrial Open Plan", date: "17 Jun 2026", status: "Submitted" },
];

export default function DesignOptionsPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_OPTIONS.filter(o => 
    o.project.toLowerCase().includes(search.toLowerCase()) || 
    o.variant.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Design Options"
        description="Review, modify, and present different design variants to clients."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Option
          </Button>
        }
      />

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search variants or projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/30"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(opt => (
          <Card key={opt.id} className="border-border/60 shadow-sm hover:border-slate-300 transition-colors">
            <div className="aspect-video bg-muted/30 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Grid className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge variant="secondary" className="bg-white text-slate-700 shadow-sm border border-slate-200">
                  {opt.id}
                </Badge>
                <Badge className={
                  opt.status === 'Submitted' ? 'bg-blue-500 text-white shadow-sm' :
                  opt.status === 'Draft' ? 'bg-slate-500 text-white shadow-sm' :
                  'bg-amber-500 text-white shadow-sm'
                }>
                  {opt.status}
                </Badge>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="flex flex-col gap-1 mb-4">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Variant Name</span>
                <h3 className="font-semibold text-lg">{opt.variant}</h3>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-border/40">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Project</span>
                  <span className="font-medium truncate max-w-[150px]" title={opt.project}>{opt.project}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Linked Request</span>
                  <span className="font-medium text-blue-600">{opt.request}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created On</span>
                  <span className="font-medium flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {opt.date}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border rounded-xl bg-muted/20">
            <Grid className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-lg">No options found</h3>
            <p className="text-muted-foreground mt-1">Create a new variant or adjust search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
