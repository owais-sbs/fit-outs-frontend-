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
  fetchActivityProgress,
  uploadProgressAttachment,
} from "@/modules/admin/api/schedule.api";
import { AttachmentList, AttachmentUploadField } from "@/components/shared/AttachmentField";

export default function SubcontractorProgressLogsPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ percentComplete: 0, notes: "", labourHours: "" });
  const [pendingFiles, setPendingFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadActivities = () => {
    setLoading(true);
    fetchMyScheduleActivities()
      .then((list) => setActivities(Array.isArray(list) ? list : []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const open = (activity) => {
    setSelected(activity);
    setForm({ percentComplete: activity.percentComplete || 0, notes: "", labourHours: "" });
    setPendingFiles([]);
    setMessage("");
    fetchActivityProgress(activity.uuid)
      .then((list) => setHistory(Array.isArray(list) ? list : []))
      .catch(() => setHistory([]));
  };

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      const created = await postActivityProgress(selected.uuid, {
        percentComplete: Number(form.percentComplete) || 0,
        notes: form.notes || null,
        labourHours: form.labourHours !== "" ? Number(form.labourHours) : null,
      });
      if (created?.uuid && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          await uploadProgressAttachment(created.uuid, file);
        }
      }
      setMessage("Progress log submitted with attachments — awaiting PM validation.");
      setPendingFiles([]);
      setForm({ percentComplete: form.percentComplete, notes: "", labourHours: "" });
      loadActivities();
      const list = await fetchActivityProgress(selected.uuid);
      setHistory(Array.isArray(list) ? list : []);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to post progress");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title="Progress logs"
        subtitle="Log site progress on assigned schedule activities with photos and documents."
      />

      {activities.length === 0 ? (
        <Surface className="px-4 py-10 text-center text-sm text-muted-foreground">
          No published activities assigned to your account yet.
        </Surface>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
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
                  <Badge className="border-none bg-primary/10 text-primary">{a.percentComplete}%</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.startDate} → {a.endDate} · Project #{a.projectId}
                </p>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="space-y-4">
              <Surface className="p-5">
                <h2 className="mb-3 text-sm font-semibold">New progress log — {selected.name}</h2>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Percent complete</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.percentComplete}
                      onChange={(e) => setForm((f) => ({ ...f, percentComplete: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Labour hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={form.labourHours}
                      onChange={(e) => setForm((f) => ({ ...f, labourHours: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Describe work completed on site..."
                    />
                  </div>
                  <AttachmentUploadField
                    files={pendingFiles}
                    onFilesChange={setPendingFiles}
                    disabled={busy}
                  />
                  <Button size="sm" disabled={busy} onClick={submit}>
                    {busy ? "Submitting…" : "Submit progress log"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Attach site photos or documents before submitting. Updates apply after PM approval.
                  </p>
                  {message && <p className="text-sm text-muted-foreground">{message}</p>}
                </div>
              </Surface>

              <Surface className="p-5">
                <h2 className="mb-3 text-sm font-semibold">Previous logs ({history.length})</h2>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No progress logs yet.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((log) => (
                      <div key={log.uuid} className="rounded-xl border border-border/40 bg-card/50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold tabular-nums">{log.percentComplete}%</p>
                          {log.validationStatus && (
                            <Badge variant="secondary" className="text-[10px]">
                              {log.validationStatus}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {log.reportedAt ? new Date(log.reportedAt).toLocaleString() : ""}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="mt-1 text-xs text-muted-foreground">{log.notes}</p>
                        )}
                        <AttachmentList paths={log.photoPaths} className="mt-2" />
                      </div>
                    ))}
                  </div>
                )}
              </Surface>
            </div>
          ) : (
            <Surface className="flex items-center justify-center px-4 py-16 text-sm text-muted-foreground">
              Select an activity to log progress.
            </Surface>
          )}
        </div>
      )}
    </PageShell>
  );
}
