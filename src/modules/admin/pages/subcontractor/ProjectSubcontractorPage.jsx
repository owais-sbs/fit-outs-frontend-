import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw, X, FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchBoqsByProject } from "../../api/boq.api";
import {
  fetchAllSubcontractors,
  fetchScPackages,
  createScPackage,
  appointScPackage,
  generateScPackagesFromBoq,
  fetchProjectScClaims,
  fetchScAppointmentEligibility,
  approveScClaim,
  rejectScClaim,
  measureScClaim,
  certifyScClaim,
  markScClaimPaid,
} from "../../api/subcontractor.api";
import { ROUTES, projectPlanningBackPath } from "@/shared/constants/routes";
import ScTenderPanel from "./ScTenderPanel";
import ScInspectionReviewPanel from "./ScInspectionReviewPanel";

import {
  findApprovedBoq,
  findPackageForBoqLine,
  formatBoqLineMeta,
  formatBoqLineOptionLabel,
  isLineAssigned,
  sortBoqLines,
  truncate,
} from "./subcontractorBoq.utils";

const APPOINT_MODE = { EXISTING: "existing", NEW: "new" };

const emptyAppointForm = () => ({
  mode: APPOINT_MODE.EXISTING,
  accountId: "",
  companyName: "",
  fullName: "",
  email: "",
  phone: "",
});

function AppointPanel({
  uuid,
  af,
  subcontractors,
  busy,
  onFieldChange,
  onAppoint,
  canAppoint,
  eligibility,
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={af.mode === APPOINT_MODE.EXISTING ? "default" : "outline"}
          onClick={() => onFieldChange({ mode: APPOINT_MODE.EXISTING })}
        >
          Existing subcontractor
        </Button>
        <Button
          type="button"
          size="sm"
          variant={af.mode === APPOINT_MODE.NEW ? "default" : "outline"}
          onClick={() => onFieldChange({ mode: APPOINT_MODE.NEW })}
        >
          Create new
        </Button>
      </div>

      {af.mode === APPOINT_MODE.EXISTING ? (
        <div className="space-y-1">
          <Label className="text-xs">Assign subcontractor</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={af.accountId}
            onChange={(e) => {
              const id = e.target.value;
              const selected = subcontractors.find((s) => String(s.id) === id);
              onFieldChange({
                accountId: id,
                companyName: selected?.companyName || selected?.fullName || "",
              });
            }}
          >
            <option value="">Select subcontractor…</option>
            {subcontractors.map((s) => (
              <option key={s.id} value={s.id}>
                {(s.companyName || s.fullName || s.email) + (s.email ? ` (${s.email})` : "")}
              </option>
            ))}
          </select>
          {subcontractors.length === 0 && (
            <p className="text-[11px] text-muted-foreground">No subcontractors yet — use Create new.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Full name</Label>
            <Input
              value={af.fullName}
              onChange={(e) => onFieldChange({ fullName: e.target.value })}
              placeholder="Jane Contractor"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Company name</Label>
            <Input
              value={af.companyName}
              onChange={(e) => onFieldChange({ companyName: e.target.value })}
              placeholder="ABC Contractors"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={af.email}
              onChange={(e) => onFieldChange({ email: e.target.value })}
              placeholder="sc@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phone (optional)</Label>
            <Input
              value={af.phone}
              onChange={(e) => onFieldChange({ phone: e.target.value })}
              placeholder="+971…"
            />
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        They will receive an email to set a password and sign in to the subcontractor portal.
      </p>
      {eligibility && !eligibility.eligible && eligibility.blockingReasons?.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive space-y-1">
          <p className="font-medium">Cannot appoint — compliance gate</p>
          {eligibility.blockingReasons.map((r) => (
            <p key={r}>{r}</p>
          ))}
        </div>
      )}
      <Button
        size="sm"
        disabled={busy || !canAppoint || (eligibility && !eligibility.eligible)}
        onClick={onAppoint}
      >
        Appoint & send invite
      </Button>
    </div>
  );
}

export default function ProjectSubcontractorPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const backPath = projectPlanningBackPath(location, projectId);
  const backLabel = location.state?.from === "detail" ? "Project" : "Schedule";

  const [packages, setPackages] = useState([]);
  const [claims, setClaims] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pkgForm, setPkgForm] = useState({ name: "", boqSectionCode: "" });
  const [appointForms, setAppointForms] = useState({});
  const [rejectReasons, setRejectReasons] = useState({});
  const [measureForms, setMeasureForms] = useState({});
  const [paidRefs, setPaidRefs] = useState({});

  const [boqWizardOpen, setBoqWizardOpen] = useState(false);
  const [boqLines, setBoqLines] = useState([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [boqWizardLoading, setBoqWizardLoading] = useState(false);
  const [eligibilityMap, setEligibilityMap] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([
      fetchScPackages(projectId).catch(() => []),
      fetchProjectScClaims(projectId).catch(() => []),
      fetchAllSubcontractors().catch(() => []),
    ])
      .then(([pkgs, cls, scs]) => {
        setPackages(Array.isArray(pkgs) ? pkgs : []);
        setClaims(Array.isArray(cls) ? cls : []);
        setSubcontractors(Array.isArray(scs) ? scs : []);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMsg) => {
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

  const currentLine = boqLines[lineIndex] || null;

  const packageForLine = useMemo(
    () => findPackageForBoqLine(packages, currentLine),
    [packages, currentLine]
  );

  const handleCreate = () =>
    run(async () => {
      await createScPackage(projectId, {
        name: pkgForm.name.trim(),
        boqSectionCode: pkgForm.boqSectionCode.trim() || null,
      });
      setPkgForm({ name: "", boqSectionCode: "" });
    }, "Package created");

  const openBoqWizard = async () => {
    setBoqWizardLoading(true);
    setMessage("");
    try {
      const boqs = await fetchBoqsByProject(projectId);
      const approved = findApprovedBoq(boqs);
      if (!approved?.lines?.length) {
        setMessage("No approved BOQ with line items found for this project.");
        return;
      }
      const lines = sortBoqLines(approved.lines);
      if (lines.length === 0) {
        setMessage("BOQ has no items to assign.");
        return;
      }
      await generateScPackagesFromBoq(projectId);
      await load();
      setBoqLines(lines);
      setLineIndex(0);
      setBoqWizardOpen(true);
      setMessage(`Loaded ${lines.length} BOQ line item${lines.length !== 1 ? "s" : ""} — assign each one individually.`);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to load BOQ items");
    } finally {
      setBoqWizardLoading(false);
    }
  };

  const setAppointField = (uuid, patch) => {
    setAppointForms((m) => {
      const current = m[uuid] || emptyAppointForm();
      return { ...m, [uuid]: { ...current, ...patch } };
    });
  };

  useEffect(() => {
    const checks = Object.entries(appointForms).filter(([, f]) => f.mode === APPOINT_MODE.EXISTING && f.accountId);
    if (!checks.length) return;
    checks.forEach(([packageUuid, f]) => {
      fetchScAppointmentEligibility(Number(f.accountId), packageUuid)
        .then((result) => setEligibilityMap((m) => ({ ...m, [packageUuid]: result })))
        .catch(() => setEligibilityMap((m) => ({ ...m, [packageUuid]: { eligible: false, blockingReasons: ["Could not verify eligibility"] } })));
    });
  }, [appointForms]);

  const canAppoint = (f) => {
    if (!f) return false;
    if (f.mode === APPOINT_MODE.EXISTING) return Boolean(f.accountId);
    return Boolean(f.email?.trim() && f.fullName?.trim() && f.companyName?.trim());
  };

  const handleAppoint = (uuid) => {
    const f = appointForms[uuid] || emptyAppointForm();
    return run(async () => {
      if (f.mode === APPOINT_MODE.EXISTING) {
        const selected = subcontractors.find((s) => String(s.id) === String(f.accountId));
        await appointScPackage(projectId, uuid, {
          accountId: Number(f.accountId),
          companyName:
            (f.companyName || "").trim() ||
            selected?.companyName ||
            selected?.fullName ||
            null,
        });
      } else {
        await appointScPackage(projectId, uuid, {
          fullName: f.fullName.trim(),
          email: f.email.trim(),
          phone: f.phone?.trim() || null,
          companyName: f.companyName.trim(),
        });
      }
      setAppointForms((m) => {
        const next = { ...m };
        delete next[uuid];
        return next;
      });
    }, "Subcontractor appointed — portal invite emailed");
  };

  const goPrevLine = () => setLineIndex((i) => Math.max(0, i - 1));
  const goNextLine = () => setLineIndex((i) => Math.min(boqLines.length - 1, i + 1));

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

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Assign from BOQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Each BOQ line is its own package. Pick one line, assign a subcontractor, then use Next for the next line.
            Previously assigned lines show who they are assigned to.
          </p>
          <Button
            size="sm"
            onClick={openBoqWizard}
            disabled={busy || boqWizardLoading}
          >
            {boqWizardLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            {boqWizardOpen ? "Reload BOQ items" : "Generate from BOQ & assign"}
          </Button>

          {boqWizardOpen && boqLines.length > 0 && (
            <div className="space-y-4 rounded-xl border border-border/60 bg-card/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Select BOQ line item</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={lineIndex}
                    onChange={(e) => setLineIndex(Number(e.target.value))}
                  >
                    {boqLines.map((line, idx) => {
                      const pkg = findPackageForBoqLine(packages, line);
                      return (
                        <option key={line.id || idx} value={idx}>
                          {formatBoqLineOptionLabel(line, pkg)}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={lineIndex <= 0}
                    onClick={goPrevLine}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {lineIndex + 1} of {boqLines.length}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={lineIndex >= boqLines.length - 1}
                    onClick={goNextLine}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              {currentLine && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border/50 bg-background px-4 py-3">
                    <p className="text-sm font-semibold leading-snug">
                      {currentLine.description || "BOQ line item"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatBoqLineMeta(currentLine)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(currentLine.categoryCode || currentLine.categoryName) && (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {currentLine.categoryCode || currentLine.categoryName}
                        </Badge>
                      )}
                      {packageForLine?.status && (
                        <Badge variant="outline">{packageForLine.status}</Badge>
                      )}
                    </div>
                  </div>

                  {!packageForLine ? (
                    <p className="text-sm text-destructive">
                      Package not found for this BOQ line — click Reload BOQ items.
                    </p>
                  ) : isLineAssigned(packageForLine) ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-3 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        Already assigned to{" "}
                        <strong>{packageForLine.appointedCompanyName || `account #${packageForLine.appointedAccountId}`}</strong>
                      </span>
                    </div>
                  ) : (
                    <AppointPanel
                      uuid={packageForLine.uuid}
                      af={appointForms[packageForLine.uuid] || emptyAppointForm()}
                      subcontractors={subcontractors}
                      busy={busy}
                      onFieldChange={(patch) => setAppointField(packageForLine.uuid, patch)}
                      onAppoint={() => handleAppoint(packageForLine.uuid)}
                      canAppoint={canAppoint(appointForms[packageForLine.uuid])}
                      eligibility={eligibilityMap[packageForLine.uuid]}
                    />
                  )}

                  <div className="rounded-lg border border-border/40 divide-y divide-border/30 max-h-48 overflow-y-auto">
                    {boqLines.map((line, idx) => {
                      const pkg = findPackageForBoqLine(packages, line);
                      const active = idx === lineIndex;
                      const assigned = isLineAssigned(pkg);
                      return (
                        <button
                          key={line.id || idx}
                          type="button"
                          onClick={() => setLineIndex(idx)}
                          className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                            active ? "bg-primary/10" : "hover:bg-muted/40"
                          }`}
                        >
                          <p className="font-medium text-foreground">{truncate(line.description, 100)}</p>
                          <p className="text-muted-foreground">
                            {assigned
                              ? `Assigned to ${pkg.appointedCompanyName || `account #${pkg.appointedAccountId}`}`
                              : "Unassigned"}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {lineIndex < boqLines.length - 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-muted-foreground"
                      onClick={goNextLine}
                    >
                      Next BOQ item <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ScTenderPanel
        projectId={projectId}
        packages={packages}
        busy={busy}
        onMessage={setMessage}
        onRefresh={load}
      />

      <ScInspectionReviewPanel projectId={projectId} />

      <Card>

        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">New package (manual)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={pkgForm.name}
                onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="MEP package"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">BOQ section code</Label>
              <Input
                value={pkgForm.boqSectionCode}
                onChange={(e) => setPkgForm((f) => ({ ...f, boqSectionCode: e.target.value }))}
                placeholder="A.1"
              />
            </div>
          </div>
          <Button size="sm" onClick={handleCreate} disabled={busy || !pkgForm.name.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Create package
          </Button>
        </CardContent>
      </Card>

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
                return (
                  <div key={c.uuid} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{pkg?.name || String(c.packageUuid || "").slice(0, 8)}</p>
                        <Badge variant="secondary">{c.status || "DRAFT"}</Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 max-w-xs">
                        <div className="rounded-lg bg-secondary/60 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Planned</p>
                          <p className="text-sm font-semibold tabular-nums">{planned}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/60 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Claimed</p>
                          <p className="text-sm font-semibold tabular-nums">{claimed}</p>
                        </div>
                      </div>
                      {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                    </div>
                    {(c.status === "SUBMITTED" || c.status === "PENDING" || c.status === "APPROVED") && (
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
                    {(c.status === "SUBMITTED" || c.status === "APPROVED") && (
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
                                  measuredValue: measureForms[c.uuid]?.value !== ""
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
                    {c.status === "CERTIFIED" && (
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
                              "Claim marked paid"
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
