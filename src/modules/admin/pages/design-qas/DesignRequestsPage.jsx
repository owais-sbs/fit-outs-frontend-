import { useState } from "react";
import { Search, PenTool, Clock, ArrowRight } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MOCK_REQUESTS = [
  { id: "REQ-001", project: "Sunset Boulevard Villa", client: "Omar Farooq", date: "10 Jun 2026", status: "Pending", priority: "High" },
  { id: "REQ-002", project: "Downtown Office Fit-out", client: "Tech Corp", date: "12 Jun 2026", status: "In Progress", priority: "Medium" },
  { id: "REQ-003", project: "Palm Jumeirah Residence", client: "Sarah K.", date: "14 Jun 2026", status: "Completed", priority: "Low" },
];

export default function DesignRequestsPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_REQUESTS.filter(r => 
    r.project.toLowerCase().includes(search.toLowerCase()) || 
    r.client.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Design Requests"
        description="Manage incoming design requests and track their progression."
      />

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ID, project or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/30"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(req => (
          <Card key={req.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {req.status}
                </Badge>
                <div className="text-xs text-muted-foreground font-medium">
                  {req.id}
                </div>
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{req.project}</h3>
              <p className="text-sm font-medium text-slate-600 mb-4">{req.client}</p>
              
              <div className="flex justify-between items-center text-sm text-muted-foreground mt-4 pt-4 border-t border-border/40">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" />
                  {req.date}
                </div>
                <Badge variant="secondary" className={req.priority === 'High' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}>
                  {req.priority} Priority
                </Badge>
              </div>

              <Button variant="outline" className="w-full mt-4 bg-slate-50">
                View Request Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border rounded-xl bg-muted/20">
            <PenTool className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-lg">No requests found</h3>
            <p className="text-muted-foreground mt-1">Adjust your search to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
}
