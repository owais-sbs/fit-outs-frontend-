import { useState } from "react";
import { CheckSquare, Plus, Search, Edit2, Trash2 } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MOCK_CHECKLISTS = [
  { id: 1, title: "Initial Site Assessment", items: 12, category: "Assessment", status: "Active" },
  { id: 2, title: "Measurement & Spatial", items: 8, category: "Measurement", status: "Active" },
  { id: 3, title: "Safety & Compliance", items: 15, category: "Safety", status: "Active" },
  { id: 4, title: "Client Requirement Brief", items: 10, category: "Planning", status: "Draft" },
];

export default function ChecklistsPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_CHECKLISTS.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checklists Configuration"
        description="Manage standard checklists used during site inspections."
        actions={
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Checklist
          </Button>
        }
      />

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search checklists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((checklist) => (
          <Card key={checklist.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="bg-muted/50 font-medium">
                  {checklist.category}
                </Badge>
                <Badge variant="outline" className={
                  checklist.status === "Active" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }>
                  {checklist.status}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-3">{checklist.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex justify-between items-center">
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckSquare className="w-4 h-4 mr-1.5" />
                {checklist.items} check items
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div className="py-16 flex flex-col items-center text-center bg-muted/20 border border-border/50 rounded-xl">
          <CheckSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium text-lg">No checklists found</h3>
          <p className="text-muted-foreground max-w-sm mt-1">Try adjusting your search query or create a new checklist.</p>
        </div>
      )}
    </div>
  );
}
