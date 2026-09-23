import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Package, MapPin, FileText, FileImage, FileCheck, Info, Users } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  fetchMyScPackages,
  acceptScPackage,
  fetchMyScAwardPack,
  fetchScPackageWorkers,
  nominateScPackageWorker,
  fetchScWorkers,
} from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";
import ContractSection from "../components/ContractSection";
import PackageInspectionsSection from "../components/PackageInspectionsSection";
import PackageDrawingsSection from "../components/PackageDrawingsSection";
import { useSubcontractorPortal } from "../context/SubcontractorPortalContext";

export default function SubcontractorPackageDetailPage() {
  const { packageUuid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isOrgAdmin, canAccessExecution } = useSubcontractorPortal();
  const [pkg, setPkg] = useState(null);
  const [awardPack, setAwardPack] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [roster, setRoster] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [nominating, setNominating] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  const loadPackage = useCallback(async () => {
    if (!packageUuid) return;
    setLoading(true);
    setError("");
    try {
      const list = await fetchMyScPackages();
      const found = (Array.isArray(list) ? list : []).find((p) => p.uuid === packageUuid);
      if (found) {
        setPkg(found);
        try {
          const pack = await fetchMyScAwardPack(packageUuid);
          setAwardPack(pack);
        } catch {
          setAwardPack(null);
        }
        if (canAccessExecution || isOrgAdmin) {
          try {
            const nominated = await fetchScPackageWorkers(packageUuid);
            setWorkers(Array.isArray(nominated) ? nominated : []);
          } catch {
            setWorkers([]);
          }
        }
        if (isOrgAdmin) {
          try {
            const all = await fetchScWorkers();
            setRoster(Array.isArray(all) ? all : []);
          } catch {
            setRoster([]);
          }
        }
      } else {
        setError("Subcontractor package not found or access denied.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load package");
    } finally {
      setLoading(false);
    }
  }, [packageUuid, canAccessExecution, isOrgAdmin]);

  useEffect(() => {
    loadPackage();
  }, [loadPackage]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

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

  const handleNominate = async () => {
    if (!selectedWorker) return;
    setNominating(true);
    setError("");
    try {
      await nominateScPackageWorker(packageUuid, { workerUuid: selectedWorker });
      setSelectedWorker("");
      await loadPackage();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Nomination failed");
    } finally {
      setNominating(false);
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

  if (error && !pkg) {
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

  const awardedLines = awardPack?.awardedBoqLines || [];

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

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 gap-6 flex-wrap h-auto">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 text-xs font-semibold flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="award" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 text-xs font-semibold flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" /> Award Pack
          </TabsTrigger>
          <TabsTrigger value="contract" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 text-xs font-semibold flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Contract & E-Sign
          </TabsTrigger>
          {(canAccessExecution || isOrgAdmin) && (
            <TabsTrigger value="workers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 text-xs font-semibold flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Mobilisation
            </TabsTrigger>
          )}
          <TabsTrigger value="drawings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 text-xs font-semibold flex items-center gap-1.5">
            <FileImage className="h-3.5 w-3.5" /> Drawings
          </TabsTrigger>
          <TabsTrigger value="inspections" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 text-xs font-semibold flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5" /> Inspections
          </TabsTrigger>
        </TabsList>

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
                <p className="text-xs text-muted-foreground">Trade package</p>
                <p className="font-medium text-foreground">{pkg.tradePackageCode || pkg.boqSectionCode || "N/A"}</p>
                <p className="text-xs text-muted-foreground mt-1">{pkg.tradePackageName || pkg.boqLineDescription || "Legacy package scope"}</p>
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

            <div className="flex flex-wrap gap-2 text-xs">
              <Button asChild size="sm" variant="outline"><Link to={ROUTES.SUBCONTRACTOR.CLAIMS}>Claims</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to={ROUTES.SUBCONTRACTOR.CERTIFICATES || "/subcontractor/certificates"}>Certificates</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to={ROUTES.SUBCONTRACTOR.PROGRESS_LOGS}>Progress</Link></Button>
            </div>

            {pkg.status === "APPOINTED" && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Mobilise package</p>
                  <p className="text-xs text-muted-foreground">Accept to move APPOINTED → IN_PROGRESS and unlock execution.</p>
                </div>
                <Button size="sm" onClick={handleAccept} disabled={accepting}>
                  {accepting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Accept Package
                </Button>
              </div>
            )}
          </Surface>
        </TabsContent>

        <TabsContent value="award" className="space-y-4">
          {!awardPack ? (
            <Surface className="p-6 text-sm text-muted-foreground">No award pack for this package yet.</Surface>
          ) : (
            <Surface className="p-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-4 text-xs">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Quoted</p>
                  <p className="font-semibold">{awardPack.quotedValue != null ? `AED ${Number(awardPack.quotedValue).toLocaleString()}` : "—"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Awarded</p>
                  <p className="font-semibold">{awardPack.awardedValue != null ? `AED ${Number(awardPack.awardedValue).toLocaleString()}` : "—"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Original award</p>
                  <p className="font-semibold">{awardPack.originalAwardValue != null ? `AED ${Number(awardPack.originalAwardValue).toLocaleString()}` : "—"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Contract</p>
                  <p className="font-semibold">{formatScStatus(awardPack.contractStatus)}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Awarded priced BOQ (frozen)</h3>
                {awardedLines.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No awarded BOQ lines frozen yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 text-left">
                        <tr>
                          <th className="p-2">Code</th><th className="p-2">Description</th>
                          <th className="p-2">Unit</th><th className="p-2 text-right">Qty</th>
                          <th className="p-2 text-right">Rate</th><th className="p-2 text-right">Amount</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {awardedLines.map((line) => (
                          <tr key={line.uuid || line.boqLineId} className="border-t">
                            <td className="p-2 font-mono">{line.sectionCode || "—"}</td>
                            <td className="p-2">{line.description || "—"}</td>
                            <td className="p-2">{line.unit || "—"}</td>
                            <td className="p-2 text-right">{line.quantity ?? "—"}</td>
                            <td className="p-2 text-right">{line.rate ?? "—"}</td>
                            <td className="p-2 text-right">{line.amount ?? "—"}</td>
                            <td className="p-2">{line.lineStatus || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {Array.isArray(awardPack.sections) && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Award pack sections</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {awardPack.sections.map((section) => (
                      <div key={section.code} className="rounded-lg border p-3 text-xs space-y-1.5">
                        <div className="flex justify-between gap-2 items-start">
                          <span className="font-medium text-foreground">{section.label}</span>
                          <Badge
                            variant="outline"
                            className={
                              section.status === "CONNECTED"
                                ? "border-emerald-300 text-emerald-700 bg-emerald-500/10 shrink-0"
                                : section.status === "PARTIAL"
                                  ? "border-amber-300 text-amber-700 bg-amber-500/10 shrink-0"
                                  : "shrink-0"
                            }
                          >
                            {section.status === "CONNECTED"
                              ? "Ready"
                              : section.status === "PARTIAL"
                                ? "Partial"
                                : "Pending"}
                          </Badge>
                        </div>
                        {(section.value || section.note) && (
                          <p className="text-muted-foreground leading-relaxed">
                            {section.value || section.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Surface>
          )}
        </TabsContent>

        <TabsContent value="contract">
          <ContractSection packageUuid={pkg.uuid} projectId={pkg.projectId} />
        </TabsContent>

        {(canAccessExecution || isOrgAdmin) && (
          <TabsContent value="workers" className="space-y-4">
            <Surface className="p-6 space-y-4">
              <h3 className="text-sm font-semibold">Package mobilisation workers</h3>
              <p className="text-xs text-muted-foreground">
                Nominate roster workers against this awarded package. Site eligibility is enforced on the backend.
              </p>
              {isOrgAdmin && (
                <div className="flex flex-wrap gap-2 items-end">
                  <select
                    className="h-9 min-w-[220px] rounded-md border bg-background px-2 text-sm"
                    value={selectedWorker}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                  >
                    <option value="">Select worker…</option>
                    {roster.filter((w) => w.siteEligible).map((w) => (
                      <option key={w.uuid} value={w.uuid}>{w.fullName} · {w.trade || "—"}</option>
                    ))}
                  </select>
                  <Button size="sm" disabled={!selectedWorker || nominating} onClick={handleNominate}>
                    {nominating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Nominate
                  </Button>
                </div>
              )}
              {workers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No workers nominated yet.</p>
              ) : (
                <div className="space-y-2">
                  {workers.map((w) => (
                    <div key={w.uuid} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                      <div>
                        <p className="font-medium">{w.workerName}</p>
                        <p className="text-muted-foreground">{w.trade || "—"} · {w.siteEligibilityNote}</p>
                      </div>
                      <Badge variant="outline">{w.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Surface>
          </TabsContent>
        )}

        <TabsContent value="drawings">
          <PackageDrawingsSection projectId={pkg.projectId} />
        </TabsContent>

        <TabsContent value="inspections">
          <PackageInspectionsSection packageUuid={pkg.uuid} />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
