import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search, UserPlus } from "lucide-react";
import { PageShell, PageTitle, StatTile } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchScVendors,
  inviteScVendor,
  reviewScVendorPrequalification,
} from "../../api/subcontractor.api";

const STATUS_OPTIONS = [
  "ALL",
  "INVITED",
  "REGISTERED",
  "UNDER_REVIEW",
  "APPROVED",
  "CONDITIONAL",
  "SUSPENDED",
  "BLACKLISTED",
];

const REVIEW_STATUS_OPTIONS = [
  "UNDER_REVIEW",
  "APPROVED",
  "CONDITIONAL",
  "SUSPENDED",
  "BLACKLISTED",
];

const STATUS_VARIANT = {
  INVITED: "secondary",
  REGISTERED: "outline",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  CONDITIONAL: "default",
  SUSPENDED: "destructive",
  BLACKLISTED: "destructive",
};

function formatStatus(status = "") {
  return status.replace(/_/g, " ");
}

function normalizeVendor(item = {}) {
  return {
    organizationUuid: item.organizationUuid || item.organization_uuid || "",
    legalCompanyName: item.legalCompanyName || item.legal_company_name || "—",
    primaryContactEmail: item.primaryContactEmail || item.primary_contact_email || "",
    status: item.status || "INVITED",
    complianceStatus: item.complianceStatus || item.compliance_status || "—",
    approvedTrades: item.approvedTrades || item.approved_trades || [],
    maxPackageValue: item.maxPackageValue ?? item.max_package_value ?? null,
    prequalificationNotes: item.prequalificationNotes || item.prequalification_notes || "",
    reviewedAt: item.reviewedAt || item.reviewed_at || null,
  };
}

export default function VendorListPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    companyName: "",
    fullName: "",
    email: "",
    phone: "",
  });

  const [reviewForm, setReviewForm] = useState({
    status: "APPROVED",
    notes: "",
    approvedTrades: "",
    maxPackageValue: "",
  });

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const status = statusFilter === "ALL" ? undefined : statusFilter;
      const data = await fetchScVendors(status);
      setVendors((Array.isArray(data) ? data : []).map(normalizeVendor));
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to load vendors");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const stats = useMemo(() => ({
    total: vendors.length,
    approved: vendors.filter((v) => v.status === "APPROVED" || v.status === "CONDITIONAL").length,
    pending: vendors.filter((v) =>
      ["INVITED", "REGISTERED", "UNDER_REVIEW"].includes(v.status)).length,
  }), [vendors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) =>
      v.legalCompanyName.toLowerCase().includes(q)
      || v.primaryContactEmail.toLowerCase().includes(q));
  }, [vendors, search]);

  const openReview = (vendor) => {
    setSelected(vendor);
    setReviewForm({
      status: vendor.status === "INVITED" || vendor.status === "REGISTERED"
        ? "UNDER_REVIEW"
        : vendor.status,
      notes: vendor.prequalificationNotes || "",
      approvedTrades: (vendor.approvedTrades || []).join(", "),
      maxPackageValue: vendor.maxPackageValue != null ? String(vendor.maxPackageValue) : "",
    });
    setReviewOpen(true);
  };

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) {
      setMessage("Email is required to send an invite.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await inviteScVendor({
        companyName: inviteForm.companyName.trim() || undefined,
        fullName: inviteForm.fullName.trim() || undefined,
        email: inviteForm.email.trim(),
        phone: inviteForm.phone.trim() || undefined,
      });
      setInviteOpen(false);
      setInviteForm({ companyName: "", fullName: "", email: "", phone: "" });
      setMessage("Invite sent — subcontractor will receive a portal setup email.");
      await loadVendors();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Invite failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async () => {
    if (!selected?.organizationUuid) return;
    setSaving(true);
    setMessage("");
    try {
      const approvedTrades = reviewForm.approvedTrades
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await reviewScVendorPrequalification(selected.organizationUuid, {
        status: reviewForm.status,
        notes: reviewForm.notes.trim() || undefined,
        approvedTrades: approvedTrades.length ? approvedTrades : undefined,
        maxPackageValue: reviewForm.maxPackageValue
          ? Number(reviewForm.maxPackageValue)
          : undefined,
      });
      setReviewOpen(false);
      setSelected(null);
      setMessage("Prequalification review saved.");
      await loadVendors();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Review failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <PageTitle
        title="Subcontractor vendors"
        subtitle="Invite-only onboarding. QS and PM can review prequalification."
        actions={
          <Button size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite vendor
          </Button>
        }
      />

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total vendors" value={stats.total} icon={Building2} />
        <StatTile label="Approved / conditional" value={stats.approved} />
        <StatTile label="Pending review" value={stats.pending} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search company or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "ALL" ? "All statuses" : formatStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Prequal status</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No vendors found. Send an invite to onboard a subcontractor.
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.map((vendor) => (
                <TableRow key={vendor.organizationUuid}>
                  <TableCell className="font-medium">{vendor.legalCompanyName}</TableCell>
                  <TableCell>{vendor.primaryContactEmail || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[vendor.status] || "secondary"}>
                      {formatStatus(vendor.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{vendor.complianceStatus}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openReview(vendor)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite subcontractor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Registration is invite-only. The contact receives an email to set their portal password.
          </p>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Company name</Label>
              <Input
                value={inviteForm.companyName}
                onChange={(e) => setInviteForm((f) => ({ ...f, companyName: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Contact name</Label>
              <Input
                value={inviteForm.fullName}
                onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input
                value={inviteForm.phone}
                onChange={(e) => setInviteForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={saving} className="gap-2">
              <Plus className="h-4 w-4" />
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prequalification review</DialogTitle>
          </DialogHeader>
          {selected && (
            <p className="text-sm text-muted-foreground">
              {selected.legalCompanyName} · {selected.primaryContactEmail}
            </p>
          )}
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Decision</Label>
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
            <div className="grid gap-1.5">
              <Label>Approved trades (comma-separated)</Label>
              <Input
                value={reviewForm.approvedTrades}
                onChange={(e) => setReviewForm((f) => ({ ...f, approvedTrades: e.target.value }))}
                placeholder="e.g. MEP, Joinery"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Max package value (AED)</Label>
              <Input
                type="number"
                min="0"
                value={reviewForm.maxPackageValue}
                onChange={(e) => setReviewForm((f) => ({ ...f, maxPackageValue: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={reviewForm.notes}
                onChange={(e) => setReviewForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleReview} disabled={saving}>
              Save review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
