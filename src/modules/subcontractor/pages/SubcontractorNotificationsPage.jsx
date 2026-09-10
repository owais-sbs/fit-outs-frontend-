import { useCallback, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  fetchScNotificationPrefs,
  updateScNotificationPrefs,
} from "@/modules/admin/api/subcontractor.api";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
  { value: "ur", label: "Urdu" },
];

export default function SubcontractorNotificationsPage() {
  const [prefs, setPrefs] = useState({
    whatsappEnabled: false,
    whatsappNumber: "",
    preferredLanguage: "en",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchScNotificationPrefs()
      .then((data) => {
        if (data) {
          setPrefs({
            whatsappEnabled: Boolean(data.whatsappEnabled),
            whatsappNumber: data.whatsappNumber || "",
            preferredLanguage: data.preferredLanguage || "en",
          });
        }
      })
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load preferences"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true);
    setMessage("");
    try {
      await updateScNotificationPrefs(prefs);
      setMessage("Preferences saved");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title="Notifications"
        subtitle="WhatsApp and language preferences for portal alerts"
      />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      <Surface className="max-w-lg space-y-5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">WhatsApp alerts</p>
            <p className="text-xs text-muted-foreground">Receive RFQ deadlines, claim updates and snag reminders</p>
          </div>
          <Switch
            checked={prefs.whatsappEnabled}
            onCheckedChange={(v) => setPrefs((p) => ({ ...p, whatsappEnabled: v }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">WhatsApp number</Label>
          <Input
            value={prefs.whatsappNumber}
            onChange={(e) => setPrefs((p) => ({ ...p, whatsappNumber: e.target.value }))}
            placeholder="+971 50 000 0000"
            disabled={!prefs.whatsappEnabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Preferred language</Label>
          <Select
            value={prefs.preferredLanguage}
            onValueChange={(v) => setPrefs((p) => ({ ...p, preferredLanguage: v }))}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={save} disabled={busy}>
          <Save className="mr-2 h-4 w-4" /> Save preferences
        </Button>
      </Surface>
    </PageShell>
  );
}
