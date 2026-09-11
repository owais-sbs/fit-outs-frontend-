import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, Send, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addScTenderBidders,
  answerScTenderClarification,
  awardScPackage,
  fetchScEligibleBidders,
  fetchScTenderBidders,
  fetchScTenderClarifications,
  fetchScTenderComparison,
  issueScRfq,
} from "../../api/subcontractor.api";
import ContractSection from "@/modules/subcontractor/components/ContractSection";
import { formatScStatus } from "@/modules/subcontractor/utils/subcontractor.utils";

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function fromDatetimeLocal(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ScTenderPanel({ projectId, packages, busy: parentBusy, onMessage, onRefresh }) {
  const [selectedPackage, setSelectedPackage] = useState("");
  const [eligible, setEligible] = useState([]);
  const [bidders, setBidders] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [clarifications, setClarifications] = useState([]);
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [materialFlags, setMaterialFlags] = useState({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedOrgs, setSelectedOrgs] = useState([]);
  const [awardOrg, setAwardOrg] = useState("");
  const [issueForm, setIssueForm] = useState({
    tenderDeadline: "",
    quoteValidityDays: "30",
    paymentTerms: "Net 30",
    retentionPct: "",
    siteVisitAt: "",
    tenderDescription: "",
  });

  const packageUuid = selectedPackage;
  const selectedPkg = useMemo(
    () => packages.find((p) => String(p.uuid) === String(packageUuid)) || null,
    [packages, packageUuid]
  );

  const loadTenderData = useCallback(() => {
    if (!projectId || !packageUuid) {
      setEligible([]);
      setBidders([]);
      setComparison(null);
      setClarifications([]);
      return Promise.resolve();
    }
    setLoading(true);
    return Promise.all([
      fetchScEligibleBidders(projectId, packageUuid).catch(() => []),
      fetchScTenderBidders(projectId, packageUuid).catch(() => []),
      fetchScTenderComparison(projectId, packageUuid).catch(() => null),
      fetchScTenderClarifications(projectId, packageUuid).catch(() => []),
    ])
      .then(([elig, bids, comp, clarifs]) => {
        setEligible(Array.isArray(elig) ? elig : []);
        setBidders(Array.isArray(bids) ? bids : []);
        setComparison(comp);
        setClarifications(Array.isArray(clarifs) ? clarifs : []);
      })
      .finally(() => setLoading(false));
  }, [projectId, packageUuid]);

  useEffect(() => {
    if (!selectedPackage && packages.length > 0) {
      setSelectedPackage(packages[0].uuid);
    }
  }, [packages, selectedPackage]);

  useEffect(() => {
    loadTenderData();
  }, [loadTenderData]);

  useEffect(() => {
    if (!selectedPkg) return;
    setIssueForm((f) => ({
      ...f,
      tenderDeadline: selectedPkg.tenderDeadline
        ? toDatetimeLocal(selectedPkg.tenderDeadline)
        : f.tenderDeadline,
      quoteValidityDays:
        selectedPkg.quoteValidityDays != null
          ? String(selectedPkg.quoteValidityDays)
          : f.quoteValidityDays,
      paymentTerms: selectedPkg.paymentTerms || f.paymentTerms,
      retentionPct:
        selectedPkg.retentionPct != null && selectedPkg.retentionPct !== ""
          ? String(selectedPkg.retentionPct)
          : f.retentionPct,
      siteVisitAt: selectedPkg.siteVisitAt ? toDatetimeLocal(selectedPkg.siteVisitAt) : f.siteVisitAt,
      tenderDescription: selectedPkg.tenderDescription || f.tenderDescription,
    }));
  }, [selectedPkg?.uuid, selectedPkg?.tenderDeadline, selectedPkg?.tenderStatus]);

  const invitedOrgIds = useMemo(
    () => new Set(bidders.map((b) => String(b.organizationUuid))),
    [bidders]
  );

  const notInvited = useMemo(
    () => eligible.filter((e) => e.eligible && !invitedOrgIds.has(String(e.organizationUuid))),
    [eligible, invitedOrgIds]
  );

  const comparisonRows = comparison?.bidders?.length
    ? comparison.bidders
    : bidders.map((b) => ({
        organizationUuid: b.organizationUuid,
        organizationName: b.organizationName,
        bidderStatus: b.status,
        quoteUuid: null,
        totalValue: null,
        leadTimeDays: null,
      }));

  const deadlinePassed = comparison?.deadlinePassed === true;
  const rfqIssued = Boolean(
    selectedPkg?.tenderStatus
    && String(selectedPkg.tenderStatus).toUpperCase() !== "DRAFT"
  );

  const run = async (fn, okMsg) => {
    setBusy(true);
    onMessage?.("");
    try {
      await fn();
      await loadTenderData();
      await onRefresh?.();
      if (okMsg) onMessage?.(okMsg);
    } catch (e) {
      onMessage?.(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleOrg = (orgUuid) => {
    setSelectedOrgs((prev) =>
      prev.includes(orgUuid) ? prev.filter((id) => id !== orgUuid) : [...prev, orgUuid]
    );
  };

  const addBidders = () =>
    run(
      () => addScTenderBidders(projectId, packageUuid, { organizationUuids: selectedOrgs }),
      "Bidders added"
    ).then(() => setSelectedOrgs([]));

  const issueRfq = () =>
    run(
      () =>
        issueScRfq(projectId, packageUuid, {
          tenderDeadline: fromDatetimeLocal(issueForm.tenderDeadline),
          quoteValidityDays: issueForm.quoteValidityDays ? Number(issueForm.quoteValidityDays) : null,
          paymentTerms: issueForm.paymentTerms.trim() || null,
          retentionPct: issueForm.retentionPct !== "" ? Number(issueForm.retentionPct) : null,
          siteVisitAt: fromDatetimeLocal(issueForm.siteVisitAt),
          tenderDescription: issueForm.tenderDescription.trim() || null,
        }),
      "RFQ issued to invited bidders"
    );

  const award = () => {
    const row = comparisonRows.find((b) => String(b.organizationUuid) === String(awardOrg));
    return run(
      () =>
        awardScPackage(projectId, packageUuid, {
          organizationUuid: awardOrg,
          quoteUuid: row?.quoteUuid || null,
          awardedValue: row?.totalValue ?? null,
        }),
      "Package awarded — other bidders marked regret"
    );
  };

  const answerClarification = (clarificationUuid) => {
    const answer = (answerDrafts[clarificationUuid] || "").trim();
    if (!answer) {
      onMessage?.("Enter an answer before saving.");
      return;
    }
    return run(
      () =>
        answerScTenderClarification(projectId, packageUuid, clarificationUuid, {
          answer,
          material: Boolean(materialFlags[clarificationUuid]),
        }),
      "Clarification answered"
    ).then(() => {
      setAnswerDrafts((d) => {
        const next = { ...d };
        delete next[clarificationUuid];
        return next;
      });
    });
  };

  const isBusy = busy || parentBusy;

  if (packages.length === 0) return null;

  return (
    <Card className="border-violet-500/20">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">Tender & award</CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy || loading || !packageUuid}
            onClick={() => loadTenderData()}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh bids
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs">Package for tender</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
          >
            {packages.map((p) => (
              <option key={p.uuid} value={p.uuid}>
                {p.name} {p.tenderStatus ? `(${p.tenderStatus})` : ""}
              </option>
            ))}
          </select>
          {selectedPkg?.tenderDeadline && (
            <p className="text-[11px] text-muted-foreground">
              Deadline: {formatDate(selectedPkg.tenderDeadline)}
              {rfqIssued ? " · RFQ issued" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Add bidders</p>
              {notInvited.length === 0 ? (
                <p className="text-xs text-muted-foreground">No additional eligible bidders to invite.</p>
              ) : (
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border/40 p-2">
                  {notInvited.map((e) => (
                    <label key={e.organizationUuid} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOrgs.includes(e.organizationUuid)}
                        onChange={() => toggleOrg(e.organizationUuid)}
                      />
                      <span>{e.organizationName}</span>
                    </label>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy || selectedOrgs.length === 0}
                onClick={addBidders}
              >
                <Plus className="h-4 w-4 mr-1" /> Invite selected
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Invited bidders ({bidders.length})
              </p>
              {bidders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No bidders invited yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {bidders.map((b) => (
                    <Badge key={b.uuid || b.organizationUuid} variant="secondary" className="text-[10px]">
                      {b.organizationName} · {formatScStatus(b.status)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-medium">{rfqIssued ? "Update / re-issue RFQ" : "Issue RFQ"}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Deadline</Label>
                  <Input
                    type="datetime-local"
                    value={issueForm.tenderDeadline}
                    onChange={(e) => setIssueForm((f) => ({ ...f, tenderDeadline: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Site visit</Label>
                  <Input
                    type="datetime-local"
                    value={issueForm.siteVisitAt}
                    onChange={(e) => setIssueForm((f) => ({ ...f, siteVisitAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quote validity (days)</Label>
                  <Input
                    type="number"
                    value={issueForm.quoteValidityDays}
                    onChange={(e) => setIssueForm((f) => ({ ...f, quoteValidityDays: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Retention %</Label>
                  <Input
                    type="number"
                    value={issueForm.retentionPct}
                    onChange={(e) => setIssueForm((f) => ({ ...f, retentionPct: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Payment terms</Label>
                <Input
                  value={issueForm.paymentTerms}
                  onChange={(e) => setIssueForm((f) => ({ ...f, paymentTerms: e.target.value }))}
                  placeholder="Net 30"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  value={issueForm.tenderDescription}
                  onChange={(e) => setIssueForm((f) => ({ ...f, tenderDescription: e.target.value }))}
                />
              </div>
              <Button size="sm" disabled={isBusy || !issueForm.tenderDeadline || bidders.length === 0} onClick={issueRfq}>
                <Send className="h-4 w-4 mr-1" /> {rfqIssued ? "Update RFQ deadline" : "Issue RFQ"}
              </Button>
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Bid comparison{" "}
                {deadlinePassed ? "(deadline passed — rates visible)" : "(sealed until deadline)"}
              </p>
              {!rfqIssued && bidders.length === 0 ? (
                <p className="text-xs text-muted-foreground">Invite bidders and issue an RFQ first.</p>
              ) : comparisonRows.length === 0 ? (
                <p className="text-xs text-muted-foreground">No bidders yet.</p>
              ) : (
                <div className="divide-y divide-border/30 rounded-lg border border-border/40">
                  {comparisonRows.map((row) => (
                    <div key={row.organizationUuid} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                      <span className="font-medium flex-1">{row.organizationName || "—"}</span>
                      <span className="tabular-nums">
                        {deadlinePassed ? formatMoney(row.totalValue) : "••••"}
                      </span>
                      <span>
                        {deadlinePassed && row.leadTimeDays != null ? `${row.leadTimeDays}d` : "—"}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {formatScStatus(row.bidderStatus)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {!deadlinePassed && comparisonRows.some((r) => String(r.bidderStatus).toUpperCase() === "SUBMITTED") && (
                <p className="text-xs text-amber-700">
                  Bids have been submitted but rates stay sealed until the deadline. Click Refresh after the deadline, or shorten the deadline and update RFQ.
                </p>
              )}

              {deadlinePassed && (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 space-y-1 min-w-[200px]">
                    <Label className="text-xs">Award to</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={awardOrg}
                      onChange={(e) => setAwardOrg(e.target.value)}
                    >
                      <option value="">Select bidder…</option>
                      {comparisonRows
                        .filter((b) => b.quoteUuid || String(b.bidderStatus).toUpperCase() === "SUBMITTED")
                        .map((b) => (
                          <option key={b.organizationUuid} value={b.organizationUuid}>
                            {b.organizationName} — {formatMoney(b.totalValue)}
                          </option>
                        ))}
                    </select>
                  </div>
                  <Button size="sm" disabled={isBusy || !awardOrg} onClick={award}>
                    <Trophy className="h-4 w-4 mr-1" /> Award package
                  </Button>
                </div>
              )}
            </div>

            {packageUuid && (
              <div className="space-y-2 rounded-lg border border-border/50 p-4">
                <p className="text-xs font-medium text-muted-foreground">Subcontract agreement</p>
                <ContractSection packageUuid={packageUuid} projectId={projectId} />
              </div>
            )}

            <div className="space-y-3 rounded-lg border border-border/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Clarifications ({clarifications.length})
              </p>
              {clarifications.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No questions yet. When an SC Estimator asks on the RFQ detail page, they appear here for staff to answer.
                </p>
              ) : (
                <div className="space-y-3">
                  {clarifications.map((c) => (
                    <div key={c.uuid} className="rounded-lg border border-border/40 bg-background p-3 space-y-2">
                      <p className="text-sm font-medium">{c.question}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(c.createdAt)}</p>
                      {c.answer ? (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Answer: </span>
                          {c.answer}
                          {c.material && (
                            <Badge variant="outline" className="ml-2 text-[10px]">Addendum</Badge>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Textarea
                            rows={2}
                            placeholder="Type your answer…"
                            value={answerDrafts[c.uuid] || ""}
                            onChange={(e) =>
                              setAnswerDrafts((d) => ({ ...d, [c.uuid]: e.target.value }))
                            }
                            disabled={isBusy}
                          />
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={Boolean(materialFlags[c.uuid])}
                              onChange={(e) =>
                                setMaterialFlags((m) => ({ ...m, [c.uuid]: e.target.checked }))
                              }
                            />
                            Broadcast as addendum to all bidders
                          </label>
                          <Button
                            size="sm"
                            disabled={isBusy || !(answerDrafts[c.uuid] || "").trim()}
                            onClick={() => answerClarification(c.uuid)}
                          >
                            Save answer
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
