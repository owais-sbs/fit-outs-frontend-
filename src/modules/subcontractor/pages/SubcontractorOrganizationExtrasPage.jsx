import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Save, Upload, UserPlus } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchScCompanyProfile,
  updateScOrganizationExtension,
  updateScBankDetail,
  uploadScBankLetter,
  fetchScCommunityAuthorities,
  addScCommunityRegistration,
  uploadScCommunityRegistrationFile,
  deleteScCommunityRegistration,
  addScOrganizationReference,
  deleteScOrganizationReference,
  uploadScOrgDocument,
} from "@/modules/admin/api/subcontractor.api";
import { AttachmentList } from "@/components/shared/AttachmentField";
import { useSubcontractorPortal } from "../context/SubcontractorPortalContext";

const ORG_DOC_TYPES = [
  { code: "ESTABLISHMENT_CARD", label: "Establishment card" },
  { code: "VAT_CERTIFICATE", label: "VAT certificate" },
  { code: "HSE_POLICY", label: "HSE policy" },
  { code: "HSE_OFFICER_CERT", label: "HSE officer certificate" },
];

const EXTRA_COMPLIANCE = [
  "MUNICIPALITY_CLASSIFICATION",
  "ISO_9001",
  "ISO_45001",
  "ISO_14001",
  "CHAMBER_OF_COMMERCE",
];

function emptyExt() {
  return {
    tradeLicenceAuthority: "",
    tradeLicenceActivities: "",
    establishmentCardExpiry: "",
    locationPin: "",
    monthlyCapacityValue: "",
    monthlyCapacityManpower: "",
    yearsInOperation: "",
    annualTurnoverBand: "",
    workshopAddress: "",
    hseLtiCount: "",
    hseOfficerName: "",
    hseOfficerCertExpiry: "",
    paymentTermsAccepted: "",
    retentionPctAccepted: "",
    advancePaymentRequired: "",
    workforceTotal: "",
    workforceTradeBreakdown: "",
  };
}

export default function SubcontractorOrganizationExtrasPage() {
  const { isOrgAdmin } = useSubcontractorPortal();
  const [profile, setProfile] = useState(null);
  const [extForm, setExtForm] = useState(emptyExt());
  const [bankForm, setBankForm] = useState({ bankName: "", accountName: "", iban: "", swiftCode: "" });
  const [communityAuthorities, setCommunityAuthorities] = useState([]);
  const [communityForm, setCommunityForm] = useState({ authorityCode: "", authorityName: "", registrationNo: "", expiryDate: "" });
  const [refForm, setRefForm] = useState({ clientName: "", projectValue: "", yearCompleted: "", scopeDescription: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const ext = profile?.organizationExtension;

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchScCompanyProfile(), fetchScCommunityAuthorities().catch(() => [])])
      .then(([p, authorities]) => {
        setProfile(p);
        setCommunityAuthorities(Array.isArray(authorities) ? authorities : []);
        const e = p?.organizationExtension || {};
        setExtForm({
          tradeLicenceAuthority: e.tradeLicenceAuthority || "",
          tradeLicenceActivities: e.tradeLicenceActivities || "",
          establishmentCardExpiry: e.establishmentCardExpiry || "",
          locationPin: e.locationPin || "",
          monthlyCapacityValue: e.monthlyCapacityValue != null ? String(e.monthlyCapacityValue) : "",
          monthlyCapacityManpower: e.monthlyCapacityManpower != null ? String(e.monthlyCapacityManpower) : "",
          yearsInOperation: e.yearsInOperation != null ? String(e.yearsInOperation) : "",
          annualTurnoverBand: e.annualTurnoverBand || "",
          workshopAddress: e.workshopAddress || "",
          hseLtiCount: e.hseLtiCount != null ? String(e.hseLtiCount) : "",
          hseOfficerName: e.hseOfficerName || "",
          hseOfficerCertExpiry: e.hseOfficerCertExpiry || "",
          paymentTermsAccepted: e.paymentTermsAccepted || "",
          retentionPctAccepted: e.retentionPctAccepted != null ? String(e.retentionPctAccepted) : "",
          advancePaymentRequired: e.advancePaymentRequired != null ? String(e.advancePaymentRequired) : "",
          workforceTotal: e.workforceTotal != null ? String(e.workforceTotal) : "",
          workforceTradeBreakdown: e.workforceTradeBreakdown || "",
        });
        const bank = e.bankDetail || {};
        setBankForm({
          bankName: bank.bankName || "",
          accountName: bank.accountName || "",
          iban: bank.iban || "",
          swiftCode: bank.swiftCode || "",
        });
      })
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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

  if (loading) {
    return (
      <PageShell className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  if (!isOrgAdmin) {
    return (
      <PageShell>
        <PageTitle title="Organization profile" subtitle="Only SC Admin can edit extended prequalification fields." />
        <p className="text-sm text-muted-foreground">Contact your company administrator to update HSE, financial and community registrations.</p>
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-3xl mx-auto space-y-6">
      <PageTitle
        title="Extended profile"
        subtitle="HSE, capacity, financial terms, community registrations and references (C7)."
      />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Surface>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Licence & capacity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Licence authority</Label>
                <Input value={extForm.tradeLicenceAuthority} onChange={(e) => setExtForm((f) => ({ ...f, tradeLicenceAuthority: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location pin</Label>
                <Input value={extForm.locationPin} onChange={(e) => setExtForm((f) => ({ ...f, locationPin: e.target.value }))} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Licence activities</Label>
                <Textarea rows={2} value={extForm.tradeLicenceActivities} onChange={(e) => setExtForm((f) => ({ ...f, tradeLicenceActivities: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Monthly capacity (AED)</Label>
                <Input value={extForm.monthlyCapacityValue} onChange={(e) => setExtForm((f) => ({ ...f, monthlyCapacityValue: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Monthly manpower</Label>
                <Input value={extForm.monthlyCapacityManpower} onChange={(e) => setExtForm((f) => ({ ...f, monthlyCapacityManpower: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Years in operation</Label>
                <Input value={extForm.yearsInOperation} onChange={(e) => setExtForm((f) => ({ ...f, yearsInOperation: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Turnover band</Label>
                <Input value={extForm.annualTurnoverBand} onChange={(e) => setExtForm((f) => ({ ...f, annualTurnoverBand: e.target.value }))} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Workshop address</Label>
                <Textarea rows={2} value={extForm.workshopAddress} onChange={(e) => setExtForm((f) => ({ ...f, workshopAddress: e.target.value }))} />
              </div>
            </div>
            <Button disabled={busy} onClick={() => run(() => updateScOrganizationExtension({
              ...extForm,
              monthlyCapacityManpower: extForm.monthlyCapacityManpower ? Number(extForm.monthlyCapacityManpower) : undefined,
              yearsInOperation: extForm.yearsInOperation ? Number(extForm.yearsInOperation) : undefined,
              hseLtiCount: extForm.hseLtiCount ? Number(extForm.hseLtiCount) : undefined,
              workforceTotal: extForm.workforceTotal ? Number(extForm.workforceTotal) : undefined,
            }), "Saved")}>
              <Save className="h-4 w-4 mr-1" /> Save capacity
            </Button>
          </CardContent>
        </Card>
      </Surface>

      <Surface>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm">HSE & workforce</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">LTI count (last 12 months)</Label>
                <Input value={extForm.hseLtiCount} onChange={(e) => setExtForm((f) => ({ ...f, hseLtiCount: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">HSE officer</Label>
                <Input value={extForm.hseOfficerName} onChange={(e) => setExtForm((f) => ({ ...f, hseOfficerName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">HSE officer cert expiry</Label>
                <Input type="date" value={extForm.hseOfficerCertExpiry} onChange={(e) => setExtForm((f) => ({ ...f, hseOfficerCertExpiry: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total workforce</Label>
                <Input value={extForm.workforceTotal} onChange={(e) => setExtForm((f) => ({ ...f, workforceTotal: e.target.value }))} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Trade breakdown</Label>
                <Textarea rows={2} value={extForm.workforceTradeBreakdown} onChange={(e) => setExtForm((f) => ({ ...f, workforceTradeBreakdown: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ORG_DOC_TYPES.filter((d) => d.code.startsWith("HSE")).map((doc) => (
                <label key={doc.code} className="inline-flex">
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" disabled={busy}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) run(() => uploadScOrgDocument(doc.code, f), `${doc.label} uploaded`); e.target.value = ""; }} />
                  <Button type="button" size="sm" variant="outline" asChild><span><Upload className="h-3.5 w-3.5 mr-1 inline" />{doc.label}</span></Button>
                </label>
              ))}
            </div>
            <Button disabled={busy} onClick={() => run(() => updateScOrganizationExtension(extForm), "HSE saved")}>
              <Save className="h-4 w-4 mr-1" /> Save HSE
            </Button>
          </CardContent>
        </Card>
      </Surface>

      <Surface>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Financial terms & bank</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input placeholder="Payment terms" value={extForm.paymentTermsAccepted} onChange={(e) => setExtForm((f) => ({ ...f, paymentTermsAccepted: e.target.value }))} />
              <Input placeholder="Retention %" value={extForm.retentionPctAccepted} onChange={(e) => setExtForm((f) => ({ ...f, retentionPctAccepted: e.target.value }))} />
              <Input placeholder="Advance required" value={extForm.advancePaymentRequired} onChange={(e) => setExtForm((f) => ({ ...f, advancePaymentRequired: e.target.value }))} />
            </div>
            <Button disabled={busy} size="sm" variant="secondary" onClick={() => run(() => updateScOrganizationExtension(extForm), "Terms saved")}>Save terms</Button>
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <Input placeholder="Bank name" value={bankForm.bankName} onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))} />
              <Input placeholder="Account name" value={bankForm.accountName} onChange={(e) => setBankForm((f) => ({ ...f, accountName: e.target.value }))} />
              <Input placeholder="IBAN" value={bankForm.iban} onChange={(e) => setBankForm((f) => ({ ...f, iban: e.target.value }))} />
              <Input placeholder="SWIFT" value={bankForm.swiftCode} onChange={(e) => setBankForm((f) => ({ ...f, swiftCode: e.target.value }))} />
            </div>
            {ext?.bankDetail?.verificationStatus && (
              <Badge variant="outline">Bank: {ext.bankDetail.verificationStatus.replace(/_/g, " ")}</Badge>
            )}
            {ext?.bankDetail?.bankLetterFilePath && <AttachmentList paths={[ext.bankDetail.bankLetterFilePath]} />}
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} size="sm" onClick={() => run(() => updateScBankDetail(bankForm), "Bank details saved")}>Save bank</Button>
              <label className="inline-flex">
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" disabled={busy}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) run(() => uploadScBankLetter(f), "Bank letter uploaded"); e.target.value = ""; }} />
                <Button type="button" size="sm" variant="outline" asChild><span><Upload className="h-3.5 w-3.5 mr-1 inline" />Upload bank letter</span></Button>
              </label>
            </div>
          </CardContent>
        </Card>
      </Surface>

      <Surface>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Organization documents</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {ORG_DOC_TYPES.map((doc) => (
              <label key={doc.code} className="inline-flex">
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" disabled={busy}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) run(() => uploadScOrgDocument(doc.code, f), `${doc.label} uploaded`); e.target.value = ""; }} />
                <Button type="button" size="sm" variant="outline" asChild><span><Upload className="h-3.5 w-3.5 mr-1 inline" />{doc.label}</span></Button>
              </label>
            ))}
          </CardContent>
        </Card>
      </Surface>

      <Surface>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Community registrations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(ext?.communityRegistrations || []).map((reg) => (
              <div key={reg.uuid} className="rounded border p-2 flex flex-wrap justify-between gap-2 text-sm">
                <span>{reg.authorityName || reg.authorityCode} · {reg.registrationNo || "—"} · exp {reg.expiryDate || "—"}</span>
                <div className="flex gap-2">
                  <label className="inline-flex">
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" disabled={busy}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) run(() => uploadScCommunityRegistrationFile(reg.uuid, f), "File uploaded"); e.target.value = ""; }} />
                    <Button type="button" size="sm" variant="outline" asChild><span>Upload</span></Button>
                  </label>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => deleteScCommunityRegistration(reg.uuid), "Removed")}>Remove</Button>
                </div>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={communityForm.authorityName} onValueChange={(v) => setCommunityForm((f) => ({ ...f, authorityName: v, authorityCode: v.toUpperCase().replace(/\s+/g, "_") }))}>
                <SelectTrigger><SelectValue placeholder="Authority" /></SelectTrigger>
                <SelectContent>
                  {communityAuthorities.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Registration no." value={communityForm.registrationNo} onChange={(e) => setCommunityForm((f) => ({ ...f, registrationNo: e.target.value }))} />
              <Input type="date" value={communityForm.expiryDate} onChange={(e) => setCommunityForm((f) => ({ ...f, expiryDate: e.target.value }))} />
            </div>
            <Button size="sm" disabled={busy} onClick={() => run(() => addScCommunityRegistration(communityForm), "Community added")}>
              <Plus className="h-4 w-4 mr-1" /> Add registration
            </Button>
          </CardContent>
        </Card>
      </Surface>

      <Surface>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Reference projects</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(ext?.references || []).map((ref) => (
              <div key={ref.uuid} className="rounded border p-2 flex justify-between gap-2 text-sm">
                <span>{ref.clientName} · {ref.yearCompleted || "—"} · {ref.scopeDescription || ""}</span>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => deleteScOrganizationReference(ref.uuid), "Removed")}>Remove</Button>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Client" value={refForm.clientName} onChange={(e) => setRefForm((f) => ({ ...f, clientName: e.target.value }))} />
              <Input placeholder="Value (AED)" value={refForm.projectValue} onChange={(e) => setRefForm((f) => ({ ...f, projectValue: e.target.value }))} />
              <Input placeholder="Year" value={refForm.yearCompleted} onChange={(e) => setRefForm((f) => ({ ...f, yearCompleted: e.target.value }))} />
              <Input placeholder="Scope" value={refForm.scopeDescription} onChange={(e) => setRefForm((f) => ({ ...f, scopeDescription: e.target.value }))} />
            </div>
            <Button size="sm" disabled={busy} onClick={() => run(() => addScOrganizationReference({
              ...refForm,
              projectValue: refForm.projectValue ? Number(refForm.projectValue) : undefined,
              yearCompleted: refForm.yearCompleted ? Number(refForm.yearCompleted) : undefined,
            }), "Reference added")}>
              <Plus className="h-4 w-4 mr-1" /> Add reference
            </Button>
          </CardContent>
        </Card>
      </Surface>

      <p className="text-xs text-muted-foreground">
        Additional certifications (ISO, municipality): upload via Company profile compliance section — types: {EXTRA_COMPLIANCE.join(", ")}.
      </p>
    </PageShell>
  );
}
