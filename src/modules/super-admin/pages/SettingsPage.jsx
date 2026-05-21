import { useState } from "react";
import { Save } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { AUDIT_LOGS } from "../data/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_VARIANT = { success: "success", warning: "warning", destructive: "destructive" };

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

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [platform, setPlatform] = useState({
    maintenance: false,
    signups: true,
    apiAccess: true,
  });
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    tenantExpiry: true,
    billingFailures: true,
    weeklyDigest: false,
  });
  const [security, setSecurity] = useState({ twoFa: true, sessionTimeout: true });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Settings"
        description="Platform configuration, security, branding, and audit history."
      />

      {saved && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
          Settings saved successfully.
        </div>
      )}

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="audit">Audit logs</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-4">
          <SettingsGroup title="Platform settings" description="Core behaviour for all tenants">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform name</Label>
                <Input defaultValue="OnePath Fitouts" />
              </div>
              <div className="space-y-2">
                <Label>Default timezone</Label>
                <Select defaultValue="australia">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="australia">Australia/Sydney</SelectItem>
                    <SelectItem value="melbourne">Australia/Melbourne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ToggleRow
              label="Maintenance mode"
              description="Restrict access for non-admin users"
              checked={platform.maintenance}
              onCheckedChange={(v) => setPlatform((p) => ({ ...p, maintenance: v }))}
            />
            <ToggleRow
              label="Allow new tenant signups"
              checked={platform.signups}
              onCheckedChange={(v) => setPlatform((p) => ({ ...p, signups: v }))}
            />
            <ToggleRow
              label="Public API access"
              checked={platform.apiAccess}
              onCheckedChange={(v) => setPlatform((p) => ({ ...p, apiAccess: v }))}
            />
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <SettingsGroup title="Notification preferences">
            <ToggleRow
              label="Email alerts"
              description="Critical platform events"
              checked={notifications.emailAlerts}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, emailAlerts: v }))}
            />
            <ToggleRow
              label="Tenant expiry warnings"
              checked={notifications.tenantExpiry}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, tenantExpiry: v }))}
            />
            <ToggleRow
              label="Billing failure alerts"
              checked={notifications.billingFailures}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, billingFailures: v }))}
            />
            <ToggleRow
              label="Weekly digest"
              checked={notifications.weeklyDigest}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, weeklyDigest: v }))}
            />
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <SettingsGroup title="Branding settings">
            <div className="space-y-2">
              <Label>Support email</Label>
              <Input type="email" defaultValue="support@onepath.com.au" />
            </div>
            <div className="space-y-2">
              <Label>Login welcome message</Label>
              <Textarea defaultValue="Manage commercial fit-out projects with confidence." />
            </div>
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SettingsGroup title="Security settings">
            <ToggleRow
              label="Enforce 2FA for admins"
              description="Required for Super Admin"
              checked={security.twoFa}
              onCheckedChange={(v) => setSecurity((s) => ({ ...s, twoFa: v }))}
            />
            <ToggleRow
              label="Session timeout (30 min)"
              checked={security.sessionTimeout}
              onCheckedChange={(v) => setSecurity((s) => ({ ...s, sessionTimeout: v }))}
            />
            <div className="space-y-2">
              <Label>Allowed IP ranges (optional)</Label>
              <Textarea placeholder="203.0.113.0/24" className="min-h-[60px]" />
            </div>
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="overflow-hidden border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Audit logs</CardTitle>
              <CardDescription>Recent administrative actions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AUDIT_LOGS.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="pl-6 font-medium">{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell className="text-muted-foreground">{log.target}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{log.time}</TableCell>
                      <TableCell className="pr-6">
                        <Badge variant={STATUS_VARIANT[log.status] || "secondary"}>{log.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SettingsGroup title="System preferences">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Log retention (days)</Label>
                <Input type="number" defaultValue={90} />
              </div>
              <div className="space-y-2">
                <Label>Backup frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ToggleRow label="Enable debug logging" checked={false} onCheckedChange={() => {}} />
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
