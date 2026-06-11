import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, CheckCircle2, XCircle, ArrowRight, Eye, Search, MapPin, Calendar } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectStore } from "@/shared/store/projectStore";
import { ROUTES } from "@/shared/constants/routes";

export default function ProjectRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const loadRequests = () => {
    setRequests(projectStore.getRequests());
  };

  useEffect(() => {
    loadRequests();
    const timer = setTimeout(() => setLoading(false), 500);
    window.addEventListener("storage_update", loadRequests);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage_update", loadRequests);
    };
  }, []);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesSearch =
        !query ||
        r.id.toLowerCase().includes(query) ||
        r.projectName.toLowerCase().includes(query) ||
        r.clientName.toLowerCase().includes(query) ||
        r.location.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const handleApprove = (id) => {
    projectStore.updateRequestStatus(id, "Approved");
    loadRequests();
    if (selectedRequest?.id === id) {
      setSelectedRequest((prev) => ({ ...prev, status: "Approved" }));
    }
  };

  const handleReject = (id) => {
    projectStore.updateRequestStatus(id, "Rejected");
    loadRequests();
    if (selectedRequest?.id === id) {
      setSelectedRequest((prev) => ({ ...prev, status: "Rejected" }));
    }
  };

  const handleConvertToProject = (request) => {
    // Navigate to Create Project screen and pre-fill details using route state
    navigate(ROUTES.ADMIN.PROJECT_CREATE, { state: { fromRequestId: request.id, requestData: request } });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-none font-medium">Pending</Badge>;
      case "Approved":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-none font-medium">Approved</Badge>;
      case "Rejected":
        return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20 border-none font-medium">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Project Requests"
        description="Review project requests submitted directly by clients. Approve or convert them to active projects."
      />

      {/* Filters */}
      <Card className="border-border/60 shadow-sm bg-card/65 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search request ID, client, project..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4 pl-6">Request ID</th>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 pl-6"><div className="h-4 w-12 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="py-4 px-4 pr-6 text-right"><div className="h-8 w-24 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No project requests found</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedRequest(r)}
                  >
                    <td className="py-4 px-4 pl-6 font-mono text-xs font-semibold text-muted-foreground group-hover:text-primary">
                      {r.id}
                    </td>
                    <td className="py-4 px-4 font-medium max-w-[200px] truncate">{r.projectName}</td>
                    <td className="py-4 px-4 text-muted-foreground">{r.clientName}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="text-xs font-normal bg-background/50">{r.projectType}</Badge>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        <span className="truncate max-w-[120px]">{r.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        <span>{r.submissionDate}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(r.status)}</td>
                    <td className="py-4 px-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="View Details"
                          onClick={() => setSelectedRequest(r)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {r.status === "Pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                              title="Approve Request"
                              onClick={() => handleApprove(r.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Reject Request"
                              onClick={() => handleReject(r.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {r.status === "Approved" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => handleConvertToProject(r)}
                          >
                            <span>Convert</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details View Drawer/Modal Overlay */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-border/80 shadow-2xl p-6 relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-mono text-xs font-semibold text-muted-foreground">{selectedRequest.id}</span>
                <h3 className="text-xl font-bold">{selectedRequest.projectName}</h3>
              </div>
              <div>{getStatusBadge(selectedRequest.status)}</div>
            </div>

            <div className="space-y-4 text-sm mb-6">
              <div className="grid grid-cols-2 gap-4 border-y py-4 border-border/50">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">Client Name</span>
                  <span className="font-medium">{selectedRequest.clientName}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">Submission Date</span>
                  <span>{selectedRequest.submissionDate}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">Project Type</span>
                  <span>{selectedRequest.projectType}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">Location</span>
                  <span>{selectedRequest.location}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">Expected Start Date</span>
                  <span>{selectedRequest.expectedStartDate}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">Budget Range</span>
                  <span className="font-semibold text-primary">{selectedRequest.budgetRange}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-1">Description</span>
                <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border">
                  {selectedRequest.description}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                {selectedRequest.status === "Pending" && (
                  <>
                    <Button variant="outline" className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10" size="sm" onClick={() => handleApprove(selectedRequest.id)}>
                      Approve
                    </Button>
                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10" size="sm" onClick={() => handleReject(selectedRequest.id)}>
                      Reject
                    </Button>
                  </>
                )}
                {selectedRequest.status === "Approved" && (
                  <Button size="sm" className="gap-2" onClick={() => handleConvertToProject(selectedRequest)}>
                    <span>Convert to Project</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
