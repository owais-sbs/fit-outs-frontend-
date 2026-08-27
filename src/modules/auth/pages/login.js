import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { ROLES } from "@/shared/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { BRAND_NAME, JctLogoTile } from "@/components/brand/BrandMark";

const ROLE_ROUTES = {
  [ROLES.SUPER_ADMIN]: ROUTES.SUPER_ADMIN.DASHBOARD,
  [ROLES.ADMIN]: ROUTES.ADMIN.DASHBOARD,
  [ROLES.BUSINESS_OWNER]: ROUTES.BUSINESS_OWNER.DASHBOARD,
  [ROLES.PROJECT_MANAGER]: ROUTES.PROJECT_MANAGER.DASHBOARD,
  [ROLES.DESIGNER]: ROUTES.DESIGNER.DASHBOARD,
  [ROLES.QAS]: ROUTES.QAS.DASHBOARD,
  [ROLES.QS]: ROUTES.ADMIN.QAS,
  [ROLES.SENIOR_QS]: ROUTES.ADMIN.BOQ_INBOX,
  [ROLES.FINANCE]: ROUTES.FINANCE.DASHBOARD,
  [ROLES.SUBCONTRACTOR]: ROUTES.SUBCONTRACTOR.DASHBOARD,
  [ROLES.CLIENT]: ROUTES.CLIENT.DASHBOARD,
  [ROLES.SALES]: ROUTES.SALES.DASHBOARD,
  [ROLES.EMPLOYEE]: ROUTES.EMPLOYEE.DASHBOARD,
  [ROLES.SITE_ENGINEER]: ROUTES.EMPLOYEE.DASHBOARD,
};

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (role) {
        const route = ROLE_ROUTES[role];
        if (route) {
          navigate(route, { replace: true });
        }
      } else {
        navigate("/roles", { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, role, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--color-accent-copper)]" />
        <span className="mt-4 animate-pulse text-sm font-medium text-muted-foreground">
          Checking session...
        </span>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await login({ email, password });

      if (result?.noValidRole) {
        setError("Your account does not have access to any available portal.");
        return;
      }

      if (result?.singleRole) {
        const route = ROLE_ROUTES[result.singleRole];
        if (route) {
          navigate(route);
        } else {
          setError("Invalid role assigned to your account.");
        }
        return;
      }

      if (result?.multipleRoles) {
        navigate("/roles");
        return;
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10">
      {/* Soft spatial atmosphere — ink + copper, no purple */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 520px at 12% -10%, color-mix(in oklab, var(--color-accent-copper) 18%, transparent), transparent 55%), radial-gradient(700px 480px at 92% 108%, oklch(0.92 0.01 260 / 0.7), transparent 50%), radial-gradient(600px 400px at 70% 20%, oklch(0.97 0.008 90 / 0.9), transparent 45%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.2 0.01 285 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.2 0.01 285 / 0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] page-enter">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <JctLogoTile className="h-14 w-14 rounded-2xl" imgClassName="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-[2rem]">
            {BRAND_NAME}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage commercial fit-out projects
          </p>
        </div>

        <div className="surface-panel relative overflow-hidden px-6 py-7 sm:px-8">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-0.5"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--color-accent-copper), var(--color-accent-gold), transparent)",
            }}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@onepath.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Password
                </Label>
                <Link
                  to={ROUTES.AUTH.FORGOT_PASSWORD}
                  className="text-xs text-[var(--color-accent-copper)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-2 h-11 w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Authorized personnel only. {BRAND_NAME} © 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
