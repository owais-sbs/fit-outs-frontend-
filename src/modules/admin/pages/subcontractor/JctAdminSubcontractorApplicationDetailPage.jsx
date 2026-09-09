import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Building2, User, FileText, CheckCircle2, XCircle, Clock, ShieldCheck, Download, Eye, AlertTriangle, History, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/layout/PageShell";
import { getApplicationById, updateApplicationStatus, updateDocumentStatus } from "@/modules/subcontractor/mock/subcontractorOnboardingMock";

export default function JctAdminSubcontractorApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);

  // Modals state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [tierRating, setTierRating] = useState("TIER_1");
  const [rejectError, setRejectError] = useState("");

  useEffect(() => {
    if (id) {
      setApplication(getApplicationById(id));
    }
  }, [id]);

  if (!application) {
    return (
      <PageShell>
        <div className="text-center py-12 text-sm text-muted-foreground">Loading application details…</div>
      </PageShell>
    );
  }

  // Toggle Document Status (Approve/Reject individual doc)
  const handleToggleDocStatus = (docId, newStatus) => {
    const updated = updateDocumentStatus(application.id, docId, newStatus);
    setApplication(updated);
  };

  // Confirm Final Approval
  const handleConfirmApproval = () => {
    const updated = updateApplicationStatus(
      application.id,
      "VERIFIED",
      `Prequalification approved. Assigned tier: ${tierRating}`,
      "JCT Procurement Admin"
    );
    setApplication(updated);
    setShowApproveModal(false);
  };

  // Confirm Final Rejection
  const handleConfirmRejection = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectError("Rejection reason is required before rejecting the application.");
      return;
    }
    const updated = updateApplicationStatus(
      application.id,
      "REJECTED",
      rejectionReason,
      "JCT Procurement Admin"
    );
    setApplication(updated);
    setShowRejectModal(false);
    setRejectionReason("");
    setRejectError("");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs px-3 py-1">Verified Subcontractor</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-xs px-3 py-1">Application Rejected</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs px-3 py-1">Under Review</Badge>;
    }
  };

  return (
    <PageShell>
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs">
          <Link to="/admin/subcontractors/applications">
            <ArrowLeft className="h-4 w-4" /> Back to Applications Queue
          </Link>
        </Button>
      </div>

      {/* Header Banner */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                {application.legalName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{application.legalName}</h1>
                  {getStatusBadge(application.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  CR Number: <span className="font-mono text-foreground font-semibold">{application.crNumber}</span> • Registered on {new Date(application.registeredAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(true)}
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <XCircle className="h-4 w-4 mr-1" /> Reject Application
              </Button>

              <Button
                size="sm"
                onClick={() => setShowApproveModal(true)}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve Application
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rejection / Approval Banner info if processed */}
      {application.status === "VERIFIED" && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <span className="font-semibold block">Subcontractor Verified & Prequalified</span>
            <span>Verified by {application.verifiedBy || "JCT Procurement Admin"} on {new Date(application.verifiedAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {application.status === "REJECTED" && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-300">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Application Rejected</span>
            <span>Reason: {application.rejectionReason}</span>
          </div>
        </div>
      )}

      {/* Main Review Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Company Info */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> 1. Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">Legal Name</span>
                  <span className="font-semibold text-foreground">{application.legalName}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">Trade Name</span>
                  <span className="font-semibold text-foreground">{application.tradeName || "—"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">CR Number</span>
                  <span className="font-mono font-semibold text-foreground">{application.crNumber}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">VAT ID / TRN</span>
                  <span className="font-mono font-semibold text-foreground">{application.vatId || "N/A"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">Contact Email</span>
                  <span className="font-medium text-foreground">{application.contactEmail}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">Contact Phone</span>
                  <span className="font-medium text-foreground">{application.contactPhone}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/40 border">
                <span className="text-muted-foreground block text-[11px]">Office Address</span>
                <span className="font-medium text-foreground">{application.officeAddress}</span>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Trade Specializations */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">2. Trade Specializations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(application.tradeSpecializations || []).map((t) => (
                  <Badge key={t} className="bg-primary/10 text-primary border-primary/20 py-1 px-3 text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Compliance Documents Table with Verification Toggles */}
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 md:p-6 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> 3. Compliance Documents Review
              </CardTitle>
              <CardDescription className="text-xs">
                Inspect uploaded trade licenses and certificates. Mark individual documents as Approved or Rejected.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Document Type</TableHead>
                      <TableHead className="text-xs">File</TableHead>
                      <TableHead className="text-xs">Expiry</TableHead>
                      <TableHead className="text-xs">Doc Status</TableHead>
                      <TableHead className="text-xs text-right">Verification Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(application.documents || []).map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium text-xs text-foreground">{doc.type}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[140px]">
                          {doc.filename}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{doc.expiryDate || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              doc.status === "Approved"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-none text-[10px]"
                                : doc.status === "Expired" || doc.status === "Rejected"
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-none text-[10px]"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-none text-[10px]"
                            }
                          >
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant={doc.status === "Approved" ? "default" : "outline"}
                              className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                              onClick={() => handleToggleDocStatus(doc.id, "Approved")}
                              title="Approve Document"
                            >
                              <Check className="h-3 w-3" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant={doc.status === "Rejected" ? "destructive" : "outline"}
                              className="h-7 text-[11px] px-2"
                              onClick={() => handleToggleDocStatus(doc.id, "Rejected")}
                              title="Reject Document"
                            >
                              <X className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Primary Admin & Audit Trail */}
        <div className="space-y-6">
          {/* Primary Admin Card */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Primary Subcontractor Admin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Full Name</span>
                <span className="font-semibold text-foreground text-sm">{application.primaryAdmin?.fullName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Email</span>
                <span className="font-medium text-foreground">{application.primaryAdmin?.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Phone</span>
                <span className="font-medium text-foreground">{application.primaryAdmin?.phone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Verification History Log */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Verification Audit History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(application.verificationHistory || []).map((h, i) => (
                <div key={i} className="text-xs border-l-2 border-primary/40 pl-3 py-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{h.action}</span>
                    <span className="text-[10px] text-muted-foreground">{h.date}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">By {h.actor}</p>
                  {h.notes && <p className="text-[11px] italic text-muted-foreground">{h.notes}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve & Verify Subcontractor</DialogTitle>
            <DialogDescription className="text-xs">
              Confirm prequalification approval for <span className="font-semibold text-foreground">{application.legalName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Assign Prequalification Vendor Tier *</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                value={tierRating}
                onChange={(e) => setTierRating(e.target.value)}
              >
                <option value="TIER_1">Tier 1 — High Capacity / Preferred Vendor</option>
                <option value="TIER_2">Tier 2 — Standard Commercial Trade Vendor</option>
                <option value="TIER_3">Tier 3 — Specialized / Small Scope Vendor</option>
              </select>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Upon approval, this firm will be marked as <Badge className="bg-emerald-500/15 text-emerald-600 border-none text-[10px]">Verified</Badge> and can be invited to RFQs.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmApproval} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Reject Application</DialogTitle>
            <DialogDescription className="text-xs">
              Please provide a specific rejection reason for <span className="font-semibold text-foreground">{application.legalName}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRejection} className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-rose-600">Rejection Reason / Correction Notes *</Label>
              <Textarea
                placeholder="Specify missing documents, expired trade license, or failed prequalification criteria..."
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                className="text-xs h-24"
                required
              />
              {rejectError && <p className="text-[11px] text-rose-500">{rejectError}</p>}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="destructive">
                Reject Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
