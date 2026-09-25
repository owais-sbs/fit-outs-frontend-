import { useEffect, useState } from "react";
import { GanttChart, Loader2 } from "lucide-react";
import { Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProgressMaterialIssuesFields, {
  toMaterialIssuesPayload,
} from "@/modules/admin/components/progress/ProgressMaterialIssuesFields";
import CpmGantt from "@/modules/admin/pages/schedule/CpmGantt";
import { fetchMaterialPlan } from "@/modules/admin/api/material-plan.api";
import {
  fetchPublishedProjectSchedule,
  postActivityProgress,
  requestDurationExtension,
} from "@/modules/admin/api/schedule.api";

const DELAY_REASON_PRESETS = [
  { code: "WEATHER", label: "Adverse weather" },
  { code: "MATERIAL_DELAY", label: "Material / delivery delay" },
  { code: "CLIENT_CHANGE", label: "Client instruction / scope change" },
  { code: "ACCESS_CONSTRAINT", label: "Site access / permit constraint" },
  { code: "LABOUR_SHORTAGE", label: "Labour shortage" },
  { code: "DESIGN_HOLD", label: "Design / drawing hold" },
  { code: "OTHER", label: "Custom" },
];

/**
 * Published programme Gantt for assigned staff / site engineers.
 * @param {"immediate"|"validation"} progressMode — SE applies live; employees wait for PM approval.
 * @param {boolean} allowProgress — when false, Gantt is view-only (e.g. team staff programme page).
 * @param {(activity) => boolean} [canUpdateActivity] — optional gate for which bars open the progress form.
 */
export default function AssignedProgrammeView({
  projectOptions = [],
  initialProjectId = null,
  progressMode = "validation",
  allowProgress = true,
  canUpdateActivity,
  emptyMessage = "No published programme yet.",
}) {
  const [projectId, setProjectId] = useState(
    initialProjectId != null ? String(initialProjectId) : ""
  );
  const [activities, setActivities] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [criticalPaths, setCriticalPaths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ percentComplete: 0, notes: "", labourHours: "" });
  const [materialRows, setMaterialRows] = useState([]);
  const [planLines, setPlanLines] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [extForm, setExtForm] = useState({
    requestedDurationWorkingDays: "",
    delayReasonCode: "WEATHER",
    delayReasonText: "",
  });
  const [extMessage, setExtMessage] = useState("");
  const [extBusy, setExtBusy] = useState(false);

  useEffect(() => {
    if (!projectId && projectOptions.length === 1) {
      setProjectId(String(projectOptions[0].id));
    }
  }, [projectId, projectOptions]);

  useEffect(() => {
    if (initialProjectId != null) {
      setProjectId(String(initialProjectId));
    }
  }, [initialProjectId]);

  const loadSchedule = (pid) => {
    if (!pid) {
      setActivities([]);
      setDependencies([]);
      setCriticalPaths([]);
      return Promise.resolve();
    }
    setLoading(true);
    setError("");
    setSelected(null);
    setMessage("");
    return fetchPublishedProjectSchedule(pid)
      .then((schedule) => {
        const acts = Array.isArray(schedule?.activities) ? schedule.activities : [];
        const pathCrit = new Set((schedule?.criticalPath || []).map(String));
        setActivities(
          acts.map((a) => ({
            ...a,
            critical: !!a.critical || pathCrit.has(String(a.uuid)),
          }))
        );
        setDependencies(Array.isArray(schedule?.dependencies) ? schedule.dependencies : []);
        const paths =
          Array.isArray(schedule?.criticalPaths) && schedule.criticalPaths.length
            ? schedule.criticalPaths
            : schedule?.criticalPath
              ? [schedule.criticalPath]
              : [];
        setCriticalPaths(paths);
      })
      .catch((e) => {
        setActivities([]);
        setDependencies([]);
        setCriticalPaths([]);
        setError(e?.response?.data?.error || e?.message || "Could not load programme");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSchedule(projectId);
  }, [projectId]);

  const selectActivity = (a) => {
    if (!allowProgress) return;
    if (typeof canUpdateActivity === "function" && !canUpdateActivity(a)) {
      setSelected(null);
      setMessage("You can only update activities assigned to you. Click one of your assigned bars.");
      return;
    }
    setSelected(a);
    setForm({ percentComplete: a?.percentComplete || 0, notes: "", labourHours: "" });
    setMaterialRows([]);
    setMessage("");
    setExtMessage("");
    const currentDays = Number(a?.durationWorkingDays) || 0;
    setExtForm({
      requestedDurationWorkingDays: currentDays > 0 ? String(currentDays + 1) : "",
      delayReasonCode: "WEATHER",
      delayReasonText: "",
    });
    const pid = a?.projectId || projectId;
    if (pid) {
      fetchMaterialPlan(pid)
        .then((plan) => setPlanLines(Array.isArray(plan?.lines) ? plan.lines : []))
        .catch(() => setPlanLines([]));
    } else {
      setPlanLines([]);
    }
  };

  const submitExtension = async () => {
    if (!selected?.uuid || progressMode !== "immediate") return;
    const current = Number(selected.durationWorkingDays) || 0;
    const requested = Number(extForm.requestedDurationWorkingDays);
    if (!requested || requested <= current) {
      setExtMessage(`New duration must be greater than current (${current} working days).`);
      return;
    }
    if (extForm.delayReasonCode === "OTHER" && !String(extForm.delayReasonText || "").trim()) {
      setExtMessage("Please describe the custom delay reason.");
      return;
    }
    setExtBusy(true);
    setExtMessage("");
    try {
      await requestDurationExtension(selected.uuid, {
        requestedDurationWorkingDays: requested,
        delayReasonCode: extForm.delayReasonCode,
        delayReasonText: String(extForm.delayReasonText || "").trim() || null,
      });
      setExtMessage("Pending PM approval — programme dates will not change until approved.");
    } catch (e) {
      setExtMessage(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Request failed");
    } finally {
      setExtBusy(false);
    }
  };

  const submit = async () => {
    if (!selected?.uuid || !allowProgress) return;
    setBusy(true);
    setMessage("");
    try {
      const materialIssues = toMaterialIssuesPayload(materialRows);
      await postActivityProgress(selected.uuid, {
        percentComplete: Number(form.percentComplete) || 0,
        notes: form.notes || null,
        labourHours: form.labourHours !== "" ? Number(form.labourHours) : null,
        ...(materialIssues.length ? { materialIssues } : {}),
      });
      setMessage(
        progressMode === "immediate"
          ? "Progress applied — Gantt updated."
          : "Submitted for PM validation — awaiting approval."
      );
      setMaterialRows([]);
      await loadSchedule(projectId);
      setSelected((prev) =>
        prev
          ? { ...prev, percentComplete: Number(form.percentComplete) || 0 }
          : null
      );
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to post progress");
    } finally {
      setBusy(false);
    }
  };

  if (!projectOptions.length) {
    return (
      <Surface className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <GanttChart className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">{emptyMessage}</p>
      </Surface>
    );
  }

  return (
    <div className="space-y-4">
      {projectOptions.length > 1 && (
        <div className="max-w-sm space-y-1.5">
          <Label className="text-xs">Project</Label>
          <Select value={projectId || undefined} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projectOptions.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name || p.projectName || `Project #${p.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!projectId ? (
        <p className="text-sm text-muted-foreground">Select a project to view the programme.</p>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading programme…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
          {error}
        </div>
      ) : activities.length === 0 ? (
        <Surface className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <GanttChart className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">Programme not published yet</p>
          <p className="max-w-md text-xs text-muted-foreground">{emptyMessage}</p>
        </Surface>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {allowProgress
              ? `Critical path highlighted · ${activities.length} activities · click a bar to update %`
              : `Critical path highlighted · ${activities.length} activities · read-only`}
          </p>
          <CpmGantt
            activities={activities}
            dependencies={dependencies}
            selectedUuid={selected?.uuid}
            onSelect={allowProgress ? selectActivity : undefined}
            emptyMessage="Programme not published yet"
          />
          {!!criticalPaths.length && (
            <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
              <p className="mb-2 text-sm font-semibold">Longest paths</p>
              <div className="space-y-1.5">
                {criticalPaths.slice(0, 3).map((path, index) => {
                  const labels = (path || []).map((uuid) => {
                    const a = activities.find((x) => String(x.uuid) === String(uuid));
                    return a?.activityCode || a?.name || String(uuid).slice(0, 8);
                  });
                  return (
                    <div
                      key={`path-${index}-${labels.join(">")}`}
                      className="flex items-start gap-2 text-xs"
                    >
                      <Badge
                        className={
                          index === 0
                            ? "bg-amber-500/15 text-amber-800"
                            : "bg-secondary text-muted-foreground"
                        }
                      >
                        {index === 0 ? "Critical" : `Path ${index + 1}`}
                      </Badge>
                      <span className="font-mono text-muted-foreground">{labels.join(" → ")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {message && !selected && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}

          {allowProgress && selected && (
            <Surface className="p-5">
              <h2 className="mb-3 text-sm font-semibold">Update progress — {selected.name}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
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
                <div className="sm:col-span-2">
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <ProgressMaterialIssuesFields
                    planLines={planLines}
                    rows={materialRows}
                    onChange={setMaterialRows}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button size="sm" disabled={busy} onClick={submit}>
                  {busy
                    ? "Saving…"
                    : progressMode === "immediate"
                      ? "Apply progress"
                      : "Submit for validation"}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  {progressMode === "immediate"
                    ? "Updates the Gantt immediately for you and the client programme."
                    : "Your update applies to the schedule after PM approval."}
                </p>
              </div>
              {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
            </Surface>
          )}

          {allowProgress && progressMode === "immediate" && selected && (
            <Surface className="p-5">
              <h2 className="mb-3 text-sm font-semibold">Request duration extension — {selected.name}</h2>
              <p className="mb-3 text-[11px] text-muted-foreground">
                Increases require PM approval. Gantt dates stay unchanged until approved.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Current duration (working days)</Label>
                  <Input type="number" value={Number(selected.durationWorkingDays) || 0} disabled />
                </div>
                <div>
                  <Label className="text-xs">New duration (working days)</Label>
                  <Input
                    type="number"
                    min={(Number(selected.durationWorkingDays) || 0) + 1}
                    value={extForm.requestedDurationWorkingDays}
                    onChange={(e) =>
                      setExtForm((f) => ({ ...f, requestedDurationWorkingDays: e.target.value }))
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Delay reason</Label>
                  <Select
                    value={extForm.delayReasonCode}
                    onValueChange={(v) => setExtForm((f) => ({ ...f, delayReasonCode: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {DELAY_REASON_PRESETS.map((r) => (
                        <SelectItem key={r.code} value={r.code}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {extForm.delayReasonCode === "OTHER" && (
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Custom reason</Label>
                    <Textarea
                      rows={2}
                      value={extForm.delayReasonText}
                      onChange={(e) => setExtForm((f) => ({ ...f, delayReasonText: e.target.value }))}
                      placeholder="Describe the delay…"
                    />
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button size="sm" variant="outline" disabled={extBusy} onClick={submitExtension}>
                  {extBusy ? "Submitting…" : "Request extension"}
                </Button>
              </div>
              {extMessage && <p className="mt-2 text-sm text-muted-foreground">{extMessage}</p>}
            </Surface>
          )}
        </>
      )}
    </div>
  );
}
