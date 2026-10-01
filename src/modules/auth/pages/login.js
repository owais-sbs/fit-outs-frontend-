import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { ROLES } from "@/shared/constants/roles";
import { routeForAccessPhase } from "@/shared/constants/access-phase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { PlatformBrandHeader } from "@/components/brand/BrandMark";
import { SessionBootLoader } from "@/components/brand/SessionBootLoader";

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
  [ROLES.SITE_ENGINEER]: ROUTES.SITE_ENGINEER.DASHBOARD,
};

function destinationForAuth(user, role) {
  const portal = ROLE_ROUTES[role] || ROUTES.ADMIN.DASHBOARD;
  return routeForAccessPhase(user?.accessPhase, portal);
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, user, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (role) {
        navigate(destinationForAuth(user, role), { replace: true });
      } else {
        navigate("/roles", { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, role, user, navigate]);

  if (authLoading) {
    return <SessionBootLoader />;
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
        navigate(destinationForAuth(result.user, result.singleRole));
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Full-page dotted check grid — dark on light, light on dark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle, oklch(var(--foreground) / 0.28) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 w-full max-w-[468px] page-enter">
        {/* Dotted crop-mark frame — lines extend past corners */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 -right-10 top-0 border-t border-dotted border-foreground/35" />
          <div className="absolute -left-10 -right-10 bottom-0 border-t border-dotted border-foreground/35" />
          <div className="absolute -top-10 -bottom-10 left-0 border-l border-dotted border-foreground/35" />
          <div className="absolute -top-10 -bottom-10 right-0 border-l border-dotted border-foreground/35" />
        </div>

        {/* Plain fill inside the frame; dots remain outside */}
        <div className="relative bg-background px-10 py-14 sm:px-12 sm:py-16">
          <PlatformBrandHeader imgClassName="h-[11.9rem] w-[11.9rem] sm:h-[13.6rem] sm:w-[13.6rem]" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-base text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-base font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[3.575rem] rounded-xl text-base"
                required
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-base font-medium text-foreground">
                  Password
                </Label>
                <Link
                  to={ROUTES.AUTH.FORGOT_PASSWORD}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[3.575rem] rounded-xl text-base"
                required
              />
            </div>

            <Button
              type="submit"
              variant="ghost"
              className="mt-1.5 h-[3.575rem] w-full rounded-full bg-transparent px-12 text-base font-bold uppercase tracking-widest text-foreground shadow-[inset_0_0_0_2px_#616467] transition duration-200 hover:bg-[#616467] hover:text-white dark:text-neutral-200"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to={ROUTES.AUTH.SIGNUP} className="font-medium text-foreground hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
