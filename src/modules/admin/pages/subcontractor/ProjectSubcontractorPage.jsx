import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft, Check, Loader2, Plus, X, FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  fetchScPackages,
  createScPackage,
  fetchProjectScClaims,
  fetchProjectScCertificates,
  fetchScTradePackages,
  fetchScPackageBoqLines,
  updateScPackage,
  approveScClaim,
  rejectScClaim,
  measureScClaim,
  certifyScClaim,
  markScClaimPaid,
  markScCertificatePayable,
} from "../../api/subcontractor.api";
import { ROUTES, projectPlanningBackPath } from "@/shared/constants/routes";
import ScTenderPanel from "./ScTenderPanel";
import ScInspectionReviewPanel from "./ScInspectionReviewPanel";
import ProjectLifecycleBanner from "../../components/projects/ProjectLifecycleBanner";
import { useProjectLifecycle } from "../../hooks/useProjectLifecycle";
import { FillDemoDataButton } from "@/components/shared/FillDemoDataButton";
import { DEMO } from "@/shared/demo/formDemoData";

function PackageScopeBuilder({ projectId, busy, onCreated, onMessage, existingPackage }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [lines, setLines] = useState([]);
  const [tradeCode, setTradeCode] = useState("");
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [materials, setMaterials] = useState([]);
  const [attendance, setAttendance] = useState([
    "TEMPORARY_POWER", "WATER", "SCAFFOLDING", "HOISTING_LIFTING",
    "STORAGE", "WELFARE", "CLEANING", "WASTE_REMOVAL",
  ].map((responsibilityType) => ({ responsibilityType, responsibleParty: "NOT_APPLICABLE", notes: "" })));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  const trade = templates.find((item) => item.code === tradeCode);

  const isSuggestedFor = (code, line) => {
    const tpl = templates.find((item) => item.code === code);
    if (!tpl) return false;
    const haystack = `${line.sectionCode || ""} ${line.description || ""}`.toLowerCase();
    const terms = `${tpl.matchKeywords || ""} ${tpl.typicalBoqSections || ""} ${tpl.name || ""}`
      .toLowerCase().split(/[,;|]/).map((x) => x.trim()).filter(Boolean);
    return terms.some((term) => term.length > 1 && haystack.includes(term));
  };

  const suggested = (line) => isSuggestedFor(tradeCode, line);

  const lineTaken = (line) => Boolean(
    line.packageUuid
    && (!existingPackage || String(line.packageUuid) !== String(existingPackage.uuid))
  );

  const load = async () => {
    setLoading(true);
    setLocalError("");
    try {
      const [catalogue, boqLines] = await Promise.all([
        fetchScTradePackages(),
        fetchScPackageBoqLines(projectId),
      ]);
      setTemplates(Array.isArray(catalogue) ? catalogue : []);
      setLines(Array.isArray(boqLines) ? boqLines : []);
      if (existingPackage) {
        setTradeCode(existingPackage.tradePackageCode || "");
        setName(existingPackage.name || "");
        setSelected((existingPackage.boqLines || []).map((line) => line.boqLineId));
        setMaterials(existingPackage.freeIssueMaterials || []);
        setAttendance(existingPackage.attendanceMatrix || []);
      }
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to load trade packages and approved BOQ";
      setLocalError(msg);
      onMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const chooseTrade = (code) => {
    setTradeCode(code);
    const next = lines
      .filter((line) => isSuggestedFor(code, line) && !lineTaken(line))
      .map((line) => line.boqLineId)
      .filter(Boolean);
    setSelected(next);
    const selectedTrade = templates.find((item) => item.code === code);
    setName(selectedTrade ? `${selectedTrade.code} package` : "");
  };

  const toggle = (id) => {
    if (!id) return;
    setSelected((items) => (
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id]
    ));
  };

  const create = async () => {
    if (!tradeCode || selected.length === 0 || !name.trim()) {
      setLocalError("Select a trade, package name, and at least one free BOQ line.");
      return;
    }
    const takenSelected = lines.filter((line) => selected.includes(line.boqLineId) && lineTaken(line));
    if (takenSelected.length > 0) {
      setLocalError(
        `These BOQ lines are already in another package: ${takenSelected.map((l) => l.packageName || "package").join(", ")}. Uncheck them and pick free lines.`
      );
      return;
    }
    setSaving(true);
    setLocalError("");
    try {
      const payload = {
        name: name.trim(),
        tradePackageCode: tradeCode,
        boqLineIds: selected,
        freeIssueMaterials: materials
          .filter((item) => item.itemDescription?.trim())
          .map((item) => ({
            itemDescription: item.itemDescription.trim(),
            suppliedBy: item.suppliedBy || "MAIN_CONTRACTOR",
            quantity: item.quantity === "" || item.quantity == null ? null : Number(item.quantity),
            unit: item.unit || undefined,
            notes: item.notes || undefined,
          })),
        attendanceMatrix: attendance,
      };
      if (existingPackage) {
        await updateScPackage(projectId, existingPackage.uuid, payload);
      } else {
        await createScPackage(projectId, payload);
      }
      onMessage(existingPackage ? "Package updated." : `Package created with ${selected.length} BOQ line${selected.length === 1 ? "" : "s"}.`);
      setOpen(false);
      setSelected([]);
      setMaterials([]);
      onCreated();
    } catch (e) {
      const msg = e?.response?.data?.error
        || e?.response?.data?.message
        || e?.response?.data?.detail
        || "Failed to create package";
      setLocalError(msg);
      onMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{existingPackage ? "Edit package scope and details" : "Create package from approved BOQ"}</CardTitle>
          {open && (
            <FillDemoDataButton
              onClick={() => {
                const ele = templates.find((t) => /ele|electrical/i.test(`${t.code} ${t.name}`));
                const pick = ele || templates[0];
                if (pick) chooseTrade(pick.code);
                setName(DEMO.packageCreate.name);
                setMaterials([DEMO.freeIssueMaterial]);
              }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Select one catalogue trade and deliberately confirm multiple BOQ lines. Suggested matches are preselected but never included silently.
        </p>
        <Button size="sm" onClick={() => { setOpen(true); load(); }} disabled={busy || loading}>
          {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
          {open ? "Reload approved BOQ" : (existingPackage ? "Edit package" : "Choose trade package")}
        </Button>
        {open && (
          <div className="space-y-4 rounded-xl border border-border/60 bg-card/50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Trade package template</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={tradeCode}
                  onChange={(e) => chooseTrade(e.target.value)}
                >
                  <option value="">Select trade…</option>
                  {templates.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Package name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Electrical package" />
              </div>
            </div>
            {trade && (
              <p className="text-xs text-muted-foreground">
                Defaults: retention {trade.typicalRetention || "—"} · payment {trade.typicalPaymentTerms || "—"} · licence {trade.specialLicenceRequired || "—"}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium">Approved BOQ scope ({selected.length} selected / {lines.length})</p>
              {trade && <span className="text-[11px] text-primary">{lines.filter(suggested).length} suggested for {trade.code}</span>}
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border/50 p-2">
              {lines.map((line) => {
                const taken = lineTaken(line);
                return (
                  <label
                    key={line.boqLineId}
                    className={`flex items-start gap-2 rounded-md px-2 py-2 text-xs ${
                      taken ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={taken}
                      checked={selected.includes(line.boqLineId)}
                      onChange={() => toggle(line.boqLineId)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-mono text-[10px]">{line.sectionCode || "—"}</span>{" "}
                      {line.description || "BOQ line"}
                      {suggested(line) && !taken && (
                        <span className="ml-2 text-[10px] text-primary">Suggested</span>
                      )}
                      {taken && (
                        <span className="ml-2 text-[10px] text-amber-800">
                          In {line.packageName || "another package"}
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground">{line.amount ?? "—"}</span>
                  </label>
                );
              })}
            </div>
            <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3 text-xs">
              <p className="font-semibold">Package review checklist</p>
              <p className={tradeCode ? "text-emerald-700" : "text-muted-foreground"}>{tradeCode ? "✓" : "○"} Trade selected</p>
              <p className={selected.length > 0 ? "text-emerald-700" : "text-muted-foreground"}>
                {selected.length > 0 ? "✓" : "○"} {selected.length} BOQ item{selected.length === 1 ? "" : "s"} selected
              </p>
              <p className={name.trim() ? "text-emerald-700" : "text-muted-foreground"}>{name.trim() ? "✓" : "○"} Package title</p>
              <p className="text-amber-800">⚠ Drawing revision / specs — configure on package detail after create if needed</p>
              <p className="text-muted-foreground">○ Free-issue / attendance optional before create</p>
            </div>
            {localError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {localError}
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" disabled={busy || saving || !tradeCode || !name.trim() || selected.length === 0} onClick={create}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                Create package
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
            <div className="space-y-2 border-t border-border/50 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Free-issue materials</p>
                <Button size="sm" variant="outline" onClick={() => setMaterials((items) => [...items, {
                  itemDescription: "", suppliedBy: "MAIN_CONTRACTOR", quantity: "", unit: "", notes: "",
                }])}>Add material</Button>
              </div>
              {materials.map((item, index) => (
                <div key={`material-${index}`} className="grid gap-2 rounded-md border p-2 sm:grid-cols-5">
                  <Input placeholder="Item / description" value={item.itemDescription}
                    onChange={(e) => setMaterials((items) => items.map((x, i) => i === index ? { ...x, itemDescription: e.target.value } : x))} />
                  <select className="h-9 rounded-md border bg-background px-2 text-xs" value={item.suppliedBy}
                    onChange={(e) => setMaterials((items) => items.map((x, i) => i === index ? { ...x, suppliedBy: e.target.value } : x))}>
                    {["MAIN_CONTRACTOR", "SUBCONTRACTOR", "CLIENT", "OTHER"].map((value) => <option key={value}>{value}</option>)}
                  </select>
                  <Input type="number" placeholder="Quantity" value={item.quantity}
                    onChange={(e) => setMaterials((items) => items.map((x, i) => i === index ? { ...x, quantity: e.target.value } : x))} />
                  <Input placeholder="Unit" value={item.unit}
                    onChange={(e) => setMaterials((items) => items.map((x, i) => i === index ? { ...x, unit: e.target.value } : x))} />
                  <Input placeholder="Notes" value={item.notes}
                    onChange={(e) => setMaterials((items) => items.map((x, i) => i === index ? { ...x, notes: e.target.value } : x))} />
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-border/50 pt-3">
              <p className="text-xs font-semibold">Attendance matrix</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {attendance.map((item, index) => (
                  <div key={item.responsibilityType} className="grid grid-cols-[1fr_1fr] gap-2 rounded-md border p-2">
                    <span className="text-xs self-center">{item.responsibilityType.replaceAll("_", " ")}</span>
                    <select className="h-8 rounded-md border bg-background px-2 text-xs" value={item.responsibleParty}
                      onChange={(e) => setAttendance((items) => items.map((x, i) => i === index ? { ...x, responsibleParty: e.target.value } : x))}>
                      {["MAIN_CONTRACTOR", "SUBCONTRACTOR", "CLIENT", "SHARED", "NOT_APPLICABLE"].map((value) => <option key={value}>{value}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProjectSubcontractorPage() {
  const { projectId } = useParams();
  const { commercialStage, archived } = useProjectLifecycle(projectId);
  const location = useLocation();
  const backPath = projectPlanningBackPath(location, projectId);
  const backLabel = location.state?.from === "detail" ? "Project" : "Schedule";

  const [packages, setPackages] = useState([]);
  const [claims, setClaims] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [rejectReasons, setRejectReasons] = useState({});
  const [measureForms, setMeasureForms] = useState({});
  const [paidRefs, setPaidRefs] = useState({});
  const [editingPackage, setEditingPackage] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([
      fetchScPackages(projectId).catch(() => []),
      fetchProjectScClaims(projectId).catch(() => []),
      fetchProjectScCertificates(projectId).catch(() => []),
    ])
      .then(([pkgs, cls, certs]) => {
        setPackages(Array.isArray(pkgs) ? pkgs : []);
        setClaims(Array.isArray(cls) ? cls : []);
        setCertificates(Array.isArray(certs) ? certs : []);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMsg) => {
    if (archived) {
      setMessage("This project is archived and read-only.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await load();
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell className="max-w-5xl mx-auto flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title={`Back to ${backLabel}`}>
          <Link to={backPath}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <span className="text-sm text-muted-foreground hidden sm:inline">Back to {backLabel}</span>
        <PageTitle
          title="Subcontractors"
          subtitle={`Project #${projectId}`}
          className="flex-1"
          actions={
            <Button asChild size="sm" variant="outline">
              <Link to={ROUTES.ADMIN.PROJECT_DRAWINGS.replace(":projectId", projectId)}>
                <FileImage className="w-4 h-4 mr-1" /> Drawings
              </Link>
            </Button>
          }
        />
      </div>

      <ProjectLifecycleBanner commercialStage={commercialStage} />

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {!archived && (
        <PackageScopeBuilder
          projectId={projectId}
          busy={busy}
          onCreated={load}
          onMessage={setMessage}
          existingPackage={editingPackage}
        />
      )}

      {!archived && (
      <ScTenderPanel
        projectId={projectId}
        packages={packages}
        busy={busy}
        onMessage={setMessage}
        onRefresh={load}
      />
      )}

      <ScInspectionReviewPanel projectId={projectId} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">All packages ({packages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No packages yet</p>
          ) : (
            <div className="divide-y divide-border/40">
              {packages.map((p) => (
                <div key={p.uuid} className="flex flex-wrap items-center gap-2 py-3">
                  <p className="text-sm font-medium">{p.name}</p>
                  <Badge variant="secondary">{p.status || "DRAFT"}</Badge>
                  {p.boqSectionCode && (
                    <span className="text-xs text-muted-foreground font-mono">{p.boqSectionCode}</span>
                  )}
                  {p.appointedCompanyName ? (
                    <span className="text-xs text-emerald-700">· {p.appointedCompanyName}</span>
                  ) : (
                    <span className="text-xs text-amber-700">· Unassigned</span>
                  )}
                  {p.tenderStatus == null && (
                    <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={() => setEditingPackage(p)}>
                      Edit package
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Claims ({claims.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No claims yet</p>
          ) : (
            <div className="divide-y divide-border/40">
              {claims.map((c) => {
                const pkg = packages.find((p) => p.uuid === c.packageUuid);
                const planned = Number(c.plannedQty ?? 0);
                const claimed = Number(c.claimedQty ?? 0);
                const linkedCert =
                  certificates.find((cert) => String(cert.uuid) === String(c.certificateUuid))
                  || certificates.find((cert) => String(cert.claimUuid) === String(c.uuid));
                const certStatus = String(linkedCert?.status || "").toUpperCase();
                const canReview = c.status === "SUBMITTED" || c.status === "PENDING" || c.status === "UNDER_REVIEW" || c.status === "APPROVED";
                const canMeasure = c.status === "SUBMITTED" || c.status === "APPROVED" || c.status === "UNDER_REVIEW";
                return (
                  <div key={c.uuid} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{pkg?.name || String(c.packageUuid || "").slice(0, 8)}</p>
                        <Badge variant="secondary">{c.status || "DRAFT"}</Badge>
                        {c.claimNumber && (
                          <span className="font-mono text-[10px] text-muted-foreground">{c.claimNumber}</span>
                        )}
                        {String(c.paymentStatus || "").toUpperCase() === "PAID" && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-none text-[10px]">Cert paid</Badge>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 max-w-md sm:grid-cols-4">
                        <div className="rounded-lg bg-secondary/60 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Planned</p>
                          <p className="text-sm font-semibold tabular-nums">{planned}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/60 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Claimed</p>
                          <p className="text-sm font-semibold tabular-nums">{claimed}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/60 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Measured</p>
                          <p className="text-sm font-semibold tabular-nums">{c.measuredQty ?? "—"}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/60 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Certified</p>
                          <p className="text-sm font-semibold tabular-nums">
                            {c.certifiedValue != null ? Number(c.certifiedValue).toLocaleString() : "—"}
                          </p>
                        </div>
                      </div>
                      {(c.certificateUuid || linkedCert) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Certificate{" "}
                          <span className="font-mono">
                            {linkedCert?.certificateNumber || String(c.certificateUuid || linkedCert?.uuid).slice(0, 8)}
                          </span>
                          {certStatus ? ` · ${certStatus}` : ""}
                        </p>
                      )}
                      {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                    </div>
                    {canReview && (
                      <div className="flex flex-col gap-2 sm:items-end">
                        <Input
                          className="h-8 w-full sm:w-40 text-xs"
                          placeholder="Reject reason"
                          value={rejectReasons[c.uuid] || ""}
                          onChange={(e) =>
                            setRejectReasons((m) => ({ ...m, [c.uuid]: e.target.value }))
                          }
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => run(() => approveScClaim(projectId, c.uuid), "Claim approved")}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              run(
                                () => rejectScClaim(projectId, c.uuid, rejectReasons[c.uuid]),
                                "Claim rejected"
                              )
                            }
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}
                    {canMeasure && (
                      <div className="flex flex-col gap-2 sm:items-end">
                        <Input
                          className="h-8 w-full sm:w-32 text-xs"
                          type="number"
                          placeholder="Measured qty"
                          value={measureForms[c.uuid]?.qty ?? ""}
                          onChange={(e) =>
                            setMeasureForms((m) => ({
                              ...m,
                              [c.uuid]: { ...m[c.uuid], qty: e.target.value },
                            }))
                          }
                        />
                        <Input
                          className="h-8 w-full sm:w-32 text-xs"
                          type="number"
                          placeholder="Measured value"
                          value={measureForms[c.uuid]?.value ?? ""}
                          onChange={(e) =>
                            setMeasureForms((m) => ({
                              ...m,
                              [c.uuid]: { ...m[c.uuid], value: e.target.value },
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            run(
                              () =>
                                measureScClaim(projectId, c.uuid, {
                                  measuredQty: Number(measureForms[c.uuid]?.qty) || Number(c.claimedQty),
                                  measuredValue: measureForms[c.uuid]?.value !== "" && measureForms[c.uuid]?.value != null
                                    ? Number(measureForms[c.uuid]?.value)
                                    : null,
                                }),
                              "Claim measured"
                            )
                          }
                        >
                          Measure
                        </Button>
                      </div>
                    )}
                    {c.status === "MEASURED" && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => run(() => certifyScClaim(projectId, c.uuid), "Claim certified")}
                      >
                        Certify
                      </Button>
                    )}
                    {c.status === "CERTIFIED" && linkedCert && certStatus === "ISSUED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () => markScCertificatePayable(projectId, linkedCert.uuid),
                            "Certificate marked payable"
                          )
                        }
                      >
                        Mark payable
                      </Button>
                    )}
                    {c.status === "CERTIFIED" && linkedCert && certStatus === "PAYABLE" && (
                      <div className="flex flex-col gap-2 sm:items-end">
                        <Input
                          className="h-8 w-full sm:w-40 text-xs"
                          placeholder="Accounting ref"
                          value={paidRefs[c.uuid] || ""}
                          onChange={(e) =>
                            setPaidRefs((m) => ({ ...m, [c.uuid]: e.target.value }))
                          }
                        />
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            run(
                              () => markScClaimPaid(projectId, c.uuid, paidRefs[c.uuid]),
                              "Certificate marked paid"
                            )
                          }
                        >
                          Mark paid
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
