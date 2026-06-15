import { useState, useEffect } from "react";
import { Search, Calendar, Users, MapPin, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/shared/constants/routes";
import { fetchAllLeads } from "../api/leads.api";
import { fetchAllEmployees } from "../api/employees.api";

const STAGES = ["Qualified", "Site Visit", "Proposal", "Approved"];

function ProgressBar({ currentStage }) {
  const currentIndex = STAGES.indexOf(currentStage) === -1 ? 0 : STAGES.indexOf(currentStage);
  
  return (
    <div className="flex items-center gap-1 text-[10px] font-medium">
      {STAGES.map((stage, idx) => {
        let className = "px-2 py-1 rounded-full whitespace-nowrap ";
        if (idx === 0 && currentIndex === 0) {
          className += "bg-emerald-50 text-emerald-600";
        } else if (idx === currentIndex) {
          className += "bg-slate-900 text-white";
        } else {
          className += "text-muted-foreground opacity-50";
        }
        
        return (
          <div key={stage} className="flex items-center gap-1">
            <span className={className}>{stage}</span>
            {idx < STAGES.length - 1 && (
              <span className="text-muted-foreground/30 text-[8px]">&gt;</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function QualifiedLeadsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [engineerFilter, setEngineerFilter] = useState("all");
  
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAllLeads(),
      fetchAllEmployees().catch(() => [])
    ])
    .then(([allLeads, allEmployees]) => {
      if (cancelled) return;
      
      const qualifiedLeads = allLeads.filter(l => 
        l.status === "QUALIFIED" || 
        l.statusLabel === "Qualified" ||
        l.status === "SITE_VISIT_SCHEDULED"
      );
      
      setLeads(qualifiedLeads);
      setEmployees(allEmployees.filter(e => e.isActive));
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchSearch = lead.clientName.toLowerCase().includes(search.toLowerCase()) || 
                        (lead.company || "").toLowerCase().includes(search.toLowerCase());
    const assigneeName = lead.assignedTo ? (lead.assignedTo.employeeName || lead.assignedTo.fullName) : "Unassigned";
    const matchEngineer = engineerFilter === "all" || String(lead.assignedTo?.id) === engineerFilter;
    return matchSearch && matchEngineer;
  });

  const scheduledCount = leads.filter(l => l.status === "SITE_VISIT_SCHEDULED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qualified Leads"
        description="Leads ready for site visit or proposal"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Qualified" value={leads.length} icon={Users} />
        <StatCard title="Awaiting Visit" value={leads.length - scheduledCount} icon={MapPin} valueColor="text-orange-500" />
        <StatCard title="Visit Scheduled" value={scheduledCount} icon={Calendar} valueColor="text-blue-500" />
        <StatCard title="At Proposal" value="0" icon={CheckCircle} valueColor="text-emerald-600" />
      </section>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/30"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={engineerFilter} onValueChange={setEngineerFilter} disabled={loading}>
                <SelectTrigger className="w-[180px] bg-muted/30">
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.employeeName || emp.fullName}
                    </SelectItem>
                  ))}
                  <SelectItem value="null">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase">Lead Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Company</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Location</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Assigned To</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Progress</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading leads...</TableCell>
                </TableRow>
              ) : filteredLeads.map((lead) => {
                const stage = lead.status === "SITE_VISIT_SCHEDULED" ? "Site Visit" : "Qualified";
                const location = lead.location || lead.source || "—";
                
                return (
                  <TableRow key={lead.id} className="hover:bg-muted/20">
                    <TableCell className="font-semibold">{lead.clientName}</TableCell>
                    <TableCell className="font-medium">{lead.company || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-3 h-3 mr-1" />
                        {location}
                      </div>
                    </TableCell>
                    <TableCell>{lead.assignedTo ? (lead.assignedTo.employeeName || lead.assignedTo.fullName) : <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>
                      <ProgressBar currentStage={stage} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="font-medium"
                        onClick={() => navigate(ROUTES.ADMIN.SITE_VISIT_SCHEDULE)}
                      >
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        Schedule Visit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No qualified leads found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
