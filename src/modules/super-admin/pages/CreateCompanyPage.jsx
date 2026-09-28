import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Check, Loader2 } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { FEATURE_OPTIONS } from "@/modules/admin/data/employees";
import PageHeader from "../components/shared/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

const defaultForm = {
  companyName: "",
  adminEmail: "",
  subscriptionPlanUuid: "",
  enabledFeatures: [],
  logo: null,
  stamp: null,
  signature: null,
};

function formatFeatureLabel(feature) {
  return String(feature)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CreateCompanyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [plans, setPlans] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/subscription-plans")
      .then(({ data }) => {
        const list = Array.isArray(data?.data) ? data.data : [];
        setPlans(list.filter((plan) => plan?.active !== false));
      })
      .catch(() => setPlans([]));
  }, []);

  const handleTextChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setError(null);
  };

  const handleFileChange = (field) => (event) => {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, [field]: file }));
    setError(null);
  };

  const toggleFeature = (feature) => {
    setForm((prev) => {
      const has = prev.enabledFeatures.includes(feature);
      return {
        ...prev,
        enabledFeatures: has
          ? prev.enabledFeatures.filter((item) => item !== feature)
          : [...prev.enabledFeatures, feature],
      };
    });
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.companyName.trim() || !form.adminEmail.trim()) {
      setError("Company name and admin email are required");
      return;
    }
    if (!form.subscriptionPlanUuid) {
      setError("Subscription plan is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("companyName", form.companyName.trim());
      body.append("adminEmail", form.adminEmail.trim().toLowerCase());
      body.append("subscriptionPlanUuid", form.subscriptionPlanUuid);
      body.append("enabledFeatures", JSON.stringify(form.enabledFeatures));
      if (form.logo) body.append("logo", form.logo);
      if (form.stamp) body.append("stamp", form.stamp);
      if (form.signature) body.append("signature", form.signature);

      const { data } = await axiosInstance.post("/companies/provision", body, {
        headers: { "Content-Type": "multipart/form-data" },
        // Provision waits on SMTP acceptance; default 15s axios timeout was aborting first.
        timeout: 45000,
      });

      const created = data?.data || {};
      setSuccessResult({
        companyName: created.companyName || form.companyName.trim(),
        email: created.adminEmail || form.adminEmail.trim().toLowerCase(),
        planName: created.subscriptionPlanName,
        featuresCount: (created.enabledFeatures || form.enabledFeatures).length,
        status: created.status || "ACTIVE",
        inviteEmailSent: created.inviteEmailSent === true,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err.message ||
        "Failed to create company";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    navigate(ROUTES.SUPER_ADMIN.TENANTS);
  };

  const selectedPlan = plans.find((plan) => plan.uuid === form.subscriptionPlanUuid);

  return (
    <PageShell>
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 w-fit"
      >
        <a
          href={ROUTES.SUPER_ADMIN.TENANTS}
          onClick={(e) => {
            e.preventDefault();
            navigate(ROUTES.SUPER_ADMIN.TENANTS);
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          All companies
        </a>
      </Button>

      <PageHeader
        title="Create company"
        description="Invite a company admin by email. Choose a plan and the sidebar features they can access."
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Company details</CardTitle>
                <CardDescription>Name, admin invite, plan, and branding</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companyName" className="after:ml-0.5 after:text-destructive after:content-['*']">
                    Company name
                  </Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={handleTextChange("companyName")}
                    placeholder="Apex Fitouts Pty Ltd"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="adminEmail" className="after:ml-0.5 after:text-destructive after:content-['*']">
                    Admin email
                  </Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={form.adminEmail}
                    onChange={handleTextChange("adminEmail")}
                    placeholder="admin@company.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    A set-password invite email is sent. The company is activated immediately.
                    If this name was used before, a unique domain slug is assigned automatically.
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="after:ml-0.5 after:text-destructive after:content-['*']">
                    Subscription plan
                  </Label>
                  <Select
                    value={form.subscriptionPlanUuid}
                    onValueChange={(value) => {
                      setForm((prev) => ({ ...prev, subscriptionPlanUuid: value }));
                      setError(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.uuid} value={plan.uuid}>
                          {plan.planName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo</Label>
                  <Input id="logo" type="file" accept="image/*" onChange={handleFileChange("logo")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stamp">Stamp</Label>
                  <Input id="stamp" type="file" accept="image/*" onChange={handleFileChange("stamp")} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="signature">Signature</Label>
                  <Input id="signature" type="file" accept="image/*" onChange={handleFileChange("signature")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sidebar features</CardTitle>
                <CardDescription>
                  Choose which admin portal sidebar items this company can access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {FEATURE_OPTIONS.map((feature) => {
                    const checked = form.enabledFeatures.includes(feature);
                    return (
                      <label
                        key={feature}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                          checked ? "border-primary/40 bg-primary/5" : "border-border bg-background"
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleFeature(feature)}
                        />
                        <span>{formatFeatureLabel(feature)}</span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-4 text-sm space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="font-medium">{form.companyName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Admin email</p>
                    <p className="font-medium">{form.adminEmail || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="font-medium">{selectedPlan?.planName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Features</p>
                    <p className="font-medium">{form.enabledFeatures.length} selected</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Branding</p>
                    <p className="font-medium text-xs">
                      {[form.logo && "Logo", form.stamp && "Stamp", form.signature && "Signature"]
                        .filter(Boolean)
                        .join(", ") || "None selected"}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button type="submit" className="w-full gap-2" disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                    {submitting ? "Sending invite..." : "Create company & send invite"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(ROUTES.SUPER_ADMIN.TENANTS)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <Dialog open={!!successResult} onOpenChange={(open) => { if (!open) handleDone(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {successResult?.inviteEmailSent ? "Invite sent" : "Company created"}
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <div className="rounded-lg border bg-muted/20 p-4 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium">{successResult?.companyName}</span>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Admin email</p>
                  <p className="font-medium">{successResult?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-medium">{successResult?.planName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Features granted</p>
                  <p className="font-medium">{successResult?.featuresCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">{successResult?.status}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Invite email</p>
                  <p className="font-medium">
                    {successResult?.inviteEmailSent
                      ? "Accepted by mail server"
                      : "Not sent — ask the admin to use “Forgot password”, or check SMTP"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {successResult?.inviteEmailSent
                    ? "The admin will receive a set-password email to access the company portal."
                    : "The company and admin account were created. The set-password invite did not leave the mail server."}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleDone}>Go to companies</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
