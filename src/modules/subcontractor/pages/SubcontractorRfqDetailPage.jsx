import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Send } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addScRfqClarification,
  fetchScPackageBids,
  fetchScRfq,
  fetchScRfqClarifications,
  saveScQuoteDraft,
  submitScQuote,
} from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";
import { FillDemoDataButton } from "@/components/shared/FillDemoDataButton";
import { DEMO, demoQuoteLineRates } from "@/shared/demo/formDemoData";

const LINE_STATUSES = [
  { value: "QUOTED", label: "Quoted" },
  { value: "EXCLUDED", label: "Excluded" },
  { value: "ALTERNATIVE", label: "Alternative" },
  { value: "CLARIFICATION", label: "Clarification required" },
];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function useCountdown(deadlineIso, closed) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (closed || !deadlineIso) return undefined;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [deadlineIso, closed]);
  return useMemo(() => {
    if (!deadlineIso) return null;
    const end = new Date(deadlineIso).getTime();
    const ms = end - now;
    if (ms <= 0) return { closed: true, label: "Submission closed" };
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return { closed: false, label: `${days}d ${hours}h ${mins}m remaining` };
  }, [deadlineIso, now]);
}

export default function SubcontractorRfqDetailPage() {
  const { packageUuid } = useParams();
  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [quoteForm, setQuoteForm] = useState({
    leadTimeDays: "",
    exclusionsText: "",
    qualificationsText: "",
    validityDate: "",
    lines: {},
  });

  const activeQuote = useMemo(
    () => quotes.find((q) => q.status === "DRAFT") || quotes.find((q) => q.status === "SUBMITTED") || quotes[0] || null,
    [quotes]
  );

  const packageBoqLines = useMemo(
    () => (Array.isArray(rfq?.boqLines) ? rfq.boqLines : []),
    [rfq]
  );

  const closed = Boolean(rfq?.deadlinePassed);
  const countdown = useCountdown(rfq?.tenderDeadline, closed);
  const submittedLocked = activeQuote?.status === "SUBMITTED" || activeQuote?.status === "AWARDED"
    || activeQuote?.status === "UNSUCCESSFUL";
  const canEdit = !closed && !submittedLocked && (activeQuote?.status === "DRAFT" || !activeQuote);

  const load = useCallback(() => {
    if (!packageUuid) return;
    setLoading(true);
    Promise.all([
      fetchScRfq(packageUuid),
      fetchScPackageBids(packageUuid),
      fetchScRfqClarifications(packageUuid),
    ])
      .then(([rfqData, bidList, clarList]) => {
        setRfq(rfqData);
        const qList = Array.isArray(bidList) ? bidList : [];
        setQuotes(qList);
        setClarifications(Array.isArray(clarList) ? clarList : []);

        const draft = qList.find((q) => q.status === "DRAFT") || qList[0];
        const lines = {};
        const scope = Array.isArray(rfqData?.boqLines) ? rfqData.boqLines : [];
        scope.forEach((bl) => {
          lines[bl.boqLineId] = { rate: "", lineStatus: "QUOTED", remarks: "" };
        });
        if (draft?.lines) {
          draft.lines.forEach((line) => {
            if (!line.boqLineId) return;
            lines[line.boqLineId] = {
              rate: line.rate ?? "",
              lineStatus: line.lineStatus === "INCLUDED" ? "QUOTED" : (line.lineStatus || "QUOTED"),
              remarks: line.remarks || "",
            };
          });
        }
        setQuoteForm({
          leadTimeDays: draft?.leadTimeDays ?? "",
          exclusionsText: draft?.exclusionsText || "",
          qualificationsText: draft?.qualificationsText || "",
          validityDate: draft?.validityDate || "",
          lines,
        });
      })
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load RFQ"))
      .finally(() => setLoading(false));
  }, [packageUuid]);

  useEffect(() => { load(); }, [load]);

  const quoteTotal = useMemo(() => {
    let total = 0;
    packageBoqLines.forEach((bl) => {
      const row = quoteForm.lines[bl.boqLineId];
      if (!row || row.lineStatus === "EXCLUDED") return;
      const rate = Number(row.rate);
      const qty = Number(bl.plannedQty);
      if (!Number.isNaN(rate) && !Number.isNaN(qty)) total += rate * qty;
    });
    return total;
  }, [packageBoqLines, quoteForm.lines]);

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

  const buildQuotePayload = () => ({
    quoteUuid: activeQuote?.status === "DRAFT" ? activeQuote.uuid : null,
    leadTimeDays: quoteForm.leadTimeDays !== "" ? Number(quoteForm.leadTimeDays) : null,
    exclusionsText: quoteForm.exclusionsText.trim() || null,
    qualificationsText: quoteForm.qualificationsText.trim() || null,
    validityDate: quoteForm.validityDate || null,
    lines: packageBoqLines.map((bl) => {
      const row = quoteForm.lines[bl.boqLineId] || { rate: "", lineStatus: "QUOTED", remarks: "" };
      return {
        boqLineId: bl.boqLineId,
        rate: row.rate !== "" ? Number(row.rate) : null,
        quantity: bl.plannedQty ?? null,
        lineStatus: row.lineStatus || "QUOTED",
        remarks: row.remarks?.trim() || null,
      };
    }),
  });

  const saveDraft = () =>
    run(() => saveScQuoteDraft(packageUuid, buildQuotePayload()), "Draft quote saved");

  const submitBid = async () => {
    setBusy(true);
    setMessage("");
    try {
      const saved = await saveScQuoteDraft(packageUuid, buildQuotePayload());
      const quoteUuid = saved?.uuid || activeQuote?.uuid;
      if (!quoteUuid) throw new Error("No quote to submit");
      await submitScQuote(packageUuid, quoteUuid);
      await load();
      setMessage("Quote submitted — editing is locked.");
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  const askClarification = () =>
    run(async () => {
      if (!question.trim()) throw new Error("Enter a question");
      await addScRfqClarification(packageUuid, { question: question.trim() });
      setQuestion("");
    }, "Clarification submitted");

  const updateLine = (boqLineId, patch) => {
    setQuoteForm((f) => ({
      ...f,
      lines: {
        ...f.lines,
        [boqLineId]: { ...(f.lines[boqLineId] || { rate: "", lineStatus: "QUOTED", remarks: "" }), ...patch },
      },
    }));
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </PageShell>
    );
  }

  if (!rfq) {
    return (
      <PageShell>
        <p className="text-sm text-muted-foreground">RFQ not found or you are not invited.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to={ROUTES.SUBCONTRACTOR.RFQ}>Back to inbox</Link>
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link to={ROUTES.SUBCONTRACTOR.RFQ}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageTitle
          title={rfq.packageName}
          subtitle={`${rfq.projectName || `Project #${rfq.projectId}`} · ${rfq.tradePackageName || rfq.tradePackageCode || "Trade"}`}
        />
      </div>

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <Badge className={`${SC_STATUS_BADGE[rfq.bidderStatus] || "bg-muted border-none"} text-[10px]`}>
          {formatScStatus(rfq.bidderStatus)}
        </Badge>
        <Badge variant="outline" className="text-[10px]">{formatScStatus(rfq.tenderStatus)}</Badge>
        {rfq.sealed && <Badge variant="secondary" className="text-[10px]">Bid sealed</Badge>}
        {closed || countdown?.closed ? (
          <Badge variant="destructive" className="text-[10px]">Submission closed</Badge>
        ) : (
          <Badge className="bg-amber-500/15 text-amber-800 border-none text-[10px]">{countdown?.label}</Badge>
        )}
        {submittedLocked && (
          <Badge className="bg-emerald-500/15 text-emerald-800 border-none text-[10px]">Quote locked</Badge>
        )}
      </div>

      {String(rfq.bidderStatus).toUpperCase() === "REGRET" && (
        <Surface className="p-4 border-amber-500/30 bg-amber-500/5 space-y-1">
          <p className="text-sm font-semibold text-amber-950">Regret notice</p>
          <p className="text-sm text-amber-950">
            {rfq.regretMessage
              || "Thank you for your tender. We regret to inform you that your bid was not successful on this occasion."}
          </p>
        </Surface>
      )}

      {rfq.tenderDescription && (
        <Surface className="p-4 text-sm text-muted-foreground">{rfq.tenderDescription}</Surface>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <Surface className="p-3">
          <p className="text-[10px] uppercase text-muted-foreground">Deadline</p>
          <p className="font-medium">{formatDate(rfq.tenderDeadline)}</p>
        </Surface>
        <Surface className="p-3">
          <p className="text-[10px] uppercase text-muted-foreground">Site visit</p>
          <p className="font-medium">{formatDate(rfq.siteVisitAt)}</p>
        </Surface>
        <Surface className="p-3">
          <p className="text-[10px] uppercase text-muted-foreground">Payment / retention</p>
          <p className="font-medium">
            {rfq.paymentTerms || "—"}
            {rfq.retentionPct != null ? ` · ${rfq.retentionPct}%` : ""}
          </p>
        </Surface>
        <Surface className="p-3">
          <p className="text-[10px] uppercase text-muted-foreground">Quote validity</p>
          <p className="font-medium">{rfq.quoteValidityDays ? `${rfq.quoteValidityDays} days` : "—"}</p>
        </Surface>
      </div>

      <Surface className="p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold">Quotation grid</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <FillDemoDataButton
                onClick={() => setQuoteForm((f) => ({
                  ...f,
                  ...DEMO.scQuote,
                  lines: { ...f.lines, ...demoQuoteLineRates(packageBoqLines) },
                }))}
              />
            )}
            {activeQuote && (
              <Badge className={`${SC_STATUS_BADGE[activeQuote.status] || "bg-muted border-none"} text-[10px]`}>
                {formatScStatus(activeQuote.status)}
              </Badge>
            )}
            <span className="text-sm font-semibold">Total {formatMoney(quoteTotal)}</span>
          </div>
        </div>

        {packageBoqLines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No BOQ lines linked to this package.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[70px]">Unit</TableHead>
                  <TableHead className="w-[80px] text-right">Qty</TableHead>
                  <TableHead className="w-[110px]">Rate / unit</TableHead>
                  <TableHead className="w-[110px] text-right">Amount</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="min-w-[140px]">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packageBoqLines.map((bl) => {
                  const row = quoteForm.lines[bl.boqLineId] || { rate: "", lineStatus: "QUOTED", remarks: "" };
                  const excluded = row.lineStatus === "EXCLUDED";
                  const rate = Number(row.rate);
                  const qty = Number(bl.plannedQty);
                  const amount = !excluded && !Number.isNaN(rate) && !Number.isNaN(qty) ? rate * qty : null;
                  return (
                    <TableRow key={bl.boqLineId} className={excluded ? "bg-muted/40 opacity-80" : undefined}>
                      <TableCell className="font-mono text-[11px]">{bl.sectionCode || "—"}</TableCell>
                      <TableCell className="text-sm">{bl.description}</TableCell>
                      <TableCell className="text-xs">{bl.unit || "—"}</TableCell>
                      <TableCell className="text-right text-xs">{bl.plannedQty ?? "—"}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8"
                          disabled={!canEdit || busy || excluded}
                          value={row.rate}
                          onChange={(e) => updateLine(bl.boqLineId, { rate: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {excluded ? "Excluded" : formatMoney(amount)}
                      </TableCell>
                      <TableCell>
                        <select
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                          disabled={!canEdit || busy}
                          value={row.lineStatus}
                          onChange={(e) => updateLine(bl.boqLineId, { lineStatus: e.target.value })}
                        >
                          {LINE_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8"
                          disabled={!canEdit || busy}
                          value={row.remarks}
                          onChange={(e) => updateLine(bl.boqLineId, { remarks: e.target.value })}
                          placeholder={row.lineStatus === "ALTERNATIVE" ? "Alternative details…" : ""}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Lead time (days)</Label>
            <Input
              type="number"
              value={quoteForm.leadTimeDays}
              disabled={!canEdit || busy}
              onChange={(e) => setQuoteForm((f) => ({ ...f, leadTimeDays: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Validity date</Label>
            <Input
              type="date"
              value={quoteForm.validityDate}
              disabled={!canEdit || busy}
              onChange={(e) => setQuoteForm((f) => ({ ...f, validityDate: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Exclusions</Label>
          <Textarea
            rows={2}
            disabled={!canEdit || busy}
            value={quoteForm.exclusionsText}
            onChange={(e) => setQuoteForm((f) => ({ ...f, exclusionsText: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Qualifications</Label>
          <Textarea
            rows={2}
            disabled={!canEdit || busy}
            value={quoteForm.qualificationsText}
            onChange={(e) => setQuoteForm((f) => ({ ...f, qualificationsText: e.target.value }))}
          />
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={saveDraft}>
              <Save className="mr-1 h-4 w-4" /> Save draft quote
            </Button>
            <Button size="sm" disabled={busy} onClick={submitBid}>
              <Send className="mr-1 h-4 w-4" /> Submit quote
            </Button>
          </div>
        )}
        {submittedLocked && (
          <p className="text-xs text-muted-foreground">
            This quote is submitted and locked. Contact the tender administrator if a controlled revision is required.
          </p>
        )}
        {closed && !submittedLocked && (
          <p className="text-xs text-muted-foreground">Submission closed — deadline has passed.</p>
        )}
      </Surface>

      <Surface className="p-5 space-y-4">
        <h2 className="text-sm font-semibold">Clarifications</h2>
        <div className="flex gap-2">
          <Textarea
            rows={2}
            className="flex-1"
            placeholder="Ask a question about scope, specs or programme..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={busy || closed}
          />
          <div className="flex flex-col gap-2">
            {!closed && (
              <FillDemoDataButton
                label="Demo Q"
                onClick={() => setQuestion(DEMO.scClarification.question)}
              />
            )}
            <Button size="sm" disabled={busy || closed || !question.trim()} onClick={askClarification}>
              Send
            </Button>
          </div>
        </div>
        {clarifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No clarifications yet.</p>
        ) : (
          <div className="space-y-3">
            {clarifications.map((c) => (
              <div key={c.uuid} className="rounded-lg border border-border/40 p-3 text-sm">
                <p className="font-medium">{c.question}</p>
                {c.answer ? (
                  <p className="mt-2 text-muted-foreground">Answer: {c.answer}</p>
                ) : (
                  <p className="mt-1 text-xs text-amber-700">Awaiting response</p>
                )}
                {c.material && (
                  <Badge variant="outline" className="mt-2 text-[10px]">Addendum</Badge>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(c.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
