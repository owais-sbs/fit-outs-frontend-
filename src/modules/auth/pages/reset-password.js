import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/shared/constants/routes";
import { AuthShell } from "@/modules/auth/components/AuthShell";
import {
  PasswordRequirementsChecklist,
  passwordMeetsAllRules,
} from "@/modules/auth/components/PasswordRequirementsChecklist";
import { resetPassword } from "@/modules/auth/api/password-reset.api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(() => searchParams.get("token") || "");
  const [tokenReady, setTokenReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("token");
    if (fromUrl) {
      setToken(fromUrl);
      navigate(ROUTES.AUTH.RESET_PASSWORD, { replace: true });
    } else if (!token) {
      setLinkInvalid(true);
    }
    setTokenReady(true);
    // Capture token from the URL once, then strip it from the address bar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rulesPass = useMemo(() => passwordMeetsAllRules(password), [password]);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = Boolean(token) && rulesPass && passwordsMatch && !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setLinkInvalid(true);
      return;
    }
    if (!rulesPass || !passwordsMatch) {
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword: password });
      setPassword("");
      setConfirmPassword("");
      setToken("");
      setSuccess(true);
    } catch (err) {
      const status = err.response?.status;
      if (status === 400 || status === 401 || status === 404 || status === 410) {
        setPassword("");
        setConfirmPassword("");
        setToken("");
        setLinkInvalid(true);
        return;
      }
      setError(
        err.response?.data?.message ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!tokenReady) {
    return null;
  }

  if (linkInvalid) {
    return (
      <AuthShell>
        <div className="space-y-6" aria-live="polite">
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Reset link expired
            </h1>
            <p className="text-base text-muted-foreground">
              This password reset link is no longer valid. Please request a new
              password reset link.
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="h-[3.575rem] w-full rounded-full bg-transparent px-12 text-base font-bold uppercase tracking-widest text-foreground shadow-[inset_0_0_0_2px_#616467] transition duration-200 hover:bg-[#616467] hover:text-white dark:text-neutral-200"
          >
            <Link to={ROUTES.AUTH.FORGOT_PASSWORD}>Request a new reset link</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <div className="space-y-6" aria-live="polite">
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Password updated successfully
            </h1>
            <p className="text-base text-muted-foreground">
              Your password has been changed successfully. You can now sign in
              with your new password.
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="h-[3.575rem] w-full rounded-full bg-transparent px-12 text-base font-bold uppercase tracking-widest text-foreground shadow-[inset_0_0_0_2px_#616467] transition duration-200 hover:bg-[#616467] hover:text-white dark:text-neutral-200"
          >
            <Link to={ROUTES.AUTH.LOGIN}>Continue to sign in</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Create a new password
          </h1>
          <p className="text-base text-muted-foreground">
            Choose a strong password for your account.
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
          <Label htmlFor="new-password" className="text-base font-medium text-foreground">
            New password
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[3.575rem] rounded-xl pr-12 text-base"
              required
              autoFocus
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden />
              ) : (
                <Eye className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
          <PasswordRequirementsChecklist password={password} />
        </div>

        <div className="space-y-2.5">
          <Label
            htmlFor="confirm-password"
            className="text-base font-medium text-foreground"
          >
            Confirm new password
          </Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-[3.575rem] rounded-xl pr-12 text-base"
              required
              aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOff className="h-5 w-5" aria-hidden />
              ) : (
                <Eye className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p
              role="alert"
              aria-live="polite"
              className="text-sm text-destructive"
            >
              Passwords do not match.
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="ghost"
          className="mt-1.5 h-[3.575rem] w-full rounded-full bg-transparent px-12 text-base font-bold uppercase tracking-widest text-foreground shadow-[inset_0_0_0_2px_#616467] transition duration-200 hover:bg-[#616467] hover:text-white disabled:opacity-50 dark:text-neutral-200"
          disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting…
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
