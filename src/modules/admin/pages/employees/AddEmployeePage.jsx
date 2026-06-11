import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Upload, User, X } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import {
  EMPLOYEE_DEPARTMENTS, EMPLOYEE_DESIGNATIONS,
  EMPLOYEE_GENDERS, EMPLOYEE_ROLES, EMPLOYMENT_TYPES, generateEmployeeId,
} from "../../data/employees";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Password strength ────────────────────────────────────────────────────────
function pwStrength(pw) {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = [
    { label: "Too weak", bar: "bg-destructive" },
    { label: "Weak", bar: "bg-orange-500" },
    { label: "Fair", bar: "bg-amber-500" },
    { label: "Good", bar: "bg-yellow-500" },
    { label: "Strong", bar: "bg-emerald-500" },
  ];
  return { score: s, ...levels[s] };
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Section({ step, title, desc, children }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {step}
          </span>
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {desc && <CardDescription className="text-xs">{desc}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Row({ children }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Role chip selector ───────────────────────────────────────────────────────
function RoleSelector({ selected, onChange }) {
  return (
    <div className="space-y-3">
      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((r) => (
            <span
              key={r}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 pl-3 pr-2 py-1 text-xs font-medium text-primary"
            >
              {r}
              <button
                type="button"
                onClick={() => onChange(selected.filter((x) => x !== r))}
                className="rounded-full hover:bg-primary/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Clickable role grid */}
      <div className="flex flex-wrap gap-2">
        {EMPLOYEE_ROLES.map((role) => {
          const active = selected.includes(role);
          return (
            <button
              key={role}
              type="button"
              onClick={() =>
                onChange(active ? selected.filter((r) => r !== role) : [...selected, role])
              }
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {role}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-muted-foreground">Click roles above to assign them to this employee.</p>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AddEmployeePage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", gender: "", dob: "",
    email: "", phone: "", emergency: "",
    address: "", city: "", state: "", country: "Australia", zip: "",
    employeeId: generateEmployeeId(),
    joiningDate: "", department: "", designation: "",
    manager: "", employmentType: "",
    username: "", password: "", confirmPw: "",
    roles: [],
    status: "active",
    notes: "",
  });

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.joiningDate) e.joiningDate = "Required";
    if (!form.department) e.department = "Required";
    if (!form.designation) e.designation = "Required";
    if (!form.employmentType) e.employmentType = "Required";
    if (!form.username.trim()) e.username = "Required";
    if (!form.password) e.password = "Required";
    else if (form.password.length < 8) e.password = "Min. 8 characters";
    if (form.password !== form.confirmPw) e.confirmPw = "Passwords don't match";
    if (form.roles.length === 0) e.roles = "Assign at least one role";
    return e;
  };

  const handleSave = (andAnother = false) => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaved(true);
    setTimeout(() => {
      if (andAnother) {
        setForm((f) => ({
          ...f, firstName: "", lastName: "", email: "", phone: "",
          username: "", password: "", confirmPw: "", dob: "",
          employeeId: generateEmployeeId(), roles: [],
        }));
        setSaved(false);
      } else {
        navigate(ROUTES.ADMIN.EMPLOYEES);
      }
    }, 1400);
  };

  const strength = pwStrength(form.password);

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        title="Add Employee"
        description="Create a new employee profile and assign roles."
      />

      {saved && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Employee saved successfully!
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* ── Left ────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* 1 · Personal */}
          <Section step="1" title="Personal Details" desc="Basic personal information.">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/40">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Upload Photo
                </Button>
                <p className="mt-1 text-[11px] text-muted-foreground">JPG, PNG · max 5 MB</p>
              </div>
            </div>

            <Row>
              <Field label="First Name" required error={errors.firstName}>
                <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="John" />
              </Field>
              <Field label="Last Name" required error={errors.lastName}>
                <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Smith" />
              </Field>
            </Row>
            <Row>
              <Field label="Gender">
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              </Field>
            </Row>
            <Row>
              <Field label="Email Address" required error={errors.email}>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@company.com" />
              </Field>
              <Field label="Mobile Number" required error={errors.phone}>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+61 400 000 000" />
              </Field>
            </Row>
            <Field label="Emergency Contact">
              <Input value={form.emergency} onChange={(e) => set("emergency", e.target.value)} placeholder="+61 400 000 000" />
            </Field>
            <Field label="Street Address">
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="12 Example Street" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="City">
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Sydney" />
              </Field>
              <Field label="State">
                <Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="NSW" />
              </Field>
              <Field label="Country">
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
              </Field>
              <Field label="Zip">
                <Input value={form.zip} onChange={(e) => set("zip", e.target.value)} placeholder="2000" />
              </Field>
            </div>
          </Section>

          {/* 2 · Employment */}
          <Section step="2" title="Employment Details" desc="Role, department and work information.">
            <Row>
              <Field label="Employee ID">
                <Input value={form.employeeId} readOnly className="bg-muted/40 font-mono text-sm" />
              </Field>
              <Field label="Joining Date" required error={errors.joiningDate}>
                <Input type="date" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
              </Field>
            </Row>
            <Row>
              <Field label="Department" required error={errors.department}>
                <Select value={form.department} onValueChange={(v) => set("department", v)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Designation" required error={errors.designation}>
                <Select value={form.designation} onValueChange={(v) => set("designation", v)}>
                  <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </Row>
            <Row>
              <Field label="Reporting Manager">
                <Input value={form.manager} onChange={(e) => set("manager", e.target.value)} placeholder="Manager name" />
              </Field>
              <Field label="Employment Type" required error={errors.employmentType}>
                <Select value={form.employmentType} onValueChange={(v) => set("employmentType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </Row>
          </Section>

          {/* 3 · Account */}
          <Section step="3" title="Account Credentials" desc="Login username and password for the portal.">
            <Field label="Username" required error={errors.username}>
              <Input value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="john.smith" />
            </Field>
            <Row>
              <Field label="Password" required error={errors.password}>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Min. 8 characters"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password && strength && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.bar : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{strength.label}</p>
                  </div>
                )}
              </Field>
              <Field label="Confirm Password" required error={errors.confirmPw}>
                <div className="relative">
                  <Input
                    type={showCpw ? "text" : "password"}
                    value={form.confirmPw}
                    onChange={(e) => set("confirmPw", e.target.value)}
                    placeholder="Re-enter password"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCpw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </Row>
          </Section>
        </div>

        {/* ── Right ───────────────────────────────────────── */}
        <div className="space-y-6">

          {/* 4 · Role assignment */}
          <Section step="4" title="Assign Roles" desc="Select one or more roles for this employee.">
            <RoleSelector selected={form.roles} onChange={(v) => { set("roles", v); setErrors((e) => ({ ...e, roles: undefined })); }} />
            {errors.roles && <p className="text-xs text-destructive">{errors.roles}</p>}
            {form.roles.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {form.roles.length} role{form.roles.length > 1 ? "s" : ""} selected
              </p>
            )}
          </Section>

          {/* 5 · Status */}
          <Section step="5" title="Account Status" desc="Set the employee's initial status.">
            <div className="space-y-2">
              {[
                { val: "active", label: "Active", sub: "Can log in and access the system", color: "border-emerald-500/30 bg-emerald-500/5" },
                { val: "inactive", label: "Inactive", sub: "Account disabled, no access", color: "border-border/60 bg-muted/20" },
                { val: "suspended", label: "Suspended", sub: "Temporarily blocked from access", color: "border-destructive/20 bg-destructive/5" },
              ].map(({ val, label, sub, color }) => (
                <label
                  key={val}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                    form.status === val ? color + " ring-1 ring-primary/30" : "border-border/60 hover:bg-muted/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={val}
                    checked={form.status === val}
                    onChange={() => set("status", val)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* Notes */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Onboarding notes, special access requirements..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="invisible h-1" />

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            <span className="text-destructive">*</span> required fields
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to={ROUTES.ADMIN.EMPLOYEES}>Cancel</Link>
            </Button>
            <Button variant="outline" onClick={() => handleSave(true)}>
              Save &amp; Add Another
            </Button>
            <Button onClick={() => handleSave(false)}>Save Employee</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
