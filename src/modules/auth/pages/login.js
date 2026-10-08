import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CreditCard,
  Eye,
  EyeOff,
  FolderKanban,
  LogIn,
  Mail,
  Truck,
} from "lucide-react";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { portalHomeForRole } from "@/shared/constants/portal-home";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BRAND_NAME,
  PLATFORM_LOGO_URL,
  PLATFORM_LOGO_JPG_URL,
} from "@/components/brand/BrandMark";
import {
  AuthLoadingOverlay,
  SessionBootLoader,
} from "@/components/brand/SessionBootLoader";
import loginBg from "@/assets/loginpage.png";

function destinationForAuth(user, role) {
  return portalHomeForRole(user, role);
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
  { icon: Building2, title: "Companies", desc: "Manage your business" },
  { icon: CreditCard, title: "Subscriptions", desc: "Track & renew" },
  { icon: FolderKanban, title: "Projects", desc: "Stay on schedule" },
  { icon: Truck, title: "Delivery", desc: "From one platform" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, user, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logoSrc, setLogoSrc] = useState(PLATFORM_LOGO_URL);

  useForceLightDocument();

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
    <div
      className="fixed inset-0 flex h-dvh max-h-dvh w-full overflow-hidden text-[#0B1F3A]"
      style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-[#0B1F3A]/10 backdrop-blur-[2px]"
      />

      {isLoading ? <AuthLoadingOverlay label="Signing in…" /> : null}

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col overflow-hidden lg:flex-row">
        {/* Left brand */}
        <aside className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden px-6 py-8 sm:px-10 lg:max-w-[58%] lg:px-12 lg:py-10 xl:px-16">
          <div className="min-h-0">
            {/* Official lockup — icon + Fit-Outs + tagline baked into the asset */}
            <img
              src={logoSrc}
              alt={BRAND_NAME}
              className="-ml-1 h-auto w-[210px] object-contain object-left sm:-ml-2 sm:w-[240px] lg:w-[260px]"
              onError={() => {
                if (logoSrc !== PLATFORM_LOGO_JPG_URL) setLogoSrc(PLATFORM_LOGO_JPG_URL);
              }}
            />

            <h1
              className="mt-8 max-w-xl text-[2rem] font-semibold leading-[1.12] tracking-[-0.02em] text-[#0B1F3A] sm:mt-10 sm:text-[2.6rem] xl:text-[3rem]"
              style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
            >
              Premium{" "}
              <span className="font-semibold text-[#C9A96E]">Fit-Out &amp;</span>
              <br />
              Interior Solutions
            </h1>

            <p className="mt-4 max-w-md text-[15px] font-normal leading-[1.65] tracking-normal text-[#475569] sm:text-base">
              Manage companies, subscriptions, projects, and delivery from one platform.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 sm:gap-x-8">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="min-w-0">
                  <Icon className="h-5 w-5 text-[#C9A96E]" strokeWidth={1.5} />
                  <p className="mt-2.5 text-[13px] font-semibold tracking-tight text-[#0B1F3A]">
                    {title}
                  </p>
                  <p className="mt-1 text-[12px] font-normal leading-snug text-[#64748B]">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 hidden shrink-0 lg:block">
            <div className="mb-3.5 h-px w-10 bg-[#C9A96E]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C9A96E]">
              Build · Manage · Grow
            </p>
          </div>
        </aside>

        {/* Right sign-in card */}
        <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5 py-6 sm:px-8 lg:px-10 lg:py-0">
          <div className="relative w-full max-w-[420px]">
            <div className="relative overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/80 p-7 shadow-[0_20px_60px_-24px_rgba(11,31,58,0.35)] backdrop-blur-xl sm:p-9">
              <div
                aria-hidden
                className="pointer-events-none absolute right-0 top-0 h-16 w-16"
              >
                <div className="absolute right-0 top-0 h-0 w-0 border-l-[64px] border-t-[64px] border-l-transparent border-t-[#0B1F3A]" />
                <div className="absolute right-0 top-0 h-0 w-0 border-l-[40px] border-t-[40px] border-l-transparent border-t-[#C9A96E]" />
              </div>

              <div className="relative mb-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C9A96E]">
                  Welcome back
                </p>
                <h2
                  className="mt-2 text-[2rem] font-semibold tracking-[-0.02em] text-[#0B1F3A]"
                  style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
                >
                  Sign in
                </h2>
                <p className="mt-1.5 text-sm font-normal text-[#64748B]">
                  Enter your credentials to continue.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="relative space-y-4">
                {error && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-sm text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold tracking-tight text-[#0B1F3A]"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl border-[#E2E8F0] bg-white pl-11 text-sm font-medium text-[#0B1F3A] placeholder:font-normal placeholder:text-[#94A3B8] focus-visible:ring-[#C9A96E]/40"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold tracking-tight text-[#0B1F3A]"
                    >
                      Password
                    </Label>
                    <Link
                      to={ROUTES.AUTH.FORGOT_PASSWORD}
                      className="text-xs font-semibold text-[#C9A96E] hover:text-[#B89051]"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl border-[#E2E8F0] bg-white pr-11 text-sm font-medium text-[#0B1F3A] placeholder:font-normal placeholder:text-[#94A3B8] focus-visible:ring-[#C9A96E]/40"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#94A3B8] transition-colors hover:text-[#0B1F3A]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-3 h-12 w-full rounded-xl border-0 bg-gradient-to-r from-[#C9A96E] to-[#B89051] text-sm font-semibold tracking-wide text-white shadow-[0_8px_24px_-10px_rgba(184,144,81,0.7)] hover:from-[#B89051] hover:to-[#A67F42]"
                  disabled={isLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Button>
              </form>

              <div className="relative mt-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#E2E8F0]" />
                <span className="text-xs font-medium text-[#94A3B8]">New here?</span>
                <div className="h-px flex-1 bg-[#E2E8F0]" />
              </div>
              <p className="mt-4 text-center text-sm">
                <Link
                  to={ROUTES.AUTH.SIGNUP}
                  className="font-semibold text-[#C9A96E] hover:text-[#B89051] hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
