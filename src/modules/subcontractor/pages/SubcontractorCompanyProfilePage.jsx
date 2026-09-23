import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Save, Send, Upload } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchScCompanyProfile,
  fetchScTradeCategories,
  submitScPrequalificationReview,
  updateScCompanyProfile,
  uploadScTradeLicence,
  upsertScComplianceDoc,
  uploadScComplianceDoc,
} from "@/modules/admin/api/subcontractor.api";
import { AttachmentList } from "@/components/shared/AttachmentField";
import { FillDemoDataButton } from "@/components/shared/FillDemoDataButton";
import { DEMO } from "@/shared/demo/formDemoData";

const COMPLIANCE_STATUS_BADGE = {
  VALID: "bg-emerald-500/15 text-emerald-700 border-none",
  EXPIRING_SOON: "bg-amber-500/15 text-amber-700 border-none",
  EXPIRED: "bg-destructive/15 text-destructive border-none",
  INCOMPLETE: "bg-slate-500/15 text-slate-700 dark:text-slate-200 border-none",
};

const APPLICABILITY_BADGE = {
  MANDATORY: "bg-rose-500/15 text-rose-800 border-none",
  OPTIONAL: "bg-slate-500/15 text-slate-700 border-none",
  NOT_APPLICABLE: "bg-muted text-muted-foreground border-none",
};

const DOC_TYPES = [
  "CAR_INSURANCE",
  "TPL_INSURANCE",
  "WC_INSURANCE",
  "CIVIL_DEFENCE",
  "SIRA",
  "DEWA_ELECTRICAL",
  "MUNICIPALITY_CLASSIFICATION",
  "ISO_9001",
  "ISO_45001",
  "ISO_14001",
  "CHAMBER_OF_COMMERCE",
];

function emptyForm() {
  return {
    legalCompanyName: "",
    tradeLicenceNumber: "",
    tradeLicenceExpiry: "",
    trn: "",
    registeredAddress: "",
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
    accountsContactName: "",
    accountsContactEmail: "",
    accountsContactPhone: "",
    tradeCategories: [],
    declaredCapacity: "",
  };
}

function ComplianceDocRow({ doc, busy, onSave, onUpload, draft }) {
  const [refNo, setRefNo] = useState(doc.referenceNo || "");
  const [expiry, setExpiry] = useState(doc.expiryDate || "");
  const applicability = doc.applicability
    || (doc.requiredForAppointment ? "MANDATORY" : "OPTIONAL");

  useEffect(() => {
    setRefNo(draft?.referenceNo ?? doc.referenceNo ?? "");
    setExpiry(draft?.expiryDate ?? doc.expiryDate ?? "");
  }, [doc, draft]);

  if (applicability === "NOT_APPLICABLE") {
    return (
      <div className="rounded-lg border border-dashed border-border/40 p-3 flex items-center justify-between gap-2 opacity-70">
        <p className="text-sm">{doc.documentLabel}</p>
        <Badge className={APPLICABILITY_BADGE.NOT_APPLICABLE}>Not applicable</Badge>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{doc.documentLabel}</p>
        <div className="flex flex-wrap gap-1">
          <Badge className={APPLICABILITY_BADGE[applicability] || APPLICABILITY_BADGE.OPTIONAL}>
            {applicability === "MANDATORY" ? "Mandatory" : "Optional"}
          </Badge>
          <Badge className={COMPLIANCE_STATUS_BADGE[doc.itemStatus] || COMPLIANCE_STATUS_BADGE.INCOMPLETE}>
            {(doc.itemStatus || "INCOMPLETE").replace(/_/g, " ")}
          </Badge>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Reference no.</Label>
          <Input value={refNo} onChange={(e) => setRefNo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Expiry date</Label>
          <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
      </div>
      {doc.filePath && <AttachmentList paths={[doc.filePath]} />}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onSave(doc.documentType, { referenceNo: refNo, expiryDate: expiry })}
        >
          Save details
        </Button>
        <label className="inline-flex">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(doc.documentType, file);
              e.target.value = "";
            }}
          />
          <Button type="button" size="sm" variant="secondary" disabled={busy} asChild>
            <span><Upload className="h-3.5 w-3.5 mr-1 inline" />{doc.filePath ? "Replace" : "Upload"}</span>
          </Button>
        </label>
      </div>
    </div>
  );
}

function StepChip({ label, done, active }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border ${
      done ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800"
        : active ? "bg-primary/10 border-primary/30 text-foreground"
          : "bg-muted/40 border-border text-muted-foreground"
    }`}>
      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      {label}
    </div>
  );
}

export default function SubcontractorCompanyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [docDrafts, setDocDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchScCompanyProfile(), fetchScTradeCategories()])
      .then(([p, cats]) => {
        setProfile(p);
        setCategories(Array.isArray(cats) ? cats : []);
        setForm({
          legalCompanyName: p.legalCompanyName || "",
          tradeLicenceNumber: p.tradeLicenceNumber || "",
          tradeLicenceExpiry: p.tradeLicenceExpiry || "",
          trn: p.trn || "",
          registeredAddress: p.registeredAddress || "",
          primaryContactName: p.primaryContactName || "",
          primaryContactEmail: p.primaryContactEmail || "",
          primaryContactPhone: p.primaryContactPhone || "",
          accountsContactName: p.accountsContactName || "",
          accountsContactEmail: p.accountsContactEmail || "",
          accountsContactPhone: p.accountsContactPhone || "",
          tradeCategories: p.tradeCategories || [],
          declaredCapacity: p.declaredCapacity || "",
        });
      })
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleCategory = (cat) => {
    setForm((f) => {
      const set = new Set(f.tradeCategories);
      if (set.has(cat)) set.delete(cat);
      else set.add(cat);
      return { ...f, tradeCategories: Array.from(set) };
    });
  };

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      const result = await fn();
      if (result) setProfile(result);
      await load();
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const complianceDocs = useMemo(
    () => (profile?.complianceDocuments || []).filter((d) => DOC_TYPES.includes(d.documentType)),
    [profile]
  );

  const checklist = useMemo(() => {
    const companyOk = Boolean(form.legalCompanyName?.trim());
    const tradesOk = (form.tradeCategories || []).length > 0;
    const licenceOk = Boolean(
      form.tradeLicenceNumber?.trim()
      && form.tradeLicenceExpiry
      && profile?.tradeLicenceFilePath
    );
    const mandatoryDocs = complianceDocs.filter((d) =>
      (d.applicability || (d.requiredForAppointment ? "MANDATORY" : "OPTIONAL")) === "MANDATORY");
    const mandatoryOk = mandatoryDocs.every((d) => d.itemStatus === "VALID" || d.itemStatus === "EXPIRING_SOON");
    const missing = [];
    if (!companyOk) missing.push("Company details");
    if (!tradesOk) missing.push("Trade selection");
    if (!licenceOk) missing.push("Trade licence upload");
    mandatoryDocs.forEach((d) => {
      if (d.itemStatus !== "VALID" && d.itemStatus !== "EXPIRING_SOON") {
        missing.push(d.documentLabel || d.documentType);
      }
    });
    return { companyOk, tradesOk, licenceOk, mandatoryOk, missing, ready: missing.length === 0 };
  }, [form, profile, complianceDocs]);

  const status = profile?.status || "INVITED";
  const underReview = status === "UNDER_REVIEW";
  const approved = status === "APPROVED" || status === "CONDITIONAL";

  if (loading) {
    return (
      <PageShell className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Company profile"
          subtitle="Guided prequalification: profile → trades → documents → submit for QS review."
        />
        <div className="flex flex-wrap items-center gap-2">
          <FillDemoDataButton
            onClick={() => {
              setForm((f) => ({ ...f, ...DEMO.scCompanyProfile }));
              setDocDrafts({ ...DEMO.scComplianceDocs });
            }}
          />
          {profile?.complianceStatus && (
            <Badge className={COMPLIANCE_STATUS_BADGE[profile.complianceStatus]}>
              Compliance: {profile.complianceStatus.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StepChip label="Company profile" done={checklist.companyOk} active />
        <StepChip label="Trade selection" done={checklist.tradesOk} />
        <StepChip label="Required documents" done={checklist.licenceOk && checklist.mandatoryOk} />
        <StepChip label="Review" done={underReview || approved} />
        <StepChip label="Approval status" done={approved} />
      </div>

      {underReview && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          Submitted to QS for review. Your company information and selected trades are awaiting prequalification.
        </div>
      )}
      {approved && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
          Prequalification status: {status.replace(/_/g, " ")}. Approval remains subject to document validity,
          project/community eligibility and package-specific requirements.
        </div>
      )}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Surface>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Company details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Legal company name</Label>
                <Input
                  value={form.legalCompanyName}
                  onChange={(e) => setForm((f) => ({ ...f, legalCompanyName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">TRN</Label>
                <Input value={form.trn} onChange={(e) => setForm((f) => ({ ...f, trn: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Declared capacity</Label>
                <Input
                  value={form.declaredCapacity}
                  onChange={(e) => setForm((f) => ({ ...f, declaredCapacity: e.target.value }))}
                  placeholder="e.g. 3 crews / 40 workers"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Registered address</Label>
                <Textarea
                  rows={2}
                  value={form.registeredAddress}
                  onChange={(e) => setForm((f) => ({ ...f, registeredAddress: e.target.value }))}
                />
              </div>
            </div>

            <p className="text-xs font-medium pt-2">Primary contact</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input placeholder="Name" value={form.primaryContactName} onChange={(e) => setForm((f) => ({ ...f, primaryContactName: e.target.value }))} />
              <Input placeholder="Email" value={form.primaryContactEmail} onChange={(e) => setForm((f) => ({ ...f, primaryContactEmail: e.target.value }))} />
              <Input placeholder="Phone" value={form.primaryContactPhone} onChange={(e) => setForm((f) => ({ ...f, primaryContactPhone: e.target.value }))} />
            </div>

            <p className="text-xs font-medium pt-2">Accounts contact</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input placeholder="Name" value={form.accountsContactName} onChange={(e) => setForm((f) => ({ ...f, accountsContactName: e.target.value }))} />
              <Input placeholder="Email" value={form.accountsContactEmail} onChange={(e) => setForm((f) => ({ ...f, accountsContactEmail: e.target.value }))} />
              <Input placeholder="Phone" value={form.accountsContactPhone} onChange={(e) => setForm((f) => ({ ...f, accountsContactPhone: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Trade categories</Label>
              <p className="text-[11px] text-muted-foreground">
                Selected trades drive which specialist certificates are mandatory for prequalification and future RFQ eligibility.
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    size="sm"
                    variant={form.tradeCategories.includes(cat) ? "default" : "outline"}
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <Button disabled={busy} onClick={() => run(() => updateScCompanyProfile(form), "Profile saved")}>
              <Save className="h-4 w-4 mr-1" /> Save profile
            </Button>
          </CardContent>
        </Card>
      </Surface>

      <Surface>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Trade licence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Licence number</Label>
                <Input value={form.tradeLicenceNumber} onChange={(e) => setForm((f) => ({ ...f, tradeLicenceNumber: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expiry date</Label>
                <Input type="date" value={form.tradeLicenceExpiry} onChange={(e) => setForm((f) => ({ ...f, tradeLicenceExpiry: e.target.value }))} />
              </div>
            </div>
            {profile?.tradeLicenceFilePath && <AttachmentList paths={[profile.tradeLicenceFilePath]} />}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => run(() => updateScCompanyProfile({ ...form }), "Trade licence details saved")}
              >
                Save licence details
              </Button>
              <label className="inline-flex">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) run(() => uploadScTradeLicence(file), "Trade licence uploaded");
                    e.target.value = "";
                  }}
                />
                <Button type="button" size="sm" variant="secondary" disabled={busy} asChild>
                  <span><Upload className="h-3.5 w-3.5 mr-1 inline" />Upload licence file</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      </Surface>

      <Surface>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Insurance & specialist certificates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-[11px] text-muted-foreground">
              Mandatory / optional / not applicable updates from your selected trades (e.g. Fire → Civil Defence).
            </p>
            {complianceDocs.map((doc) => (
              <ComplianceDocRow
                key={doc.documentType}
                doc={doc}
                draft={docDrafts[doc.documentType]}
                busy={busy}
                onSave={(type, payload) => run(() => upsertScComplianceDoc(type, payload), "Document saved")}
                onUpload={(type, file) => run(() => uploadScComplianceDoc(type, file), "File uploaded")}
              />
            ))}
          </CardContent>
        </Card>
      </Surface>

      <Surface>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Submit for prequalification review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm space-y-1">
              <li className={checklist.companyOk ? "text-emerald-700" : "text-muted-foreground"}>
                {checklist.companyOk ? "✓" : "○"} Company details complete
              </li>
              <li className={checklist.tradesOk ? "text-emerald-700" : "text-muted-foreground"}>
                {checklist.tradesOk ? "✓" : "○"} Trade selection
              </li>
              <li className={checklist.licenceOk ? "text-emerald-700" : "text-muted-foreground"}>
                {checklist.licenceOk ? "✓" : "○"} Required trade licence uploaded
              </li>
              <li className={checklist.mandatoryOk ? "text-emerald-700" : "text-muted-foreground"}>
                {checklist.mandatoryOk ? "✓" : "○"} Mandatory insurance / specialist certificates
              </li>
            </ul>
            {!checklist.ready && (
              <p className="text-xs text-amber-800">Missing: {checklist.missing.join("; ")}</p>
            )}
            <Button
              disabled={busy || !checklist.ready || underReview || approved}
              onClick={() => run(async () => {
                await updateScCompanyProfile(form);
                return submitScPrequalificationReview();
              }, "Submitted for QS prequalification review")}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Submit for prequalification review
            </Button>
            <p className="text-xs text-muted-foreground">
              Status: <span className="font-medium">{status.replace(/_/g, " ")}</span>
            </p>
          </CardContent>
        </Card>
      </Surface>
    </PageShell>
  );
}
