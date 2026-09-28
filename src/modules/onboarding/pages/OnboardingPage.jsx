import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, LogOut, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { ACCESS_PHASE, routeForAccessPhase } from "@/shared/constants/access-phase";
import { completeCompanyProfile } from "@/modules/onboarding/api/onboarding.api";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user, refreshUser, logout } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const accessPhase = user?.accessPhase || ACCESS_PHASE.PORTAL;

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

  if (accessPhase !== ACCESS_PHASE.ONBOARDING) {
    return <Navigate to={routeForAccessPhase(accessPhase, ROUTES.ADMIN.DASHBOARD)} replace />;
  }

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!logo) {
      setError("Company logo is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await completeCompanyProfile({ companyName: companyName.trim(), logo });
      await refreshUser();
      navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to save company profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set up your company</CardTitle>
            <CardDescription>
              Payment is confirmed. Add your company name and logo to open the admin portal.
              Stamp and signature can be added later from Settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="companyName">Company name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Fitouts"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Company logo</Label>
                <Input id="logo" type="file" accept="image/*" onChange={onLogoChange} required />
                {logoPreview ? (
                  <div className="mt-2 flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-border">
                    <img src={logoPreview} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
                Company stamp and signature are optional during onboarding. You can add them later
                under Admin Settings → Cover letter configuration.
              </div>

              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Continue to admin portal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
