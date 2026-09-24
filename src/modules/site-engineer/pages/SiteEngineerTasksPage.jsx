import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchMySiteEngineerTasks,
  updateSiteEngineerTaskStatus,
} from "@/modules/site-engineer/api/site-engineer-tasks.api";

const PRIORITY_BADGE = {
  LOW: "bg-muted text-muted-foreground border-none",
  MEDIUM: "bg-blue-500/15 text-blue-700 border-none",
  HIGH: "bg-orange-500/15 text-orange-700 border-none",
  URGENT: "bg-destructive/15 text-destructive border-none",
};

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function isOverdue(deadline, status) {
  if (!deadline || status === "DONE" || status === "CANCELLED") return false;
  return String(deadline).slice(0, 10) < todayStr();
}

function fmtDate(d) {
  if (!d) return "—";
  const raw = String(d).includes("T") ? d : `${d}T00:00:00`;
  return new Date(raw).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SiteEngineerTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => {
    setLoading(true);
    fetchMySiteEngineerTasks()
      .then((list) => setTasks(Array.isArray(list) ? list : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter === "OPEN") return t.status !== "DONE" && t.status !== "CANCELLED";
      if (statusFilter === "OVERDUE") return isOverdue(t.deadline, t.status);
      if (statusFilter === "ALL") return true;
      return t.status === statusFilter;
    });
  }, [tasks, statusFilter]);

  const open = (t) => {
    setSelected(t);
    setNotes(t.progressNotes || "");
    setMessage("");
  };

  const setStatus = async (status) => {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      const updated = await updateSiteEngineerTaskStatus(selected.uuid, {
        status,
        progressNotes: notes || null,
      });
      setSelected(updated);
      setMessage("Task updated.");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.message || e.message || "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <PageTitle
        title="Tasks"
        subtitle="Tasks assigned by your project manager"
        actions={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="TODO">To do</SelectItem>
              <SelectItem value="IN_PROGRESS">In progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="ALL">All</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-2">
          {!loading && filtered.length === 0 ? (
            <Surface className="px-4 py-10 text-center text-sm text-muted-foreground">
              No tasks match this filter.
            </Surface>
          ) : (
            filtered.map((t) => (
              <button
                key={t.uuid}
                type="button"
                onClick={() => open(t)}
                className={`w-full rounded-xl px-4 py-3 text-left transition-colors hover:bg-secondary/70 ${
                  selected?.uuid === t.uuid ? "bg-primary/5 ring-1 ring-primary/25" : "bg-secondary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.projectName || `Project #${t.projectId}`} · Due {fmtDate(t.deadline)}
                      {isOverdue(t.deadline, t.status) ? " · Overdue" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge className={PRIORITY_BADGE[t.priority] || ""}>{t.priority}</Badge>
                    <Badge variant="secondary">{t.status}</Badge>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <Surface className="p-5 h-fit">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a task to update progress.</p>
          ) : (
            <div className="space-y-3">
              <h2 className="text-base font-semibold tracking-tight">{selected.title}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selected.description || "No description."}
              </p>
              <p className="text-xs text-muted-foreground">
                Deadline {fmtDate(selected.deadline)} · {selected.priority}
              </p>
              <div>
                <Label className="text-xs">Progress notes</Label>
                <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || selected.status === "IN_PROGRESS"}
                  onClick={() => setStatus("IN_PROGRESS")}
                >
                  Start
                </Button>
                <Button
                  size="sm"
                  disabled={busy || selected.status === "DONE"}
                  onClick={() => setStatus("DONE")}
                >
                  Mark done
                </Button>
              </div>
              {message && <p className="text-sm text-muted-foreground">{message}</p>}
            </div>
          )}
        </Surface>
      </div>
    </PageShell>
  );
}
