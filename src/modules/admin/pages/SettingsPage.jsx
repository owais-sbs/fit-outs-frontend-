import { useCallback, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
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
import { fetchPlanningGates, updatePlanningGates } from "../api/planning.api";

function SettingsGroup({ title, description, children }) {
  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ToggleRow({ label, description, checked, onCheckedChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

const DEFAULT_GATES = {
  requireMaterial: false,
  requireResource: false,
  requireLabour: false,
  requireSubcontractor: false,
  requirePlanningReady: true,
};

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
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
  const [gates, setGates] = useState(DEFAULT_GATES);
  const [gatesLoading, setGatesLoading] = useState(true);
  const [gatesSaving, setGatesSaving] = useState(false);

  const loadGates = useCallback(() => {
    setGatesLoading(true);
    fetchPlanningGates()
      .then((data) => {
        if (data) {
          setGates({
            requireMaterial: !!data.requireMaterial,
            requireResource: !!data.requireResource,
            requireLabour: !!data.requireLabour,
            requireSubcontractor: !!data.requireSubcontractor,
            requirePlanningReady: data.requirePlanningReady !== false,
          });
        }
      })
      .catch(() => {
        /* keep defaults if endpoint not ready */
      })
      .finally(() => setGatesLoading(false));
  }, []);

  useEffect(() => {
    loadGates();
  }, [loadGates]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveGates = async () => {
    setGatesSaving(true);
    setMessage("");
    try {
      const updated = await updatePlanningGates(gates);
      if (updated) {
        setGates({
          requireMaterial: !!updated.requireMaterial,
          requireResource: !!updated.requireResource,
          requireLabour: !!updated.requireLabour,
          requireSubcontractor: !!updated.requireSubcontractor,
          requirePlanningReady: updated.requirePlanningReady !== false,
        });
      }
      setMessage("Planning gates saved.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to save planning gates");
    } finally {
      setGatesSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Settings"
        description="Manage your account profile, notification preferences, CRM defaults, and planning gates."
      />

      {(saved || message) && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
          {message || "Settings saved successfully."}
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="crm">CRM Preferences</TabsTrigger>
          <TabsTrigger value="planning">Planning gates</TabsTrigger>
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
                <Select defaultValue="aed">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aed">AED (د.إ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <SettingsGroup
            title="Gantt publish gates"
            description="Areas marked required must be READY or NOT REQUIRED before the schedule can be published."
          >
            {gatesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading gate config…
              </div>
            ) : (
              <>
                <ToggleRow
                  label="Require planning ready"
                  description="Planning ready flag must be set before publish"
                  checked={gates.requirePlanningReady}
                  onCheckedChange={(v) => setGates((g) => ({ ...g, requirePlanningReady: v }))}
                  disabled={gatesSaving}
                />
                <ToggleRow
                  label="Require material plan"
                  description="Material area must be READY or NOT REQUIRED"
                  checked={gates.requireMaterial}
                  onCheckedChange={(v) => setGates((g) => ({ ...g, requireMaterial: v }))}
                  disabled={gatesSaving}
                />
                <ToggleRow
                  label="Require resource plan"
                  checked={gates.requireResource}
                  onCheckedChange={(v) => setGates((g) => ({ ...g, requireResource: v }))}
                  disabled={gatesSaving}
                />
                <ToggleRow
                  label="Require labour plan"
                  checked={gates.requireLabour}
                  onCheckedChange={(v) => setGates((g) => ({ ...g, requireLabour: v }))}
                  disabled={gatesSaving}
                />
                <ToggleRow
                  label="Require subcontractor plan"
                  checked={gates.requireSubcontractor}
                  onCheckedChange={(v) => setGates((g) => ({ ...g, requireSubcontractor: v }))}
                  disabled={gatesSaving}
                />
                <Button className="gap-2" onClick={handleSaveGates} disabled={gatesSaving}>
                  {gatesSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save planning gates
                </Button>
              </>
            )}
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
