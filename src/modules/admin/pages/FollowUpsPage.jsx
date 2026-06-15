import { useState, useEffect } from "react";
import { Search, Phone, Mail, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/shared/constants/routes";
import { fetchAllLeads, updateLeadStatus } from "../api/leads.api";
import { fetchAllEmployees } from "../api/employees.api";
import { useAuth } from "@/shared/context/auth-context";

export default function FollowUpsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  const [followUps, setFollowUps] = useState([]);
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
      
      // Filter out LOST and CLIENT leads to get those needing follow-up
      const activeLeads = allLeads.filter(l => l.status !== "LOST" && l.status !== "CLIENT");
      
      const mappedFollowUps = activeLeads.map(lead => {
        // Mock follow-up data since we don't have dedicated fields
        const dateObj = new Date(lead.lastActivityDate || lead.createdAt);
        const nextDate = new Date(dateObj);
        nextDate.setDate(nextDate.getDate() + 2); // Next follow-up is 2 days later
        
        const isOverdue = nextDate < new Date();
        
        return {
          id: lead.id,
          name: lead.clientName,
          email: lead.email || "No email",
          phone: lead.phone || "No phone",
          assignee: lead.assignedTo ? (lead.assignedTo.employeeName || lead.assignedTo.fullName) : "Unassigned",
          assigneeId: lead.assignedTo?.id,
          lastContact: dateObj.toLocaleDateString("en-AU", { day: '2-digit', month: 'short', year: 'numeric' }),
          nextFollowUp: nextDate.toLocaleDateString("en-AU", { day: '2-digit', month: 'short', year: 'numeric' }),
          status: isOverdue ? "Overdue" : "Upcoming",
          rawLead: lead
        };
      });
      
      setFollowUps(mappedFollowUps);
      setEmployees(allEmployees.filter(e => e.isActive));
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const filtered = followUps.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                        item.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    const matchUser = userFilter === "all" || String(item.assigneeId) === userFilter;
    return matchSearch && matchStatus && matchUser;
  });

  const handleCall = (phone) => {
    if (phone && phone !== "No phone") {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleEmail = (email, name) => {
    if (email && email !== "No email") {
      // Navigate to Email page with state
      navigate(ROUTES.ADMIN.CLIENT_EMAIL, { state: { to: email, name: name } });
    }
  };

  const handleDone = async (id) => {
    try {
      await updateLeadStatus(id, "CONTACTED", user?.id || 1, "Follow-up completed");
      // Remove from list or update next follow-up date
      setFollowUps(followUps.filter(f => f.id !== id));
    } catch (error) {
      console.error("Failed to mark follow-up as done", error);
    }
  };

  const overdueCount = followUps.filter(f => f.status === "Overdue").length;
  const upcomingCount = followUps.filter(f => f.status === "Upcoming").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        description="Leads requiring follow-up action"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total" value={followUps.length} icon={Clock} />
        <StatCard title="Overdue" value={overdueCount} icon={AlertTriangle} valueColor="text-red-500" />
        <StatCard title="Upcoming" value={upcomingCount} icon={CheckCircle} valueColor="text-orange-500" />
      </section>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/30"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
                <SelectTrigger className="w-[140px] bg-muted/30">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={userFilter} onValueChange={setUserFilter} disabled={loading}>
                <SelectTrigger className="w-[180px] bg-muted/30">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.employeeName || emp.fullName}
                    </SelectItem>
                  ))}
                  <SelectItem value="undefined">Unassigned</SelectItem>
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
                <TableHead className="text-xs font-semibold uppercase">Assigned To</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Last Contact</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Next Follow-up</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading follow-ups...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No follow-ups found.
                  </TableCell>
                </TableRow>
              ) : filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.email}</div>
                  </TableCell>
                  <TableCell className="font-medium">{item.assignee}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{item.lastContact}</TableCell>
                  <TableCell className="text-sm font-medium">{item.nextFollowUp}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={item.status === "Overdue" ? "text-red-600 bg-red-50 border-red-100" : "text-orange-600 bg-orange-50 border-orange-100"}
                    >
                      {item.status === "Overdue" ? <AlertTriangle className="w-3 h-3 mr-1" /> : <div className="w-2 h-2 rounded-full bg-orange-500 mr-1.5"></div>}
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        onClick={() => handleCall(item.phone)}
                        disabled={item.phone === "No phone"}
                      >
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                        Call
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        onClick={() => handleEmail(item.email, item.name)}
                        disabled={item.email === "No email"}
                      >
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                        Email
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleDone(item.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Done
                      </Button>
                    </div>
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
