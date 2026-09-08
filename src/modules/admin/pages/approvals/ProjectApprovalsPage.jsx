import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ChevronRight, Loader2, Sparkles, Wand2 } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { projectDetailPath } from "@/shared/constants/routes";
import {
  fetchProjectApprovals,
  generateProjectApprovals,
  resolveProjectApprovals,
} from "../../api/approvals.api";
import CaseDetailPanel from "./CaseDetailPanel";
import { daysLabel, statusLabel, statusTone, urgencyTone } from "./approvalStatus";

export default function ProjectApprovalsPage() {
  const { projectId } = useParams();
  const route = useLocation();
  const detailPath = projectDetailPath(route.pathname, projectId);

  const [cases, setCases] = useState([]);
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [location, setLocation] = useState({ emirate: "Dubai", communityName: "", buildingName: "", plotZone: "" });
  const [derivedTags, setDerivedTags] = useState([]);
  const [scopeNote, setScopeNote] = useState("");
  const [hasApprovedBoq, setHasApprovedBoq] = useState(false);

  const applyScopeFromResolve = (resolved) => {
    if (!resolved) return;
    setDerivedTags(Array.isArray(resolved.derivedScopeTags) ? resolved.derivedScopeTags : []);
    setScopeNote(resolved.scopeNote || "");
    setHasApprovedBoq(!!resolved.hasApprovedBoq);
    setLocation((prev) => ({
      emirate: resolved.emirate || prev.emirate || "Dubai",
      communityName: resolved.communityName ?? prev.communityName,
      buildingName: resolved.buildingName ?? prev.buildingName,
      plotZone: resolved.plotZone ?? prev.plotZone,
    }));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, resolved] = await Promise.all([
        fetchProjectApprovals(projectId),
        resolveProjectApprovals(projectId, {}),
      ]);
      setCases(Array.isArray(list) ? list : []);
      applyScopeFromResolve(resolved);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const runPreview = async () => {
    setBusy(true);
    setMessage("");
    try {
      const resolved = await resolveProjectApprovals(projectId, { ...location });
      setPreview(resolved);
      applyScopeFromResolve(resolved);
    } catch (e) {
      setMessage(e?.response?.data?.error || "Could not resolve the authority set");
    } finally {
      setBusy(false);
    }
  };

  const runGenerate = async () => {
    setBusy(true);
    setMessage("");
    try {
      const list = await generateProjectApprovals(projectId, { ...location });
      setCases(Array.isArray(list) ? list : []);
      setPreview(null);
      setMessage("Approval permits generated.");
      try {
        applyScopeFromResolve(await resolveProjectApprovals(projectId, { ...location }));
      } catch {
        /* chips stay as they were */
      }
    } catch (e) {
      setMessage(e?.response?.data?.error || "Could not generate permits");
    } finally {
      setBusy(false);
    }
  };

  const newCaseCount = preview ? preview.cases.filter((c) => !c.alreadyExists).length : 0;

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
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Location and scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label className="text-xs">Emirate</Label>
              <Input value={location.emirate} onChange={(e) => setLocation({ ...location, emirate: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Community</Label>
              <Input
                placeholder="Palm Jumeirah, Dubai Hills Estate"
                value={location.communityName}
                onChange={(e) => setLocation({ ...location, communityName: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Building or tower</Label>
              <Input value={location.buildingName} onChange={(e) => setLocation({ ...location, buildingName: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Plot or zone</Label>
              <Input value={location.plotZone} onChange={(e) => setLocation({ ...location, plotZone: e.target.value })} />
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

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={runPreview}>
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
              Preview permit set
            </Button>
            <Button size="sm" disabled={busy} onClick={runGenerate}>
              <Sparkles className="h-4 w-4 mr-1" /> Generate permits
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {preview.cases.length} permits apply · {newCaseCount} would be created
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">{preview.matchNote}</p>

            {(preview.warnings || []).map((w) => (
              <div key={w} className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              {(preview.authorities || []).map((a) => (
                <Badge key={a.code} className="bg-secondary text-muted-foreground" title={a.reason}>
                  {a.layer}: {a.name}
                </Badge>
              ))}
            </div>

            <div className="divide-y divide-border/40 rounded-lg bg-secondary/40">
              {preview.cases.map((c) => (
                <div key={c.permitTypeCode} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{c.permitTypeCode}</span>
                  <span>{c.permitTypeName}</span>
                  <span className="text-xs text-muted-foreground">{c.authorityName}</span>
                  {c.slaDays != null && (
                    <span className="text-xs text-muted-foreground" title={c.slaSource}>
                      {c.slaDays} working days
                    </span>
                  )}
                  {c.hasDeposit && <Badge className="bg-copper/15 text-copper-foreground">Deposit</Badge>}
                  {c.alreadyExists && (
                    <Badge className="ml-auto bg-secondary text-muted-foreground">already exists</Badge>
                  )}
                  {!c.alreadyExists && c.triggerReason && (
                    <span className="ml-auto text-[11px] text-muted-foreground">{c.triggerReason}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading permits
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(320px,380px)_1fr]">
          <Card className="self-start">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{cases.length} Permits Required</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {cases.map((c) => (
                  <button
                    key={c.uuid}
                    type="button"
                    onClick={() => setSelected(c.uuid)}
                    className={`flex w-full items-start gap-2 px-4 py-2.5 text-left hover:bg-secondary/50 ${
                      selected === c.uuid ? "bg-secondary/60" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">{c.permitTypeCode}</span>
                        <Badge className={statusTone(c.status)}>{statusLabel(c.status)}</Badge>
                      </div>
                      <div className="truncate text-sm">{c.permitTypeName}</div>
                      <div className="text-[11px] text-muted-foreground">{c.authorityName}</div>
                      {c.blockReason && (
                        <div className="text-[11px] text-amber-700">{c.blockReason}</div>
                      )}
                      {c.expiryDate && (
                        <div className={`text-[11px] ${urgencyTone(c.daysToExpiry)}`}>
                          expires {c.expiryDate} · {daysLabel(c.daysToExpiry, "ago")}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
                {!cases.length && (
                  <p className="px-4 py-8 text-sm text-muted-foreground">
                    No permits yet. Set the location, then preview or generate from the approved BOQ tags.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div>
            {selected ? (
              <CaseDetailPanel caseUuid={selected} onChanged={load} />
            ) : (
              <p className="py-10 text-sm text-muted-foreground">
                Select a permit to see its checklist, submissions and fees.
              </p>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
