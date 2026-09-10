import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Package, MapPin, FileText, FileImage, FileCheck, Info } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchMyScPackages, acceptScPackage } from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";
import ContractSection from "../components/ContractSection";
import PackageInspectionsSection from "../components/PackageInspectionsSection";
import PackageDrawingsSection from "../components/PackageDrawingsSection";

export default function SubcontractorPackageDetailPage() {
  const { packageUuid } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const loadPackage = useCallback(async () => {
    if (!packageUuid) return;
    setLoading(true);
    setError("");
    try {
      const list = await fetchMyScPackages();
      const found = (Array.isArray(list) ? list : []).find((p) => p.uuid === packageUuid);
      if (found) {
        setPkg(found);
      } else {
        setError("Subcontractor package not found or access denied.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load package");
    } finally {
      setLoading(false);
    }
  }, [packageUuid]);

  useEffect(() => {
    loadPackage();
  }, [loadPackage]);

  const handleAccept = async () => {
    if (!pkg?.uuid) return;
    setAccepting(true);
    try {
      await acceptScPackage(pkg.uuid);
      await loadPackage();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Could not accept package");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (error || !pkg) {
    return (
      <PageShell>
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(ROUTES.SUBCONTRACTOR.PACKAGES)}>
          <ArrowLeft className="h-4 w-4" /> Back to packages
        </Button>
        <Surface className="px-4 py-16 text-center">
          <p className="text-sm font-medium text-destructive">{error || "Package not found"}</p>
        </Surface>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(ROUTES.SUBCONTRACTOR.PACKAGES)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageTitle
          title={pkg.name}
          subtitle={`Package details for ${pkg.projectName || `Project #${pkg.projectId}`}`}
          className="flex-1"
          actions={
            <Badge className={`${SC_STATUS_BADGE[pkg.status] || "bg-muted border-none"} text-xs px-3 py-1`}>
              {formatScStatus(pkg.status)}
            </Badge>
          }
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 gap-6">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <Info className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger
            value="contract"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" /> Contract & E-Sign
          </TabsTrigger>
          <TabsTrigger
            value="drawings"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <FileImage className="h-3.5 w-3.5" /> Drawings
          </TabsTrigger>
          <TabsTrigger
            value="inspections"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <FileCheck className="h-3.5 w-3.5" /> Inspections
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Surface className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-6 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Project Name</p>
                <p className="font-semibold text-foreground">{pkg.projectName || `Project #${pkg.projectId}`}</p>
                {pkg.projectLocation && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {pkg.projectLocation}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">BOQ Section Code</p>
                <p className="font-medium text-foreground">{pkg.boqSectionCode || "N/A"}</p>
                <p className="text-xs text-muted-foreground mt-1">{pkg.boqLineDescription}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Status</p>
                <div className="mt-1">
                  <Badge className={`${SC_STATUS_BADGE[pkg.status] || "bg-muted"}`}>
                    {formatScStatus(pkg.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Quantity Progress Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-secondary/50 p-4 border">
                  <p className="text-xs text-muted-foreground mb-1">Planned Quantity</p>
                  <p className="text-xl font-bold tabular-nums">{pkg.boqPlannedQty ?? 0}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4 border">
                  <p className="text-xs text-muted-foreground mb-1">Approved Quantity</p>
                  <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{pkg.approvedClaimedQty ?? 0}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4 border">
                  <p className="text-xs text-muted-foreground mb-1">Remaining Quantity</p>
                  <p className="text-xl font-bold tabular-nums">{pkg.remainingQty ?? 0}</p>
                </div>
              </div>
            </div>

            {pkg.status === "APPOINTED" && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Package Assignment Pending Acceptance</p>
                  <p className="text-xs text-muted-foreground">Accept this package assignment to start submitting progress claims and logging inspections.</p>
                </div>
                <Button size="sm" onClick={handleAccept} disabled={accepting}>
                  {accepting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Accept Package
                </Button>
              </div>
            )}
          </Surface>
        </TabsContent>

        <TabsContent value="contract">
          <ContractSection packageUuid={pkg.uuid} projectId={pkg.projectId} />
        </TabsContent>


        {/* Tab 3: Drawings */}
        <TabsContent value="drawings">
          <PackageDrawingsSection projectId={pkg.projectId} />
        </TabsContent>

        {/* Tab 4: Inspections */}
        <TabsContent value="inspections">
          <PackageInspectionsSection packageUuid={pkg.uuid} />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
