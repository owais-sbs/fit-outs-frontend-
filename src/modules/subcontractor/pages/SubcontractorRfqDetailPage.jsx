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
  addScRfqClarification,
  fetchMyScBoqLines,
  fetchScPackageBids,
  fetchScRfq,
  fetchScRfqClarifications,
  saveScQuoteDraft,
  submitScQuote,
} from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SubcontractorRfqDetailPage() {
  const { packageUuid } = useParams();
  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [boqLines, setBoqLines] = useState([]);
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
    lineRates: {},
  });

  const activeQuote = useMemo(
    () => quotes.find((q) => q.status === "DRAFT") || quotes[0] || null,
    [quotes]
  );

  const packageBoqLines = useMemo(
    () => boqLines.filter((l) => String(l.packageUuid) === String(packageUuid)),
    [boqLines, packageUuid]
  );

  const load = useCallback(() => {
    if (!packageUuid) return;
    setLoading(true);
    Promise.all([
      fetchScRfq(packageUuid),
      fetchScPackageBids(packageUuid),
      fetchMyScBoqLines(),
      fetchScRfqClarifications(packageUuid),
    ])
      .then(([rfqData, bidList, lines, clarList]) => {
        setRfq(rfqData);
        const qList = Array.isArray(bidList) ? bidList : [];
        const lineList = Array.isArray(lines) ? lines : [];
        const pkgLines = lineList.filter((l) => String(l.packageUuid) === String(packageUuid));
        setQuotes(qList);
        setBoqLines(lineList);
        setClarifications(Array.isArray(clarList) ? clarList : []);

        const draft = qList.find((q) => q.status === "DRAFT") || qList[0];
        if (draft) {
          const lineRates = {};
          (draft.lines || []).forEach((line) => {
            if (line.boqLineId) lineRates[line.boqLineId] = line.rate ?? "";
          });
          pkgLines.forEach((bl) => {
            if (lineRates[bl.boqLineId] == null) {
              lineRates[bl.boqLineId] = "";
            }
          });
          setQuoteForm({
            leadTimeDays: draft.leadTimeDays ?? "",
            exclusionsText: draft.exclusionsText || "",
            qualificationsText: draft.qualificationsText || "",
            validityDate: draft.validityDate || "",
            lineRates,
          });
        } else {
          const lineRates = {};
          pkgLines.forEach((bl) => { lineRates[bl.boqLineId] = ""; });
          setQuoteForm((f) => ({ ...f, lineRates }));
        }
      })
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load RFQ"))
      .finally(() => setLoading(false));
  }, [packageUuid]);

  useEffect(() => { load(); }, [load]);

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
    quoteUuid: activeQuote?.uuid || null,
    leadTimeDays: quoteForm.leadTimeDays !== "" ? Number(quoteForm.leadTimeDays) : null,
    exclusionsText: quoteForm.exclusionsText.trim() || null,
    qualificationsText: quoteForm.qualificationsText.trim() || null,
    validityDate: quoteForm.validityDate || null,
    lines: packageBoqLines.map((bl) => ({
      boqLineId: bl.boqLineId,
      rate: quoteForm.lineRates[bl.boqLineId] !== "" ? Number(quoteForm.lineRates[bl.boqLineId]) : null,
      quantity: bl.plannedQty ?? null,
      lineStatus: "INCLUDED",
      remarks: null,
    })),
  });

  const saveDraft = () =>
    run(() => saveScQuoteDraft(packageUuid, buildQuotePayload()), "Quote draft saved");

  const submitBid = async () => {
    setBusy(true);
    setMessage("");
    try {
      const saved = await saveScQuoteDraft(packageUuid, buildQuotePayload());
      const quoteUuid = saved?.uuid || activeQuote?.uuid;
      if (!quoteUuid) throw new Error("No quote to submit");
      await submitScQuote(packageUuid, quoteUuid);
      await load();
      setMessage("Bid submitted");
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

  const canEdit = activeQuote?.status === "DRAFT" || !activeQuote;
  const closed = rfq?.deadlinePassed;

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
          subtitle={`${rfq.projectName || `Project #${rfq.projectId}`} · Deadline ${formatDate(rfq.tenderDeadline)}`}
        />
      </div>

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge className={`${SC_STATUS_BADGE[rfq.bidderStatus] || "bg-muted border-none"} text-[10px]`}>
          {formatScStatus(rfq.bidderStatus)}
        </Badge>
        <Badge variant="outline" className="text-[10px]">{formatScStatus(rfq.tenderStatus)}</Badge>
        {rfq.sealed && <Badge variant="secondary" className="text-[10px]">Sealed until deadline</Badge>}
      </div>

      {rfq.tenderDescription && (
        <Surface className="p-4 text-sm text-muted-foreground">{rfq.tenderDescription}</Surface>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <Surface className="p-3">
          <p className="text-[10px] uppercase text-muted-foreground">Site visit</p>
          <p className="font-medium">{formatDate(rfq.siteVisitAt)}</p>
        </Surface>
        <Surface className="p-3">
          <p className="text-[10px] uppercase text-muted-foreground">Payment terms</p>
          <p className="font-medium">{rfq.paymentTerms || "—"}</p>
        </Surface>
        <Surface className="p-3">
          <p className="text-[10px] uppercase text-muted-foreground">Retention</p>
          <p className="font-medium">{rfq.retentionPct != null ? `${rfq.retentionPct}%` : "—"}</p>
        </Surface>
        <Surface className="p-3">
          <p className="text-[10px] uppercase text-muted-foreground">Quote validity</p>
          <p className="font-medium">{rfq.quoteValidityDays ? `${rfq.quoteValidityDays} days` : "—"}</p>
        </Surface>
      </div>

      <Surface className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Quote entry</h2>
          {activeQuote && (
            <Badge className={`${SC_STATUS_BADGE[activeQuote.status] || "bg-muted border-none"} text-[10px]`}>
              {formatScStatus(activeQuote.status)}
              {activeQuote.totalValue != null ? ` · ${formatMoney(activeQuote.totalValue)}` : ""}
            </Badge>
          )}
        </div>

        {packageBoqLines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No BOQ lines linked to this package.</p>
        ) : (
          <div className="space-y-2">
            {packageBoqLines.map((bl) => (
              <div key={bl.boqLineId} className="grid gap-2 rounded-lg border border-border/40 p-3 sm:grid-cols-[1fr_100px_120px]">
                <div>
                  <p className="text-sm font-medium">{bl.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {bl.unit} · Qty {bl.plannedQty}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground self-center">Rate</div>
                <Input
                  type="number"
                  className="h-8"
                  disabled={!canEdit || closed || busy}
                  value={quoteForm.lineRates[bl.boqLineId] ?? ""}
                  onChange={(e) =>
                    setQuoteForm((f) => ({
                      ...f,
                      lineRates: { ...f.lineRates, [bl.boqLineId]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Lead time (days)</Label>
            <Input
              type="number"
              value={quoteForm.leadTimeDays}
              disabled={!canEdit || closed || busy}
              onChange={(e) => setQuoteForm((f) => ({ ...f, leadTimeDays: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Validity date</Label>
            <Input
              type="date"
              value={quoteForm.validityDate}
              disabled={!canEdit || closed || busy}
              onChange={(e) => setQuoteForm((f) => ({ ...f, validityDate: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Exclusions</Label>
          <Textarea
            rows={2}
            disabled={!canEdit || closed || busy}
            value={quoteForm.exclusionsText}
            onChange={(e) => setQuoteForm((f) => ({ ...f, exclusionsText: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Qualifications</Label>
          <Textarea
            rows={2}
            disabled={!canEdit || closed || busy}
            value={quoteForm.qualificationsText}
            onChange={(e) => setQuoteForm((f) => ({ ...f, qualificationsText: e.target.value }))}
          />
        </div>

        {canEdit && !closed && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={saveDraft}>
              <Save className="mr-1 h-4 w-4" /> Save draft
            </Button>
            <Button size="sm" disabled={busy} onClick={submitBid}>
              <Send className="mr-1 h-4 w-4" /> Submit bid
            </Button>
          </div>
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
            disabled={busy}
          />
          <Button size="sm" disabled={busy || !question.trim()} onClick={askClarification}>
            Send
          </Button>
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
