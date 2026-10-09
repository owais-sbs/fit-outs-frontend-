import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Camera, KeyRound, Loader2, User } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/shared/context/auth-context";
import { loadSuperAdminProfile, saveSuperAdminProfile } from "../lib/local-profile";

export default function SettingsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = ["profile", "password"].includes(tabParam) ? tabParam : "profile";
  const fileRef = useRef(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    email: "",
    description: "",
    avatarDataUrl: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const stored = loadSuperAdminProfile();
    setProfileForm({
      name: stored.name || user?.name || "",
      phone: stored.phone || "",
      email: stored.email || user?.email || "",
      description: stored.description || "",
      avatarDataUrl: stored.avatarDataUrl || "",
    });
  }, [user?.name, user?.email]);

  const updateProfile = (field) => (event) => {
    setProfileForm((prev) => ({ ...prev, [field]: event.target.value }));
    setProfileSaved(false);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      window.alert("Please choose an image under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((prev) => ({
        ...prev,
        avatarDataUrl: typeof reader.result === "string" ? reader.result : "",
      }));
      setProfileSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();
    saveSuperAdminProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
      description: profileForm.description.trim(),
      avatarDataUrl: profileForm.avatarDataUrl,
    });
    setProfileSaved(true);
  };

  const handleRemovePhoto = () => {
    setProfileForm((prev) => ({ ...prev, avatarDataUrl: "" }));
    setProfileSaved(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
    setError("");
    setSuccess("");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError("Current and new password are required.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await axiosInstance.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setSuccess("Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to change password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell className="max-w-none">
      <PageHeader
        title="Settings"
        description="Manage your Super Admin profile and account password."
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setSearchParams(value === "profile" ? {} : { tab: value }, { replace: true });
        }}
        className="space-y-6"
      >
        <div className="flex w-full justify-start">
          <TabsList className="!inline-flex h-auto !w-auto max-w-full flex-wrap !justify-start gap-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-4">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">Profile details</CardTitle>
              <CardDescription>
                Photo and basic information for your Super Admin account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex flex-col items-start gap-5 rounded-sm border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="relative shrink-0">
                    <Avatar className="h-20 w-20 border border-border bg-background">
                      {profileForm.avatarDataUrl ? (
                        <AvatarImage
                          src={profileForm.avatarDataUrl}
                          alt={profileForm.name || "Profile"}
                        />
                      ) : null}
                      <AvatarFallback className="bg-muted text-foreground">
                        <User className="h-8 w-8" strokeWidth={1.5} />
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                      aria-label="Upload profile photo"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">Profile photo</p>
                    <p className="text-xs text-muted-foreground">JPG or PNG, up to 2MB.</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileRef.current?.click()}
                      >
                        Upload
                      </Button>
                      {profileForm.avatarDataUrl ? (
                        <Button type="button" size="sm" variant="ghost" onClick={handleRemovePhoto}>
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="sa-profile-name">Name</Label>
                    <Input
                      id="sa-profile-name"
                      value={profileForm.name}
                      onChange={updateProfile("name")}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sa-profile-phone">Phone number</Label>
                    <Input
                      id="sa-profile-phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={updateProfile("phone")}
                      placeholder="+971 50 000 0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sa-profile-email">Email</Label>
                    <Input
                      id="sa-profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={updateProfile("email")}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="sa-profile-description">Short description</Label>
                    <Textarea
                      id="sa-profile-description"
                      value={profileForm.description}
                      onChange={updateProfile("description")}
                      placeholder="A short note about you or your role…"
                      rows={3}
                      className="min-h-[96px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                  <Button type="submit">Save profile</Button>
                  {profileSaved ? (
                    <p className="text-sm font-medium text-[#C9A96E]">Saved locally.</p>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">Reset password</CardTitle>
              <CardDescription>
                Enter your current password, then choose a new one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange("currentPassword")}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange("newPassword")}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange("confirmPassword")}
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
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
