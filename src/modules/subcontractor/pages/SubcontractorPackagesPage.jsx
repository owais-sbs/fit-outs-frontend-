import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MapPin, Package } from "lucide-react";
import { PageShell, PageTitle, Surface, FilterToolbar, SearchInput } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { acceptScPackage, fetchMyScPackages } from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus, groupPackagesByProject } from "../utils/subcontractor.utils";

export default function SubcontractorPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [acceptingUuid, setAcceptingUuid] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchMyScPackages()
      .then((list) => setPackages(Array.isArray(list) ? list : []))
      .catch((e) => {
        setPackages([]);
        setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to load packages");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const projects = useMemo(() => groupPackagesByProject(packages), [packages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages.filter((p) => {
      const matchProject = projectFilter === "all" || String(p.projectId) === projectFilter;
      const matchQ = !q ||
        p.name?.toLowerCase().includes(q) ||
        p.projectName?.toLowerCase().includes(q) ||
        p.boqSectionCode?.toLowerCase().includes(q) ||
        p.projectLocation?.toLowerCase().includes(q);
      return matchProject && matchQ;
    });
  }, [packages, search, projectFilter]);

  const handleAccept = async (pkg) => {
    setAcceptingUuid(pkg.uuid);
    setMessage("");
    try {
      await acceptScPackage(pkg.uuid);
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Could not accept package");
    } finally {
      setAcceptingUuid(null);
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

  return (
    <PageShell>
      <PageTitle
        title="My Packages"
        subtitle="BOQ work packages appointed to your account"
        actions={
          <Button asChild size="sm">
            <Link to={ROUTES.SUBCONTRACTOR.CLAIMS}>Submit claim</Link>
          </Button>
        }
      />

      {message && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      )}

      <FilterToolbar>
          <SearchInput
              placeholder="Search package, project, or section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-8 w-full rounded-sm lg:w-[220px]">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.projectId} value={String(p.projectId)}>
                  {p.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </FilterToolbar>

      {filtered.length === 0 ? (
        <Surface className="px-4 py-16 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No packages found</p>
        </Surface>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pkg) => (
            <Surface key={pkg.uuid} className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-tight">{pkg.name}</p>
                <Badge className={`${SC_STATUS_BADGE[pkg.status] || "bg-muted border-none"} shrink-0 text-[10px]`}>
                  {formatScStatus(pkg.status)}
                </Badge>
              </div>
              <p className="mb-1 text-xs font-medium text-foreground/80">
                {pkg.projectName || `Project #${pkg.projectId}`}
              </p>
              {pkg.projectLocation && (
                <p className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {pkg.projectLocation}
                </p>
              )}
              {(pkg.boqLineDescription || pkg.boqSectionCode) && (
                <p className="mb-4 text-xs text-muted-foreground">
                  {pkg.boqLineDescription || `Section: ${pkg.boqSectionCode}`}
                </p>
              )}
              <div className="mt-auto flex items-center gap-4 rounded-sm bg-muted/40 px-3 py-2.5 text-[11px]">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Planned</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{pkg.boqPlannedQty ?? 0}</p>
                </div>
                <div className="h-8 w-px bg-border/60" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Approved</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{pkg.approvedClaimedQty ?? 0}</p>
                </div>
                <div className="h-8 w-px bg-border/60" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Left</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{pkg.remainingQty ?? 0}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild size="sm" variant="outline" className="w-full border-border/70 text-xs">
                  <Link to={`/subcontractor/packages/${pkg.uuid}`}>
                    View Package Details & Contract
                  </Link>
                </Button>
                {pkg.status === "APPOINTED" && (
                  <Button
                    size="sm"
                    className="w-full border-0 bg-[#0a1628] text-[#FAF7F2] text-xs hover:bg-[#0d1c32] hover:text-[#FAF7F2]"
                    disabled={acceptingUuid === pkg.uuid}
                    onClick={() => handleAccept(pkg)}
                  >
                    {acceptingUuid === pkg.uuid ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Accept assignment"
                    )}
                  </Button>
                )}
              </div>
            </Surface>
          ))}
        </div>

      )}
    </PageShell>
  );
}
