import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, Send } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  fetchMyScPackages,
  fetchMyScAwardPack,
  fetchPackageClaims,
  fetchScClaimTracker,
  createScClaim,
  submitScClaim,
  uploadScClaimAttachment,
} from "@/modules/admin/api/subcontractor.api";
import { FillDemoDataButton } from "@/components/shared/FillDemoDataButton";
import { DEMO } from "@/shared/demo/formDemoData";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";
import { AttachmentList, AttachmentUploadField } from "@/components/shared/AttachmentField";

/** Primary claim pipeline (payment is on the certificate, not the claim). */
const PIPELINE_STEPS = ["SUBMITTED", "UNDER_REVIEW", "MEASURED", "CERTIFIED"];

function pipelineIndex(status) {
  const s = String(status || "").toUpperCase();
  if (s === "SUBMITTED") return 0;
  if (s === "UNDER_REVIEW" || s === "APPROVED") return 1;
  if (s === "MEASURED") return 2;
  if (s === "CERTIFIED" || s === "PAID") return 3;
  return -1;
}

function ClaimPipeline({ status }) {
  const active = pipelineIndex(status);
  if (active < 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {PIPELINE_STEPS.map((step, idx) => (
        <div key={step} className="flex items-center gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              idx <= active
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </span>
          {idx < PIPELINE_STEPS.length - 1 && (
            <span className="text-muted-foreground text-[10px]">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function priorClaimedForLine(awardLineUuid, claims) {
  const active = new Set(["SUBMITTED", "UNDER_REVIEW", "APPROVED", "MEASURED", "CERTIFIED"]);
  let sum = 0;
  for (const c of claims || []) {
    const st = String(c.status || "").toUpperCase();
    if (!active.has(st)) continue;
    for (const line of c.lines || []) {
      if (String(line.awardBoqLineUuid) === String(awardLineUuid)) {
        sum += Number(line.claimedQty || 0);
      }
    }
  }
  return sum;
}

function demoQtyForLine(line, claims) {
  const contract = Number(line.quantity ?? 0);
  if (!(contract > 0)) return "";
  const prior = priorClaimedForLine(line.uuid, claims);
  const remaining = Math.max(0, contract - prior);
  if (remaining <= 0) return "";
  // 25% of contract, never more than remaining (works for lump-sum qty=1 → 0.25)
  const demo = Math.min(remaining, Math.max(contract * 0.25, 0.0001));
  return String(Number(demo.toFixed(4)));
}

const emptyForm = () => ({
  notes: "",
  claimPeriodFrom: "",
  claimPeriodTo: "",
  claimedQty: "",
  lineQtys: {},
});

export default function SubcontractorClaimsPage() {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [claims, setClaims] = useState([]);
  const [tracker, setTracker] = useState([]);
  const [awardLines, setAwardLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadingClaimId, setUploadingClaimId] = useState(null);

  const selectedPkg = useMemo(
    () => packages.find((p) => String(p.uuid) === String(selectedPackage)),
    [packages, selectedPackage]
  );

  const hasAwardBoq = awardLines.length > 0;

  const loadPackages = useCallback(() => {
    setLoading(true);
    fetchMyScPackages()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setPackages(arr);
        setSelectedPackage((prev) => prev || arr[0]?.uuid || "");
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  const loadClaims = useCallback(() => {
    if (!selectedPackage) {
      setClaims([]);
      return;
    }
    fetchPackageClaims(selectedPackage)
      .then((list) => setClaims(Array.isArray(list) ? list : []))
      .catch(() => setClaims([]));
  }, [selectedPackage]);

  const loadTracker = useCallback(() => {
    fetchScClaimTracker()
      .then((list) => setTracker(Array.isArray(list) ? list : []))
      .catch(() => setTracker([]));
  }, []);

  const loadAwardPack = useCallback(() => {
    if (!selectedPackage) {
      setAwardLines([]);
      return;
    }
    fetchMyScAwardPack(selectedPackage)
      .then((pack) => {
        const lines = Array.isArray(pack?.awardedBoqLines) ? pack.awardedBoqLines : [];
        setAwardLines(lines);
        setForm((f) => {
          const lineQtys = { ...f.lineQtys };
          lines.forEach((line) => {
            if (lineQtys[line.uuid] == null) lineQtys[line.uuid] = "";
          });
          return { ...f, lineQtys };
        });
      })
      .catch(() => setAwardLines([]));
  }, [selectedPackage]);

  useEffect(() => { loadPackages(); }, [loadPackages]);
  useEffect(() => { loadClaims(); }, [loadClaims]);
  useEffect(() => { loadTracker(); }, [loadTracker]);
  useEffect(() => { loadAwardPack(); }, [loadAwardPack]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await loadPackages();
      await loadClaims();
      await loadTracker();
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const uploadToClaim = async (claimUuid, files, okMsg) => {
    if (!files?.length) return;
    setUploadingClaimId(claimUuid);
    setMessage("");
    try {
      for (const file of files) {
        await uploadScClaimAttachment(claimUuid, file);
      }
      await loadClaims();
      if (okMsg) setMessage(okMsg);
    } catch (err) {
      setMessage(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Upload failed");
      throw err;
    } finally {
      setUploadingClaimId(null);
    }
  };

  const buildPayload = () => {
    const payload = {
      notes: form.notes.trim() || null,
      claimPeriodFrom: form.claimPeriodFrom || null,
      claimPeriodTo: form.claimPeriodTo || null,
    };
    if (hasAwardBoq) {
      payload.lines = awardLines
        .map((line) => ({
          awardBoqLineUuid: line.uuid,
          claimedQty: Number(form.lineQtys[line.uuid]) || 0,
        }))
        .filter((l) => l.claimedQty > 0);
    } else {
      payload.claimedQty = Number(form.claimedQty) || 0;
    }
    return payload;
  };

  const resetForm = () => {
    setForm(emptyForm());
    setPendingFiles([]);
  };

  const handleCreate = (andSubmit = false) =>
    run(async () => {
      const payload = buildPayload();
      if (hasAwardBoq && (!payload.lines || payload.lines.length === 0)) {
        throw new Error("Enter claimed quantity on at least one BOQ line");
      }
      if (!hasAwardBoq && !payload.claimedQty) {
        throw new Error("Claimed quantity is required");
      }
      if (hasAwardBoq) {
        for (const row of payload.lines) {
          const line = awardLines.find((l) => String(l.uuid) === String(row.awardBoqLineUuid));
          if (!line) continue;
          const contract = Number(line.quantity ?? 0);
          if (!(contract > 0)) continue;
          const prior = priorClaimedForLine(line.uuid, claims);
          const remaining = Math.max(0, contract - prior);
          if (row.claimedQty > remaining + 1e-9) {
            const label = line.sectionCode || line.description || "line";
            throw new Error(
              `${label}: this claim qty (${row.claimedQty}) exceeds remaining ${remaining} of ${contract} ${line.unit || ""}`.trim()
            );
          }
        }
      }
      const created = await createScClaim(selectedPackage, payload);
      if (!created?.uuid) {
        throw new Error("Claim was created but no id was returned — attachments were not uploaded");
      }
      if (pendingFiles.length > 0) {
        await uploadToClaim(created.uuid, pendingFiles);
      }
      if (andSubmit) {
        await submitScClaim(created.uuid);
      }
      resetForm();
      await loadAwardPack();
    }, andSubmit
      ? "Claim submitted for measurement"
      : pendingFiles.length > 0
        ? "Claim drafted with attachments"
        : "Claim drafted");

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
        title="Progress Claims"
        subtitle="Submit completed work for QS/PM measurement and certification."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.SUBCONTRACTOR.PACKAGES}>View packages</Link>
          </Button>
        }
      />

      <p className="text-xs text-muted-foreground">
        Lifecycle: Claim → Certificate → Invoice → Payment
      </p>

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      )}

      {tracker.length > 0 && (
        <Surface className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Claim status pipeline</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Submitted → Under review → Measured → Certified. Payment status comes from the linked certificate.
          </p>
          <div className="space-y-3">
            {tracker.map((t) => (
              <div
                key={t.claimUuid}
                className="rounded-xl border border-border/40 bg-card/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{t.packageName}</p>
                    <p className="text-xs text-muted-foreground">
                      Project #{t.projectId} · Claimed qty {t.claimedQty ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={`${SC_STATUS_BADGE[t.status] || "bg-muted border-none"} text-[10px]`}>
                      {formatScStatus(t.status)}
                    </Badge>
                    {String(t.paymentStatus || "").toUpperCase() === "PAID" && (
                      <Badge className={`${SC_STATUS_BADGE.PAID} text-[10px]`}>Payment paid</Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <ClaimPipeline status={t.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
                    <p className="text-[10px] uppercase text-muted-foreground">Measured</p>
                    <p className="font-medium tabular-nums">{t.measuredQty ?? "—"}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
                    <p className="text-[10px] uppercase text-muted-foreground">Measured value</p>
                    <p className="font-medium tabular-nums">{formatMoney(t.measuredValue)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
                    <p className="text-[10px] uppercase text-muted-foreground">Certified</p>
                    <p className="font-medium tabular-nums">{formatMoney(t.certifiedValue)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
                    <p className="text-[10px] uppercase text-muted-foreground">Certificate</p>
                    <p className="font-mono text-[10px]">
                      {t.certificateUuid ? String(t.certificateUuid).slice(0, 8) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <Card className="border-border/50 bg-card/60 shadow-none">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-sm font-semibold">New claim</h2>
            <div className="space-y-1.5">
              <Label className="text-xs">Package</Label>
              <Select value={selectedPackage} onValueChange={(v) => { setSelectedPackage(v); setForm(emptyForm()); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.length === 0 ? (
                    <SelectItem value="__none" disabled>No packages assigned</SelectItem>
                  ) : (
                    packages.map((p) => (
                      <SelectItem key={p.uuid} value={p.uuid}>
                        {p.name}
                        {p.projectName ? ` · ${p.projectName}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedPkg && (
              <div className="rounded-xl bg-secondary/40 p-3 text-xs">
                <p className="font-medium">{selectedPkg.projectName || `Project #${selectedPkg.projectId}`}</p>
                <p className="text-muted-foreground">{selectedPkg.projectLocation || "No location"}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Period from</Label>
                <Input
                  type="date"
                  value={form.claimPeriodFrom}
                  onChange={(e) => setForm((f) => ({ ...f, claimPeriodFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Period to</Label>
                <Input
                  type="date"
                  value={form.claimPeriodTo}
                  onChange={(e) => setForm((f) => ({ ...f, claimPeriodTo: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs">{hasAwardBoq ? "Award BOQ — this claim qty" : "Claimed quantity"}</Label>
              <FillDemoDataButton
                onClick={() => {
                  if (hasAwardBoq) {
                    const lineQtys = {};
                    awardLines.forEach((line) => {
                      const q = demoQtyForLine(line, claims);
                      if (q) lineQtys[line.uuid] = q;
                    });
                    setForm((f) => ({
                      ...f,
                      notes: DEMO.scClaim.notes,
                      lineQtys: { ...f.lineQtys, ...lineQtys },
                    }));
                  } else {
                    setForm((f) => ({ ...f, ...DEMO.scClaim }));
                  }
                }}
              />
            </div>

            {hasAwardBoq ? (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Enter quantity up to the remaining contract qty (not money). Lump-sum lines with qty 1 use a fraction (e.g. 0.25 = 25%).
                </p>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border/40 p-2">
                  {awardLines.map((line) => {
                    const contract = Number(line.quantity ?? 0);
                    const prior = priorClaimedForLine(line.uuid, claims);
                    const remaining = Math.max(0, contract - prior);
                    return (
                      <div key={line.uuid} className="grid grid-cols-[1fr_120px] items-start gap-3 rounded-md bg-secondary/40 p-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-medium break-words">{line.sectionCode || "Line"} · {line.description}</p>
                          <p className="mt-0.5 text-muted-foreground tabular-nums">
                            Contract {line.quantity ?? "—"} {line.unit || ""} @ {formatMoney(line.rate)}
                          </p>
                          <p className="text-muted-foreground tabular-nums">
                            Remaining {Number(remaining.toFixed(4))} {line.unit || ""}
                            {prior > 0 ? ` (already claimed ${Number(prior.toFixed(4))})` : ""}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">This claim qty</Label>
                          <Input
                          type="number"
                          className="h-9"
                          placeholder="Qty"
                          min={0}
                          max={remaining > 0 ? remaining : undefined}
                          step="any"
                          value={form.lineQtys[line.uuid] ?? ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              lineQtys: { ...f.lineQtys, [line.uuid]: e.target.value },
                            }))
                          }
                        />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Input
                type="number"
                value={form.claimedQty}
                onChange={(e) => setForm((f) => ({ ...f, claimedQty: e.target.value }))}
              />
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes for QS/PM..."
              />
            </div>
            <AttachmentUploadField
              files={pendingFiles}
              onFilesChange={setPendingFiles}
              disabled={busy}
              hint="Add site photos or supporting documents with this claim."
            />
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" onClick={() => handleCreate(false)} disabled={busy || !selectedPackage}>
                <Plus className="mr-1 h-4 w-4" /> Save Draft
              </Button>
              <Button className="flex-1" onClick={() => handleCreate(true)} disabled={busy || !selectedPackage}>
                <Send className="mr-1 h-4 w-4" /> Submit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Surface className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Claims history ({claims.length})</h2>
          {claims.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No claims for this package yet
            </p>
          ) : (
            <div className="space-y-3">
              {claims.map((c) => (
                <div
                  key={c.uuid}
                  className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/50 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        {c.claimNumber || String(c.uuid).slice(0, 8)}
                      </p>
                      <Badge className={`${SC_STATUS_BADGE[c.status] || "bg-muted border-none"} text-[10px]`}>
                        {formatScStatus(c.status)}
                      </Badge>
                      {String(c.paymentStatus || "").toUpperCase() === "PAID" && (
                        <Badge className={`${SC_STATUS_BADGE.PAID} text-[10px]`}>Paid</Badge>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
                        <p className="text-[10px] uppercase text-muted-foreground">Claimed</p>
                        <p className="font-medium tabular-nums">{formatMoney(c.claimedValue ?? c.claimedQty)}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
                        <p className="text-[10px] uppercase text-muted-foreground">Measured</p>
                        <p className="font-medium tabular-nums">{formatMoney(c.measuredValue ?? c.measuredQty)}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
                        <p className="text-[10px] uppercase text-muted-foreground">Certified</p>
                        <p className="font-medium tabular-nums">{formatMoney(c.certifiedValue)}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
                        <p className="text-[10px] uppercase text-muted-foreground">Certificate</p>
                        <p className="font-mono text-[10px]">
                          {c.certificateUuid ? String(c.certificateUuid).slice(0, 8) : "—"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.notes || "No notes"}</p>
                    <AttachmentList paths={c.attachmentPaths} className="mt-2" />
                    {(c.status === "DRAFT" || c.status === "REJECTED") && (
                      <div className="mt-2">
                        <AttachmentUploadField
                          label="Add photos / documents"
                          hint={
                            uploadingClaimId === c.uuid
                              ? "Uploading..."
                              : "Files upload immediately to this draft claim."
                          }
                          files={[]}
                          disabled={busy || uploadingClaimId === c.uuid}
                          onFilesChange={(picked) => uploadToClaim(c.uuid, picked, "Attachment(s) uploaded")}
                        />
                      </div>
                    )}
                    {c.status === "REJECTED" && c.reason && (
                      <p className="mt-1 text-xs text-destructive">Rejected: {c.reason}</p>
                    )}
                  </div>
                  {(c.status === "DRAFT" || c.status === "REJECTED") && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => submitScClaim(c.uuid),
                          c.status === "REJECTED" ? "Claim resubmitted" : "Claim submitted"
                        )
                      }
                    >
                      <Send className="mr-1 h-4 w-4" />
                      {c.status === "REJECTED" ? "Resubmit" : "Submit"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>
    </PageShell>
  );
}
