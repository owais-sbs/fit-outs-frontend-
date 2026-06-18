import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Briefcase, MapPin, Calendar, DollarSign } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectStore } from "@/shared/store/projectStore";
import { ROUTES } from "@/shared/constants/routes";
import { INITIAL_EMPLOYEES } from "@/modules/admin/data/employees";

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useMemo(() => location.state || {}, [location.state]);

  const [form, setForm] = useState({
    projectName: "",
    clientName: "",
    clientId: "client-001",
    projectType: "Commercial",
    location: "",
    assignedManager: "",
    startDate: "",
    expectedCompletionDate: "",
    budget: "",
    description: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Populate form if converting from a client project request
    if (state.requestData) {
      const req = state.requestData;
      // Extract numeric budget if possible, e.g. "$150,000 - $200,000" -> 150000
      let numericBudget = "";
      if (req.budgetRange) {
        const matches = req.budgetRange.replace(/,/g, "").match(/\d+/);
        if (matches) numericBudget = matches[0];
      }

      setForm({
        projectName: req.projectName || "",
        clientName: req.clientName || "",
        clientId: req.clientId || "client-001",
        projectType: req.projectType || "Commercial",
        location: req.location || "",
        assignedManager: "",
        startDate: req.expectedStartDate || "",
        expectedCompletionDate: "",
        budget: numericBudget,
        description: req.description || "",
      });
    }
  }, [state]);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const errs = {};
    if (!form.projectName.trim()) errs.projectName = "Project name is required";
    if (!form.clientName.trim()) errs.clientName = "Client name is required";
    if (!form.location.trim()) errs.location = "Location is required";
    if (!form.assignedManager) errs.assignedManager = "Assigned manager is required";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.expectedCompletionDate) errs.expectedCompletionDate = "Expected completion date is required";
    if (!form.budget || isNaN(form.budget) || parseFloat(form.budget) <= 0) {
      errs.budget = "Valid budget amount is required";
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Add to projectStore
    projectStore.addProject({
      ...form,
      budget: parseFloat(form.budget),
      progress: 0,
      status: "Planning",
    });

    // Mark request as Approved if converting
    if (state.fromRequestId) {
      projectStore.updateRequestStatus(state.fromRequestId, "Approved");
    }

    navigate(ROUTES.ADMIN.PROJECTS);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-8 w-8 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground font-medium">Back to projects</span>
      </div>

      <PageHeader
        title="Create New Project"
        description="Establish a new project contract, assign a manager and allocate budget details."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/60 shadow-sm bg-card/65 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/85 border-b pb-2">
              General Project Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="projectName" className="text-xs font-semibold">Project Name *</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                  <Input
                    id="projectName"
                    placeholder="e.g. Retail Showroom Expansion"
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
                <Label htmlFor="clientName" className="text-xs font-semibold">Client Name *</Label>
                <Input
                  id="clientName"
                  placeholder="e.g. Claire Moss"
                  className="h-9"
                  value={form.clientName}
                  onChange={(e) => handleChange("clientName", e.target.value)}
                />
                {errors.clientName && <p className="text-[11px] text-destructive">{errors.clientName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold">Location / Address *</Label>
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold">Project Scope / Description</Label>
              <Textarea
                id="description"
                placeholder="Detail the scope of works, custom requirements, and structural changes..."
                rows={4}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/65 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/85 border-b pb-2">
              Assignment & Budgeting
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="assignedManager" className="text-xs font-semibold">Assigned Project Manager *</Label>
                <Select value={form.assignedManager} onValueChange={(val) => handleChange("assignedManager", val)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Choose a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {INITIAL_EMPLOYEES.map((emp) => (
                      <SelectItem key={emp.id} value={emp.employeeName}>
                        {emp.employeeName} ({emp.designation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assignedManager && <p className="text-[11px] text-destructive">{errors.assignedManager}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="budget" className="text-xs font-semibold">Total Contract Budget ($) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g. 150000"
                    className="pl-9 h-9"
                    value={form.budget}
                    onChange={(e) => handleChange("budget", e.target.value)}
                  />
                </div>
                {errors.budget && <p className="text-[11px] text-destructive">{errors.budget}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-semibold">Contract Start Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                  <Input
                    id="startDate"
                    type="date"
                    className="pl-9 h-9"
                    value={form.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                  />
                </div>
                {errors.startDate && <p className="text-[11px] text-destructive">{errors.startDate}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expectedCompletionDate" className="text-xs font-semibold">Expected Completion Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                  <Input
                    id="expectedCompletionDate"
                    type="date"
                    className="pl-9 h-9"
                    value={form.expectedCompletionDate}
                    onChange={(e) => handleChange("expectedCompletionDate", e.target.value)}
                  />
                </div>
                {errors.expectedCompletionDate && <p className="text-[11px] text-destructive">{errors.expectedCompletionDate}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" />
            Save Project
          </Button>
        </div>
      </form>
    </div>
  );
}
