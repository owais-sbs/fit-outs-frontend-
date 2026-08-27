import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/shared/constants/routes";
import { BRAND_NAME, JctLogoTile } from "@/components/brand/BrandMark";
import {
  completePasswordSetup,
  validatePasswordSetupToken,
} from "@/modules/auth/api/password-setup.api";

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenInfo({ valid: false, message: "Invalid or missing link." });
      setLoading(false);
      return;
    }

    validatePasswordSetupToken(token)
      .then((data) => setTokenInfo(data))
      .catch((err) => {
        setTokenInfo({
          valid: false,
          message: err.response?.data?.message || "This link is invalid or has expired.",
        });
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await completePasswordSetup(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to set password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 520px at 12% -10%, color-mix(in oklab, var(--color-accent-copper) 18%, transparent), transparent 55%), radial-gradient(700px 480px at 92% 108%, oklch(0.92 0.01 260 / 0.7), transparent 50%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <JctLogoTile className="h-14 w-14" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">{BRAND_NAME}</p>
            <h1 className="text-2xl font-semibold tracking-tight">Client portal access</h1>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/95 p-6 shadow-lg backdrop-blur-sm">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-copper)]" />
              <p className="text-sm">Verifying your link…</p>
            </div>
          ) : success ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <div>
                <h2 className="text-lg font-semibold">Password set</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You can now sign in to the client portal with your email and password.
                </p>
              </div>
              <Button className="w-full" onClick={() => navigate(ROUTES.AUTH.LOGIN)}>
                Go to sign in
              </Button>
            </div>
          ) : !tokenInfo?.valid ? (
            <div className="space-y-4 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <div>
                <h2 className="text-lg font-semibold">Link unavailable</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tokenInfo?.message || "This link is invalid or has expired."}
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to={ROUTES.AUTH.LOGIN}>Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-semibold">Choose your password</h2>
                <p className="text-sm text-muted-foreground">
                  Set a password for <span className="font-medium text-foreground">{tokenInfo.email}</span>
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{tokenInfo.fullName || tokenInfo.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Set password & continue"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
