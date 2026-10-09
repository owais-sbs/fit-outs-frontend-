import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Eye,
  EyeOff,
  FileBarChart,
  Lock,
  Mail,
  Package,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { ROLES } from "@/shared/constants/roles";
import { routeForAccessPhase } from "@/shared/constants/access-phase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  PLATFORM_ICON_URL,
} from "@/components/brand/BrandMark";
import {
  AuthLoadingOverlay,
  SessionBootLoader,
} from "@/components/brand/SessionBootLoader";
import loginBg from "@/assets/loginpage.png";

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

function destinationForAuthResult(result, role) {
  const accessPhase = result?.user?.accessPhase;
  const portal = ROLE_ROUTES[result?.singleRole || role] || ROUTES.ADMIN.DASHBOARD;
  return routeForAccessPhase(accessPhase, portal);
}

/** Auth screens stay light and locked to the viewport (no page scroll). */
function useForceLightDocument() {
  useEffect(() => {
    const root = document.documentElement;
    const { body } = document;
    const prevHtmlOverflow = root.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyHeight = body.style.height;

    root.classList.remove("dark");
    root.dataset.authLight = "true";
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.height = "100%";

    return () => {
      delete root.dataset.authLight;
      root.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.height = prevBodyHeight;
      try {
        if (localStorage.getItem("fitouts-theme") === "dark") {
          root.classList.add("dark");
        }
      } catch {
        /* ignore */
      }
    };
  }, []);
}

const FEATURES = [
  { icon: Briefcase, title: "Projects", desc: "Track & manage projects" },
  { icon: Users, title: "Teams", desc: "Coordinate workforce" },
  { icon: Package, title: "Procurement", desc: "Simplify purchases & vendors" },
  { icon: FileBarChart, title: "Reports", desc: "Insights for better decisions" },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, role, user, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useForceLightDocument();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (role) {
        navigate(routeForAccessPhase(user?.accessPhase, ROLE_ROUTES[role]), { replace: true });
      } else {
        navigate("/roles", { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, role, user?.accessPhase, navigate]);

  if (authLoading) {
    return <SessionBootLoader />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await signup({ fullName, email, password });

      if (result?.noValidRole) {
        setError("Your account does not have access to any available portal.");
        return;
      }

      if (result?.multipleRoles) {
        navigate("/roles");
        return;
      }

      navigate(destinationForAuthResult(result, result?.singleRole));
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex h-dvh max-h-dvh w-full overflow-hidden bg-[#0a1628] text-[#0a1628]"
      style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      {isLoading ? <AuthLoadingOverlay label="Creating account…" /> : null}

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col lg:flex-row">
        {/* Left — brand / hero (50%) */}
        <aside className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden lg:w-1/2 lg:max-w-[50%]">
          <div className="absolute inset-0 bg-[#0a1628]" />
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 w-[58%] bg-cover bg-center"
            style={{
              backgroundImage: `url(${loginBg})`,
              clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 w-[58%] bg-gradient-to-r from-[#0a1628] via-[#0a1628]/55 to-transparent"
            style={{ clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0 100%)" }}
          />

          <div className="relative z-10 flex h-full min-h-0 flex-col justify-between px-7 py-8 sm:px-10 lg:px-12 xl:px-14">
            <div>
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5 shadow-[0_0_0_1px_rgba(201,169,110,0.45)]">
                  <img
                    src={PLATFORM_ICON_URL}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold tracking-wide text-white sm:text-base">
                    {BRAND_NAME.toUpperCase()} ERP SYSTEM
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A96E]">
                    {BRAND_TAGLINE}
                  </p>
                </div>
              </div>

              <div className="mt-12 sm:mt-16 lg:mt-20">
                <div className="mb-4 h-px w-12 bg-[#C9A96E]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C9A96E]">
                  Building tomorrow together
                </p>
                <h1
                  className="mt-4 max-w-lg text-[2.1rem] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-[2.55rem] xl:text-[2.85rem]"
                  style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
                >
                  Fit-Out{" "}
                  <span className="text-[#C9A96E]">Made Smarter</span>
                </h1>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70 sm:text-base">
                  Create your account to access plans, projects, and your fit-out workspace.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 sm:mt-12 sm:grid-cols-4 lg:gap-x-5">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C9A96E]/45 text-[#C9A96E]">
                      <Icon className="h-4 w-4" strokeWidth={1.6} />
                    </div>
                    <p className="mt-2.5 text-[13px] font-semibold tracking-tight text-white">
                      {title}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-white/55">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 hidden shrink-0 lg:block">
              <div className="mb-3 h-px w-10 bg-[#C9A96E]/70" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C9A96E]">
                Safer / Faster / Stronger
              </p>
            </div>
          </div>
        </aside>

        {/* Right — create account (50%) */}
        <main className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-[#F4F1EC] px-5 py-8 sm:px-8 lg:w-1/2 lg:max-w-[50%] lg:px-10 lg:py-0">
          <div className="relative z-10 w-full max-w-[420px]">
            <div className="mb-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C9A96E]">
                Get started
              </p>
              <h2
                className="mt-2 text-[2rem] font-semibold tracking-[-0.02em] text-[#0a1628]"
                style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
              >
                Create account
              </h2>
              <p className="mt-1.5 text-sm text-[#64748B]">
                Sign up, then choose a plan to access your portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold text-[#0a1628]">
                  Full name
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="h-12 rounded-xl border-[#0a1628]/15 bg-transparent pl-11 text-sm font-medium text-[#0a1628] placeholder:text-[#94A3B8] focus-visible:ring-[#C9A96E]/40"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-[#0a1628]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 rounded-xl border-[#0a1628]/15 bg-transparent pl-11 text-sm font-medium text-[#0a1628] placeholder:text-[#94A3B8] focus-visible:ring-[#C9A96E]/40"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-[#0a1628]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-xl border-[#0a1628]/15 bg-transparent pl-11 pr-11 text-sm font-medium text-[#0a1628] placeholder:text-[#94A3B8] focus-visible:ring-[#C9A96E]/40"
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#94A3B8] transition-colors hover:text-[#0a1628]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2 h-12 w-full gap-2 rounded-xl border-0 bg-[#C9A96E] text-sm font-semibold tracking-wide text-white shadow-[0_10px_28px_-12px_rgba(201,169,110,0.85)] hover:bg-[#B89051] hover:text-white"
                disabled={isLoading}
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="relative mt-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#0a1628]/12" />
              <span className="text-xs font-medium text-[#94A3B8]">Already have an account?</span>
              <div className="h-px flex-1 bg-[#0a1628]/12" />
            </div>

            <Button
              asChild
              variant="outline"
              className="mt-4 h-12 w-full gap-2 rounded-xl border-[#C9A96E] bg-transparent text-sm font-semibold text-[#C9A96E] hover:bg-[#C9A96E]/10 hover:text-[#8a6d3b]"
            >
              <Link to={ROUTES.AUTH.LOGIN}>
                <Users className="h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
