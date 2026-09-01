import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MapPin, Package, Search } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fetchMyScPackages } from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus, groupPackagesByProject } from "../utils/subcontractor.utils";

export default function SubcontractorPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");

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

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search package, project, or section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full lg:w-[220px]">
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
        </CardContent>
      </Card>

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
              <p className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {pkg.projectLocation || "Location not set"}
              </p>
              {pkg.boqSectionCode && (
                <p className="mb-3 text-xs text-muted-foreground">Section: {pkg.boqSectionCode}</p>
              )}
              <div className="mt-auto grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
                  <p className="text-muted-foreground">Planned</p>
                  <p className="font-semibold tabular-nums">{pkg.boqPlannedQty ?? 0}</p>
                </div>
                <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
                  <p className="text-muted-foreground">Approved</p>
                  <p className="font-semibold tabular-nums">{pkg.approvedClaimedQty ?? 0}</p>
                </div>
                <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
                  <p className="text-muted-foreground">Left</p>
                  <p className="font-semibold tabular-nums">{pkg.remainingQty ?? 0}</p>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </PageShell>
  );
}
