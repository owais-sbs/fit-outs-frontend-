import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Plus, MapPin, Calendar, Clock, CheckCircle2 } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { projectStore } from "@/shared/store/projectStore";
import { useAuth } from "@/shared/context/auth-context";

export default function NewProjectRequestPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  
  const [form, setForm] = useState({
    projectName: "",
    projectType: "Commercial",
    location: "",
    expectedStartDate: "",
    budgetRange: "$100,000 - $150,000",
    description: "",
  });

  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const loadRequests = useCallback(() => {
    const allReqs = projectStore.getRequests();
    const clientName = user?.name || "Claire Moss";
    setRequests(allReqs.filter((r) => r.clientName.toLowerCase() === clientName.toLowerCase() || r.clientId === "client-001"));
  }, [user]);

  useEffect(() => {
    loadRequests();
    window.addEventListener("storage_update", loadRequests);
    return () => {
      window.removeEventListener("storage_update", loadRequests);
    };
  }, [loadRequests]);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.projectName.trim()) errs.projectName = "Project name is required";
    if (!form.location.trim()) errs.location = "Location is required";
    if (!form.expectedStartDate) errs.expectedStartDate = "Target start date is required";
    if (!form.description.trim()) errs.description = "Please describe the project details";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    projectStore.addRequest({
      projectName: form.projectName,
      projectType: form.projectType,
      location: form.location,
      expectedStartDate: form.expectedStartDate,
      budgetRange: form.budgetRange,
      description: form.description,
      clientName: user?.name || "Claire Moss",
      clientId: "client-001",
    });

    setForm({
      projectName: "",
      projectType: "Commercial",
      location: "",
      expectedStartDate: "",
      budgetRange: "$100,000 - $150,000",
      description: "",
    });

    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
    loadRequests();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-none font-medium">Pending Review</Badge>;
      case "Approved":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-none font-medium">Approved</Badge>;
      case "Rejected":
        return <Badge className="bg-destructive/15 text-destructive border-none font-medium">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Submit Project Request"
        description="Fill out the specifications below to request a new construction or fit-out project. Our team will review the request."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60 shadow-sm bg-card/65 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              {success && (
                <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Your project request has been submitted successfully and is currently under review by our Admin team.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="projectName" className="text-xs font-semibold">Project Name *</Label>
                    <div className="relative">
                      <ClipboardList className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                      <Input
                        id="projectName"
                        placeholder="e.g. Retail Boutique Renovation"
                        className="pl-9 h-9"
                        value={form.projectName}
                        onChange={(e) => handleChange("projectName", e.target.value)}
                      />
                    </div>
                    {errors.projectName && <p className="text-[11px] text-destructive">{errors.projectName}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="projectType" className="text-xs font-semibold">Project Type</Label>
                    <Select value={form.projectType} onValueChange={(val) => handleChange("projectType", val)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Interior">Interior</SelectItem>
                        <SelectItem value="Renovation">Renovation</SelectItem>
                        <SelectItem value="Construction">Construction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-xs font-semibold">Location / Site Address *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                      <Input
                        id="location"
                        placeholder="e.g. Surry Hills, NSW"
                        className="pl-9 h-9"
                        value={form.location}
                        onChange={(e) => handleChange("location", e.target.value)}
                      />
                    </div>
                    {errors.location && <p className="text-[11px] text-destructive">{errors.location}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="expectedStartDate" className="text-xs font-semibold">Target Start Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                      <Input
                        id="expectedStartDate"
                        type="date"
                        className="pl-9 h-9"
                        value={form.expectedStartDate}
                        onChange={(e) => handleChange("expectedStartDate", e.target.value)}
                      />
                    </div>
                    {errors.expectedStartDate && <p className="text-[11px] text-destructive">{errors.expectedStartDate}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="budgetRange" className="text-xs font-semibold">Estimated Budget Range</Label>
                  <Select value={form.budgetRange} onValueChange={(val) => handleChange("budgetRange", val)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$10,000 - $50,000">$10,000 - $50,000</SelectItem>
                      <SelectItem value="$50,000 - $100,000">$50,000 - $100,000</SelectItem>
                      <SelectItem value="$100,000 - $150,000">$100,000 - $150,000</SelectItem>
                      <SelectItem value="$150,000 - $200,000">$150,000 - $200,000</SelectItem>
                      <SelectItem value="$200,000 - $500,000">$200,000 - $500,000</SelectItem>
                      <SelectItem value="$500,000+">$500,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold">Requirements & Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about structural changes, spatial usage, and desired aesthetic fit-outs..."
                    rows={5}
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                  {errors.description && <p className="text-[11px] text-destructive">{errors.description}</p>}
                </div>

                <Button type="submit" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Submission History */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm sticky top-6">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">My Request History</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto divide-y divide-border/60">
              {requests.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">No previous requests found</p>
                </div>
              ) : (
                requests.map((r) => (
                  <div key={r.id} className="p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-semibold text-muted-foreground">{r.id}</span>
                      <span>{getStatusBadge(r.status)}</span>
                    </div>
                    <div className="font-semibold text-sm text-foreground">{r.projectName}</div>
                    <div className="text-muted-foreground leading-relaxed line-clamp-2">{r.description}</div>
                    <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                      <span>Submitted: {r.submissionDate}</span>
                      <span className="font-semibold text-primary">{r.budgetRange}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
