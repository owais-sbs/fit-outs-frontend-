import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  ClipboardList,
  FileSpreadsheet,
  Loader2,
  Package,
  Receipt,
  ShieldCheck,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/shared/constants/routes";
import { formatAed } from "@/shared/utils/currency";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/axiosInstance";

const PRODUCT_FEATURES = [
  {
    icon: Users2,
    title: "CRM & site visits",
    description: "Capture leads, schedule visits, and keep the sales pipeline moving from first contact to handover.",
  },
  {
    icon: CalendarClock,
    title: "Projects & schedule",
    description: "Plan fit-out programmes with templates, CPM scheduling, and live project tracking.",
  },
  {
    icon: FileSpreadsheet,
    title: "Drawings & BOQ",
    description: "Manage drawings, quantity take-offs, and bill of quantities in one commercial workflow.",
  },
  {
    icon: Package,
    title: "Procurement",
    description: "Track stock receipts, issues, and material movements across active project sites.",
  },
  {
    icon: ClipboardList,
    title: "Variations & approvals",
    description: "Route commercial changes and approvals with a clear audit trail for every decision.",
  },
  {
    icon: Receipt,
    title: "Billing",
    description: "Raise milestones, monitor collections, and keep project billing aligned with progress.",
  },
];

const PLAN_ACCENTS = [
  {
    ring: "border-primary/20 hover:border-primary/40",
    band: "from-slate-500/90 via-slate-500/40 to-transparent",
    badge: "Starter",
  },
  {
    ring: "border-cyan-500/25 hover:border-cyan-500/45",
    band: "from-cyan-500/90 via-cyan-500/40 to-transparent",
    badge: "Most chosen",
    featured: true,
  },
  {
    ring: "border-emerald-500/25 hover:border-emerald-500/45",
    band: "from-emerald-500/90 via-emerald-500/40 to-transparent",
    badge: "Scale",
  },
];

function formatModuleLabel(moduleId) {
  if (!moduleId) return "";
  return String(moduleId)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function LandingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    axiosInstance
      .get("/public/subscription-plans")
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data?.data) ? data.data : [];
        setPlans(list.filter((plan) => plan?.active !== false));
      })
      .catch(() => {
        if (cancelled) return;
        setPlans([]);
        setError("Unable to load subscription plans right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">Fitouts</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
          </nav>
          <Button asChild size="sm" className="gap-2">
            <Link to={ROUTES.AUTH.SIGNUP}>
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(var(--primary)/0.14),transparent_45%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
            <div className="space-y-6">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Fit-out operations platform
              </Badge>
              <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                Run every fit-out from lead to billing in one place
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                Fitouts helps contractors coordinate CRM, site visits, project schedules, drawings,
                BOQ, procurement, approvals, and billing without switching tools.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to={ROUTES.AUTH.SIGNUP}>
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#pricing">View plans</a>
                </Button>
              </div>
            </div>

            <Card className="border-primary/15 bg-card/80 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Built for fit-out teams</CardTitle>
                <CardDescription>
                  One workspace for commercial, delivery, and site coordination.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Live subscription tiers managed by your platform admin",
                  "Module access matched to each plan",
                  "Seat limits and pricing published from one source of truth",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 max-w-2xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Features
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything your fit-out delivery team needs
            </h2>
            <p className="text-muted-foreground">
              From first enquiry to final invoice, Fitouts covers the workflows that keep projects
              moving on site and commercially controlled.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="bg-card/80 transition hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader className="space-y-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted/60">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="pricing" className="border-t border-border/50 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Pricing
                </p>
                <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Subscription plans
                </h2>
                <p className="text-muted-foreground">
                  Live plans from Fitouts superadmin — pricing, seats, modules, and marketing
                  features stay in sync automatically.
                </p>
              </div>

              <div className="inline-flex rounded-full border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    billingCycle === "monthly"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    billingCycle === "annual"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Annual
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="space-y-4">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-10 w-36" />
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                      <Skeleton className="mt-4 h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4" />
                  {error}
                </CardContent>
              </Card>
            ) : plans.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No active subscription plans are published yet. Check back soon or sign in to
                  continue.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan, index) => {
                  const accent = PLAN_ACCENTS[index % PLAN_ACCENTS.length];
                  const price =
                    billingCycle === "annual" ? plan.priceAnnual : plan.priceMonthly;
                  const modules = Array.isArray(plan.modulesIncluded)
                    ? plan.modulesIncluded
                    : [];
                  const features = Array.isArray(plan.features) ? plan.features : [];

                  return (
                    <Card
                      key={plan.uuid || plan.planName}
                      className={cn(
                        "relative overflow-hidden bg-card/90 transition hover:-translate-y-0.5 hover:shadow-lg",
                        accent.ring,
                        accent.featured && "md:-mt-2 md:mb-2"
                      )}
                    >
                      <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", accent.band)} />
                      <CardHeader className="space-y-4 pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="font-display text-xl tracking-tight">
                              {plan.planName}
                            </CardTitle>
                            <CardDescription className="mt-1">{accent.badge} tier</CardDescription>
                          </div>
                          {accent.featured && <Badge>Popular</Badge>}
                        </div>

                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-semibold tracking-tight">
                              {formatAed(price)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              /{billingCycle === "annual" ? "year" : "month"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Up to {plan.maxUsers ?? 0} seats
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-5">
                        {modules.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {modules.map((moduleId) => (
                              <Badge key={moduleId} variant="outline">
                                {formatModuleLabel(moduleId)}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <ul className="space-y-2.5 text-sm">
                          {features.length === 0 ? (
                            <li className="text-muted-foreground">Plan details coming soon</li>
                          ) : (
                            features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span>{feature}</span>
                              </li>
                            ))
                          )}
                        </ul>

                        <Button asChild className="w-full gap-2">
                          <Link to={ROUTES.AUTH.SIGNUP}>
                            Get started
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2 text-foreground">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">Fitouts</span>
          </div>
          <p>Fit-out operations from lead to billing.</p>
          <Link to={ROUTES.AUTH.LOGIN} className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
