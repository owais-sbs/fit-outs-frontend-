import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/shared/constants/routes";
import { AuthShell } from "@/modules/auth/components/AuthShell";
import { forgotPassword } from "@/modules/auth/api/password-reset.api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const sendReset = useCallback(
    async (isResend) => {
      setError("");
      const trimmed = email.trim();

      if (!trimmed || !EMAIL_RE.test(trimmed)) {
        setError("Please enter a valid email address.");
        return;
      }

      if (isResend && cooldown > 0) {
        return;
      }

      setSubmitting(true);
      try {
        await forgotPassword(trimmed);
        setSuccess(true);
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } catch (err) {
        const status = err.response?.status;
        if (status === 404 || (status >= 200 && status < 300)) {
          setSuccess(true);
          setCooldown(RESEND_COOLDOWN_SECONDS);
          return;
        }
        if (status === 429) {
          setError("Too many requests, try again in a few minutes");
          return;
        }
        setError(
          err.response?.data?.message ||
            "Unable to send reset link. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [email, cooldown]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    sendReset(false);
  };

  return (
    <AuthShell>
      {success ? (
        <div className="space-y-6" aria-live="polite">
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Check your email
            </h1>
            <p className="text-base text-muted-foreground">
              We&apos;ve sent password reset instructions to your email address
              if an account is associated with it.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>

          <Button
            type="button"
            variant="ghost"
            className="h-[3.575rem] w-full rounded-full bg-transparent px-12 text-base font-bold uppercase tracking-widest text-foreground shadow-[inset_0_0_0_2px_#616467] transition duration-200 hover:bg-[#616467] hover:text-white dark:text-neutral-200"
            disabled={submitting || cooldown > 0}
            onClick={() => sendReset(true)}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : cooldown > 0 ? (
              `Try again (${cooldown}s)`
            ) : (
              "Try again"
            )}
          </Button>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-base text-destructive"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link
              to={ROUTES.AUTH.LOGIN}
              className="font-medium text-foreground hover:underline"
            >
              Remember your password? Sign in
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Forgot your password?
            </h1>
            <p className="text-base text-muted-foreground">
              Enter the email address associated with your account and we&apos;ll
              send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-base text-destructive animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-base font-medium text-foreground">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[3.575rem] rounded-xl text-base"
              required
              autoFocus
            />
          </div>

          <Button
            type="submit"
            variant="ghost"
            className="mt-1.5 h-[3.575rem] w-full rounded-full bg-transparent px-12 text-base font-bold uppercase tracking-widest text-foreground shadow-[inset_0_0_0_2px_#616467] transition duration-200 hover:bg-[#616467] hover:text-white dark:text-neutral-200"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              to={ROUTES.AUTH.LOGIN}
              className="font-medium text-foreground hover:underline"
            >
              Remember your password? Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
