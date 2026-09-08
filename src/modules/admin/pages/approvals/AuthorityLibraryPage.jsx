import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2, Plus, Search, ShieldCheck } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchAuthorities,
  fetchJurisdictions,
  fetchPermitTypes,
  fetchDocumentTypes,
  fetchSeedStatus,
  importSeed,
  createJurisdiction,
  updateJurisdiction,
} from "../../api/approvals.api";

const TABS = [
  { key: "authorities", label: "Authorities" },
  { key: "jurisdictions", label: "Communities" },
  { key: "permits", label: "Permit catalogue" },
  { key: "documents", label: "Document library" },
];

const TYPE_LABELS = {
  REGULATOR: "Regulator",
  MASTER_DEVELOPER: "Master developer",
  BUILDING_MANAGEMENT: "Building management",
  UTILITY: "Utility",
  SPECIAL: "Special",
};

function VerifiedChip({ verifiedDate, verifiedBy }) {
  if (!verifiedDate) {
    return (
      <Badge className="bg-amber-500/15 text-amber-800 gap-1">
        <AlertTriangle className="h-3 w-3" /> Unverified
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-500/15 text-emerald-800 gap-1" title={verifiedBy || ""}>
      <CheckCircle2 className="h-3 w-3" /> Verified {String(verifiedDate).slice(0, 10)}
    </Badge>
  );
}

function slaLabel(permit) {
  if (permit.usingActualSla) {
    return `${permit.planningSlaDays} d (actual median of ${permit.completedCaseCount} cases)`;
  }
  if (permit.indicativeSlaRaw) return `${permit.indicativeSlaRaw} d (seeded estimate)`;
  return "—";
}

export default function AuthorityLibraryPage() {
  const [tab, setTab] = useState("authorities");
  const [search, setSearch] = useState("");
  const [emirate, setEmirate] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [authorities, setAuthorities] = useState([]);
  const [jurisdictions, setJurisdictions] = useState([]);
  const [permits, setPermits] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [seed, setSeed] = useState(null);

  const [newCommunity, setNewCommunity] = useState({
    communityName: "",
    emirate: "Dubai",
    regulatorAuthorityCode: "",
    masterDeveloperAuthorityCode: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [a, j, p, d, s] = await Promise.allSettled([
      fetchAuthorities(),
      fetchJurisdictions(),
      fetchPermitTypes(),
      fetchDocumentTypes(),
      fetchSeedStatus(),
    ]);
    setAuthorities(a.status === "fulfilled" && Array.isArray(a.value) ? a.value : []);
    setJurisdictions(j.status === "fulfilled" && Array.isArray(j.value) ? j.value : []);
    setPermits(p.status === "fulfilled" && Array.isArray(p.value) ? p.value : []);
    setDocuments(d.status === "fulfilled" && Array.isArray(d.value) ? d.value : []);
    setSeed(s.status === "fulfilled" ? s.value : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runImport = async () => {
    setBusy(true);
    setMessage("");
    try {
      const summary = await importSeed();
      const counts = Object.entries(summary?.inserted || {})
        .map(([k, v]) => `${v} ${k}`)
        .join(", ");
      setMessage(`Imported ${counts || "nothing new"}. ${summary?.warnings?.length || 0} notes.`);
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const addCommunity = async () => {
    if (!newCommunity.communityName.trim()) {
      setMessage("Community name is required");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await createJurisdiction(newCommunity);
      setNewCommunity({ communityName: "", emirate: "Dubai", regulatorAuthorityCode: "", masterDeveloperAuthorityCode: "" });
      setMessage("Community added");
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Could not add community");
    } finally {
      setBusy(false);
    }
  };

  const confirmCommunity = async (row) => {
    setBusy(true);
    try {
      await updateJurisdiction(row.uuid, {
        emirate: row.emirate,
        communityName: row.communityName,
        regulatorAuthorityCode: row.regulatorAuthorityCode,
        masterDeveloperAuthorityCode: row.masterDeveloperAuthorityCode,
        buildingManagementAuthorityCode: row.buildingManagementAuthorityCode,
        utilityAuthorityCode: row.utilityAuthorityCode,
        additionalAuthorityCodes: row.additionalAuthorityCodes,
        verified: true,
      });
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.error || "Could not confirm community");
    } finally {
      setBusy(false);
    }
  };

  const emirates = useMemo(
    () => Array.from(new Set(authorities.map((a) => a.emirate).filter(Boolean))).sort(),
    [authorities]
  );

  const needle = search.trim().toLowerCase();
  const match = (...fields) =>
    !needle || fields.some((f) => f && String(f).toLowerCase().includes(needle));

  const unverifiedCommunities = jurisdictions.filter((j) => !j.verified).length;

  return (
    <PageShell>
      <PageTitle
        title="Authority library"
        subtitle="Authorities, communities, permit catalogue and document library for UAE approvals."
        actions={
          <Button size="sm" disabled={busy || !seed?.seedFileFound} onClick={runImport}>
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Import seed
          </Button>
        }
      />

      {seed && !seed.seedFileFound && (
        <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          Seed file not found. Place <code>vetrobuild_erp_seed_v1.json</code> in the repository{" "}
          <code>docs</code> folder, then import.
        </div>
      )}

      {message && (
        <div className="rounded-lg bg-secondary px-4 py-3 text-sm text-foreground">{message}</div>
      )}

      {unverifiedCommunities > 0 && (
        <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          <strong>{unverifiedCommunities} communities are unverified.</strong> They were derived by
          splitting each authority&rsquo;s coverage description, because the seed file has no
          community table. Confirm each one before relying on automatic case generation.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? "default" : "outline"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8 w-64"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {emirates.length > 1 && (
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={emirate}
            onChange={(e) => setEmirate(e.target.value)}
          >
            <option value="">All emirates</option>
            {emirates.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading library
        </div>
      ) : (
        <>
          {tab === "authorities" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {authorities.length} authorities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {authorities
                    .filter((a) => !emirate || a.emirate === emirate)
                    .filter((a) => match(a.code, a.name, a.jurisdictionAreas))
                    .map((a) => (
                      <div key={a.uuid} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-muted-foreground">{a.code}</span>
                          <span className="text-sm font-semibold">{a.name}</span>
                          <Badge className="bg-secondary text-muted-foreground">
                            {TYPE_LABELS[a.type] || a.type}
                          </Badge>
                          {a.emirate && <span className="text-xs text-muted-foreground">{a.emirate}</span>}
                          <div className="ml-auto">
                            <VerifiedChip verifiedDate={a.verifiedDate} verifiedBy={a.verifiedBy} />
                          </div>
                        </div>
                        {a.jurisdictionAreas && (
                          <p className="mt-1 text-xs text-muted-foreground">{a.jurisdictionAreas}</p>
                        )}
                        {a.notes && <p className="mt-1 text-xs text-muted-foreground italic">{a.notes}</p>}
                      </div>
                    ))}
                  {!authorities.length && (
                    <p className="px-4 py-8 text-sm text-muted-foreground">
                      No authorities yet. Import the seed file to populate the catalogue.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "jurisdictions" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Add a community</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-5">
                  <div>
                    <Label className="text-xs">Community</Label>
                    <Input
                      value={newCommunity.communityName}
                      onChange={(e) => setNewCommunity({ ...newCommunity, communityName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Emirate</Label>
                    <Input
                      value={newCommunity.emirate}
                      onChange={(e) => setNewCommunity({ ...newCommunity, emirate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Regulator</Label>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      value={newCommunity.regulatorAuthorityCode}
                      onChange={(e) => setNewCommunity({ ...newCommunity, regulatorAuthorityCode: e.target.value })}
                    >
                      <option value="">—</option>
                      {authorities.filter((a) => a.type === "REGULATOR").map((a) => (
                        <option key={a.code} value={a.code}>{a.code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Master developer</Label>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      value={newCommunity.masterDeveloperAuthorityCode}
                      onChange={(e) => setNewCommunity({ ...newCommunity, masterDeveloperAuthorityCode: e.target.value })}
                    >
                      <option value="">—</option>
                      {authorities.filter((a) => a.type === "MASTER_DEVELOPER").map((a) => (
                        <option key={a.code} value={a.code}>{a.code}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button size="sm" disabled={busy} onClick={addCommunity}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    {jurisdictions.length} communities
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {jurisdictions
                      .filter((j) => !emirate || j.emirate === emirate)
                      .filter((j) => match(j.communityName, j.buildingName))
                      .map((j) => (
                        <div key={j.uuid} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                          <span className="text-sm font-semibold">{j.communityName}</span>
                          <span className="text-xs text-muted-foreground">{j.emirate}</span>
                          {j.regulatorAuthorityCode && (
                            <Badge className="bg-sky-500/15 text-sky-800">{j.regulatorAuthorityCode}</Badge>
                          )}
                          {j.masterDeveloperAuthorityCode && (
                            <Badge className="bg-copper/15 text-copper-foreground">
                              {j.masterDeveloperAuthorityCode}
                            </Badge>
                          )}
                          {(j.additionalAuthorityCodes || []).map((c) => (
                            <Badge key={c} className="bg-secondary text-muted-foreground">{c}</Badge>
                          ))}
                          <div className="ml-auto flex items-center gap-2">
                            {j.verified ? (
                              <Badge className="bg-emerald-500/15 text-emerald-800 gap-1">
                                <ShieldCheck className="h-3 w-3" /> Confirmed
                              </Badge>
                            ) : (
                              <>
                                <span
                                  className="text-[11px] text-muted-foreground"
                                  title={`Derived from ${j.derivedFrom || "seed prose"}`}
                                >
                                  derived
                                </span>
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => confirmCommunity(j)}>
                                  Confirm
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    {!jurisdictions.length && (
                      <p className="px-4 py-8 text-sm text-muted-foreground">
                        No communities yet. Import the seed, or add one above.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "permits" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{permits.length} permit types</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {permits
                    .filter((p) => match(p.code, p.name, p.typicalTrigger))
                    .map((p) => (
                      <div key={p.uuid} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-muted-foreground">{p.code}</span>
                          <span className="text-sm font-semibold">{p.name}</span>
                          <Badge className="bg-secondary text-muted-foreground">
                            {p.authorityName || TYPE_LABELS[p.authorityType] || p.authorityType || "—"}
                          </Badge>
                          {p.hasDeposit && (
                            <Badge className="bg-copper/15 text-copper-foreground">Deposit</Badge>
                          )}
                          {p.depositConditional && (
                            <Badge className="bg-amber-500/15 text-amber-800">Deposit sometimes</Badge>
                          )}
                          <div className="ml-auto">
                            <VerifiedChip verifiedDate={p.verifiedDate} verifiedBy={p.verifiedBy} />
                          </div>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>SLA {slaLabel(p)}</span>
                          {p.validityRaw && <span>Valid {p.validityRaw}</span>}
                          {p.renewable && <span>Renewable</span>}
                          {(p.prerequisitePermitCodes || []).length > 0 && (
                            <span>After {p.prerequisitePermitCodes.join(", ")}</span>
                          )}
                        </div>
                        {p.blocksActivitiesRaw && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Blocks: {p.blocksActivitiesRaw}
                          </p>
                        )}
                      </div>
                    ))}
                  {!permits.length && (
                    <p className="px-4 py-8 text-sm text-muted-foreground">
                      No permit types yet. Import the seed file.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "documents" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{documents.length} document types</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {documents
                    .filter((d) => match(d.code, d.name, d.category))
                    .map((d) => (
                      <div key={d.uuid} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                        <span className="font-mono text-xs font-semibold text-muted-foreground">{d.code}</span>
                        <span className="text-sm">{d.name}</span>
                        {d.category && (
                          <Badge className="bg-secondary text-muted-foreground">{d.category}</Badge>
                        )}
                        {d.expiryTracked && (
                          <Badge className="bg-amber-500/15 text-amber-800">Expiry tracked</Badge>
                        )}
                        {d.typicallyRequiredFor && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {d.typicallyRequiredFor}
                          </span>
                        )}
                      </div>
                    ))}
                  {!documents.length && (
                    <p className="px-4 py-8 text-sm text-muted-foreground">
                      No document types yet. Import the seed file.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
