import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, User, Upload } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { CLIENT_STATUSES } from "../../data/clients";
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

function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="ml-0.5 text-destructive">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Row({ children }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Section({ title, desc, children }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {desc && <CardDescription className="text-xs">{desc}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function pwStrength(pw) {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = [
    { label: "Too weak", bar: "bg-destructive" },
    { label: "Weak",     bar: "bg-orange-500" },
    { label: "Fair",     bar: "bg-amber-500" },
    { label: "Good",     bar: "bg-yellow-500" },
    { label: "Strong",   bar: "bg-emerald-500" },
  ];
  return { score: s, ...levels[s] };
}

export default function AddClientPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", company: "", email: "", phone: "",
    location: "", city: "", state: "", country: "Australia",
    status: "Active", notes: "",
    username: "", password: "", confirmPw: "",
  });

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.username.trim()) e.username = "Required";
    if (!form.password) e.password = "Required";
    else if (form.password.length < 8) e.password = "Min. 8 characters";
    if (form.password !== form.confirmPw) e.confirmPw = "Passwords don't match";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaved(true);
    setTimeout(() => navigate(ROUTES.ADMIN.CLIENTS), 1500);
  };

  const strength = pwStrength(form.password);

  return (
    <div className="space-y-6 pb-28">
      <PageHeader title="Add Client" description="Create a new client profile and account." />

      {saved && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Client added successfully!
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Personal */}
          <Section title="Client Details" desc="Basic contact and company information.">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/40">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Button variant="outline" size="sm" className="gap-1.5"><Upload className="h-3.5 w-3.5" />Upload Photo</Button>
                <p className="mt-1 text-[11px] text-muted-foreground">JPG, PNG · max 5 MB</p>
              </div>
            </div>

            <Row>
              <Field label="First Name" required error={errors.firstName}>
                <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Claire" />
              </Field>
              <Field label="Last Name" required error={errors.lastName}>
                <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Moss" />
              </Field>
            </Row>
            <Field label="Company / Organisation">
              <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Moss Interiors" />
            </Field>
            <Row>
              <Field label="Email Address" required error={errors.email}>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="claire@company.com" />
              </Field>
              <Field label="Phone Number" required error={errors.phone}>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+61 400 000 000" />
              </Field>
            </Row>
            <Field label="Address / Location">
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="12 George Street, Sydney NSW" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="City"><Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Sydney" /></Field>
              <Field label="State"><Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="NSW" /></Field>
              <Field label="Country"><Input value={form.country} onChange={(e) => set("country", e.target.value)} /></Field>
            </div>
          </Section>

          {/* Account */}
          <Section title="Portal Account" desc="Login credentials for the client portal.">
            <Field label="Username / Email" required error={errors.username}>
              <Input value={form.username} onChange={(e) => set("username", e.target.value)} placeholder={form.email || "client@company.com"} />
            </Field>
            <Row>
              <Field label="Password" required error={errors.password}>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 8 characters" className="pr-9" />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password && strength && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.bar : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{strength.label}</p>
                  </div>
                )}
              </Field>
              <Field label="Confirm Password" required error={errors.confirmPw}>
                <div className="relative">
                  <Input type={showCpw ? "text" : "password"} value={form.confirmPw} onChange={(e) => set("confirmPw", e.target.value)} placeholder="Re-enter password" className="pr-9" />
                  <button type="button" onClick={() => setShowCpw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </Row>
          </Section>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          <Section title="Client Status" desc="Set the initial status.">
            <div className="space-y-2">
              {CLIENT_STATUSES.map((s) => {
                const variants = { Active: "success", Inactive: "secondary", Prospect: "warning", VIP: "default" };
                return (
                  <label key={s} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${form.status === s ? "border-primary/40 bg-primary/5" : "border-border/60 hover:bg-muted/20"}`}>
                    <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => set("status", s)} className="accent-primary" />
                    <Badge variant={variants[s]}>{s}</Badge>
                    <span className="text-xs text-muted-foreground">{s}</span>
                  </label>
                );
              })}
            </div>
          </Section>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Internal notes about this client..." rows={4} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="invisible h-1" />

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> required fields</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild><Link to={ROUTES.ADMIN.CLIENTS}>Cancel</Link></Button>
            <Button onClick={handleSave}>Save Client</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
