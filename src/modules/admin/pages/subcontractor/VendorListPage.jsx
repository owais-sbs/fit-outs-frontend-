import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Copy, Link2, Plus, Search, UserPlus } from "lucide-react";
import { PageShell, PageTitle, StatTile } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  createScPublicRegistrationLink,
  fetchScVendors,
  inviteScVendor,
} from "../../api/subcontractor.api";
import { FillDemoDataButton } from "@/components/shared/FillDemoDataButton";
import { DEMO } from "@/shared/demo/formDemoData";
import VendorReviewDialog from "./VendorReviewDialog";

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
    tradeCategories: item.tradeCategories || item.trade_categories || [],
    approvedTrades: item.approvedTrades || item.approved_trades || [],
    maxPackageValue: item.maxPackageValue ?? item.max_package_value ?? null,
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
  const [publicLinkOpen, setPublicLinkOpen] = useState(false);
  const [publicLink, setPublicLink] = useState(null);
  const [reviewOrgUuid, setReviewOrgUuid] = useState(null);
  const [saving, setSaving] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    companyName: "",
    fullName: "",
    email: "",
    phone: "",
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
    setReviewOrgUuid(vendor.organizationUuid);
    setReviewOpen(true);
  };

  const handlePublicLink = async (regenerate = false) => {
    setSaving(true);
    setMessage("");
    try {
      const data = await createScPublicRegistrationLink(regenerate);
      const origin = window.location.origin;
      setPublicLink({
        ...data,
        fullUrl: `${origin}${data.path || `/register/subcontractor?token=${data.token}`}`,
      });
      setPublicLinkOpen(true);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to generate link");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!publicLink?.fullUrl) return;
    try {
      await navigator.clipboard.writeText(publicLink.fullUrl);
      setMessage("Public registration link copied.");
    } catch {
      setMessage(publicLink.fullUrl);
    }
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

  return (
    <PageShell>
      <PageTitle
        title="Subcontractor vendors"
        subtitle="Public self-registration or manual invite. QS reviews trades and documents."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-2" disabled={saving} onClick={() => handlePublicLink(false)}>
              <Link2 className="h-4 w-4" />
              Public registration link
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Invite vendor
            </Button>
          </div>
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
                    No vendors found. Share a public link or send an invite.
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.map((vendor) => (
                <TableRow key={vendor.organizationUuid}>
                  <TableCell className="font-medium">{vendor.legalCompanyName}</TableCell>
                  <TableCell>{vendor.primaryContactEmail || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={STATUS_VARIANT[vendor.status] || "secondary"}>
                        {formatStatus(vendor.status)}
                      </Badge>
                      {vendor.status === "REGISTERED" || vendor.status === "UNDER_REVIEW" ? (
                        <Badge variant="outline" className="text-[10px]">NEW / FOR REVIEW</Badge>
                      ) : null}
                    </div>
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

      <Dialog open={publicLinkOpen} onOpenChange={setPublicLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Public registration link</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Share this link on WhatsApp, email or any channel. Recipients self-register without you creating their company first.
          </p>
          <Input readOnly value={publicLink?.fullUrl || ""} className="font-mono text-xs" />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" disabled={saving} onClick={() => handlePublicLink(true)}>
              Regenerate
            </Button>
            <Button size="sm" className="gap-2" onClick={copyLink}>
              <Copy className="h-4 w-4" /> Copy link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite subcontractor (manual)</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end">
            <FillDemoDataButton onClick={() => setInviteForm({ ...DEMO.vendorInvite })} />
          </div>
          <p className="text-sm text-muted-foreground">
            Create the vendor and send a password-setup email. Demo emails ending in @fitouts.demo use the configured demo password behaviour.
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

      <VendorReviewDialog
        open={reviewOpen}
        onOpenChange={(open) => {
          setReviewOpen(open);
          if (!open) setReviewOrgUuid(null);
        }}
        organizationUuid={reviewOrgUuid}
        onSaved={async () => {
          setMessage("Prequalification review saved.");
          await loadVendors();
        }}
      />
    </PageShell>
  );
}
