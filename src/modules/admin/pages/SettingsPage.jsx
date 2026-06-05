import { useState } from "react";
import { Save } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/shared/context/auth-context";

function SettingsGroup({ title, description, children }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ToggleRow({ label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "Demo User",
    email: user?.email || "admin@onepath.com",
    role: "Administrator",
  });
  const [notifications, setNotifications] = useState({
    newLeads: true,
    siteVisits: true,
    dealUpdates: false,
    weeklyDigest: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Settings"
        description="Manage your account profile, notification preferences, and CRM defaults."
      />

      {saved && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
          Settings saved successfully.
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="crm">CRM Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <SettingsGroup title="Personal Information" description="Update your contact details">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input disabled value={profile.role} />
            </div>
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <SettingsGroup title="Notification preferences">
            <ToggleRow
              label="New Lead Alerts"
              description="Get notified when a new lead enters the pipeline"
              checked={notifications.newLeads}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, newLeads: v }))}
            />
            <ToggleRow
              label="Site Visit Reminders"
              description="Upcoming site visits scheduled for today"
              checked={notifications.siteVisits}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, siteVisits: v }))}
            />
            <ToggleRow
              label="Deal Status Updates"
              description="When a deal moves to Won or Lost"
              checked={notifications.dealUpdates}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, dealUpdates: v }))}
            />
            <ToggleRow
              label="Weekly Sales Digest"
              checked={notifications.weeklyDigest}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, weeklyDigest: v }))}
            />
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="crm" className="space-y-4">
          <SettingsGroup title="CRM defaults">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Default View</Label>
                <Select defaultValue="kanban">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kanban">Kanban Board</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select defaultValue="usd">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="aud">AUD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingsGroup>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[1600px] justify-end">
          <Button className="gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
