import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, User } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { FEATURE_OPTIONS } from "../../data/employees";
import { createEmployee } from "../../api/employees.api";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

function FeatureSelector({ selected, onChange }) {
  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((f) => (
            <span
              key={f}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 pl-3 pr-2 py-1 text-xs font-medium text-primary"
            >
              {f}
              <button
                type="button"
                onClick={() => onChange(selected.filter((x) => x !== f))}
                className="rounded-full hover:bg-primary/20 p-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {FEATURE_OPTIONS.map((feature) => {
          const active = selected.includes(feature);
          return (
            <button
              key={feature}
              type="button"
              onClick={() =>
                onChange(active ? selected.filter((f) => f !== feature) : [...selected, feature])
              }
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {feature}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-muted-foreground">Click features above to grant access.</p>
      )}
    </div>
  );
}

export default function AddEmployeePage() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [form, setForm] = useState({
    employeeName: "",
    email: "",
    phone: "",
    designation: "",
    features: [],
  });

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    if (apiError) setApiError(null);
  };

  const validate = () => {
    const e = {};
    if (!form.employeeName.trim()) e.employeeName = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.designation.trim()) e.designation = "Required";
    return e;
  };

  const handleSave = async (andAnother = false) => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setApiError(null);
    try {
      await createEmployee(form);
      setSaved(true);
      setTimeout(() => {
        if (andAnother) {
          setForm({ employeeName: "", email: "", phone: "", designation: "", features: [] });
          setSaved(false);
          setSubmitting(false);
        } else {
          navigate(ROUTES.ADMIN.EMPLOYEES);
        }
      }, 1000);
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || "Failed to create employee");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        title="Add Employee"
        description="Create a new employee. A login account will be created automatically."
      />

      {apiError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {apiError}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Employee saved successfully!
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  1
                </span>
                <div>
                  <CardTitle className="text-sm font-semibold">Employee Details</CardTitle>
                  <CardDescription className="text-xs">Basic information for this employee.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    Employee Name<span className="ml-0.5 text-destructive">*</span>
                  </Label>
                  <Input value={form.employeeName} onChange={(e) => set("employeeName", e.target.value)} placeholder="John Smith" />
                  {errors.employeeName && <p className="text-xs text-destructive">{errors.employeeName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    Email<span className="ml-0.5 text-destructive">*</span>
                  </Label>
                  <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@company.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Phone</Label>
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+61 400 000 000" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    Designation<span className="ml-0.5 text-destructive">*</span>
                  </Label>
                  <Input value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Site Engineer" />
                  {errors.designation && <p className="text-xs text-destructive">{errors.designation}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  2
                </span>
                <div>
                  <CardTitle className="text-sm font-semibold">Feature Access</CardTitle>
                  <CardDescription className="text-xs">Select which features this employee can access.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FeatureSelector selected={form.features} onChange={(v) => set("features", v)} />
              {form.features.length > 0 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {form.features.length} feature{form.features.length > 1 ? "s" : ""} selected
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            <span className="text-destructive">*</span> required fields
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={submitting} asChild>
              <Link to={ROUTES.ADMIN.EMPLOYEES}>Cancel</Link>
            </Button>
            <Button variant="outline" disabled={submitting} onClick={() => handleSave(true)}>
              {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Save &amp; Add Another
            </Button>
            <Button disabled={submitting} onClick={() => handleSave(false)}>
              {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Save Employee
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
