import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ChevronRight, FileText, Loader2, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectDetailPath } from "@/shared/constants/routes";
import {
  addProjectApprovalCase,
  deleteApprovalCase,
  fetchJurisdictions,
  fetchPermitTypes,
  fetchProjectApprovals,
  generateProjectApprovals,
  resolveProjectApprovals,
} from "../../api/approvals.api";
import { fetchApprovalsCatalog } from "../../api/approvals-config.api";
import { fetchProjectById } from "../../api/projects.api";
import CaseDetailPanel from "./CaseDetailPanel";
import ProjectDeveloperInfo from "../ProjectDeveloperInfo";
import {
  approvalWorkbenchFilters,
  daysLabel,
  matchesApprovalListFilter,
  statusLabel,
  statusTone,
  urgencyTone,
} from "./approvalStatus";

const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Hyderabad"];
const COMMUNITY_OTHER = "__other__";
const CLASSIFIER_NONE = "__none__";

function statusAccent(status) {
  if (["APPROVED", "ISSUED"].includes(status)) return "bg-emerald-500";
  if (["EXPIRED", "REJECTED"].includes(status)) return "bg-red-500";
  if (status === "EXPIRING_SOON") return "bg-amber-500";
  if (["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED", "READY_TO_SUBMIT"].includes(status)) return "bg-sky-500";
  if (["PACK_IN_PREPARATION", "COMMENTS_RECEIVED"].includes(status)) return "bg-amber-400";
  return "bg-zinc-300";
}

export default function ProjectApprovalsPage() {
  const { projectId } = useParams();
  const route = useLocation();
  const detailPath = projectDetailPath(route.pathname, projectId);
  const persistReady = useRef(false);

  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [location, setLocation] = useState({ emirate: "Dubai", communityName: "", buildingName: "", plotZone: "" });
  const [classifiers, setClassifiers] = useState({ propertyTypeId: "", natureId: "" });
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [projectNatures, setProjectNatures] = useState([]);
  const [derivedTags, setDerivedTags] = useState([]);
  const [scopeNote, setScopeNote] = useState("");
  const [hasApprovedBoq, setHasApprovedBoq] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [permitTypes, setPermitTypes] = useState([]);
  const [addPermitCode, setAddPermitCode] = useState("");
  const [pickingOtherCommunity, setPickingOtherCommunity] = useState(false);
  const [listQuery, setListQuery] = useState("");
  const [listFilter, setListFilter] = useState("all");
  const [jurisdictionPackId, setJurisdictionPackId] = useState("");

  const applyScopeFromResolve = (resolved, projectRow) => {
    if (resolved) {
      setDerivedTags(Array.isArray(resolved.derivedScopeTags) ? resolved.derivedScopeTags : []);
      setScopeNote(resolved.scopeNote || "");
      setHasApprovedBoq(!!resolved.hasApprovedBoq);
      setLocation((prev) => ({
        emirate: resolved.emirate || prev.emirate || "Dubai",
        communityName: resolved.communityName ?? prev.communityName,
        buildingName: resolved.buildingName ?? prev.buildingName,
        plotZone: resolved.plotZone ?? prev.plotZone,
      }));
      setPickingOtherCommunity(false);
    }
    setClassifiers({
      propertyTypeId: String(resolved?.approvalPropertyTypeId || projectRow?.approvalPropertyTypeId || ""),
      natureId: String(resolved?.approvalProjectNatureId || projectRow?.approvalProjectNatureId || ""),
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    persistReady.current = false;
    try {
      const [list, resolved, jurisdictionRows, catalogue, config, project] = await Promise.all([
        fetchProjectApprovals(projectId).catch(() => []),
        resolveProjectApprovals(projectId, {}).catch(() => null),
        fetchJurisdictions().catch(() => []),
        fetchPermitTypes().catch(() => []),
        fetchApprovalsCatalog().catch(() => ({})),
        fetchProjectById(projectId).catch(() => null),
      ]);
      setCases(Array.isArray(list) ? list : []);
      applyScopeFromResolve(resolved, project);
      setCommunities(Array.isArray(jurisdictionRows) ? jurisdictionRows : []);
      setPermitTypes(Array.isArray(catalogue) ? catalogue : []);
      setPropertyTypes(Array.isArray(config?.propertyTypes) ? config.propertyTypes : []);
      setProjectNatures(Array.isArray(config?.projectNatures) ? config.projectNatures : []);
      setJurisdictionPackId(project?.jurisdictionPackId || "");
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
      persistReady.current = true;
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const resolvePayload = useCallback(() => ({
    ...location,
    approvalPropertyTypeId: classifiers.propertyTypeId || null,
    approvalProjectNatureId: classifiers.natureId || null,
  }), [location, classifiers.propertyTypeId, classifiers.natureId]);

  useEffect(() => {
    if (!persistReady.current) return undefined;
    const timer = setTimeout(() => {
      resolveProjectApprovals(projectId, { ...resolvePayload(), saveToProject: true }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [projectId, resolvePayload]);

  const communityOptions = useMemo(() => {
    const names = new Set();
    for (const row of communities) {
      if (row?.communityName && (!location.emirate || row.emirate === location.emirate)) {
        names.add(row.communityName);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [communities, location.emirate]);

  const communitySelectValue = pickingOtherCommunity || (location.communityName && !communityOptions.includes(location.communityName))
    ? COMMUNITY_OTHER
    : (location.communityName || undefined);

  const addablePermits = useMemo(() => {
    const terminal = new Set(["REJECTED", "CLOSED"]);
    const existing = new Set(cases.filter((c) => !terminal.has(c.status)).map((c) => c.permitTypeCode));
    return permitTypes.filter((p) => p.code && !existing.has(p.code));
  }, [cases, permitTypes]);

  const listFilters = useMemo(() => approvalWorkbenchFilters(cases), [cases]);

  const visibleCases = useMemo(() => {
    const needle = listQuery.trim().toLowerCase();
    return cases.filter((c) => {
      if (!matchesApprovalListFilter(c, listFilter)) return false;
      if (!needle) return true;
      return [c.permitTypeCode, c.permitTypeName, c.authorityName, c.caseNumber]
        .some((f) => f && String(f).toLowerCase().includes(needle));
    });
  }, [cases, listFilter, listQuery]);

  useEffect(() => {
    if (selected && cases.some((c) => c.uuid === selected)) return;
    if (visibleCases[0]) setSelected(visibleCases[0].uuid);
  }, [cases, selected, visibleCases]);

  const runRestore = async () => {
    setBusy(true);
    setMessage("");
    try {
      const list = await generateProjectApprovals(projectId, resolvePayload());
      setCases(Array.isArray(list) ? list : []);
      setMessage("Permits rebuilt from location, BOQ and scope.");
      try {
        applyScopeFromResolve(await resolveProjectApprovals(projectId, resolvePayload()));
      } catch {
        /* chips stay as they were */
      }
    } catch (e) {
      setMessage(e?.response?.data?.error || "Could not restore permits");
    } finally {
      setBusy(false);
    }
  };

  const runAdd = async () => {
    if (!addPermitCode) return;
    setBusy(true);
    setMessage("");
    try {
      const list = await addProjectApprovalCase(projectId, { permitTypeCode: addPermitCode });
      setCases(Array.isArray(list) ? list : []);
      setAddPermitCode("");
      setMessage("Permit added.");
    } catch (e) {
      setMessage(e?.response?.data?.error || "Could not add permit");
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async (caseUuid, permitName) => {
    if (!window.confirm(`Remove ${permitName || "this permit"} from the required list?`)) return;
    setBusy(true);
    setMessage("");
    try {
      const list = await deleteApprovalCase(caseUuid);
      setCases(Array.isArray(list) ? list : []);
      if (selected === caseUuid) setSelected(null);
      setMessage("Permit removed.");
    } catch (e) {
      setMessage(e?.response?.data?.error || "Could not remove permit");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="flex items-start gap-2">
        <Button asChild variant="ghost" size="icon" className="mt-0.5 h-8 w-8 shrink-0 text-muted-foreground" title="Back to project">
          <Link to={detailPath}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageTitle
          title="Approvals"
          subtitle="Authority, community and building permits for this project."
        />
      </div>

      {message && (
        <div className="rounded-lg bg-secondary px-4 py-3 text-sm text-foreground">{message}</div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 pb-2 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle className="text-sm font-semibold">Location and scope</CardTitle>
          <ProjectDeveloperInfo jurisdictionPackId={jurisdictionPackId} variant="header" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <Label className="text-xs">Emirate</Label>
              <Select
                value={location.emirate || undefined}
                onValueChange={(emirate) => {
                  setPickingOtherCommunity(false);
                  setLocation((prev) => ({ ...prev, emirate, communityName: "" }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select emirate" />
                </SelectTrigger>
                <SelectContent>
                  {EMIRATES.map((emirate) => (
                    <SelectItem key={emirate} value={emirate}>{emirate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Community</Label>
              <Select
                value={communitySelectValue}
                onValueChange={(value) => {
                  if (value === COMMUNITY_OTHER) {
                    setPickingOtherCommunity(true);
                    setLocation((prev) => ({
                      ...prev,
                      communityName: communityOptions.includes(prev.communityName) ? "" : prev.communityName,
                    }));
                    return;
                  }
                  setPickingOtherCommunity(false);
                  setLocation((prev) => ({ ...prev, communityName: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select community" />
                </SelectTrigger>
                <SelectContent>
                  {communityOptions.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                  <SelectItem value={COMMUNITY_OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
              {communitySelectValue === COMMUNITY_OTHER && (
                <Input
                  className="mt-2"
                  placeholder="Community name"
                  value={location.communityName}
                  onChange={(e) => setLocation({ ...location, communityName: e.target.value })}
                />
              )}
            </div>
            <div>
              <Label className="text-xs">Building or tower</Label>
              <Input
                value={location.buildingName}
                onChange={(e) => setLocation({ ...location, buildingName: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Plot or zone</Label>
              <Input
                value={location.plotZone}
                onChange={(e) => setLocation({ ...location, plotZone: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Property type</Label>
              <Select
                value={classifiers.propertyTypeId || CLASSIFIER_NONE}
                onValueChange={(value) => setClassifiers((prev) => ({
                  ...prev,
                  propertyTypeId: value === CLASSIFIER_NONE ? "" : value,
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CLASSIFIER_NONE}>Not set</SelectItem>
                  {propertyTypes.filter((item) => item.active !== false).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Project nature</Label>
              <Select
                value={classifiers.natureId || CLASSIFIER_NONE}
                onValueChange={(value) => setClassifiers((prev) => ({
                  ...prev,
                  natureId: value === CLASSIFIER_NONE ? "" : value,
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CLASSIFIER_NONE}>Not set</SelectItem>
                  {projectNatures.filter((item) => item.active !== false).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">From BOQ work-item tags</p>
            {derivedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {derivedTags.map((tag) => (
                  <Badge key={tag.code} className="bg-secondary text-muted-foreground">
                    {tag.name || tag.code}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {scopeNote
                  || (hasApprovedBoq
                    ? "Approved BOQ work items have no scope tags. Only community, access and completion permits apply until work items are tagged."
                    : "No approved BOQ yet. Only community, access and completion permits apply until tagged work items are on an approved BOQ.")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Button size="sm" disabled={busy} onClick={runRestore}>
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Restore from BOQ/scope
            </Button>
            <p className="text-xs text-muted-foreground">
              Changing emirate, community or classifiers does not rewrite this list by itself.
              Restore adds newly applicable permits. Existing permits are left in place.
              Remove a not-started permit if it should not be on the list.
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading permits
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(380px,440px)_1fr]">
          <Card className="self-start overflow-hidden">
            <CardHeader className="space-y-3 border-b border-border/40 pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">
                  {cases.length} permit{cases.length === 1 ? "" : "s"} required
                </CardTitle>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {listFilters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setListFilter(f.id)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      listFilter === f.id
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {f.label} {f.count}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-8"
                  placeholder="Search permit or authority"
                  value={listQuery}
                  onChange={(e) => setListQuery(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Label className="text-xs">Add permit</Label>
                  <Select value={addPermitCode || undefined} onValueChange={setAddPermitCode}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={addablePermits.length ? "Select a permit" : "All catalogue permits are listed"} />
                    </SelectTrigger>
                    <SelectContent>
                      {addablePermits.map((p) => (
                        <SelectItem key={p.code} value={p.code}>
                          {p.code} · {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="h-9" disabled={busy || !addPermitCode} onClick={runAdd}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[min(70vh,720px)] overflow-y-auto">
                {visibleCases.map((c) => {
                  const active = selected === c.uuid;
                  return (
                    <div
                      key={c.uuid}
                      className={`flex border-b border-border/40 last:border-b-0 ${
                        active ? "bg-secondary/70" : "hover:bg-secondary/40"
                      }`}
                    >
                      <div className={`w-1 shrink-0 ${statusAccent(c.status)}`} />
                      <button
                        type="button"
                        onClick={() => setSelected(c.uuid)}
                        className="flex min-w-0 flex-1 items-start gap-2 px-3 py-3 text-left"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[11px] text-muted-foreground">{c.permitTypeCode}</span>
                            <Badge className={statusTone(c.status)}>{statusLabel(c.status)}</Badge>
                          </div>
                          <div className="text-sm font-medium leading-snug">{c.permitTypeName}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {[c.authorityName || (!c.authorityCode && "Authority not resolved"), c.caseNumber].filter(Boolean).join(" · ")}
                          </div>
                          {Array.isArray(c.candidateAuthorityCodes) && c.candidateAuthorityCodes.length > 0 && !c.authorityCode && (
                            <div className="text-[11px] text-amber-800">
                              Candidates: {c.candidateAuthorityCodes.join(", ")}
                            </div>
                          )}
                          {c.blockReason && (
                            <div className="flex items-start gap-1 text-[11px] text-amber-800">
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                              <span>{c.blockReason}</span>
                            </div>
                          )}
                          {c.expiryDate && (
                            <div className={`text-[11px] ${urgencyTone(c.daysToExpiry)}`}>
                              expires {c.expiryDate} · {daysLabel(c.daysToExpiry, "ago")}
                            </div>
                          )}
                          {c.slaDueDate && (
                            <div className={`text-[11px] ${urgencyTone(c.daysToSlaDue)}`}>
                              SLA {c.slaDueDate} · {daysLabel(c.daysToSlaDue)}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                      {c.status === "NOT_STARTED" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-2 mr-1 h-8 w-8 shrink-0 text-muted-foreground hover:text-red-700"
                          title="Remove permit"
                          disabled={busy}
                          onClick={() => runDelete(c.uuid, c.permitTypeName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                {!cases.length && (
                  <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium">No permits yet</p>
                    <p className="text-xs text-muted-foreground">
                      Set the location, then restore from BOQ/scope, or add a permit from the catalogue.
                    </p>
                  </div>
                )}
                {!!cases.length && !visibleCases.length && (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No permits match this filter.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div>
            {selected ? (
              <CaseDetailPanel
                caseUuid={selected}
                summary={cases.find((c) => c.uuid === selected)}
                onChanged={load}
              />
            ) : (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-6 py-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">Select a permit</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Checklist, submissions and fees open here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
