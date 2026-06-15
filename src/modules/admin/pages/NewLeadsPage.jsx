import { useState, useEffect } from "react";
import { Users, Clock, Flame, Calendar, UserPlus, ArrowRight } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/shared/context/auth-context";
import { fetchAllLeads, assignLead, updateLeadStatus } from "../api/leads.api";
import { fetchAllEmployees } from "../api/employees.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function NewLeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAllLeads(),
      fetchAllEmployees().catch(() => [])
    ])
    .then(([allLeads, allEmployees]) => {
      if (cancelled) return;
      const newLeads = allLeads.filter(l => l.status === "NEW" || l.statusLabel === "New");
      setLeads(newLeads);
      setEmployees(allEmployees.filter(e => e.isActive));
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const handleOpenAssignModal = (lead) => {
    setSelectedLeadForAssign(lead);
    setSelectedEmployeeId(lead.assignedTo?.id || "");
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedEmployeeId || !selectedLeadForAssign) return;
    
    setAssigning(true);
    try {
      await assignLead(selectedLeadForAssign.id, selectedEmployeeId);
      
      // Update local state
      const emp = employees.find(e => String(e.id) === String(selectedEmployeeId));
      setLeads(leads.map(l => {
        if (l.id === selectedLeadForAssign.id) {
          return { ...l, assignedTo: emp };
        }
        return l;
      }));
      setIsAssignModalOpen(false);
    } catch (error) {
      console.error("Failed to assign lead:", error);
    } finally {
      setAssigning(false);
    }
  };

  const handleQualifyLead = async (leadId) => {
    try {
      await updateLeadStatus(leadId, "QUALIFIED", user?.id || 1);
      setLeads(leads.filter(l => l.id !== leadId));
    } catch (error) {
      console.error("Failed to qualify lead:", error);
    }
  };

  const unassignedCount = leads.filter(l => !l.assignedTo).length;
  // Compute priority (mocked since backend might not have priority)
  const hotLeads = leads.filter(l => l.priority === "Hot" || !l.priority).length;
  const todayCount = leads.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Leads"
        description="Recently added leads awaiting assignment"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total New" value={leads.length} icon={Users} />
        <StatCard title="Unassigned" value={unassignedCount} icon={Clock} valueColor="text-red-500" />
        <StatCard title="Hot Leads" value={hotLeads} icon={Flame} valueColor="text-red-500" />
        <StatCard title="Today" value={todayCount} icon={Calendar} valueColor="text-emerald-600" />
      </section>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">No new leads available.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {leads.map((lead) => {
            const priority = lead.priority || "Warm";
            const initials = lead.clientName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
            
            return (
              <Card key={lead.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground line-clamp-1">{lead.clientName}</h3>
                        <p className="text-sm text-muted-foreground">{lead.phone || "No phone"}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        priority === "Hot" ? "text-red-500 border-red-200 bg-red-50" :
                        priority === "Warm" ? "text-orange-500 border-orange-200 bg-orange-50" :
                        "text-blue-500 border-blue-200 bg-blue-50"
                      }
                    >
                      <Flame className="w-3 h-3 mr-1" />
                      {priority}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100">
                      {lead.source}
                    </Badge>
                    <span className={`text-xs font-medium ${lead.assignedTo ? 'text-blue-600' : 'text-red-500'}`}>
                      {lead.assignedTo ? lead.assignedTo.employeeName || lead.assignedTo.fullName : "Unassigned"}
                    </span>
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground mb-5">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(lead.createdAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" size="sm" onClick={() => handleOpenAssignModal(lead)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign
                    </Button>
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                      size="sm"
                      onClick={() => handleQualifyLead(lead.id)}
                    >
                      Qualify
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Assign Lead Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Assign Lead</DialogTitle>
          </DialogHeader>

          {selectedLeadForAssign && (
            <div className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="font-semibold text-lg">{selectedLeadForAssign.clientName}</div>
                <div className="text-muted-foreground text-sm">{selectedLeadForAssign.phone || "No phone provided"}</div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-3 block">Assign to</Label>
                <div className="space-y-3">
                  {employees.map(emp => {
                    const empName = emp.employeeName || emp.fullName;
                    const empInitials = empName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                    
                    return (
                      <div key={emp.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10 cursor-pointer" onClick={() => setSelectedEmployeeId(String(emp.id))}>
                        <div className="flex items-center gap-3 w-full">
                          <input 
                            type="radio" 
                            name="assignee" 
                            value={String(emp.id)} 
                            checked={String(selectedEmployeeId) === String(emp.id)} 
                            onChange={(e) => setSelectedEmployeeId(e.target.value)} 
                            id={`emp-${emp.id}`}
                            className="h-4 w-4 text-primary border-primary focus:ring-primary"
                          />
                          <Label htmlFor={`emp-${emp.id}`} className="flex items-center gap-3 cursor-pointer w-full pointer-events-none">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-slate-800 text-white text-xs">{empInitials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{empName}</span>
                          </Label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1 bg-slate-900 text-white hover:bg-slate-800" 
                  onClick={handleConfirmAssign}
                  disabled={!selectedEmployeeId || assigning}
                >
                  {assigning ? "Assigning..." : "Confirm Assign"}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setIsAssignModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
