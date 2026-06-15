import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Search, Download, Eye } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchAllSiteVisits } from "../api/site-visits.api";
import { fetchAllLeads } from "../api/leads.api";

export default function VisitReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAllSiteVisits().catch(() => []),
      fetchAllLeads().catch(() => []),
    ])
      .then(([visits, leads]) => {
        if (cancelled) return;
        const leadMap = new Map(leads.map((l) => [String(l.id), l]));
        
        // Only include completed visits that would theoretically have a report
        const completedVisits = visits.filter(v => v.status === "COMPLETED");
        
        const enriched = completedVisits.map((v) => {
          const lead = leadMap.get(String(v.leadId));
          const dateTime = v.scheduledDate && v.scheduledTime
            ? `${v.scheduledDate}T${v.scheduledTime}`
            : v.scheduledDate || v.createdAt || new Date().toISOString();

          return {
            id: v.uuid || v.id,
            client: lead?.clientName || `Lead #${v.leadId}`,
            company: lead?.company || "—",
            date: dateTime,
            assignee: v.assignedTo ? `Employee #${v.assignedTo}` : "Unassigned",
            status: "Generated"
          };
        });

        setReports(enriched);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to fetch reports:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = reports.filter(
    (r) =>
      !search.trim() ||
      r.client.toLowerCase().includes(search.toLowerCase()) ||
      r.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visit Reports"
        description="Access and download generated site inspection reports."
      />

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reports by client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase pl-6">Client / Company</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Inspection Date</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Inspector</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading reports...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-muted-foreground">No reports found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((report) => (
                  <TableRow key={report.id} className="hover:bg-muted/20">
                    <TableCell className="pl-6">
                      <div className="font-semibold">{report.client}</div>
                      <div className="text-xs text-muted-foreground">{report.company}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(report.date).toLocaleDateString("en-AU", { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                      })}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{report.assignee}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={ROUTES.ADMIN.SITE_VISIT_REPORT.replace(":visitId", report.id)}>
                            <Eye className="w-4 h-4 mr-1.5" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1.5" />
                          PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
