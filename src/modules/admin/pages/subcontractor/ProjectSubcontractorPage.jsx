import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  fetchScPackages,
  createScPackage,
  appointScPackage,
  generateScPackagesFromBoq,
  fetchProjectScClaims,
  approveScClaim,
  rejectScClaim,
} from "../../api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";

export default function ProjectSubcontractorPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const routes = isPm ? ROUTES.PROJECT_MANAGER : ROUTES.ADMIN;
  const detailPath = routes.PROJECT_DETAIL.replace(":projectId", projectId);

  const [packages, setPackages] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pkgForm, setPkgForm] = useState({ name: "", boqSectionCode: "" });
  const [appointForms, setAppointForms] = useState({});
  const [rejectReasons, setRejectReasons] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchScPackages(projectId).catch(() => []),
      fetchProjectScClaims(projectId).catch(() => []),
    ])
      .then(([pkgs, cls]) => {
        setPackages(Array.isArray(pkgs) ? pkgs : []);
        setClaims(Array.isArray(cls) ? cls : []);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

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

  const handleCreate = () =>
    run(async () => {
      await createScPackage(projectId, {
        name: pkgForm.name.trim(),
        boqSectionCode: pkgForm.boqSectionCode.trim() || null,
      });
      setPkgForm({ name: "", boqSectionCode: "" });
    }, "Package created");

  const handleGenerateFromBoq = () =>
    run(() => generateScPackagesFromBoq(projectId), "Packages generated from BOQ");

  const handleAppoint = (uuid) => {
    const f = appointForms[uuid] || {};
    return run(
      () =>
        appointScPackage(projectId, uuid, {
          accountId: f.accountId ? Number(f.accountId) : null,
          companyName: (f.companyName || "").trim(),
        }),
      "Subcontractor appointed"
    );
  };

  if (loading) {
    return (
      <PageShell className="max-w-5xl mx-auto flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Link to={detailPath}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageTitle title="Subcontractors" subtitle={`Project #${projectId}`} />
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">New package</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={pkgForm.name}
                onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="MEP package"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">BOQ section code</Label>
              <Input
                value={pkgForm.boqSectionCode}
                onChange={(e) => setPkgForm((f) => ({ ...f, boqSectionCode: e.target.value }))}
                placeholder="A.1"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleCreate} disabled={busy || !pkgForm.name.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Create package
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerateFromBoq} disabled={busy}>
              <RefreshCw className="h-4 w-4 mr-1" /> Generate from BOQ
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Packages ({packages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No packages yet</p>
          ) : (
            <div className="divide-y divide-border/40">
              {packages.map((p) => {
                const af = appointForms[p.uuid] || { accountId: "", companyName: "" };
                return (
                  <div key={p.uuid} className="flex flex-col gap-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{p.name}</p>
                      <Badge variant="secondary">{p.status || "DRAFT"}</Badge>
                      {p.boqSectionCode && (
                        <span className="text-xs text-muted-foreground font-mono">{p.boqSectionCode}</span>
                      )}
                    </div>
                    {p.appointedCompanyName || p.appointedAccountId ? (
                      <p className="text-xs text-muted-foreground">
                        Appointed: {p.appointedCompanyName || "—"}
                        {p.appointedAccountId ? ` · account #${p.appointedAccountId}` : ""}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="space-y-1 flex-1">
                          <Label className="text-xs">Account ID</Label>
                          <Input
                            value={af.accountId}
                            onChange={(e) =>
                              setAppointForms((m) => ({
                                ...m,
                                [p.uuid]: { ...af, accountId: e.target.value },
                              }))
                            }
                            placeholder="123"
                          />
                        </div>
                        <div className="space-y-1 flex-1">
                          <Label className="text-xs">Company name</Label>
                          <Input
                            value={af.companyName}
                            onChange={(e) =>
                              setAppointForms((m) => ({
                                ...m,
                                [p.uuid]: { ...af, companyName: e.target.value },
                              }))
                            }
                            placeholder="ABC Contractors"
                          />
                        </div>
                        <Button
                          size="sm"
                          disabled={busy || !af.accountId || !af.companyName?.trim()}
                          onClick={() => handleAppoint(p.uuid)}
                        >
                          Appoint
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Claims ({claims.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No claims yet</p>
          ) : (
            <div className="divide-y divide-border/40">
              {claims.map((c) => {
                const pkg = packages.find((p) => p.uuid === c.packageUuid);
                const planned = Number(c.plannedQty ?? 0);
                const claimed = Number(c.claimedQty ?? 0);
                return (
                  <div key={c.uuid} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{pkg?.name || String(c.packageUuid || "").slice(0, 8)}</p>
                        <Badge variant="secondary">{c.status || "DRAFT"}</Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 max-w-xs">
                        <div className="rounded-lg bg-secondary/60 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Planned</p>
                          <p className="text-sm font-semibold tabular-nums">{planned}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/60 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Claimed</p>
                          <p className="text-sm font-semibold tabular-nums">{claimed}</p>
                        </div>
                      </div>
                      {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                    </div>
                    {(c.status === "SUBMITTED" || c.status === "PENDING") && (
                      <div className="flex flex-col gap-2 sm:items-end">
                        <Input
                          className="h-8 w-full sm:w-40 text-xs"
                          placeholder="Reject reason"
                          value={rejectReasons[c.uuid] || ""}
                          onChange={(e) =>
                            setRejectReasons((m) => ({ ...m, [c.uuid]: e.target.value }))
                          }
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => run(() => approveScClaim(projectId, c.uuid), "Claim approved")}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              run(
                                () => rejectScClaim(projectId, c.uuid, rejectReasons[c.uuid]),
                                "Claim rejected"
                              )
                            }
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
