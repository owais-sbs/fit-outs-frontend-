import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Eye,
} from "lucide-react";
import { Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { resolveFileUrl } from "@/modules/admin/api/documents.api";
import { fetchCoverLetterBranding } from "@/modules/admin/api/cover-letter-branding.api";
import {
  fetchPackageContract,
  signPackageContract,
  adminSignPackageContract,
  fetchSubcontractorSignature,
  uploadSubcontractorSignature,
  fetchScAwardPack,
  mapAwardPackToContract,
  scApiError,
  isScAwardPackMissingError,
} from "@/modules/admin/api/subcontractor.api";

const STATUS = {
  WAITING_FOR_ADMIN_SIGNATURE: "WAITING_FOR_ADMIN_SIGNATURE",
  WAITING_FOR_CONTRACTOR_SIGNATURE: "WAITING_FOR_CONTRACTOR_SIGNATURE",
  SIGNED_AND_EXECUTED: "SIGNED_AND_EXECUTED",
};

const IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/gif";

function contractStatusOf(contract) {
  if (!contract) return STATUS.WAITING_FOR_ADMIN_SIGNATURE;
  if (contract.contractStatus) return contract.contractStatus;
  if (contract.signed) return STATUS.SIGNED_AND_EXECUTED;
  if (contract.adminSigned) return STATUS.WAITING_FOR_CONTRACTOR_SIGNATURE;
  return STATUS.WAITING_FOR_ADMIN_SIGNATURE;
}

function normalizeSignature(sigData) {
  if (!sigData) return { uploaded: false, url: null };
  if (typeof sigData === "string") {
    return { uploaded: true, url: resolveFileUrl(sigData) };
  }
  const url = sigData.signatureUrl ? resolveFileUrl(sigData.signatureUrl) : null;
  return {
    uploaded: Boolean(sigData.signatureUploaded) || Boolean(url),
    url,
  };
}

function isCoverLetterConfigError(message) {
  const text = String(message || "");
  return /Cover Letter/i.test(text) || /digital signature is not configured/i.test(text);
}

function PdfActions({ filePath, executed }) {
  const href = resolveFileUrl(filePath);
  if (!href) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3 bg-background">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="h-5 w-5 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium">
            {executed ? "View / Download Executed Contract PDF" : "Subcontract Agreement PDF"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {executed
              ? "Final executed PDF with both Admin and Subcontractor signatures"
              : "Stage 1 PDF with Admin signature"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" asChild className="text-xs">
          <a href={href} target="_blank" rel="noopener noreferrer">
            <Eye className="h-3.5 w-3.5 mr-1" /> View Contract PDF
          </a>
        </Button>
        <Button size="sm" variant="outline" asChild className="text-xs">
          <a href={href} download>
            <Download className="h-3.5 w-3.5 mr-1" /> Download Contract PDF
          </a>
        </Button>
      </div>
    </div>
  );
}

export default function ContractSection({ packageUuid, projectId }) {
  const { user, role } = useAuth();
  const isAdminUser = role !== "subcontractor";

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [subSignatureUploaded, setSubSignatureUploaded] = useState(false);
  const [subSignatureUrl, setSubSignatureUrl] = useState(null);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [sigUploadError, setSigUploadError] = useState("");

  const [adminSigUrl, setAdminSigUrl] = useState(null);
  const [adminSigConfigured, setAdminSigConfigured] = useState(false);

  const [signModalOpen, setSignModalOpen] = useState(false);
  const [adminSignModalOpen, setAdminSignModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signError, setSignError] = useState("");

  const [signatureName, setSignatureName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const sigFileInputRef = useRef(null);

  const applyContract = useCallback((data) => {
    if (!data) {
      setContract(null);
      return;
    }
    setContract(data);
    if (data.subcontractorSignatureUploaded || data.subcontractorSignatureUrl) {
      setSubSignatureUploaded(Boolean(data.subcontractorSignatureUploaded) || Boolean(data.subcontractorSignatureUrl));
      setSubSignatureUrl(data.subcontractorSignatureUrl ? resolveFileUrl(data.subcontractorSignatureUrl) : null);
    }
  }, []);

  const loadContract = useCallback(async () => {
    if (!packageUuid) return;
    setLoading(true);
    setError("");
    try {
      if (isAdminUser) {
        const pid = projectId;
        if (!pid) {
          throw new Error("Project ID is required to load the subcontract agreement.");
        }
        const pack = await fetchScAwardPack(pid, packageUuid);
        applyContract(mapAwardPackToContract(pack));
      } else {
        const data = await fetchPackageContract(packageUuid);
        applyContract(data);
      }
    } catch (err) {
      setContract(null);
      // Unawarded packages should show an empty state, not a red server error.
      if (isScAwardPackMissingError(err)) {
        setError("");
      } else {
        setError(scApiError(err, "Failed to load contract details"));
      }
    } finally {
      setLoading(false);
    }
  }, [packageUuid, projectId, isAdminUser, applyContract]);

  const loadSubSignature = useCallback(async () => {
    if (isAdminUser) return;
    try {
      const sigData = await fetchSubcontractorSignature();
      const normalized = normalizeSignature(sigData);
      setSubSignatureUploaded(normalized.uploaded);
      setSubSignatureUrl(normalized.url);
    } catch {
      // Signature endpoint is independent of contract load.
    }
  }, [isAdminUser]);

  const loadAdminSignatureConfig = useCallback(async () => {
    if (!isAdminUser) return;
    try {
      const branding = await fetchCoverLetterBranding();
      const url = branding?.signatureUrl ? resolveFileUrl(branding.signatureUrl) : null;
      setAdminSigUrl(url);
      setAdminSigConfigured(Boolean(url));
    } catch {
      setAdminSigUrl(null);
      setAdminSigConfigured(false);
    }
  }, [isAdminUser]);

  useEffect(() => {
    loadContract();
    if (!isAdminUser) {
      loadSubSignature();
    } else {
      loadAdminSignatureConfig();
    }
  }, [loadContract, loadSubSignature, loadAdminSignatureConfig, isAdminUser]);

  useEffect(() => {
    if (signModalOpen || adminSignModalOpen) {
      setSignatureName((current) => current || user?.fullName || user?.name || "");
      setSignError("");
    }
  }, [signModalOpen, adminSignModalOpen, user]);

  const handleSigFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!String(file.type || "").toLowerCase().startsWith("image/")) {
      setSigUploadError("Upload a PNG or JPG image");
      if (e.target) e.target.value = "";
      return;
    }

    setUploadingSig(true);
    setSigUploadError("");
    try {
      await uploadSubcontractorSignature(file);
      const sigData = await fetchSubcontractorSignature();
      const normalized = normalizeSignature(sigData);
      setSubSignatureUploaded(normalized.uploaded);
      setSubSignatureUrl(normalized.url);
      await loadContract();
    } catch (err) {
      setSigUploadError(scApiError(err, "Failed to upload digital signature"));
    } finally {
      setUploadingSig(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleAdminSignSubmit = async (e) => {
    e.preventDefault();
    const effectiveProjectId = projectId || contract?.projectId;
    if (!effectiveProjectId) {
      setSignError("Project ID missing for admin signing.");
      return;
    }
    setSubmitting(true);
    setSignError("");
    try {
      const payload = {
        signatureName: signatureName.trim() || undefined,
        signerTitle: signerTitle.trim() || undefined,
      };
      const signed = await adminSignPackageContract(effectiveProjectId, packageUuid, payload);
      setAdminSignModalOpen(false);
      applyContract(signed);
      await loadContract();
    } catch (err) {
      setSignError(scApiError(err, "Failed to sign contract as Admin"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubSignSubmit = async (e) => {
    e.preventDefault();
    if (!signatureName.trim() || !declarationAccepted) return;
    setSubmitting(true);
    setSignError("");
    try {
      const signed = await signPackageContract(packageUuid, {
        signatureName: signatureName.trim(),
        signerTitle: signerTitle.trim() || undefined,
        declarationAccepted: true,
      });
      setSignModalOpen(false);
      applyContract(signed);
      await loadContract();
    } catch (err) {
      setSignError(scApiError(err, "Failed to sign contract"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!packageUuid) {
    return (
      <Surface className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Select a package to view the subcontract agreement.</p>
      </Surface>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    const noAward = /no (subcontract )?award|award recorded|not awarded/i.test(error);
    if (noAward) {
      return (
        <Surface className="p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium">No award yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Award this package first. A digital subcontract is created when the package is awarded.
          </p>
        </Surface>
      );
    }
    return (
      <Surface className="p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive">{error}</p>
        {isCoverLetterConfigError(error) && (
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link to={ROUTES.ADMIN.COVER_LETTER_CONFIG}>Go to Project Configuration → Cover Letter</Link>
          </Button>
        )}
        <Button variant="outline" size="sm" className="mt-4 ml-2" onClick={loadContract}>
          Retry
        </Button>
      </Surface>
    );
  }

  if (!contract) {
    return (
      <Surface className="p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">No award yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Award this package first. A digital subcontract is created when the package is awarded.
        </p>
      </Surface>
    );
  }

  const rawStatus = contractStatusOf(contract);
  const isFullyExecuted = rawStatus === STATUS.SIGNED_AND_EXECUTED;
  const isWaitingForSub = rawStatus === STATUS.WAITING_FOR_CONTRACTOR_SIGNATURE;
  const isWaitingForAdmin = rawStatus === STATUS.WAITING_FOR_ADMIN_SIGNATURE;
  const canViewPdf = Boolean(contract.contractFilePath) && (contract.contractAvailable !== false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Subcontract Agreement</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Two-party digital subcontract for {contract.packageName || "this package"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={loadContract} className="h-8 px-2">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Badge
              variant={isFullyExecuted ? "default" : isWaitingForSub ? "secondary" : "outline"}
              className={`text-xs ${
                isFullyExecuted
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                  : isWaitingForSub
                    ? "bg-blue-500/10 text-blue-700 border-blue-200"
                    : "bg-amber-500/10 text-amber-700 border-amber-200"
              }`}
            >
              {isFullyExecuted ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Signed & Executed
                </span>
              ) : isWaitingForSub ? (
                "Waiting for Contractor to Sign"
              ) : (
                "Waiting for Admin to Sign"
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-[11px] font-mono text-muted-foreground">
            Contract Status: {rawStatus}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg border">
            <div>
              <p className="text-xs text-muted-foreground">Package Name</p>
              <p className="font-medium">{contract.packageName || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Awarded Value</p>
              <p className="font-medium text-emerald-600 dark:text-emerald-400">
                {contract.awardedValue != null ? `AED ${Number(contract.awardedValue).toLocaleString()}` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Award Date</p>
              <p className="font-medium">
                {contract.awardedAt ? new Date(contract.awardedAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subcontractor Org</p>
              <p className="font-medium">{contract.organizationName || "N/A"}</p>
            </div>
          </div>

          {canViewPdf && <PdfActions filePath={contract.contractFilePath} executed={isFullyExecuted} />}

          {/* Signature Summary Grid Layout: LEFT = ADMIN, RIGHT = SUBCONTRACTOR */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Two-Party Execution Status
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* LEFT COLUMN: ADMIN */}
              <div className={`p-3 rounded-lg border ${contract.adminSigned ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-foreground">ADMIN</span>
                  {contract.adminSigned ? (
                    <Badge className="bg-emerald-600 text-white text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Admin Signature ✓
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700">
                      Pending
                    </Badge>
                  )}
                </div>
                {contract.adminSigned ? (
                  <div className="space-y-0.5 text-muted-foreground">
                    {contract.adminSignerName && (
                      <p>
                        Signed By: <strong className="text-foreground">{contract.adminSignerName}</strong>
                        {contract.adminSignerTitle ? ` (${contract.adminSignerTitle})` : ""}
                      </p>
                    )}
                    <p>Signed At: {contract.adminSignedAt ? new Date(contract.adminSignedAt).toLocaleString() : "N/A"}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Waiting for Admin Signature</p>
                )}
              </div>

              {/* RIGHT COLUMN: SUBCONTRACTOR */}
              <div className={`p-3 rounded-lg border ${contract.signed ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-foreground">SUBCONTRACTOR</span>
                  {contract.signed ? (
                    <Badge className="bg-emerald-600 text-white text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Subcontractor Signature ✓
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700">
                      Pending
                    </Badge>
                  )}
                </div>
                {contract.signed ? (
                  <div className="space-y-0.5 text-muted-foreground">
                    {contract.subcontractorSignerName && (
                      <p>
                        Signed By: <strong className="text-foreground">{contract.subcontractorSignerName}</strong>
                        {contract.subcontractorSignerTitle ? ` (${contract.subcontractorSignerTitle})` : ""}
                      </p>
                    )}
                    <p>Signed At: {contract.signedAt ? new Date(contract.signedAt).toLocaleString() : "N/A"}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Waiting for Subcontractor Signature</p>
                )}
              </div>
            </div>
          </div>

          {isFullyExecuted && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Signed & Executed</p>
                  <p className="text-xs text-muted-foreground">
                    Both parties have executed this digital subcontract. The final PDF contains both signatures.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN ACTION BLOCK */}
          {isAdminUser && isWaitingForAdmin && (
            <div className="space-y-3 border rounded-lg p-4 bg-background">
              <p className="text-sm font-semibold text-foreground">Sign Contractor</p>
              <p className="text-xs text-muted-foreground">
                Your configured Cover Letter digital signature will be applied to this contract.
              </p>

              {!adminSigConfigured ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-2">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Digital signature not configured
                  </p>
                  <p className="text-muted-foreground">
                    Please configure a digital signature in Project Configuration → Cover Letter before signing.
                  </p>
                  <Button size="sm" variant="outline" asChild className="text-xs mt-1">
                    <Link to={ROUTES.ADMIN.COVER_LETTER_CONFIG}>Go to Project Configuration → Cover Letter</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border">
                  {adminSigUrl && (
                    <img src={adminSigUrl} alt="Configured Cover Letter signature" className="h-10 object-contain border rounded p-1 bg-white" />
                  )}
                  <span className="text-xs text-muted-foreground">Cover Letter digital signature on file</span>
                </div>
              )}

              <Button
                size="sm"
                disabled={!adminSigConfigured}
                onClick={() => setAdminSignModalOpen(true)}
              >
                Sign Contract
              </Button>
            </div>
          )}

          {isAdminUser && isWaitingForSub && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-blue-800 dark:text-blue-300">
                <Clock className="h-4 w-4" /> Waiting for Contractor to Sign
              </div>
              <p className="text-xs text-muted-foreground">
                Admin Signature is recorded
                {contract.adminSignerName ? ` (${contract.adminSignerName})` : ""}
                {contract.adminSignedAt ? ` on ${new Date(contract.adminSignedAt).toLocaleString()}` : ""}.
                Refresh this section after the subcontractor signs to see Signed & Executed.
              </p>
            </div>
          )}

          {/* SUBCONTRACTOR ACTION BLOCK */}
          {!isAdminUser && isWaitingForAdmin && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-1">
              <div className="flex items-center gap-2 font-semibold text-sm text-amber-800 dark:text-amber-300">
                <Clock className="h-4 w-4" /> Waiting for Admin to Sign
              </div>
              <p className="text-xs text-muted-foreground">
                You cannot sign until the Admin has applied their Cover Letter digital signature.
              </p>
            </div>
          )}

          {!isAdminUser && isWaitingForSub && (
            <div className="space-y-4 border rounded-lg p-4 bg-background">
              <div>
                <p className="text-sm font-semibold text-foreground">Contract Ready for Your Signature</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Admin signature is on the Stage 1 PDF. Upload your digital signature, then sign the agreement.
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">Your Digital Signature</p>
                  {subSignatureUploaded && (
                    <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">
                      Digital signature uploaded
                    </Badge>
                  )}
                </div>

                {sigUploadError && (
                  <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{sigUploadError}</p>
                )}

                {!subSignatureUploaded ? (
                  <div className="space-y-2 text-xs">
                    <p className="text-muted-foreground">
                      Please upload your digital signature before signing.
                    </p>
                    <input
                      type="file"
                      ref={sigFileInputRef}
                      accept={IMAGE_ACCEPT}
                      className="hidden"
                      onChange={handleSigFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingSig}
                      onClick={() => sigFileInputRef.current?.click()}
                    >
                      {uploadingSig ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2 text-primary" />}
                      Upload Digital Signature
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-background p-3 rounded-lg border gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {subSignatureUrl && (
                        <img src={subSignatureUrl} alt="Uploaded digital signature" className="h-10 object-contain border rounded p-1 bg-white" />
                      )}
                      <span className="text-xs text-muted-foreground">Uploaded signature preview</span>
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={sigFileInputRef}
                        accept={IMAGE_ACCEPT}
                        className="hidden"
                        onChange={handleSigFileChange}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        disabled={uploadingSig}
                        onClick={() => sigFileInputRef.current?.click()}
                      >
                        {uploadingSig ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                        Replace Signature
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {subSignatureUploaded ? (
                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setSignModalOpen(true)}>
                    Sign Agreement
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
                  Please upload your digital signature before signing.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Sign Confirmation Modal */}
      <Dialog open={adminSignModalOpen} onOpenChange={setAdminSignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Contract</DialogTitle>
            <DialogDescription className="text-xs">
              Your configured Cover Letter digital signature will be applied to this contract. No signature image is uploaded from this screen.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdminSignSubmit} className="space-y-4 py-2 text-xs">
            {signError && (
              <div className="p-2.5 text-xs text-destructive bg-destructive/10 border rounded space-y-2">
                <p>{signError}</p>
                {isCoverLetterConfigError(signError) && (
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link to={ROUTES.ADMIN.COVER_LETTER_CONFIG}>Go to Project Configuration → Cover Letter</Link>
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Signer name</Label>
              <Input
                className="h-9 text-xs"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder={user?.name || "Admin representative"}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Signer title</Label>
              <Input
                className="h-9 text-xs"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="e.g. Project Director"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setAdminSignModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Sign Contract
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subcontractor Sign Agreement Modal */}
      <Dialog open={signModalOpen} onOpenChange={setSignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Agreement</DialogTitle>
            <DialogDescription className="text-xs">
              Your uploaded digital signature will be applied to package <strong>{contract.packageName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubSignSubmit} className="space-y-4 py-2">
            {signError && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                {signError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="sigName" className="text-xs">Authorized signer full name *</Label>
              <Input
                id="sigName"
                placeholder="e.g. John Doe"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sigTitle" className="text-xs">Title / designation</Label>
              <Input
                id="sigTitle"
                placeholder="e.g. Managing Director"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
              />
            </div>

            {subSignatureUrl && (
              <div className="p-3 bg-muted/40 border rounded-lg text-xs space-y-1">
                <p className="text-muted-foreground font-semibold">Uploaded signature image</p>
                <img src={subSignatureUrl} alt="Digital signature preview" className="h-10 object-contain border rounded p-1 bg-white" />
              </div>
            )}

            <div className="flex items-start space-x-2 pt-2 border-t">
              <Checkbox
                id="decAccepted"
                checked={declarationAccepted}
                onCheckedChange={(checked) => setDeclarationAccepted(Boolean(checked))}
                required
              />
              <Label htmlFor="decAccepted" className="text-xs font-normal leading-tight text-muted-foreground">
                I declare that I am an authorized representative of{" "}
                <strong className="text-foreground">{contract.organizationName || "the subcontractor organization"}</strong>{" "}
                and I accept this subcontract using our uploaded digital signature.
              </Label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setSignModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!signatureName.trim() || !declarationAccepted || submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign Agreement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
