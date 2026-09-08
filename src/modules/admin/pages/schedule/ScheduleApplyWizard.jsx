import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2,
  PackageSearch,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  applySchedule,
  fetchScheduleTemplates,
  fetchWorkCalendars,
  previewSchedule,
} from "../../api/schedule.api";

const STEPS = ["Template", "Duration", "Parameters", "Preview"];

const FINISH_LEVELS = [
  { value: "BASIC", label: "Basic / shell" },
  { value: "STANDARD", label: "Standard" },
  { value: "PREMIUM", label: "Premium" },
  { value: "ULTRA_LUXURY", label: "Ultra luxury" },
];

/**
 * The 60-day fast track is a commercial decision, not a scheduling one. The premium is real
 * money, so it is shown before the PM picks the shorter template, not after.
 */
const FAST_TRACK_PREMIUM = {
  range: "12–18%",
  drivers: "Additional manpower, expedited procurement, premium freight and out-of-hours rates.",
};

export default function ScheduleApplyWizard({ projectId, onApplied, onPreviewChange, onClose }) {
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [acks, setAcks] = useState({});

  // Parent passes an inline handler; keep it in a ref so preview sync does not loop renders.
  const previewChangeRef = useRef(onPreviewChange);
  previewChangeRef.current = onPreviewChange;

  const [params, setParams] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    areaSqft: "",
    roomCount: "",
    floorCount: "",
    finishLevel: "STANDARD",
    crewCount: "",
    occupiedBuilding: false,
    workCalendarUuid: "",
  });
  const [toggles, setToggles] = useState({});

  useEffect(() => {
    Promise.allSettled([fetchScheduleTemplates(), fetchWorkCalendars()])
      .then(([t, c]) => {
        setTemplates(t.status === "fulfilled" && Array.isArray(t.value) ? t.value : []);
        setCalendars(c.status === "fulfilled" && Array.isArray(c.value) ? c.value : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const chooseTemplate = (template) => {
    setSelectedTemplate(template);
    setPreview(null);
    setAcks({});
    const base = template.baseParameters || {};
    setParams((p) => ({
      ...p,
      areaSqft: base.areaSqft ?? "",
      roomCount: base.roomCount ?? "",
      floorCount: base.floorCount ?? "",
      finishLevel: base.finishLevel || "STANDARD",
      crewCount: base.crewCount ?? "",
    }));
    setToggles(
      Object.fromEntries((template.scopeToggleCodes || []).map((code) => [code, true]))
    );
  };

  const payload = useMemo(
    () => ({
      templateUuid: selectedTemplate?.uuid,
      startDate: params.startDate || undefined,
      areaSqft: params.areaSqft === "" ? undefined : Number(params.areaSqft),
      roomCount: params.roomCount === "" ? undefined : Number(params.roomCount),
      floorCount: params.floorCount === "" ? undefined : Number(params.floorCount),
      finishLevel: params.finishLevel || undefined,
      crewCount: params.crewCount === "" ? undefined : Number(params.crewCount),
      occupiedBuilding: params.occupiedBuilding,
      workCalendarUuid: params.workCalendarUuid || undefined,
      scopeToggles: toggles,
      fastTrackAcknowledgements: acks,
    }),
    [selectedTemplate, params, toggles, acks]
  );

  const runPreview = useCallback(async () => {
    if (!selectedTemplate) return;
    setBusy(true);
    setError("");
    try {
      setPreview(await previewSchedule(projectId, payload));
      setStep(3);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not compute the programme");
    } finally {
      setBusy(false);
    }
  }, [projectId, payload, selectedTemplate]);

  const runApply = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await applySchedule(projectId, payload);
      if (!result?.activitiesWritten) {
        throw new Error(
          "No activities were written. Import the seed file from Authority library, then try again."
        );
      }
      onApplied?.(result);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not apply the programme");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    previewChangeRef.current?.(step === 3 ? preview : null);
  }, [preview, step]);

  // Re-preview whenever an acknowledgement changes, so the publish button unlocks live.
  useEffect(() => {
    if (step === 3 && preview?.requiresFastTrackAcknowledgement) {
      const timer = setTimeout(runPreview, 250);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [acks]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading templates
        </CardContent>
      </Card>
    );
  }

  const fastTrackAlternative = templates.find((t) => t.fastTrack && t.uuid !== selectedTemplate?.uuid);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-semibold">Apply a programme template</CardTitle>
          <div className="flex items-center gap-1 text-xs">
            {STEPS.map((label, index) => (
              <span key={label} className="flex items-center gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    index === step
                      ? "bg-foreground text-background font-semibold"
                      : index < step
                      ? "bg-emerald-500/15 text-emerald-800"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                {index < STEPS.length - 1 && <span className="text-muted-foreground">·</span>}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {templates.map((t) => (
              <button
                key={t.uuid}
                type="button"
                onClick={() => chooseTemplate(t)}
                className={`rounded-lg border p-4 text-left transition hover:border-foreground/40 ${
                  selectedTemplate?.uuid === t.uuid ? "border-foreground bg-secondary/50" : "border-border"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
                  {t.fastTrack && <Badge className="bg-copper/15 text-copper-foreground">Fast track</Badge>}
                  {!t.systemTemplate && <Badge className="bg-secondary text-muted-foreground">Your template</Badge>}
                </div>
                <p className="mt-1 font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.projectType}</p>
                <p className="mt-2 text-sm">
                  {t.computedWorkingDays ?? t.targetWorkingDays ?? "—"} working days ·{" "}
                  {t.activityCount} activities
                </p>
                {t.varianceNote && (
                  <p className="mt-1 flex items-start gap-1 text-[11px] text-amber-800">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    {t.varianceNote}
                  </p>
                )}
              </button>
            ))}
            {!templates.length && (
              <p className="text-sm text-muted-foreground">
                No templates in the library yet. Import the seed file from the approvals admin
                screen to load them.
              </p>
            )}
          </div>
        )}

        {step === 1 && selectedTemplate && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirm the programme length before sizing it. A shorter programme is a commercial
              decision as much as a scheduling one.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <th className="py-2 font-semibold">Option</th>
                    <th className="py-2 font-semibold">Working days</th>
                    <th className="py-2 font-semibold">Published figure</th>
                    <th className="py-2 font-semibold">Cost impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="py-2 font-medium">{selectedTemplate.name}</td>
                    <td className="py-2">{selectedTemplate.computedWorkingDays ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">
                      {selectedTemplate.targetWorkingDays ?? "—"}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {selectedTemplate.fastTrack ? `+${FAST_TRACK_PREMIUM.range} premium` : "Baseline"}
                    </td>
                  </tr>
                  {fastTrackAlternative && (
                    <tr>
                      <td className="py-2">
                        {fastTrackAlternative.name}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-2 h-6"
                          onClick={() => chooseTemplate(fastTrackAlternative)}
                        >
                          Switch
                        </Button>
                      </td>
                      <td className="py-2">{fastTrackAlternative.computedWorkingDays ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">
                        {fastTrackAlternative.targetWorkingDays ?? "—"}
                      </td>
                      <td className="py-2 text-muted-foreground">+{FAST_TRACK_PREMIUM.range} premium</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedTemplate.varianceNote && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{selectedTemplate.varianceNote}</span>
              </div>
            )}
            {selectedTemplate.fastTrack && (
              <p className="text-xs text-muted-foreground">
                Acceleration premium of {FAST_TRACK_PREMIUM.range}. {FAST_TRACK_PREMIUM.drivers}
              </p>
            )}
            {selectedTemplate.dataQualityNotes && (
              <p className="text-xs text-muted-foreground">{selectedTemplate.dataQualityNotes}</p>
            )}
          </div>
        )}

        {step === 2 && selectedTemplate && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Start date</Label>
                <Input
                  type="date"
                  value={params.startDate}
                  onChange={(e) => setParams({ ...params, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Area (sqft)</Label>
                <Input
                  type="number"
                  value={params.areaSqft}
                  onChange={(e) => setParams({ ...params, areaSqft: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Template reference: {selectedTemplate.baseParameters?.areaSqft ?? "not set"}
                </p>
              </div>
              <div>
                <Label className="text-xs">Rooms</Label>
                <Input
                  type="number"
                  value={params.roomCount}
                  onChange={(e) => setParams({ ...params, roomCount: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Floors</Label>
                <Input
                  type="number"
                  value={params.floorCount}
                  onChange={(e) => setParams({ ...params, floorCount: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Finish level</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={params.finishLevel}
                  onChange={(e) => setParams({ ...params, finishLevel: e.target.value })}
                >
                  {FINISH_LEVELS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Simultaneous crews</Label>
                <Input
                  type="number"
                  value={params.crewCount}
                  onChange={(e) => setParams({ ...params, crewCount: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Work calendar</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={params.workCalendarUuid}
                  onChange={(e) => setParams({ ...params, workCalendarUuid: e.target.value })}
                >
                  <option value="">Default (Saturday to Thursday)</option>
                  {calendars.map((c) => (
                    <option key={c.uuid} value={c.uuid}>{c.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-end gap-2 pb-1 text-sm">
                <Switch
                  checked={params.occupiedBuilding}
                  onCheckedChange={(v) => setParams({ ...params, occupiedBuilding: v })}
                />
                <span>Occupied building</span>
              </label>
            </div>

            {!!Object.keys(toggles).length && (
              <div>
                <p className="mb-2 text-sm font-semibold">Scope</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {Object.keys(toggles).map((code) => (
                    <label key={code} className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={!!toggles[code]}
                        onCheckedChange={(v) => setToggles({ ...toggles, [code]: v })}
                      />
                      <span>{code.replace(/_/g, " ").toLowerCase()}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Turning a scope off removes those activities and their logic links, then
                  recomputes the critical path.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 3 && preview && <PreviewPanel preview={preview} acks={acks} setAcks={setAcks} />}

        <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-4">
          <div className="flex gap-2">
            {step > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setStep(step - 1)} disabled={busy}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 2 && (
              <Button size="sm" disabled={!selectedTemplate || busy} onClick={() => setStep(step + 1)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 2 && (
              <Button size="sm" disabled={busy} onClick={runPreview}>
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <PackageSearch className="h-4 w-4 mr-1" />}
                Compute preview
              </Button>
            )}
            {step === 3 && (
              <>
                <Button size="sm" variant="outline" disabled={busy} onClick={runPreview}>
                  Recompute
                </Button>
                <Button size="sm" disabled={busy || !preview?.canPublish} onClick={runApply}>
                  {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  Apply and publish
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewPanel({ preview, acks, setAcks }) {
  const critical = (preview.activities || []).filter((a) => a.critical);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Finish date" value={preview.finishDate} />
        <Stat label="Working days" value={preview.workingDays} hint={`${preview.calendarDays} calendar days`} />
        <Stat label="Activities" value={preview.activityCount}
              hint={preview.excludedByToggleCount ? `${preview.excludedByToggleCount} excluded by scope` : undefined} />
        <Stat label="On the critical path" value={critical.length} />
      </div>

      {preview.targetVarianceNote && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{preview.targetVarianceNote}</span>
        </div>
      )}

      {(preview.blockers || []).map((b) => (
        <div key={b} className="flex items-start gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{b}</span>
        </div>
      ))}

      {preview.requiresFastTrackAcknowledgement && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-900">
            This programme cannot publish until every condition below is acknowledged.
          </p>
          <div className="mt-2 space-y-1.5">
            {(preview.fastTrackConditions || []).map((c) => (
              <label key={c} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={!!acks[c]}
                  onChange={(e) => setAcks({ ...acks, [c]: e.target.checked })}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {!!(preview.criticalPaths || []).length && (
        <div>
          <p className="mb-2 text-sm font-semibold">Longest paths</p>
          <div className="space-y-1.5">
            {preview.criticalPaths.map((path, index) => (
              <div key={path.join(">")} className="flex items-start gap-2 text-xs">
                <Badge className={index === 0 ? "bg-amber-500/15 text-amber-800" : "bg-secondary text-muted-foreground"}>
                  {index === 0 ? "Critical" : `Path ${index + 1}`}
                </Badge>
                <span className="font-mono text-muted-foreground">{path.join(" → ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!(preview.orderByDates || []).length && (
        <div>
          <p className="mb-2 text-sm font-semibold">Order-by dates</p>
          <div className="overflow-x-auto rounded-lg border border-border/40">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 font-semibold">Lead</th>
                  <th className="px-3 py-2 font-semibold">Installs</th>
                  <th className="px-3 py-2 font-semibold">Order by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {preview.orderByDates.map((o) => (
                  <tr key={o.itemName} className={o.overdue ? "bg-red-500/5" : ""}>
                    <td className="px-3 py-1.5">{o.itemName}</td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">
                      {o.leadTimeCalendarDays} days
                    </td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">
                      {o.installActivityCode} · {o.installStartDate}
                    </td>
                    <td className={`px-3 py-1.5 ${o.overdue ? "font-semibold text-red-700" : ""}`}>
                      {o.orderByDate}
                      {o.overdue && " · already passed"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!!(preview.warnings || []).length && (
        <details className="rounded-lg border border-border/40 p-3">
          <summary className="cursor-pointer text-sm font-semibold">
            {preview.warnings.length} data-quality notes
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {preview.warnings.map((w) => <li key={w}>· {w}</li>)}
          </ul>
        </details>
      )}

      {preview.canPublish && (
        <p className="flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          Preview looks good. Click <strong>Apply and publish</strong> below to write{" "}
          {preview.activityCount} activities to this project and create package shells, billing
          milestones, hold points and procurement deadlines.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-lg bg-secondary/50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value ?? "—"}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
