import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Save, Briefcase, MapPin, Calendar, Loader2, UserPlus,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectStore } from "@/shared/store/projectStore";
import { ROUTES } from "@/shared/constants/routes";
import { fetchAllClients, createClient } from "@/modules/admin/api/clients.api";
import { fetchAllEmployees } from "@/modules/admin/api/employees.api";
import { createProject } from "@/modules/admin/api/projects.api";
import { DIRHAM_SYMBOL } from "@/shared/utils/currency";
import { useAuth } from "@/shared/context/auth-context";
import { ROLES } from "@/shared/constants/roles";

const CLIENT_MODE = {
  NONE: "none",
  EXISTING: "existing",
  NEW: "new",
};

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
  let out = "";
  for (let i = 0; i < 14; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isPm = location.pathname.startsWith("/project-manager");
  const projectsListRoute = isPm ? ROUTES.PROJECT_MANAGER.PROJECTS : ROUTES.ADMIN.PROJECTS;
  const state = useMemo(() => location.state || {}, [location.state]);

  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [clientMode, setClientMode] = useState(CLIENT_MODE.NONE);
  const [form, setForm] = useState({
    projectName: "",
    clientName: "",
    clientId: "",
    projectType: "Commercial",
    location: "",
    assignedManager: "",
    startDate: "",
    expectedCompletionDate: "",
    budget: "",
    description: "",
    newClientName: "",
    newClientEmail: "",
    newClientPhone: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAllClients()
      .then((list) => setClients(Array.isArray(list) ? list : []))
      .catch(() => setClients([]));
    fetchAllEmployees()
      .then((list) => setEmployees(Array.isArray(list) ? list.filter((e) => e.isActive !== false) : []))
      .catch(() => setEmployees([]));
  }, []);

  const managerOptions = useMemo(() => {
    const managers = employees.filter((emp) => emp.role === ROLES.PROJECT_MANAGER);
    return managers.length > 0 ? managers : employees;
  }, [employees]);

  useEffect(() => {
    if (state.requestData) {
      const req = state.requestData;
      let numericBudget = "";
      if (req.budgetRange) {
        const matches = req.budgetRange.replace(/,/g, "").match(/\d+/);
        if (matches) numericBudget = matches[0];
      }

      setForm((prev) => ({
        ...prev,
        projectName: req.projectName || "",
        clientName: req.clientName || "",
        clientId: req.clientId ? String(req.clientId) : prev.clientId,
        projectType: req.projectType || "Commercial",
        location: req.location || "",
        startDate: req.expectedStartDate || "",
        budget: numericBudget,
        description: req.description || "",
        newClientName: req.clientName || "",
      }));
      if (req.clientId) setClientMode(CLIENT_MODE.EXISTING);
      else if (req.clientName || req.clientEmail) setClientMode(CLIENT_MODE.NEW);
    }
  }, [state]);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: undefined, submit: undefined }));
  };

  const handleClientModeChange = (mode) => {
    setClientMode(mode);
    setErrors((prev) => ({
      ...prev,
      clientId: undefined,
      newClientName: undefined,
      newClientEmail: undefined,
      submit: undefined,
    }));
    if (mode !== CLIENT_MODE.EXISTING) {
      handleChange("clientId", "");
      handleChange("clientName", "");
    }
  };

  const handleClientChange = (clientId) => {
    const client = clients.find((c) => String(c.id) === String(clientId));
    handleChange("clientId", clientId);
    handleChange("clientName", client?.fullName || "");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.projectName.trim()) errs.projectName = "Project name is required";
    if (!form.location.trim()) errs.location = "Location is required";
    if (!form.assignedManager.trim()) errs.assignedManager = "Assigned manager is required";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.expectedCompletionDate) errs.expectedCompletionDate = "Expected completion date is required";
    if (!form.budget || isNaN(form.budget) || parseFloat(form.budget) <= 0) {
      errs.budget = "Valid budget amount is required";
    }

    if (clientMode === CLIENT_MODE.EXISTING && !form.clientId) {
      errs.clientId = "Select a client account, or choose another option";
    }
    if (clientMode === CLIENT_MODE.NEW) {
      if (!form.newClientName.trim()) errs.newClientName = "Client name is required";
      if (!form.newClientEmail.trim() || !/\S+@\S+\.\S+/.test(form.newClientEmail)) {
        errs.newClientEmail = "Valid client email is required";
      }
    }
    return errs;
  };

  const resolveClientId = async () => {
    if (clientMode === CLIENT_MODE.NONE) return null;
    if (clientMode === CLIENT_MODE.EXISTING) return form.clientId || null;

    const created = await createClient({
      fullName: form.newClientName.trim(),
      email: form.newClientEmail.trim(),
      phone: form.newClientPhone.trim() || null,
      password: generateTempPassword(),
      companyUuid: user?.companyId || user?.companyUuid || null,
      companyName: user?.companyName || null,
    });
    return created.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const clientId = await resolveClientId();

      await createProject({
        name: form.projectName.trim(),
        projectName: form.projectName.trim(),
        clientId: clientId || null,
        companyId: user?.companyId || user?.companyUuid || null,
        projectType: form.projectType,
        location: form.location.trim(),
        assignedManager: form.assignedManager.trim(),
        startDate: form.startDate,
        expectedCompletionDate: form.expectedCompletionDate,
        budget: parseFloat(form.budget),
        description: form.description.trim(),
        status: "Planning",
        progress: 0,
      });

      if (state.fromRequestId) {
        projectStore.updateRequestStatus(state.fromRequestId, "Approved");
      }

      navigate(projectsListRoute);
    } catch (err) {
      setErrors({
        submit:
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to create project",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(projectsListRoute)}
          className="h-8 w-8 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground font-medium">Back to projects</span>
      </div>

      <PageHeader
        title="Create New Project"
        description="Start a project with the details you have. Client account is optional — you can skip it or create one here."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20">
            {errors.submit}
          </p>
        )}

        <Card className="bg-card/65 backdrop-blur-sm">
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

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold">Client (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={clientMode === CLIENT_MODE.NONE ? "default" : "outline"}
                    onClick={() => handleClientModeChange(CLIENT_MODE.NONE)}
                  >
                    No client yet
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={clientMode === CLIENT_MODE.EXISTING ? "default" : "outline"}
                    onClick={() => handleClientModeChange(CLIENT_MODE.EXISTING)}
                  >
                    Existing client
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={clientMode === CLIENT_MODE.NEW ? "default" : "outline"}
                    className="gap-1.5"
                    onClick={() => handleClientModeChange(CLIENT_MODE.NEW)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Create new client
                  </Button>
                </div>
              </div>

              {clientMode === CLIENT_MODE.EXISTING && (
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="clientId" className="text-xs font-semibold">Client Account</Label>
                  <Select value={form.clientId} onValueChange={handleClientChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select client portal account" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.length === 0 ? (
                        <SelectItem value="__none" disabled>No clients found</SelectItem>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={String(client.id)}>
                            {client.fullName} ({client.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.clientId && <p className="text-[11px] text-destructive">{errors.clientId}</p>}
                </div>
              )}

              {clientMode === CLIENT_MODE.NEW && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="newClientName" className="text-xs font-semibold">New client name *</Label>
                    <Input
                      id="newClientName"
                      placeholder="e.g. Marcus Reid"
                      className="h-9"
                      value={form.newClientName}
                      onChange={(e) => handleChange("newClientName", e.target.value)}
                    />
                    {errors.newClientName && <p className="text-[11px] text-destructive">{errors.newClientName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newClientEmail" className="text-xs font-semibold">New client email *</Label>
                    <Input
                      id="newClientEmail"
                      type="email"
                      placeholder="client@company.com"
                      className="h-9"
                      value={form.newClientEmail}
                      onChange={(e) => handleChange("newClientEmail", e.target.value)}
                    />
                    {errors.newClientEmail && <p className="text-[11px] text-destructive">{errors.newClientEmail}</p>}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="newClientPhone" className="text-xs font-semibold">New client phone</Label>
                    <Input
                      id="newClientPhone"
                      type="tel"
                      placeholder="+61 400 000 000"
                      className="h-9"
                      value={form.newClientPhone}
                      onChange={(e) => handleChange("newClientPhone", e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Creates a CLIENT portal account and links it to this project. They can set a password later via invite/resend.
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-1.5 md:col-span-2">
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

        <Card className="bg-card/65 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/85 border-b pb-2">
              Assignment & Budgeting
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="assignedManager" className="text-xs font-semibold">Assigned Project Manager *</Label>
                <Select
                  value={form.assignedManager || undefined}
                  onValueChange={(value) => handleChange("assignedManager", value)}
                >
                  <SelectTrigger id="assignedManager" className="h-9">
                    <SelectValue placeholder="Select project manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managerOptions.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No employees available — add staff in Employees first
                      </SelectItem>
                    ) : (
                      managerOptions.map((emp) => (
                        <SelectItem key={emp.id} value={emp.employeeName}>
                          {emp.employeeName}
                          {emp.designation ? ` · ${emp.designation}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.assignedManager && <p className="text-[11px] text-destructive">{errors.assignedManager}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="budget" className="text-xs font-semibold">Total Contract Budget ({DIRHAM_SYMBOL}) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-medium text-muted-foreground/90">{DIRHAM_SYMBOL}</span>
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
          <Button type="button" variant="outline" onClick={() => navigate(projectsListRoute)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" className="gap-2" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {submitting ? "Saving…" : "Save Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
