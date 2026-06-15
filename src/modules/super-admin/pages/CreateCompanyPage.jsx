import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "../components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axiosInstance from "@/lib/axiosInstance";

const FALLBACK_PLANS = [
  { uuid: "fallback-1", planName: "Starter", priceMonthly: 299, maxUsers: 10, modulesIncluded: ["crm", "dashboard", "site-visits"], active: true },
  { uuid: "fallback-2", planName: "Professional", priceMonthly: 990, maxUsers: 50, modulesIncluded: ["crm", "dashboard", "site-visits", "reports", "users"], active: true },
  { uuid: "fallback-3", planName: "Enterprise", priceMonthly: 4800, maxUsers: 500, modulesIncluded: ["crm", "dashboard", "site-visits", "reports", "users", "billing"], active: true },
];

const STATUS_OPTIONS = [
  { value: "TRIAL", label: "Trial" },
  { value: "ACTIVE", label: "Active" },
];

const defaultForm = {
  companyName: "",
  domainSlug: "",
  subscriptionPlanUuid: "",
  status: "TRIAL",
  logo: "",
  fullName: "",
  email: "",
  password: "",
};

export default function CreateCompanyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPlansLoading(true);
    axiosInstance
      .get("/subscription-plans")
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data?.data) ? data.data : [];
        const activePlans = list.filter((p) => p.active !== false);
        setPlans(activePlans.length > 0 ? activePlans : FALLBACK_PLANS);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch plans, using fallback:", err);
        setPlans(FALLBACK_PLANS);
      })
      .finally(() => {
        if (!cancelled) setPlansLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "companyName") {
        next.domainSlug = value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return next;
    });
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.companyName.trim() || !form.domainSlug.trim() || !form.subscriptionPlanUuid) {
      setError("Please fill in all required company fields");
      return;
    }
    if (!form.email.trim() || !form.password.trim()) {
      setError("Please fill in admin email and password");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const companyRes = await axiosInstance.post("/companies/AddCompany", {
        companyName: form.companyName.trim(),
        domainSlug: form.domainSlug.trim().toLowerCase(),
        subscriptionPlanUuid: form.subscriptionPlanUuid,
        status: form.status,
        logo: form.logo.trim() || undefined,
      });

      const companyUuid = companyRes.data?.data?.uuid;
      if (!companyUuid) throw new Error("Failed to get company UUID from response");

      const accountRes = await axiosInstance.post("/accounts", {
        fullName: form.fullName.trim() || form.companyName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        companyUuid: companyUuid,
        roles: ["ADMIN"],
      });

      setSuccessResult({
        companyName: form.companyName.trim(),
        companyUuid,
        email: form.email.trim().toLowerCase(),
        accountId: accountRes.data?.data?.id,
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to create company";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    navigate(ROUTES.SUPER_ADMIN.TENANTS);
  };

  const selectedPlan = plans.find((p) => p.uuid === form.subscriptionPlanUuid);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <a href={ROUTES.SUPER_ADMIN.TENANTS} onClick={(e) => { e.preventDefault(); navigate(ROUTES.SUPER_ADMIN.TENANTS); }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          All companies
        </a>
      </Button>

      <PageHeader
        title="Create company"
        description="Provision a new company, assign a subscription plan, and create the admin account."
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Company details</CardTitle>
                <CardDescription>Information about the company</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companyName" className="after:ml-0.5 after:text-destructive after:content-['*']">
                    Company name
                  </Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={handleChange("companyName")}
                    placeholder="Apex Fitouts Pty Ltd"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domainSlug" className="after:ml-0.5 after:text-destructive after:content-['*']">
                    Domain slug
                  </Label>
                  <Input
                    id="domainSlug"
                    value={form.domainSlug}
                    onChange={handleChange("domainSlug")}
                    placeholder="apex-fitouts"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from company name. Lowercase letters, numbers, and hyphens only.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL (optional)</Label>
                  <Input
                    id="logo"
                    value={form.logo}
                    onChange={handleChange("logo")}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Subscription plan</CardTitle>
                <CardDescription>Select the plan and initial status</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="after:ml-0.5 after:text-destructive after:content-['*']">
                    Plan
                  </Label>
                  {plansLoading ? (
                    <Skeleton className="h-10 w-full rounded-md" />
                  ) : (
                    <Select
                      value={form.subscriptionPlanUuid}
                      onValueChange={handleChange("subscriptionPlanUuid")}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.uuid} value={plan.uuid}>
                            {plan.planName} — ${plan.priceMonthly}/mo ({plan.maxUsers} users)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={handleChange("status")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPlan && (
                  <div className="sm:col-span-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Included modules</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPlan.modulesIncluded?.map((mod) => (
                        <Badge key={mod} variant="secondary" className="text-xs">
                          <Check className="mr-1 h-3 w-3" />
                          {mod}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Admin user</CardTitle>
                <CardDescription>
                  Create the admin account for this company with role-based access.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                    placeholder="Sarah Chen"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="after:ml-0.5 after:text-destructive after:content-['*']">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="sarah@company.com"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="password" className="after:ml-0.5 after:text-destructive after:content-['*']">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange("password")}
                      placeholder="Enter admin password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                    <p className="text-xs text-muted-foreground">
                      The admin will be assigned the <Badge variant="outline" className="mx-1 text-xs">ADMIN</Badge> role
                      and linked to this company.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-border/60 shadow-sm sticky top-20">
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="font-medium">{form.companyName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Domain slug</p>
                    <p className="font-mono text-xs">{form.domainSlug || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="font-medium">{selectedPlan?.planName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{form.status.toLowerCase()}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Admin name</p>
                    <p className="font-medium">{form.fullName || form.companyName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Admin email</p>
                    <p className="font-medium">{form.email || "—"}</p>
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
                    {submitting ? "Creating..." : "Create company & admin"}
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
            <DialogTitle>Company created successfully</DialogTitle>
            <DialogDescription className="space-y-3">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium">{successResult?.companyName}</span>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Admin email</p>
                  <p className="font-medium">{successResult?.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  The admin can sign in using the credentials you provided.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleDone}>Go to companies</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
