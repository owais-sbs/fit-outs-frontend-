import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchScAllClarifications,
  fetchScRfqs,
  addScRfqClarification,
} from "@/modules/admin/api/subcontractor.api";
import { FillDemoDataButton } from "@/components/shared/FillDemoDataButton";
import { DEMO } from "@/shared/demo/formDemoData";
import { ROUTES } from "@/shared/constants/routes";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function SubcontractorClarificationsPage() {
  const [threads, setThreads] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [packageFilter, setPackageFilter] = useState("ALL");
  const [askPackageUuid, setAskPackageUuid] = useState("");
  const [question, setQuestion] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setMessage("");
    Promise.all([fetchScAllClarifications().catch(() => []), fetchScRfqs().catch(() => [])])
      .then(([clarList, rfqList]) => {
        setThreads(Array.isArray(clarList) ? clarList : []);
        const packages = Array.isArray(rfqList) ? rfqList : [];
        setRfqs(packages);
        setAskPackageUuid((current) => {
          if (current) return current;
          return packages[0]?.packageUuid || packages[0]?.uuid || "";
        });
      })
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load clarifications"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (packageFilter === "ALL") return threads;
    return threads.filter((t) => String(t.packageUuid) === String(packageFilter));
  }, [threads, packageFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const t of filtered) {
      const key = t.packageUuid || "unknown";
      if (!map.has(key)) {
        map.set(key, {
          packageUuid: t.packageUuid,
          packageName: t.packageName || "Package",
          projectId: t.projectId,
          projectName: t.projectName || (t.projectId ? `Project #${t.projectId}` : "Project"),
          items: [],
        });
      }
      map.get(key).items.push(t);
    }
    return Array.from(map.values());
  }, [filtered]);

  const ask = async () => {
    if (!askPackageUuid || !question.trim()) {
      setMessage("Select an RFQ package and enter a question.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await addScRfqClarification(askPackageUuid, { question: question.trim() });
      setQuestion("");
      setMessage("Clarification sent.");
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to send clarification");
    } finally {
      setBusy(false);
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
    <PageShell className="max-w-4xl mx-auto space-y-6">
      <PageTitle
        title="Clarifications"
        subtitle="Questions and addenda across all RFQs you are invited to, grouped by project package."
      />

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Surface className="p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[200px] flex-1">
            <Label className="text-xs">Ask about package</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={askPackageUuid}
              onChange={(e) => setAskPackageUuid(e.target.value)}
            >
              <option value="">Select RFQ…</option>
              {rfqs.map((r) => (
                <option key={r.packageUuid || r.uuid} value={r.packageUuid || r.uuid}>
                  {(r.projectName || `Project #${r.projectId || "?"}`)} — {r.packageName || r.name || "Package"}
                </option>
              ))}
            </select>
          </div>
          <FillDemoDataButton
            label="Demo Q"
            onClick={() => setQuestion(DEMO.scClarification.question)}
            disabled={busy || rfqs.length === 0}
          />
        </div>
        <Textarea
          rows={3}
          placeholder="Ask a question about scope, specs, drawings or programme…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={busy || rfqs.length === 0}
        />
        <Button size="sm" className="gap-2" disabled={busy || !askPackageUuid || !question.trim()} onClick={ask}>
          <Send className="h-3.5 w-3.5" /> Send clarification
        </Button>
        {rfqs.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No issued RFQs yet. Once you are invited to a tender, you can ask clarifications here.
          </p>
        )}
      </Surface>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={packageFilter === "ALL" ? "secondary" : "ghost"}
          className="h-7 text-xs"
          onClick={() => setPackageFilter("ALL")}
        >
          All packages
        </Button>
        {rfqs.map((r) => {
          const id = r.packageUuid || r.uuid;
          return (
            <Button
              key={id}
              size="sm"
              variant={String(packageFilter) === String(id) ? "secondary" : "ghost"}
              className="h-7 text-xs"
              onClick={() => setPackageFilter(id)}
            >
              {r.packageName || r.name || String(id).slice(0, 8)}
            </Button>
          );
        })}
      </div>

      {grouped.length === 0 ? (
        <Surface className="p-10 text-center text-sm text-muted-foreground">
          <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No clarification threads yet. Ask a question above or open an RFQ from Quote / rate entry.
        </Surface>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <Surface key={group.packageUuid || group.packageName} className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{group.projectName}</p>
                  <p className="text-xs text-muted-foreground">{group.packageName}</p>
                </div>
                {group.packageUuid && (
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link to={ROUTES.SUBCONTRACTOR.RFQ_DETAIL.replace(":packageUuid", group.packageUuid)}>
                      Open RFQ
                    </Link>
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {group.items.map((c) => (
                  <div key={c.uuid} className="rounded-lg border border-border/40 p-3 text-sm space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {c.material && <Badge variant="outline" className="text-[10px]">Addendum</Badge>}
                      {!c.answer && <Badge className="bg-amber-500/15 text-amber-800 border-none text-[10px]">Awaiting reply</Badge>}
                      {c.answer && <Badge className="bg-emerald-500/15 text-emerald-800 border-none text-[10px]">Answered</Badge>}
                    </div>
                    <p className="font-medium">{c.question}</p>
                    {c.answer ? (
                      <p className="text-muted-foreground">Answer: {c.answer}</p>
                    ) : (
                      <p className="text-xs text-amber-800">Waiting for main contractor / QS response</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">{formatDate(c.createdAt)}</p>
                  </div>
                ))}
              </div>
            </Surface>
          ))}
        </div>
      )}
    </PageShell>
  );
}
