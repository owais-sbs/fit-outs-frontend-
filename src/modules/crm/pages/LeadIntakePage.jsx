import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, UserCheck } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import {
  LEAD_SOURCES,
  REQUIREMENT_TYPES,
  SALES_REPS,
} from "../data/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LeadIntakePage() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    company: "",
    phone: "",
    email: "",
    budget: "",
    source: "",
    requirement: "",
    assignee: "",
    notes: "",
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.clientName.trim()) e.clientName = "Required";
    if (!form.company.trim()) e.company = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.budget) e.budget = "Required";
    if (!form.source) e.source = "Required";
    if (!form.requirement) e.requirement = "Required";
    if (!form.assignee) e.assignee = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="New lead"
        description="Capture a fit-out enquiry in under two minutes."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lead information</CardTitle>
            <CardDescription>Client and project requirements</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Client name *</Label>
              <Input value={form.clientName} onChange={(e) => update("clientName", e.target.value)} />
              {errors.clientName && <p className="text-xs text-destructive">{errors.clientName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Company name *</Label>
              <Input value={form.company} onChange={(e) => update("company", e.target.value)} />
              {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Budget (AUD) *</Label>
              <Input type="number" value={form.budget} onChange={(e) => update("budget", e.target.value)} />
              {errors.budget && <p className="text-xs text-destructive">{errors.budget}</p>}
            </div>
            <div className="space-y-2">
              <Label>Lead source *</Label>
              <Select value={form.source} onValueChange={(v) => update("source", v)}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.source && <p className="text-xs text-destructive">{errors.source}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Requirement type *</Label>
              <Select value={form.requirement} onValueChange={(v) => update("requirement", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {REQUIREMENT_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Assigned sales rep *</Label>
              <Select value={form.assignee} onValueChange={(v) => update("assignee", v)}>
                <SelectTrigger><SelectValue placeholder="Assign rep" /></SelectTrigger>
                <SelectContent>
                  {SALES_REPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 h-fit">
          <CardHeader>
            <CardTitle className="text-base">Quick tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Confirm budget range before assigning.</p>
            <p>• Link site visit if scope requires inspection.</p>
            <p>• Use referral source for partner leads.</p>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[1600px] justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(ROUTES.CRM.PIPELINE)}>Cancel</Button>
          <Button className="gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save & assign
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead saved</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {form.clientName} at {form.company} assigned to {form.assignee}.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Add another</Button>
            <Button className="gap-2" onClick={() => navigate(ROUTES.CRM.PIPELINE)}>
              <UserCheck className="h-4 w-4" />
              View pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
