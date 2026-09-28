import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "@/lib/axiosInstance";

export default function SettingsPage() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.currentPassword || !form.newPassword) {
      setError("Current and new password are required.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await axiosInstance.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess("Password changed successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to change password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Settings"
        description="Reset the password for your superadmin account."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Reset password</CardTitle>
          <CardDescription>
            Enter your current password, then choose a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={handleChange("currentPassword")}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={handleChange("newPassword")}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
                {success}
              </div>
            )}

            <Button type="submit" className="gap-2" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {submitting ? "Saving..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
