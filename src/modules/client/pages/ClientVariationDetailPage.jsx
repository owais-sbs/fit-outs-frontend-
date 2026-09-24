import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { clientApproveVariation, clientRejectVariation, fetchVariation } from "@/modules/admin/api/variations.api";
import { formatCurrency } from "@/modules/admin/pages/boq/quantityCalcUtils";
import CrBadge from "@/modules/admin/pages/variations/CrBadge";
import VariationAttachments from "@/modules/admin/pages/variations/VariationAttachments";
import VariationStatusPipeline from "@/modules/admin/pages/variations/VariationStatusPipeline";

export default function ClientVariationDetailPage() {
  const { projectId, uuid } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(() => {
    setLoading(true);
    fetchVariation(projectId, uuid).then(setItem).catch(() => setItem(null)).finally(() => setLoading(false));
  }, [projectId, uuid]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, success) => {
    setBusy(true); setMessage("");
    try { await fn(); setMessage(success); load(); }
    catch (e) { setMessage(e?.response?.data?.error || e?.response?.data?.message || "Action failed"); }
    finally { setBusy(false); }
  };

  if (loading) return <PageShell><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div></PageShell>;
  if (!item) return <PageShell><p className="text-muted-foreground">Variation not found.</p></PageShell>;

  return (
    <PageShell>
      <PageTitle title={<span className="flex items-center gap-2"><CrBadge number={item.crNumber} /> {item.title}</span>} description="Contract change request" actions={<Button variant="outline" asChild><Link to="/client/variations">Back to variations</Link></Button>} />
      {message && <p className="mb-3 text-sm text-muted-foreground">{message}</p>}
      <Surface className="mb-4 p-4"><VariationStatusPipeline status={item.status} /></Surface>
      <div className="grid gap-4 lg:grid-cols-3">
        <Surface className="space-y-4 p-4 lg:col-span-2">
          <p className="whitespace-pre-wrap text-sm">{item.description || "No description provided."}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>Variation value<br /><strong>{formatCurrency(item.sellDelta)}</strong></div>
            <div>Schedule impact<br /><strong>{item.proposedDelayDays || 0} days</strong></div>
            <div>Current contract<br /><strong>{formatCurrency(item.currentContractValue)}</strong></div>
            <div>Proposed contract<br /><strong>{formatCurrency(item.proposedContractValue)}</strong></div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Pricing breakdown</h3>
            <div className="divide-y rounded-md border text-sm">
              {(item.lines || []).map((line) => <div key={line.uuid} className="grid grid-cols-[1fr_auto] gap-3 p-3"><span>{line.description}</span><strong>{formatCurrency(line.sellAmount)}</strong></div>)}
              {!item.lines?.length && <p className="p-3 text-muted-foreground">No pricing lines.</p>}
            </div>
          </div>
        </Surface>
        <div className="space-y-4">
          {item.status === "ISSUED_TO_CLIENT" && <Surface className="space-y-3 p-4"><h3 className="text-sm font-semibold">Your decision</h3><Textarea placeholder="Reason required when requesting changes" value={comment} onChange={(e) => setComment(e.target.value)} /><div className="flex gap-2"><Button disabled={busy} onClick={() => run(() => clientApproveVariation(projectId, uuid), "Variation approved")}>Approve</Button><Button disabled={busy || !comment.trim()} variant="outline" onClick={() => run(() => clientRejectVariation(projectId, uuid, comment), "Changes requested")}>Request changes</Button></div></Surface>}
          <Surface className="p-4"><VariationAttachments attachments={item.attachments} /></Surface>
        </div>
      </div>
    </PageShell>
  );
}
