import { useState } from "react";
import { Save, User, Bell, Lock } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/auth-context";

export default function ClientSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || "Client User",
    email: user?.email || "client@example.com",
    company: "Al Barari Developments",
    phone: "+971 50 123 4567",
  });
  const [notifications, setNotifications] = useState({
    designUploaded: true,
    approvalRequired: true,
    revisionCompleted: true,
    emailDigest: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, notification preferences, and account security."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Full Name", key: "name" },
              { label: "Email Address", key: "email", type: "email" },
              { label: "Company", key: "company" },
              { label: "Phone Number", key: "phone" },
            ].map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium">{field.label}</label>
                <Input
                  type={field.type || "text"}
                  value={profile[field.key]}
                  onChange={(e) => setProfile((p) => ({ ...p, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "designUploaded", label: "New design uploaded", desc: "Notified when a new design is ready for review" },
                { key: "approvalRequired", label: "Approval required", desc: "Reminded when a design needs your sign-off" },
                { key: "revisionCompleted", label: "Revision completed", desc: "Notified when the team addresses your feedback" },
                { key: "emailDigest", label: "Weekly email digest", desc: "Summary of all activity sent every Monday" },
              ].map((n) => (
                <div key={n.key} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key] }))}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${notifications[n.key] ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${notifications[n.key] ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">Change Password</Button>
              <p className="text-xs text-center text-muted-foreground">Last changed 32 days ago</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button className="gap-2" onClick={handleSave}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
        {saved && <p className="text-sm text-emerald-600 font-medium">Changes saved successfully.</p>}
      </div>
    </div>
  );
}
