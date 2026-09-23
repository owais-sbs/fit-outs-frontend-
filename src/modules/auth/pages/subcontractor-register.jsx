import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completePublicScRegistration,
  fetchPublicScRegistrationInfo,
} from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { FillDemoDataButton } from "@/components/shared/FillDemoDataButton";
import { DEMO } from "@/shared/demo/formDemoData";

export default function SubcontractorRegistrationPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage("This page requires a registration link from the main contractor.");
      return;
    }
    fetchPublicScRegistrationInfo(token)
      .then(setInfo)
      .catch((e) => setMessage(e?.response?.data?.error || "Invalid or expired registration link"))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await completePublicScRegistration(token, {
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      setMessage("Registration complete. You can now sign in.");
      setTimeout(() => navigate(ROUTES.AUTH.LOGIN), 1200);
    } catch (err) {
      setMessage(err?.response?.data?.error || err?.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-lg mx-auto space-y-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Subcontractor registration"
          subtitle={
            info?.contractorDisplayName
              ? `Register to work with ${info.contractorDisplayName}`
              : "Create your company portal account"
          }
        />
        {info?.usable && (
          <FillDemoDataButton
            onClick={() => {
              const stamp = Date.now().toString(36);
              setForm({
                companyName: DEMO.scCompanyProfile.legalCompanyName,
                contactName: DEMO.scCompanyProfile.primaryContactName,
                email: `sc.${stamp}@fitouts.demo`,
                phone: DEMO.scCompanyProfile.primaryContactPhone,
                password: "123456",
                confirmPassword: "123456",
              });
            }}
          />
        )}
      </div>

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      {!info?.usable ? (
        <Surface className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            This registration link is invalid or has expired. Ask the main contractor for a new link.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.AUTH.LOGIN}>Go to login</Link>
          </Button>
        </Surface>
      ) : (
        <Surface className="p-6">
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label className="text-xs">Company name *</Label>
              <Input
                required
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contact person *</Label>
              <Input
                required
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password *</Label>
              <Input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirm password *</Label>
              <Input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create account & continue
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Already registered?{" "}
              <Link className="underline" to={ROUTES.AUTH.LOGIN}>Sign in</Link>
            </p>
          </form>
        </Surface>
      )}
    </PageShell>
  );
}
