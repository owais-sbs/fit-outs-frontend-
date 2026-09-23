import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttachmentList } from "@/components/shared/AttachmentField";
import { fetchScVendor, reviewScVendorPrequalification } from "../../api/subcontractor.api";

const REVIEW_STATUS_OPTIONS = [
  "UNDER_REVIEW",
  "APPROVED",
  "CONDITIONAL",
  "SUSPENDED",
  "BLACKLISTED",
];

const STATUS_BADGE = {
  VALID: "bg-emerald-500/15 text-emerald-700 border-none",
  EXPIRING_SOON: "bg-amber-500/15 text-amber-700 border-none",
  EXPIRED: "bg-destructive/15 text-destructive border-none",
  INCOMPLETE: "bg-slate-500/15 text-slate-700 border-none",
};

const APPLICABILITY_BADGE = {
  MANDATORY: "bg-rose-500/15 text-rose-800 border-none",
  OPTIONAL: "bg-slate-500/15 text-slate-700 border-none",
  NOT_APPLICABLE: "bg-muted text-muted-foreground border-none",
};

function formatStatus(status = "") {
  return String(status).replace(/_/g, " ");
}

function parseRejectedNotes(notes) {
  if (!notes) return { summary: "", rejected: [] };
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === "object") {
      return {
        summary: parsed.summary || "",
        rejected: Array.isArray(parsed.rejectedTrades) ? parsed.rejectedTrades : [],
      };
    }
  } catch {
    /* plain text */
  }
  return { summary: notes, rejected: [] };
}

function Field({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value || "—"}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Full QS/PM prequalification dossier: company overview, PDFs, trade decisions.
 */
export default function VendorReviewDialog({
  open,
  onOpenChange,
  organizationUuid,
  onSaved,
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tradeDecisions, setTradeDecisions] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    status: "UNDER_REVIEW",
    notes: "",
    maxPackageValue: "",
  });

  useEffect(() => {
    if (!open || !organizationUuid) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    setDetail(null);
    fetchScVendor(organizationUuid)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        const notes = parseRejectedNotes(data.prequalificationNotes);
        const requested = data.tradeCategories?.length
          ? data.tradeCategories
          : data.approvedTrades || [];
        const rejectedMap = Object.fromEntries(
          (notes.rejected || []).map((r) => [r.trade, r.reason || ""])
        );
        setTradeDecisions(
          (requested || []).map((trade) => ({
            trade,
            decision: (data.approvedTrades || []).includes(trade)
              ? "APPROVE"
              : rejectedMap[trade]
                ? "REJECT"
                : "APPROVE",
            reason: rejectedMap[trade] || "",
          }))
        );
        setReviewForm({
          status: ["INVITED", "REGISTERED"].includes(data.status) ? "UNDER_REVIEW" : data.status,
          notes: notes.summary || "",
          maxPackageValue: data.maxPackageValue != null ? String(data.maxPackageValue) : "",
        });
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.response?.data?.error || e?.response?.data?.message || "Failed to load vendor detail");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, organizationUuid]);

  const save = async () => {
    for (const d of tradeDecisions) {
      if (d.decision === "REJECT" && !d.reason.trim()) {
        setError(`Rejection reason is required for trade: ${d.trade}`);
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      await reviewScVendorPrequalification(organizationUuid, {
        status: reviewForm.status,
        notes: reviewForm.notes.trim() || undefined,
        tradeDecisions: tradeDecisions.map((d) => ({
          trade: d.trade,
          decision: d.decision,
          reason: d.reason.trim() || undefined,
        })),
        maxPackageValue: reviewForm.maxPackageValue
          ? Number(reviewForm.maxPackageValue)
          : undefined,
      });
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || "Review failed");
    } finally {
      setSaving(false);
    }
  };

  const docs = (detail?.complianceDocuments || []).filter(
    (d) => (d.applicability || "OPTIONAL") !== "NOT_APPLICABLE" || d.filePath
  );
  const ext = detail?.organizationExtension;
  const bank = ext?.bankDetail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prequalification review</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {!loading && detail && (
          <div className="space-y-4 py-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold">{detail.legalCompanyName}</p>
              <Badge variant="outline">{formatStatus(detail.status)}</Badge>
              <Badge className={STATUS_BADGE[detail.complianceStatus] || STATUS_BADGE.INCOMPLETE}>
                Compliance: {formatStatus(detail.complianceStatus)}
              </Badge>
              {detail.performanceScore != null && (
                <Badge variant="secondary">Score {detail.performanceScore}</Badge>
              )}
            </div>

            {(detail.complianceGaps || []).length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900">
                <p className="font-medium mb-1">Compliance gaps</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {detail.complianceGaps.map((g) => <li key={g}>{g}</li>)}
                </ul>
              </div>
            )}

            <Section title="Company overview">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Legal name" value={detail.legalCompanyName} />
                <Field label="TRN" value={detail.trn} />
                <Field label="Declared capacity" value={detail.declaredCapacity} />
                <Field label="Registered address" value={detail.registeredAddress} />
                <Field label="Primary contact" value={detail.primaryContactName} />
                <Field label="Primary email" value={detail.primaryContactEmail} />
                <Field label="Primary phone" value={detail.primaryContactPhone} />
                <Field label="Accounts contact" value={detail.accountsContactName} />
                <Field label="Accounts email" value={detail.accountsContactEmail} />
              </div>
            </Section>

            <Section title="Trade licence">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Licence number" value={detail.tradeLicenceNumber} />
                <Field label="Expiry" value={detail.tradeLicenceExpiry} />
                <Field label="Authority" value={ext?.tradeLicenceAuthority} />
              </div>
              {ext?.tradeLicenceActivities && (
                <p className="text-sm text-muted-foreground mt-2">{ext.tradeLicenceActivities}</p>
              )}
              {detail.tradeLicenceFilePath ? (
                <div className="mt-3">
                  <AttachmentList paths={[detail.tradeLicenceFilePath]} />
                </div>
              ) : (
                <p className="mt-2 text-xs text-amber-800">Trade licence file not uploaded</p>
              )}
            </Section>

            <Section title="Submitted documents — verify each file">
              <p className="text-xs text-muted-foreground">
                Open PDFs/images below. Mandatory documents must be valid before approval.
              </p>
              {docs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No compliance documents on file.</p>
              ) : (
                <div className="space-y-4">
                  {docs.map((doc) => {
                    const applicability = doc.applicability
                      || (doc.requiredForAppointment ? "MANDATORY" : "OPTIONAL");
                    return (
                      <div key={doc.documentType} className="rounded-lg border border-border/40 bg-background p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">{doc.documentLabel || doc.documentType}</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge className={APPLICABILITY_BADGE[applicability] || APPLICABILITY_BADGE.OPTIONAL}>
                              {applicability === "MANDATORY" ? "Mandatory" : applicability === "NOT_APPLICABLE" ? "N/A" : "Optional"}
                            </Badge>
                            <Badge className={STATUS_BADGE[doc.itemStatus] || STATUS_BADGE.INCOMPLETE}>
                              {formatStatus(doc.itemStatus || "INCOMPLETE")}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 text-xs">
                          <p><span className="text-muted-foreground">Reference:</span> {doc.referenceNo || "—"}</p>
                          <p><span className="text-muted-foreground">Expiry:</span> {doc.expiryDate || "—"}</p>
                        </div>
                        {doc.filePath ? (
                          <AttachmentList paths={[doc.filePath]} />
                        ) : (
                          <p className="text-xs text-amber-800">No file uploaded</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            {(ext || bank) && (
              <Section title="Capacity, HSE & bank">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Years in operation" value={ext?.yearsInOperation} />
                  <Field label="Turnover band" value={ext?.annualTurnoverBand} />
                  <Field label="Workforce" value={ext?.workforceTotal} />
                  <Field label="Monthly capacity (AED)" value={ext?.monthlyCapacityValue} />
                  <Field label="HSE officer" value={ext?.hseOfficerName} />
                  <Field label="LTI count" value={ext?.hseLtiCount} />
                  <Field label="Bank" value={bank?.bankName} />
                  <Field label="IBAN" value={bank?.iban} />
                  <Field label="Bank verification" value={bank?.verificationStatus} />
                </div>
                {bank?.bankLetterFilePath && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Bank letter</p>
                    <AttachmentList paths={[bank.bankLetterFilePath]} />
                  </div>
                )}
                {ext?.hsePolicyFilePath && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">HSE policy</p>
                    <AttachmentList paths={[ext.hsePolicyFilePath]} />
                  </div>
                )}
                {ext?.vatCertificateFilePath && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">VAT certificate</p>
                    <AttachmentList paths={[ext.vatCertificateFilePath]} />
                  </div>
                )}
                {ext?.establishmentCardFilePath && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Establishment card</p>
                    <AttachmentList paths={[ext.establishmentCardFilePath]} />
                  </div>
                )}
              </Section>
            )}

            {(ext?.communityRegistrations || []).length > 0 && (
              <Section title="Community registrations">
                <div className="space-y-3">
                  {ext.communityRegistrations.map((reg) => (
                    <div key={reg.uuid || reg.registrationNo} className="rounded-lg border p-3 text-sm space-y-2">
                      <p className="font-medium">{reg.authorityName || reg.authorityCode}</p>
                      <p className="text-xs text-muted-foreground">
                        {reg.registrationNo || "—"} · Expiry {reg.expiryDate || "—"}
                      </p>
                      {reg.filePath && <AttachmentList paths={[reg.filePath]} />}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {(ext?.references || []).length > 0 && (
              <Section title="Project references">
                <div className="space-y-2">
                  {ext.references.map((ref) => (
                    <div key={ref.uuid || ref.clientName} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{ref.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {ref.yearCompleted || "—"} · Value {ref.projectValue ?? "—"}
                      </p>
                      {ref.scopeDescription && (
                        <p className="mt-1 text-xs text-muted-foreground">{ref.scopeDescription}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="QS decision">
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Overall status</Label>
                  <Select
                    value={reviewForm.status}
                    onValueChange={(v) => setReviewForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trade approval (requested by vendor)</Label>
                  {tradeDecisions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No trades requested yet.</p>
                  ) : (
                    tradeDecisions.map((d, idx) => (
                      <div key={d.trade} className="rounded-lg border border-border/50 p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {d.trade}{" "}
                            <span className="text-xs text-muted-foreground">Requested ✓</span>
                          </p>
                          <Select
                            value={d.decision}
                            onValueChange={(v) => setTradeDecisions((rows) => rows.map((r, i) => (i === idx ? { ...r, decision: v } : r)))}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="APPROVE">Approve</SelectItem>
                              <SelectItem value="REJECT">Reject</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {d.decision === "REJECT" && (
                          <Textarea
                            rows={2}
                            placeholder="Rejection reason (required)"
                            value={d.reason}
                            onChange={(e) => setTradeDecisions((rows) => rows.map((r, i) => (i === idx ? { ...r, reason: e.target.value } : r)))}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label>Approved up to package value (AED)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={reviewForm.maxPackageValue}
                    onChange={(e) => setReviewForm((f) => ({ ...f, maxPackageValue: e.target.value }))}
                    placeholder="e.g. 1500000"
                  />
                  <p className="text-[11px] text-muted-foreground">Eligibility warning threshold — not a hard block.</p>
                </div>
                <div className="grid gap-1.5">
                  <Label>Review notes</Label>
                  <Textarea
                    rows={3}
                    value={reviewForm.notes}
                    onChange={(e) => setReviewForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Document verification notes, conditions, follow-ups…"
                  />
                </div>
              </div>
            </Section>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || loading || !detail}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
