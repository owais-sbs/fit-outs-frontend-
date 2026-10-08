import { useEffect, useRef, useState } from "react";
import { Camera, User } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { loadAdminProfile, saveAdminProfile } from "../lib/local-profile";

export default function AdminProfilePage() {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    description: "",
    avatarDataUrl: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = loadAdminProfile();
    setForm({
      name: stored.name || user?.name || "",
      phone: stored.phone || "",
      email: stored.email || user?.email || "",
      description: stored.description || "",
      avatarDataUrl: stored.avatarDataUrl || "",
    });
  }, [user?.name, user?.email]);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setSaved(false);
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
      setForm((prev) => ({
        ...prev,
        avatarDataUrl: typeof reader.result === "string" ? reader.result : "",
      }));
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (event) => {
    event.preventDefault();
    saveAdminProfile({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      description: form.description.trim(),
      avatarDataUrl: form.avatarDataUrl,
    });
    setSaved(true);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, avatarDataUrl: "" }));
    setSaved(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <PageShell>
      <PageHeader
        title="My Profile"
        description="Update your basic details. Saved on this device only."
        backTo={ROUTES.ADMIN.DASHBOARD}
        backTitle="Back to dashboard"
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Profile details</CardTitle>
          <CardDescription>
            Photo and basic information for your Admin account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col items-start gap-5 rounded-sm border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="relative shrink-0">
                <Avatar className="h-20 w-20 border border-border bg-background">
                  {form.avatarDataUrl ? (
                    <AvatarImage src={form.avatarDataUrl} alt={form.name || "Profile"} />
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
                  <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                    Upload
                  </Button>
                  {form.avatarDataUrl ? (
                    <Button type="button" size="sm" variant="ghost" onClick={handleRemovePhoto}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="admin-profile-name">Name</Label>
                <Input id="admin-profile-name" value={form.name} onChange={update("name")} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-profile-phone">Phone number</Label>
                <Input id="admin-profile-phone" type="tel" value={form.phone} onChange={update("phone")} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-profile-email">Email</Label>
                <Input id="admin-profile-email" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="admin-profile-description">Short description</Label>
                <Textarea
                  id="admin-profile-description"
                  value={form.description}
                  onChange={update("description")}
                  placeholder="A short note about you or your role…"
                  rows={3}
                  className="min-h-[96px] resize-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <Button type="submit">Save profile</Button>
              {saved ? (
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Saved locally.</p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
