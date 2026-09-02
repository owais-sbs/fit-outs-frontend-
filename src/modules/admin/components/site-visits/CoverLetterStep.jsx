import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { buildDefaultSubject } from "../../data/jctCoverLetterCopy";
import CoverLetterTemplate from "./CoverLetterTemplate";
import AppendixPicker from "./AppendixPicker";
import { fetchCoverLetterBranding } from "../../api/cover-letter-branding.api";
import {
  clearVisitCoverSignature,
  clearVisitCoverStamp,
  uploadVisitCoverSignature,
  uploadVisitCoverStamp,
} from "../../api/site-visit-estimate.api";
import { Stamp } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { Link } from "react-router-dom";

function mergeBranding(estimate, saved) {
  return {
    ...estimate,
    includeStamp: saved.includeStamp !== false,
    includeSignature: saved.includeSignature !== false,
    stampImageUrl: saved.stampImageUrl || "",
    signatureImageUrl: saved.signatureImageUrl || "",
  };
}

function BrandingPreview({ label, src, included }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div
        className={`flex h-24 items-center justify-center rounded-md border bg-muted/20 p-2 ${
          src && !included ? "opacity-40" : ""
        }`}
      >
        {src ? (
          <img src={src} alt={label} className="max-h-full max-w-full object-contain" />
        ) : (
          <p className="text-[11px] text-muted-foreground">None uploaded</p>
        )}
      </div>
      {src && !included ? (
        <p className="text-[10px] text-muted-foreground">Hidden on this letter</p>
      ) : null}
    </div>
  );
}

export default function CoverLetterStep({
  visitId,
  estimate,
  onChange,
  disabled = false,
  previewRef,
}) {
  const [branding, setBranding] = useState({ stampUrl: "", signatureUrl: "" });
  const [uploading, setUploading] = useState("");

  useEffect(() => {
    fetchCoverLetterBranding()
      .then(setBranding)
      .catch(() => setBranding({ stampUrl: "", signatureUrl: "" }));
  }, []);

  const updateField = (field, value) => {
    if (disabled) return;
    const next = { ...estimate, [field]: value };
    if (field === "locationLabel" && (!estimate.subject || estimate.subject.includes("TURNKEY"))) {
      next.subject = buildDefaultSubject(value);
    }
    onChange?.(next);
  };

  const includeStamp = estimate?.includeStamp !== false;
  const includeSignature = estimate?.includeSignature !== false;
  const hasStampOverride = Boolean(estimate?.stampImageUrl);
  const hasSignatureOverride = Boolean(estimate?.signatureImageUrl);
  const stampSrc = includeStamp ? (estimate?.stampImageUrl || branding.stampUrl || "") : "";
  const signatureSrc = includeSignature
    ? (estimate?.signatureImageUrl || branding.signatureUrl || "")
    : "";
  const stampPreview = estimate?.stampImageUrl || branding.stampUrl || "";
  const signaturePreview = estimate?.signatureImageUrl || branding.signatureUrl || "";

  const handleVisitUpload = async (kind, file) => {
    if (!visitId || !file || disabled) return;
    setUploading(kind);
    try {
      const saved = kind === "stamp"
        ? await uploadVisitCoverStamp(visitId, file)
        : await uploadVisitCoverSignature(visitId, file);
      onChange?.(mergeBranding(estimate, saved));
    } finally {
      setUploading("");
    }
  };

  const handleUseCompanyDefault = async (kind) => {
    if (!visitId || disabled) return;
    setUploading(kind);
    try {
      const saved = kind === "stamp"
        ? await clearVisitCoverStamp(visitId)
        : await clearVisitCoverSignature(visitId);
      onChange?.(mergeBranding(estimate, saved));
    } finally {
      setUploading("");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.4fr)]">
      <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4">
        <h2 className="text-base font-semibold">Cover letter details</h2>
        <div className="space-y-2">
          <Label>Quote No.</Label>
          <Input
            value={estimate?.quoteNo || ""}
            disabled={disabled}
            onChange={(e) => updateField("quoteNo", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Valid until</Label>
            <Input
              type="date"
              value={estimate?.validUntil || ""}
              disabled={disabled}
              onChange={(e) => updateField("validUntil", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Revision</Label>
            <Input
              value={estimate?.revision || "R0"}
              disabled={disabled}
              onChange={(e) => updateField("revision", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Client name</Label>
          <Input
            value={estimate?.clientName || ""}
            disabled={disabled}
            onChange={(e) => updateField("clientName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Client address</Label>
          <Input
            value={estimate?.clientAddress || ""}
            disabled={disabled}
            onChange={(e) => updateField("clientAddress", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Project</Label>
          <Input
            value={estimate?.projectLabel || ""}
            disabled={disabled}
            onChange={(e) => updateField("projectLabel", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            value={estimate?.locationLabel || ""}
            disabled={disabled}
            onChange={(e) => updateField("locationLabel", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input
            value={estimate?.subject || ""}
            disabled={disabled}
            onChange={(e) => updateField("subject", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Prepared by (QS)</Label>
          <Input
            value={estimate?.preparedBy || ""}
            disabled={disabled}
            placeholder="Quantity Surveyor name"
            onChange={(e) => updateField("preparedBy", e.target.value)}
          />
        </div>

        <div className="space-y-3 rounded-md border border-border/60 bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Stamp and signature</p>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium" asChild>
              <Link to={ROUTES.ADMIN.COVER_LETTER_CONFIG}>
                <Stamp className="h-3.5 w-3.5" />
                Company defaults
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <BrandingPreview label="Stamp" src={stampPreview} included={includeStamp} />
            <BrandingPreview label="Signature" src={signaturePreview} included={includeSignature} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="include-stamp" className="text-sm font-normal">Include stamp</Label>
            <Switch
              id="include-stamp"
              checked={includeStamp}
              disabled={disabled}
              onCheckedChange={(checked) => updateField("includeStamp", checked)}
            />
          </div>
          {includeStamp && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex">
                <Button type="button" size="sm" variant="outline" disabled={disabled || uploading === "stamp"} asChild>
                  <span>{uploading === "stamp" ? "Uploading…" : "Replace for this visit"}</span>
                </Button>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  disabled={disabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) handleVisitUpload("stamp", file);
                  }}
                />
              </label>
              {hasStampOverride && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled || uploading === "stamp"}
                  onClick={() => handleUseCompanyDefault("stamp")}
                >
                  Use company default
                </Button>
              )}
              {!hasStampOverride && !branding.stampUrl && (
                <p className="text-[11px] text-muted-foreground">No company stamp uploaded yet.</p>
              )}
              {hasStampOverride && (
                <p className="text-[11px] text-muted-foreground">Using a visit-specific stamp.</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="include-signature" className="text-sm font-normal">Include signature</Label>
            <Switch
              id="include-signature"
              checked={includeSignature}
              disabled={disabled}
              onCheckedChange={(checked) => updateField("includeSignature", checked)}
            />
          </div>
          {includeSignature && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex">
                <Button type="button" size="sm" variant="outline" disabled={disabled || uploading === "signature"} asChild>
                  <span>{uploading === "signature" ? "Uploading…" : "Replace for this visit"}</span>
                </Button>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  disabled={disabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) handleVisitUpload("signature", file);
                  }}
                />
              </label>
              {hasSignatureOverride && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled || uploading === "signature"}
                  onClick={() => handleUseCompanyDefault("signature")}
                >
                  Use company default
                </Button>
              )}
              {!hasSignatureOverride && !branding.signatureUrl && (
                <p className="text-[11px] text-muted-foreground">No company signature uploaded yet.</p>
              )}
              {hasSignatureOverride && (
                <p className="text-[11px] text-muted-foreground">Using a visit-specific signature.</p>
              )}
            </div>
          )}
        </div>

        <AppendixPicker
          selectedIds={estimate?.selectedAppendixIds || []}
          disabled={disabled}
          onChange={(ids, appendices) =>
            onChange?.({
              ...estimate,
              selectedAppendixIds: ids,
              selectedAppendices: appendices || [],
            })
          }
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/60 bg-muted/20 p-4">
        <CoverLetterTemplate
          ref={previewRef}
          estimate={estimate}
          includeAppendix
          selectedAppendices={estimate?.selectedAppendices || []}
          stampSrc={stampSrc}
          signatureSrc={signatureSrc}
        />
      </div>
    </div>
  );
}
