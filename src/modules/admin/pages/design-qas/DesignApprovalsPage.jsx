import { useState } from "react";
import { Search, CheckCircle, Clock, XCircle, FileSignature } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const MOCK_APPROVALS = [
  { id: "APP-001", option: "OPT-001", project: "Sunset Boulevard Villa", client: "Omar Farooq", date: "16 Jun 2026", status: "Approved" },
  { id: "APP-002", option: "OPT-003", project: "Downtown Office Fit-out", client: "Tech Corp", date: "18 Jun 2026", status: "Pending" },
  { id: "APP-003", option: "OPT-002", project: "Sunset Boulevard Villa", client: "Omar Farooq", date: "16 Jun 2026", status: "Rejected" },
];

export default function DesignApprovalsPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_APPROVALS.filter(a => 
    a.project.toLowerCase().includes(search.toLowerCase()) || 
    a.client.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Design Approvals"
        description="Track client feedback and final sign-offs on submitted design options."
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

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase">Approval ID</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Design Option</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Project & Client</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Date Sent</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No approvals found matching your search.
                  </TableCell>
                </TableRow>
              ) : filtered.map((app) => (
                <TableRow key={app.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-blue-600">{app.id}</TableCell>
                  <TableCell className="font-medium">{app.option}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{app.project}</div>
                    <div className="text-xs text-muted-foreground">{app.client}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {app.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        app.status === "Approved" ? "text-emerald-600 bg-emerald-50 border-emerald-200" : 
                        app.status === "Rejected" ? "text-red-600 bg-red-50 border-red-200" :
                        "text-amber-600 bg-amber-50 border-amber-200"
                      }
                    >
                      {app.status === "Approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {app.status === "Rejected" && <XCircle className="w-3 h-3 mr-1" />}
                      {app.status === "Pending" && <Clock className="w-3 h-3 mr-1" />}
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8">
                      <FileSignature className="w-4 h-4 mr-2 text-muted-foreground" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
