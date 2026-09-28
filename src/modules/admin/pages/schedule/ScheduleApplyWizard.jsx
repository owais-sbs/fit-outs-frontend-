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
  applyProgramme,
  applySchedule,
  fetchScheduleTemplate,
  fetchScheduleTemplates,
  fetchWorkCalendars,
  previewProgramme,
  previewSchedule,
  suggestBoqMatches,
} from "../../api/schedule.api";
import { fetchBoq, fetchBoqsByProject } from "../../api/boq.api";
import { isBoqApproved } from "../boq/boqDataUtils";
import ApplyCascadeOverlay from "./ApplyCascadeOverlay";

const MODE_TEMPLATE = "TEMPLATE";
const MODE_BOQ = "BOQ";
const MODE_BLEND = "BLEND";

const TEMPLATE_STEPS = ["Template", "Duration", "Parameters", "Preview"];
const BOQ_STEPS = ["BOQ durations", "Preview"];
const BLEND_STEPS = ["Template", "Duration", "Parameters", "Match BOQ", "Preview"];

const FINISH_LEVELS = [
  { value: "BASIC", label: "Basic / shell" },
  { value: "STANDARD", label: "Standard" },
  { value: "PREMIUM", label: "Premium" },
  { value: "ULTRA_LUXURY", label: "Ultra luxury" },
];

const FAST_TRACK_PREMIUM = {
  range: "12–18%",
  drivers: "Additional manpower, expedited procurement, premium freight and out-of-hours rates.",
};

const SCOPE_OFF_BY_DEFAULT = new Set([
  "STRUCTURAL_MODIFICATION",
  "FACADE_CHANGE",
  "EXTERNAL_WORKS",
  "LANDSCAPE",
  "SWIMMING_POOL",
]);

function quantitiesFromBoq(boq) {
  const lines = Array.isArray(boq?.lines) ? boq.lines : [];
  if (!lines.length) return {};

  const sums = {};
  const add = (key, qty) => {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) return;
    sums[key] = (sums[key] || 0) + n;
  };

  for (const line of lines) {
    const qty = Number(line.quantity) || 0;
    if (qty <= 0) continue;
    const unit = String(line.unit || "").toLowerCase();
    const cat = String(line.categoryCode || "").toUpperCase();
    const desc = String(line.description || line.categoryName || "").toLowerCase();
    const room = String(line.roomLabel || "").toLowerCase();

    const isArea =
      unit.includes("m2") ||
      unit.includes("sqm") ||
      unit.includes("sq.m") ||
      unit.includes("sqft") ||
      unit.includes("sq ft") ||
      unit.includes("sft");
    if (isArea) add("AREA", qty);

    if (desc.includes("bath") || room.includes("bath") || cat.includes("BATH")) add("BATHROOMS", 1);
    if (desc.includes("bed") || room.includes("bed") || cat.includes("BED")) add("BEDROOMS", 1);
    if (desc.includes("kitchen") || room.includes("kitchen") || cat.includes("KIT")) add("KITCHENS", 1);
    if (unit.includes("nos") || unit.includes("no.") || unit === "no" || unit === "nr") {
      if (desc.includes("door")) add("DOORS", qty);
      else if (desc.includes("point") || desc.includes("socket") || desc.includes("outlet")) add("POINTS", qty);
    }
  }
  return sums;
}

function usableBoqLines(boq) {
  return (Array.isArray(boq?.lines) ? boq.lines : []).filter((l) =>
    String(l.description || "").trim()
  );
}

function lineId(line) {
  return line.id || line.uuid;
}

export default function ScheduleApplyWizard({ projectId, onApplied, onPreviewChange, onClose }) {
  const [mode, setMode] = useState(MODE_TEMPLATE);
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateDetail, setTemplateDetail] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [acks, setAcks] = useState({});
  const [applyPhase, setApplyPhase] = useState(null);
  const [applyResult, setApplyResult] = useState(null);

  const [approvedBoq, setApprovedBoq] = useState(null);
  const [boqLines, setBoqLines] = useState([]);
  const [defaultDuration, setDefaultDuration] = useState(1);
  const [lineDurations, setLineDurations] = useState({});
  const [matches, setMatches] = useState({});
  const [suggestions, setSuggestions] = useState([]);

  const previewChangeRef = useRef(onPreviewChange);
  previewChangeRef.current = onPreviewChange;

  const [params, setParams] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    areaSqft: "",
    roomCount: "",
    floorCount: "",
    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    finishLevel: "STANDARD",
    crewCount: "",
    occupiedBuilding: false,
    workCalendarUuid: "",
  });
  const [toggles, setToggles] = useState({});
  const [quantities, setQuantities] = useState({});

  const steps =
    mode === MODE_BOQ ? BOQ_STEPS : mode === MODE_BLEND ? BLEND_STEPS : TEMPLATE_STEPS;

  useEffect(() => {
    Promise.allSettled([fetchScheduleTemplates(), fetchWorkCalendars()])
      .then(([t, c]) => {
        setTemplates(t.status === "fulfilled" && Array.isArray(t.value) ? t.value : []);
        setCalendars(c.status === "fulfilled" && Array.isArray(c.value) ? c.value : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    fetchBoqsByProject(projectId)
      .then(async (list) => {
        const approved = (Array.isArray(list) ? list : [])
          .filter((b) => isBoqApproved(b.status))
          .sort((a, b) => {
            const aDate = new Date(a.approvedAt || a.updatedAt || a.createdAt || 0).getTime();
            const bDate = new Date(b.approvedAt || b.updatedAt || b.createdAt || 0).getTime();
            return bDate - aDate;
          })[0];
        if (!approved?.id && !approved?.uuid) {
          setApprovedBoq(null);
          setBoqLines([]);
          setQuantities({});
          return;
        }
        const detail = await fetchBoq(approved.id || approved.uuid).catch(() => approved);
        setApprovedBoq(detail);
        const lines = usableBoqLines(detail);
        setBoqLines(lines);
        setQuantities(quantitiesFromBoq(detail));
        const durMap = {};
        for (const line of lines) {
          durMap[lineId(line)] = 1;
        }
        setLineDurations(durMap);
      })
      .catch(() => {
        setApprovedBoq(null);
        setBoqLines([]);
        setQuantities({});
      });
  }, [projectId]);

  const changeMode = (next) => {
    setMode(next);
    setStep(0);
    setPreview(null);
    setError("");
    setMatches({});
    setSuggestions([]);
  };

  const applyDefaultDuration = () => {
    const d = Math.max(1, Number(defaultDuration) || 1);
    setDefaultDuration(d);
    setLineDurations((prev) => {
      const next = { ...prev };
      for (const line of boqLines) {
        next[lineId(line)] = d;
      }
      return next;
    });
  };

  const chooseTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateDetail(null);
    setPreview(null);
    setAcks({});
    setMatches({});
    setSuggestions([]);
    const base = template.baseParameters || {};
    setParams((p) => ({
      ...p,
      areaSqft: base.areaSqft ?? "",
      roomCount: base.roomCount ?? "",
      floorCount: base.floorCount ?? "",
      bedrooms: base.bedrooms ?? "",
      bathrooms: base.bathrooms ?? "",
      kitchens: base.kitchens ?? "",
      finishLevel: base.finishLevel || "STANDARD",
      crewCount: base.crewCount ?? "",
    }));
    setToggles(
      Object.fromEntries(
        (template.scopeToggleCodes || []).map((code) => [
          code,
          !SCOPE_OFF_BY_DEFAULT.has(code),
        ])
      )
    );
    fetchScheduleTemplate(template.uuid)
      .then(setTemplateDetail)
      .catch(() => setTemplateDetail(null));
  };

  const templateActivities = useMemo(() => {
    const list = templateDetail?.activities || selectedTemplate?.activities || [];
    return Array.isArray(list) ? list.filter((a) => !a.milestone) : [];
  }, [templateDetail, selectedTemplate]);

  const templatePayload = useMemo(
    () => ({
      templateUuid: selectedTemplate?.uuid,
      startDate: params.startDate || undefined,
      areaSqft: params.areaSqft === "" ? undefined : Number(params.areaSqft),
      roomCount: params.roomCount === "" ? undefined : Number(params.roomCount),
      floorCount: params.floorCount === "" ? undefined : Number(params.floorCount),
      bedrooms: params.bedrooms === "" ? undefined : Number(params.bedrooms),
      bathrooms: params.bathrooms === "" ? undefined : Number(params.bathrooms),
      kitchens: params.kitchens === "" ? undefined : Number(params.kitchens),
      finishLevel: params.finishLevel || undefined,
      crewCount: params.crewCount === "" ? undefined : Number(params.crewCount),
      occupiedBuilding: params.occupiedBuilding,
      workCalendarUuid: params.workCalendarUuid || undefined,
      scopeToggles: toggles,
      quantities: Object.keys(quantities).length ? quantities : undefined,
      fastTrackAcknowledgements: acks,
    }),
    [selectedTemplate, params, toggles, quantities, acks]
  );

  const boqProgrammePayload = useMemo(
    () => ({
      mode: MODE_BOQ,
      startDate: params.startDate || undefined,
      workCalendarUuid: params.workCalendarUuid || undefined,
      lineDurations: boqLines.map((line) => ({
        boqLineId: lineId(line),
        durationWorkingDays: Math.max(1, Number(lineDurations[lineId(line)]) || 1),
      })),
    }),
    [params.startDate, params.workCalendarUuid, boqLines, lineDurations]
  );

  const blendProgrammePayload = useMemo(() => {
    const matchList = [];
    const unmatchedDurations = [];
    for (const line of boqLines) {
      const id = lineId(line);
      const m = matches[id];
      if (m?.activityCode) {
        matchList.push({
          boqLineId: id,
          activityCode: m.activityCode,
          matchSource: m.matchSource || "USER_CHANGED",
        });
      } else {
        matchList.push({ boqLineId: id, activityCode: null });
        unmatchedDurations.push({
          boqLineId: id,
          durationWorkingDays: Math.max(1, Number(lineDurations[id]) || 1),
        });
      }
    }
    return {
      mode: MODE_BLEND,
      ...templatePayload,
      matches: matchList,
      unmatchedDurations,
    };
  }, [boqLines, matches, lineDurations, templatePayload]);

  const loadSuggestions = useCallback(async () => {
    if (!selectedTemplate?.uuid || !projectId) return;
    setBusy(true);
    setError("");
    try {
      const list = await suggestBoqMatches(projectId, selectedTemplate.uuid);
      setSuggestions(Array.isArray(list) ? list : []);
      setMatches((prev) => {
        const next = { ...prev };
        for (const s of list || []) {
          const id = s.boqLineId;
          if (next[id]?.manual) continue;
          if (s.suggestedActivityCode) {
            next[id] = {
              activityCode: s.suggestedActivityCode,
              matchSource: "AUTO_ACCEPTED",
              confidence: s.confidence,
            };
          } else {
            next[id] = { activityCode: null, matchSource: null, confidence: s.confidence };
          }
        }
        return next;
      });
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not suggest matches");
    } finally {
      setBusy(false);
    }
  }, [projectId, selectedTemplate]);

  const runPreview = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      let result;
      if (mode === MODE_TEMPLATE) {
        if (!selectedTemplate) return;
        result = await previewSchedule(projectId, templatePayload);
      } else if (mode === MODE_BOQ) {
        if (!boqLines.length) throw new Error("No approved BOQ lines to import");
        result = await previewProgramme(projectId, boqProgrammePayload);
      } else {
        if (!selectedTemplate) return;
        result = await previewProgramme(projectId, blendProgrammePayload);
      }
      setPreview(result);
      setStep(steps.length - 1);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not compute the programme");
    } finally {
      setBusy(false);
    }
  }, [
    mode,
    selectedTemplate,
    projectId,
    templatePayload,
    boqProgrammePayload,
    blendProgrammePayload,
    boqLines.length,
    steps.length,
  ]);

  const openApplyConfirm = () => {
    setError("");
    setApplyResult(null);
    setApplyPhase("confirm");
  };

  const cancelApplyDialog = () => {
    if (busy) return;
    setApplyPhase(null);
    setApplyResult(null);
  };

  const finalizeApply = async () => {
    setBusy(true);
    setError("");
    try {
      let result;
      if (mode === MODE_TEMPLATE) {
        result = await applySchedule(projectId, templatePayload);
      } else if (mode === MODE_BOQ) {
        result = await applyProgramme(projectId, boqProgrammePayload);
      } else {
        result = await applyProgramme(projectId, blendProgrammePayload);
      }
      if (!result?.activitiesWritten) {
        throw new Error("No activities were written. Check the programme and try again.");
      }
      setApplyResult(result);
      setApplyPhase("result");
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not apply the programme");
      setApplyPhase(null);
    } finally {
      setBusy(false);
    }
  };

  const dismissApplyResult = () => {
    const result = applyResult;
    setApplyPhase(null);
    setApplyResult(null);
    onApplied?.(result);
  };

  useEffect(() => {
    previewChangeRef.current?.(step === steps.length - 1 ? preview : null);
  }, [preview, step, steps.length]);

  useEffect(() => {
    if (step === steps.length - 1 && preview?.requiresFastTrackAcknowledgement) {
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
  const previewStep = steps.length - 1;
  const needsBoq = mode === MODE_BOQ || mode === MODE_BLEND;
  const boqReady = !!approvedBoq && boqLines.length > 0;

  const goNext = async () => {
    if (mode === MODE_BLEND && step === 2) {
      setStep(3);
      if (!suggestions.length) await loadSuggestions();
      return;
    }
    setStep(step + 1);
  };

  const setMatchForLine = (id, activityCode, fromSuggestion) => {
    setMatches((prev) => ({
      ...prev,
      [id]: {
        activityCode: activityCode || null,
        matchSource: activityCode
          ? fromSuggestion
            ? "AUTO_ACCEPTED"
            : "USER_CHANGED"
          : null,
        manual: true,
        confidence: prev[id]?.confidence,
      },
    }));
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm font-semibold">Build programme</CardTitle>
            <div className="flex items-center gap-1 text-xs">
              {steps.map((label, index) => (
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
                  {index < steps.length - 1 && <span className="text-muted-foreground">·</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { id: MODE_TEMPLATE, label: "Template only" },
              { id: MODE_BOQ, label: "BOQ only" },
              { id: MODE_BLEND, label: "Blend (template + BOQ)" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => changeMode(m.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                  mode === m.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/40"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {needsBoq && !boqReady && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This mode needs a final approved BOQ with line items. Approve a BOQ for this
                project first.
              </span>
            </div>
          )}

          {needsBoq && boqReady && (
            <p className="text-xs text-muted-foreground">
              Approved BOQ {approvedBoq.version || ""} · {boqLines.length} construction lines
            </p>
          )}

          {/* ---------- Mode 1 / Mode 3: template pick ---------- */}
          {(mode === MODE_TEMPLATE || mode === MODE_BLEND) && step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.uuid}
                  type="button"
                  onClick={() => chooseTemplate(t)}
                  className={`rounded-lg border p-4 text-left transition hover:border-foreground/40 ${
                    selectedTemplate?.uuid === t.uuid
                      ? "border-foreground bg-secondary/50"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
                    {t.fastTrack && (
                      <Badge className="bg-copper/15 text-copper-foreground">Fast track</Badge>
                    )}
                  </div>
                  <p className="mt-1 font-semibold">{t.name}</p>
                  <p className="mt-2 text-sm">
                    {t.computedWorkingDays ?? t.targetWorkingDays ?? "—"} working days ·{" "}
                    {t.activityCount} activities
                  </p>
                </button>
              ))}
              {!templates.length && (
                <p className="text-sm text-muted-foreground">No templates in the library yet.</p>
              )}
            </div>
          )}

          {(mode === MODE_TEMPLATE || mode === MODE_BLEND) && step === 1 && selectedTemplate && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Confirm the programme length before sizing it.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b border-border/40">
                      <th className="py-2 font-semibold">Option</th>
                      <th className="py-2 font-semibold">Working days</th>
                      <th className="py-2 font-semibold">Cost impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 font-medium">{selectedTemplate.name}</td>
                      <td className="py-2">{selectedTemplate.computedWorkingDays ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">
                        {selectedTemplate.fastTrack
                          ? `+${FAST_TRACK_PREMIUM.range} premium`
                          : "Baseline"}
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
                          +{FAST_TRACK_PREMIUM.range} premium
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(mode === MODE_TEMPLATE || mode === MODE_BLEND) && step === 2 && selectedTemplate && (
            <ParametersPanel
              params={params}
              setParams={setParams}
              calendars={calendars}
              toggles={toggles}
              setToggles={setToggles}
              quantities={quantities}
              selectedTemplate={selectedTemplate}
              mode={mode}
            />
          )}

          {/* ---------- Mode 2: BOQ duration table ---------- */}
          {mode === MODE_BOQ && step === 0 && boqReady && (
            <BoqDurationTable
              lines={boqLines}
              lineDurations={lineDurations}
              setLineDurations={setLineDurations}
              defaultDuration={defaultDuration}
              setDefaultDuration={setDefaultDuration}
              applyDefaultDuration={applyDefaultDuration}
              params={params}
              setParams={setParams}
              calendars={calendars}
            />
          )}

          {/* ---------- Mode 3: match step ---------- */}
          {mode === MODE_BLEND && step === 3 && boqReady && (
            <MatchBoqPanel
              lines={boqLines}
              matches={matches}
              suggestions={suggestions}
              templateActivities={templateActivities}
              lineDurations={lineDurations}
              setLineDurations={setLineDurations}
              setMatchForLine={setMatchForLine}
              reloadSuggestions={loadSuggestions}
              busy={busy}
            />
          )}

          {step === previewStep && preview && (
            <PreviewPanel preview={preview} acks={acks} setAcks={setAcks} />
          )}

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
              {step < previewStep - 1 && (
                <Button
                  size="sm"
                  disabled={
                    busy ||
                    ((mode === MODE_TEMPLATE || mode === MODE_BLEND) && !selectedTemplate) ||
                    (needsBoq && !boqReady)
                  }
                  onClick={goNext}
                >
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {step === previewStep - 1 && (
                <Button
                  size="sm"
                  disabled={
                    busy ||
                    (mode === MODE_TEMPLATE && !selectedTemplate) ||
                    (mode === MODE_BLEND && !selectedTemplate) ||
                    (needsBoq && !boqReady)
                  }
                  onClick={runPreview}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <PackageSearch className="h-4 w-4 mr-1" />
                  )}
                  Compute preview
                </Button>
              )}
              {step === previewStep && (
                <>
                  <Button size="sm" variant="outline" disabled={busy} onClick={runPreview}>
                    Recompute
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy || !preview?.canPublish}
                    onClick={openApplyConfirm}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    Apply and publish
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {applyPhase && (
        <ApplyCascadeOverlay
          phase={applyPhase}
          preview={preview}
          result={applyResult}
          busy={busy}
          onCancel={cancelApplyDialog}
          onFinalize={finalizeApply}
          onDone={dismissApplyResult}
        />
      )}
    </>
  );
}

function ParametersPanel({
  params,
  setParams,
  calendars,
  toggles,
  setToggles,
  quantities,
  selectedTemplate,
  mode,
}) {
  return (
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
          <Label className="text-xs">Finish level</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={params.finishLevel}
            onChange={(e) => setParams({ ...params, finishLevel: e.target.value })}
          >
            {FINISH_LEVELS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
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
              <option key={c.uuid} value={c.uuid}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
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
        </div>
      )}
      {mode === MODE_TEMPLATE && !!Object.keys(quantities).length && (
        <p className="text-[11px] text-muted-foreground">
          BOQ quantities will drive QUANTITY scaling (
          {Object.entries(quantities)
            .map(([k, v]) => `${k}: ${Math.round(v)}`)
            .join(", ")}
          ).
        </p>
      )}
      {selectedTemplate?.dataQualityNotes && (
        <p className="text-xs text-muted-foreground">{selectedTemplate.dataQualityNotes}</p>
      )}
    </div>
  );
}

function BoqDurationTable({
  lines,
  lineDurations,
  setLineDurations,
  defaultDuration,
  setDefaultDuration,
  applyDefaultDuration,
  params,
  setParams,
  calendars,
}) {
  return (
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
          <Label className="text-xs">Work calendar</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={params.workCalendarUuid}
            onChange={(e) => setParams({ ...params, workCalendarUuid: e.target.value })}
          >
            <option value="">Default (Saturday to Thursday)</option>
            {calendars.map((c) => (
              <option key={c.uuid} value={c.uuid}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs">Default duration (working days)</Label>
            <Input
              type="number"
              min={1}
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(e.target.value)}
            />
          </div>
          <Button size="sm" variant="outline" type="button" onClick={applyDefaultDuration}>
            Apply to all
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border/40 max-h-80">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Description</th>
              <th className="px-3 py-2 font-semibold">Category</th>
              <th className="px-3 py-2 font-semibold w-28">Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {lines.map((line) => {
              const id = lineId(line);
              return (
                <tr key={id}>
                  <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                    {line.sortOrder ?? "—"}
                  </td>
                  <td className="px-3 py-1.5">{line.description}</td>
                  <td className="px-3 py-1.5 text-xs text-muted-foreground">
                    {line.categoryCode || line.categoryName || "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      type="number"
                      min={1}
                      className="h-8"
                      value={lineDurations[id] ?? 1}
                      onChange={(e) =>
                        setLineDurations((prev) => ({
                          ...prev,
                          [id]: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchBoqPanel({
  lines,
  matches,
  suggestions,
  templateActivities,
  lineDurations,
  setLineDurations,
  setMatchForLine,
  reloadSuggestions,
  busy,
}) {
  const suggestionById = useMemo(() => {
    const map = {};
    for (const s of suggestions || []) map[s.boqLineId] = s;
    return map;
  }, [suggestions]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Accept, change, or mark no match. Unmatched lines need a duration and become their own
          Gantt bars.
        </p>
        <Button size="sm" variant="outline" onClick={reloadSuggestions} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Re-suggest"}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border/40 max-h-96">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-semibold">BOQ line</th>
              <th className="px-3 py-2 font-semibold">Suggested</th>
              <th className="px-3 py-2 font-semibold">Match to</th>
              <th className="px-3 py-2 font-semibold w-24">Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {lines.map((line) => {
              const id = lineId(line);
              const m = matches[id] || {};
              const sug = suggestionById[id];
              const unmatched = !m.activityCode;
              return (
                <tr key={id}>
                  <td className="px-3 py-2">
                    <p className="font-medium">{line.description}</p>
                    <p className="text-[11px] text-muted-foreground">
                      #{line.sortOrder} · {line.categoryCode || line.categoryName || "—"}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {sug?.suggestedActivityCode ? (
                      <>
                        <span className="font-mono">{sug.suggestedActivityCode}</span>
                        <br />
                        {sug.suggestedActivityName}
                        <br />
                        conf {(Number(sug.confidence) * 100).toFixed(0)}%
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="h-9 w-full min-w-[12rem] rounded-md border border-input bg-background px-2 text-xs"
                      value={m.activityCode || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const fromSug = val && val === sug?.suggestedActivityCode;
                        setMatchForLine(id, val || null, fromSug);
                      }}
                    >
                      <option value="">No match (own bar)</option>
                      {templateActivities.map((a) => (
                        <option key={a.activityCode || a.code} value={a.activityCode || a.code}>
                          {(a.activityCode || a.code) + " — " + a.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {unmatched ? (
                      <Input
                        type="number"
                        min={1}
                        className="h-8"
                        value={lineDurations[id] ?? 1}
                        onChange={(e) =>
                          setLineDurations((prev) => ({
                            ...prev,
                            [id]: Math.max(1, Number(e.target.value) || 1),
                          }))
                        }
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">attached</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PreviewPanel({ preview, acks, setAcks }) {
  const critical = (preview.activities || []).filter((a) => a.critical);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Finish date" value={preview.finishDate} />
        <Stat
          label="Working days"
          value={preview.workingDays}
          hint={`${preview.calendarDays} calendar days`}
        />
        <Stat
          label="Activities"
          value={preview.activityCount}
          hint={
            preview.excludedByToggleCount
              ? `${preview.excludedByToggleCount} excluded by scope`
              : undefined
          }
        />
        <Stat label="On the critical path" value={critical.length} />
      </div>

      {preview.targetVarianceNote && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{preview.targetVarianceNote}</span>
        </div>
      )}

      {(preview.blockers || []).map((b) => (
        <div
          key={b}
          className="flex items-start gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-900"
        >
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
                <Badge
                  className={
                    index === 0
                      ? "bg-amber-500/15 text-amber-800"
                      : "bg-secondary text-muted-foreground"
                  }
                >
                  {index === 0 ? "Critical" : `Path ${index + 1}`}
                </Badge>
                <span className="font-mono text-muted-foreground">{path.join(" → ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.canPublish && (
        <p className="flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          Preview looks good. Apply will <strong>replace</strong> the current programme with{" "}
          {preview.activityCount} activities.
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
