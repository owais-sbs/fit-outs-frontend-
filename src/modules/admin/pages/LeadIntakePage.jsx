import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, UserCheck, ArrowRight, User, Phone, Mail,
  MapPin, Building2, Info, CheckCircle2,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { LEAD_SOURCES, PROJECT_TYPES } from "../data/leads";
import { createLead } from "../api/leads.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function FormField({ label, required, error, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <Info className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function validate(form) {
  const e = {};
  if (!form.clientName.trim()) e.clientName = "Client name is required";
  if (!form.phone.trim()) e.phone = "Phone number is required";
  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
    e.email = "Valid email address required";
  if (!form.projectType) e.projectType = "Project type is required";
  if (!form.source) e.source = "Lead source is required";
  if (form.source === "Other" && !form.otherSource.trim())
    e.otherSource = "Please specify the source";
  return e;
}

const EMPTY_FORM = {
  clientName: "",
  phone: "",
  email: "",
  projectType: "",
  source: "",
  otherSource: "",
  assignedTo: "",
  notes: "",
};

export default function LeadIntakePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const next = { ...e }; delete next[field]; return next; });
  };

  const submitLead = async () => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return null;

    setSubmitting(true);
    setSubmitError("");
    try {
      return await createLead(form);
    } catch (error) {
      setSubmitError(error.response?.data?.error || error.response?.data?.message || "Unable to save lead");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    const savedLead = await submitLead();
    if (savedLead) setConfirmOpen(true);
  };

  const handleSaveAndContinue = async () => {
    const savedLead = await submitLead();
    if (savedLead) navigate(ROUTES.ADMIN.LEADS_LIST);
  };

  const filledCount = Object.values(form).filter((v) => v.trim?.() || v).length;
  const totalFields = Object.keys(EMPTY_FORM).length;
  const progress = Math.round((filledCount / totalFields) * 100);

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        title="New lead"
        description="Capture a fit-out enquiry. All starred fields are required."
        actions={
          <Badge variant="outline" className="gap-1.5 text-xs">
            <span className="font-semibold text-primary">{filledCount}</span>
            <span className="text-muted-foreground">/ {totalFields} fields</span>
          </Badge>
        }
      />

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Client information
              </CardTitle>
              <CardDescription>Contact details for this lead</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Client name" required error={errors.clientName} icon={User}>
                <Input
                  id="clientName"
                  placeholder="e.g. Marcus Reid"
                  value={form.clientName}
                  onChange={(e) => update("clientName", e.target.value)}
                  className={cn(errors.clientName && "border-destructive focus-visible:ring-destructive")}
                />
              </FormField>

              <FormField label="Phone" required error={errors.phone} icon={Phone}>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+61 400 000 000"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={cn(errors.phone && "border-destructive focus-visible:ring-destructive")}
                />
              </FormField>

              <FormField label="Email address" required error={errors.email} icon={Mail}>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@company.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" />
                Project details
              </CardTitle>
              <CardDescription>Project type, source, and assignment</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Project type" required error={errors.projectType}>
                <Select value={form.projectType} onValueChange={(v) => update("projectType", v)}>
                  <SelectTrigger id="projectType" className={cn(errors.projectType && "border-destructive")}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Lead source" required error={errors.source}>
                <Select value={form.source} onValueChange={(v) => update("source", v)}>
                  <SelectTrigger id="source" className={cn(errors.source && "border-destructive")}>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {form.source === "Other" && (
                <FormField label="Specify source" required error={errors.otherSource} icon={MapPin}>
                  <Input
                    id="otherSource"
                    placeholder="e.g. Google Ads, Billboard"
                    value={form.otherSource}
                    onChange={(e) => update("otherSource", e.target.value)}
                    className={cn(errors.otherSource && "border-destructive focus-visible:ring-destructive")}
                  />
                </FormField>
              )}

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional details about the client's requirements..."
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {(form.clientName || form.projectType || form.source) && (
            <Card className="border-border/60 border-primary/20 bg-primary/3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Lead preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {form.clientName && <p className="font-semibold">{form.clientName}</p>}
                {form.projectType && <p className="text-muted-foreground">{form.projectType}</p>}
                {form.source && (
                  <p className="text-xs text-muted-foreground">
                    via {form.source}{form.otherSource ? ` — ${form.otherSource}` : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-primary" />
                Quick tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm text-muted-foreground">
              <p className="flex gap-2">
                <span className="text-primary">•</span>
                Select <strong className="text-foreground">Walk-in</strong> source for showroom enquiries.
              </p>
              <p className="flex gap-2">
                <span className="text-primary">•</span>
                Use <strong className="text-foreground">Other</strong> for sources not in the list.
              </p>
              <Separator className="my-2" />
              <p className="text-xs">
                Lead will appear in <strong className="text-foreground">New</strong> status automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Required fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {[
                { key: "clientName", label: "Client name" },
                { key: "phone", label: "Phone" },
                { key: "email", label: "Email" },
                { key: "projectType", label: "Project type" },
                { key: "source", label: "Lead source" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <CheckCircle2
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      form[key] ? "text-emerald-600" : "text-muted-foreground/30"
                    )}
                  />
                  <span className={cn(
                    "text-xs",
                    form[key] ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <p className="hidden text-sm text-muted-foreground sm:block">
            {Object.keys(errors).length > 0 && (
              <span className="text-destructive">
                {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""} need attention
              </span>
            )}
            {submitError && <span className="text-destructive">{submitError}</span>}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.ADMIN.LEADS_LIST)}>
              Cancel
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleSaveAndContinue} disabled={submitting}>
              Save &amp; continue
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={submitting}>
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save lead
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Lead saved successfully
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
              <p><span className="text-muted-foreground">Client: </span><strong>{form.clientName}</strong></p>
              <p><span className="text-muted-foreground">Project: </span>{form.projectType}</p>
              <p><span className="text-muted-foreground">Source: </span>{form.source}{form.otherSource ? ` — ${form.otherSource}` : ""}</p>
            </div>
            <p className="text-muted-foreground text-xs">
              The lead has been added with <strong className="text-foreground">New</strong> status.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setConfirmOpen(false); setForm(EMPTY_FORM); setErrors({}); setSubmitError(""); }}>
              Add another lead
            </Button>
            <Button className="gap-2" onClick={() => navigate(ROUTES.ADMIN.LEADS_LIST)}>
              <UserCheck className="h-4 w-4" />
              View leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
