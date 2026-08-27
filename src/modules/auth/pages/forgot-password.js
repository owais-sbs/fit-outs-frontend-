import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/shared/constants/routes";
import { BRAND_NAME, JctLogoTile } from "@/components/brand/BrandMark";
import { requestPasswordSetupEmail } from "@/modules/auth/api/password-setup.api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      await requestPasswordSetupEmail(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send setup email. Please try again.");
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

      <div className="relative z-10 w-full max-w-[420px] page-enter">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <JctLogoTile className="h-14 w-14 rounded-2xl" imgClassName="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-[2rem]">
            {BRAND_NAME}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Client portal password setup
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

          {success ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <div>
                <h2 className="text-lg font-semibold">Check your email</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  If a client portal account exists for <strong>{email}</strong>, we sent a link to set your password.
                  The link expires in 7 days.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to={ROUTES.AUTH.LOGIN}>Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-semibold">Forgot password?</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email and we&apos;ll send you a link to set or reset your client portal password.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
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
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send setup link"
                )}
              </Button>

              <Button asChild variant="ghost" className="w-full gap-2">
                <Link to={ROUTES.AUTH.LOGIN}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
