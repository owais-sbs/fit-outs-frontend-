import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Check,
  Loader2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/shared/constants/routes";
import { ACCESS_PHASE, routeForAccessPhase } from "@/shared/constants/access-phase";
import { formatAed } from "@/shared/utils/currency";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/shared/context/auth-context";
import {
  fetchPaymentInstructions,
  submitSubscriptionPayment,
} from "@/modules/onboarding/api/onboarding.api";

function formatModuleLabel(moduleId) {
  return String(moduleId || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SubscribePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user, refreshUser, logout } = useAuth();
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [instructions, setInstructions] = useState(null);
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [selectedPlanUuid, setSelectedPlanUuid] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingSubmitted, setPendingSubmitted] = useState(false);

  const accessPhase = user?.accessPhase || ACCESS_PHASE.PORTAL;
  const awaitingConfirmation =
    pendingSubmitted || user?.pendingPaymentStatus === "PENDING";

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const { data } = await axiosInstance.get("/public/subscription-plans");
      const list = Array.isArray(data?.data) ? data.data : [];
      setPlans(list.filter((p) => p.active !== false));
      if (list.length > 0) {
        setSelectedPlanUuid((prev) => prev || list[0].uuid);
      }
    } catch {
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadInstructions = useCallback(async () => {
    try {
      const data = await fetchPaymentInstructions();
      setInstructions(data);
    } catch {
      setInstructions(null);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && accessPhase === ACCESS_PHASE.SUBSCRIBE) {
      loadPlans();
      loadInstructions();
    }
  }, [authLoading, isAuthenticated, accessPhase, loadPlans, loadInstructions]);

  useEffect(() => {
    if (!awaitingConfirmation || accessPhase !== ACCESS_PHASE.SUBSCRIBE) return undefined;
    const id = setInterval(async () => {
      try {
        const next = await refreshUser();
        if (next?.accessPhase === ACCESS_PHASE.ONBOARDING) {
          navigate(ROUTES.ONBOARDING, { replace: true });
        } else if (next?.accessPhase === ACCESS_PHASE.PORTAL) {
          navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
        }
      } catch {
        // keep polling quietly
      }
    }, 8000);
    return () => clearInterval(id);
  }, [awaitingConfirmation, accessPhase, refreshUser, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  if (accessPhase !== ACCESS_PHASE.SUBSCRIBE) {
    return <Navigate to={routeForAccessPhase(accessPhase, ROUTES.ADMIN.DASHBOARD)} replace />;
  }

  const handleSubmitPayment = async () => {
    if (!selectedPlanUuid) {
      setError("Select a plan first.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitSubscriptionPayment({
        planUuid: selectedPlanUuid,
        billingCycle,
        paymentMethod: "Bank transfer",
      });
      setPendingSubmitted(true);
      await refreshUser();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to={ROUTES.LANDING} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">Fitouts</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => logout()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <Badge variant="outline">Subscription</Badge>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Choose a plan and complete payment
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Your account is ready. Pick a plan, transfer the amount using the details below, then
            confirm you&apos;ve paid. We&apos;ll unlock onboarding once payment is verified.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={billingCycle === "MONTHLY" ? "default" : "outline"}
            size="sm"
            onClick={() => setBillingCycle("MONTHLY")}
          >
            Monthly
          </Button>
          <Button
            type="button"
            variant={billingCycle === "ANNUAL" ? "default" : "outline"}
            size="sm"
            onClick={() => setBillingCycle("ANNUAL")}
          >
            Annual
          </Button>
        </div>

        {plansLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No active plans are published yet. Contact support.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const selected = selectedPlanUuid === plan.uuid;
              const price =
                billingCycle === "ANNUAL" ? plan.priceAnnual : plan.priceMonthly;
              const features = Array.isArray(plan.features) ? plan.features : [];
              const modules = Array.isArray(plan.modulesIncluded) ? plan.modulesIncluded : [];
              return (
                <Card
                  key={plan.uuid}
                  className={cn(
                    "cursor-pointer transition",
                    selected && "border-primary ring-2 ring-primary/20"
                  )}
                  onClick={() => setSelectedPlanUuid(plan.uuid)}
                >
                  <CardHeader>
                    <CardTitle>{plan.planName}</CardTitle>
                    <CardDescription>
                      Up to {plan.maxUsers} users
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-3xl font-semibold tracking-tight">
                      {formatAed(price)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{billingCycle === "ANNUAL" ? "yr" : "mo"}
                      </span>
                    </p>
                    {modules.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {modules.map((moduleId) => (
                          <Badge key={moduleId} variant="outline">
                            {formatModuleLabel(moduleId)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <ul className="space-y-2 text-sm">
                      {features.slice(0, 5).map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {selected && (
                      <Badge className="w-fit">Selected</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment instructions</CardTitle>
            <CardDescription>
              Manual bank / UPI transfer until the payment gateway is connected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {instructions ? (
              <>
                <p className="text-muted-foreground">{instructions.instructions}</p>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Bank</dt>
                    <dd className="font-medium">{instructions.bankName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Account name</dt>
                    <dd className="font-medium">{instructions.accountName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Account number</dt>
                    <dd className="font-medium">{instructions.accountNumber || "—"}</dd>
                  </div>
                  {instructions.iban ? (
                    <div>
                      <dt className="text-muted-foreground">IBAN</dt>
                      <dd className="font-medium">{instructions.iban}</dd>
                    </div>
                  ) : null}
                  {instructions.upiId ? (
                    <div>
                      <dt className="text-muted-foreground">UPI</dt>
                      <dd className="font-medium">{instructions.upiId}</dd>
                    </div>
                  ) : null}
                </dl>
              </>
            ) : (
              <p className="text-muted-foreground">Loading payment details…</p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {awaitingConfirmation ? (
              <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                <p className="font-medium">Awaiting payment confirmation</p>
                <p className="mt-1 text-muted-foreground">
                  A Super Admin will mark your payment as paid. This page refreshes automatically.
                </p>
              </div>
            ) : (
              <Button
                className="gap-2"
                disabled={submitting || !selectedPlanUuid}
                onClick={handleSubmitPayment}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                I&apos;ve paid
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Prefer to browse the product story?{" "}
          <Link to={ROUTES.LANDING} className="text-foreground underline-offset-4 hover:underline">
            Back to landing page
          </Link>
        </p>
      </main>
    </div>
  );
}
