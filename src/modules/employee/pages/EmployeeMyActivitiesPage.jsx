import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  fetchMyScheduleActivities,
  postActivityProgress,
} from "@/modules/admin/api/schedule.api";

export default function EmployeeMyActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ percentComplete: 0, notes: "", labourHours: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    fetchMyScheduleActivities()
      .then((list) => setActivities(Array.isArray(list) ? list : []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const open = (a) => {
    setSelected(a);
    setForm({ percentComplete: a.percentComplete || 0, notes: "", labourHours: "" });
    setMessage("");
  };

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      await postActivityProgress(selected.uuid, {
        percentComplete: Number(form.percentComplete) || 0,
        notes: form.notes || null,
        labourHours: form.labourHours !== "" ? Number(form.labourHours) : null,
      });
      setMessage("Submitted for PM validation — awaiting approval.");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to post progress");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell className="max-w-4xl mx-auto">
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-4xl mx-auto">
      <PageTitle
        title="My activities"
        subtitle="Published schedule activities assigned to you"
      />

      {activities.length === 0 ? (
        <Surface className="px-4 py-10 text-center text-sm text-muted-foreground">
          No published activities assigned to your account yet.
        </Surface>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => (
            <button
              key={a.uuid}
              type="button"
              onClick={() => open(a)}
              className={`w-full rounded-xl px-4 py-3 text-left transition-colors hover:bg-secondary/70 ${
                selected?.uuid === a.uuid ? "bg-primary/5 ring-1 ring-primary/25" : "bg-secondary/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{a.name}</p>
                <Badge className="border-none bg-primary/10 text-primary">{a.percentComplete}% approved</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {a.startDate} → {a.endDate} · Project #{a.projectId}
              </p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Surface className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Update progress — {selected.name}</h2>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Percent complete</Label>
              <Input type="number" min={0} max={100} value={form.percentComplete}
                onChange={(e) => setForm((f) => ({ ...f, percentComplete: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Labour hours</Label>
              <Input type="number" step="0.5" value={form.labourHours}
                onChange={(e) => setForm((f) => ({ ...f, labourHours: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea rows={3} value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button size="sm" disabled={busy} onClick={submit}>Submit for validation</Button>
            <p className="text-[11px] text-muted-foreground">
              Your update applies to the schedule after PM approval.
            </p>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>
        </Surface>
      )}
    </PageShell>
  );
}
