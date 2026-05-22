import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PROJECT_TYPES } from "../../constants/project.constants";
import { PAYMENT_METHODS, PRIORITIES } from "../../constants/client-conversion.constants";
import { MANAGERS } from "../../data/client-conversion";

function FormField({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

const INITIAL_FORM = {
  clientName: "",
  company: "",
  projectName: "",
  projectType: "",
  manager: "",
  startDate: "",
  estimatedCompletion: "",
  budget: "",
  initialPayment: "",
  paymentMethod: "",
  priority: "Medium",
  notes: "",
};

function validate(form) {
  const e = {};
  if (!form.clientName.trim()) e.clientName = "Client name is required";
  if (!form.projectName.trim()) e.projectName = "Project name is required";
  if (!form.projectType) e.projectType = "Project type is required";
  if (!form.manager) e.manager = "Project manager is required";
  if (!form.startDate) e.startDate = "Start date is required";
  if (!form.estimatedCompletion) e.estimatedCompletion = "Estimated completion is required";
  if (!form.budget || isNaN(Number(form.budget)) || Number(form.budget) <= 0)
    e.budget = "Valid budget is required";
  return e;
}

export default function ClientConversionForm({ selectedLead, onSubmit, onSaveDraft }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const populateFromLead = () => {
    if (!selectedLead) return;
    setForm({
      clientName: selectedLead.clientName,
      company: selectedLead.company || "",
      projectName: "",
      projectType: selectedLead.projectType,
      manager: selectedLead.manager,
      startDate: "",
      estimatedCompletion: "",
      budget: String(selectedLead.finalNegotiatedAmount || selectedLead.budget || ""),
      initialPayment: "",
      paymentMethod: "",
      priority: "High",
      notes: "",
    });
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSubmit({ ...form, sourceLeadId: selectedLead?.id });
  };

  const gridClass = "grid grid-cols-1 gap-3 sm:grid-cols-2";

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Conversion Form</CardTitle>
          {selectedLead && (
            <button
              type="button"
              onClick={populateFromLead}
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              Populate from lead
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={gridClass}>
            <FormField label="Client Name" required error={errors.clientName}>
              <Input value={form.clientName} onChange={set("clientName")} placeholder="Full name" className="h-9" />
            </FormField>
            <FormField label="Company">
              <Input value={form.company} onChange={set("company")} placeholder="Company name" className="h-9" />
            </FormField>
          </div>

          <FormField label="Project Name" required error={errors.projectName}>
            <Input value={form.projectName} onChange={set("projectName")} placeholder="e.g. CBD Office Fit-out" className="h-9" />
          </FormField>

          <div className={gridClass}>
            <FormField label="Project Type" required error={errors.projectType}>
              <Select value={form.projectType} onValueChange={set("projectType")}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Project Manager" required error={errors.manager}>
              <Select value={form.manager} onValueChange={set("manager")}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select manager" /></SelectTrigger>
                <SelectContent>
                  {MANAGERS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className={gridClass}>
            <FormField label="Start Date" required error={errors.startDate}>
              <Input type="date" value={form.startDate} onChange={set("startDate")} className="h-9" />
            </FormField>
            <FormField label="Est. Completion" required error={errors.estimatedCompletion}>
              <Input type="date" value={form.estimatedCompletion} onChange={set("estimatedCompletion")} className="h-9" />
            </FormField>
          </div>

          <div className={gridClass}>
            <FormField label="Budget ($)" required error={errors.budget}>
              <Input type="number" value={form.budget} onChange={set("budget")} placeholder="0" className="h-9" />
            </FormField>
            <FormField label="Initial Payment ($)">
              <Input type="number" value={form.initialPayment} onChange={set("initialPayment")} placeholder="0" className="h-9" />
            </FormField>
          </div>

          <div className={gridClass}>
            <FormField label="Payment Method">
              <Select value={form.paymentMethod} onValueChange={set("paymentMethod")}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select value={form.priority} onValueChange={set("priority")}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Internal Notes">
            <Textarea value={form.notes} onChange={set("notes")} placeholder="Any additional notes..." rows={3} />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onSaveDraft} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
              Save Draft
            </button>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Convert Client
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
