import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, FileText, GitBranch, Save, Send, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBoq } from "../BoqEngine";
import BoqInvoiceTemplate from "../BoqInvoiceTemplate";
import BoqChargesEditor from "../BoqChargesEditor";
import { getQasStats, isBoqApproved, isBoqEditable } from "../boqDataUtils";
import { formatCurrency } from "../quantityCalcUtils";
import { downloadBoqPdf, printBoqDocument } from "../boqPdfExport";
import { BoqStatusBadge } from "../BoqApprovalTimeline";
import BoqApprovalTimeline from "../BoqApprovalTimeline";
import { fetchBoqApprovalHistory } from "../../../api/boq.api";
import { canSubmitBoq } from "@/shared/constants/roles";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";

export default function Step03GenerateQuotation() {
  const { role } = useAuth();
  const {
    floors,
    rooms,
    additionalLines,
    generatedBoq,
    generateBoq,
    refreshBoqFromSurvey,
    addAdditionalLine,
    updateAdditionalLine,
    removeAdditionalLine,
    saveBoqDraft,
    submitBoqForApproval,
    createRevision,
    apiBoqId,
    saveNotice,
    prevStep,
    resetSession,
  } = useBoq();
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState(null);
  const [revisionLabel, setRevisionLabel] = useState("Client revision");

  useEffect(() => {
    if (!generatedBoq) {
      generateBoq();
    }
  }, [generatedBoq, generateBoq]);

  useEffect(() => {
    const id = apiBoqId || generatedBoq?.apiId;
    if (!id) return;
    fetchBoqApprovalHistory(id)
      .then(setHistory)
      .catch(() => setHistory(null));
  }, [apiBoqId, generatedBoq?.apiId, generatedBoq?.status]);

  const stats = getQasStats(floors, rooms);
  const doc = generatedBoq;
  const editable = isBoqEditable(doc?.status);
  const approved = isBoqApproved(doc?.status);

  const handleRefreshSurvey = () => {
    setRefreshing(true);
    refreshBoqFromSurvey();
    setTimeout(() => setRefreshing(false), 400);
  };

  if (!doc) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Creating BOQ draft from survey…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold">BOQ &amp; Quotation</h2>
            <BoqStatusBadge status={doc.status} />
            {doc.version && (
              <span className="text-xs font-mono text-muted-foreground">v{doc.version}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.floors} floors · {stats.rooms} rooms · {doc.qasLineCount ?? stats.workItems} survey items
            {(doc.additionalLineCount ?? additionalLines.length) > 0 &&
              ` · ${doc.additionalLineCount ?? additionalLines.length} additional charges`}
          </p>
          {doc.lastRejectionComment && (
            <p className="text-xs text-red-600 mt-1">
              Last rejection: {doc.lastRejectionComment}
            </p>
          )}
          {saveNotice && (
            <p className="text-xs text-emerald-600 mt-1">{saveNotice}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button type="button" variant="outline" size="sm" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Edit Survey
            </Button>
          )}
          {editable && (
            <Button type="button" variant="outline" size="sm" onClick={handleRefreshSurvey} disabled={refreshing}>
              <Sparkles className="h-4 w-4 mr-1" /> Refresh Survey Lines
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => printBoqDocument()}>
            <FileText className="h-4 w-4 mr-1" /> Print
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => downloadBoqPdf(doc)}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          {editable && (
            <Button type="button" variant="outline" size="sm" onClick={saveBoqDraft}>
              <Save className="h-4 w-4 mr-1" /> Save Draft
            </Button>
          )}
          {editable && canSubmitBoq(role) && (
            <Button type="button" size="sm" onClick={submitBoqForApproval}>
              <Send className="h-4 w-4 mr-1" /> Submit for Approval
            </Button>
          )}
        </div>
      </div>

      {approved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex flex-col sm:flex-row sm:items-end gap-3 print:hidden">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-emerald-800">This BOQ is approved and locked.</p>
            <div className="flex gap-2">
              <Input
                value={revisionLabel}
                onChange={(e) => setRevisionLabel(e.target.value)}
                placeholder="Revision label"
                className="max-w-xs h-8 text-sm"
              />
              <Button type="button" size="sm" variant="outline" onClick={() => createRevision(revisionLabel)}>
                <GitBranch className="h-4 w-4 mr-1" /> Create Revision
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-4 print:hidden">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Survey subtotal</p>
            <p className="font-bold tabular-nums">{formatCurrency(doc.totals?.qasSubtotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Additional charges</p>
            <p className="font-bold tabular-nums">{formatCurrency(doc.totals?.additionalSubtotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="font-bold tabular-nums">{formatCurrency(doc.totals?.subtotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">VAT (5%)</p>
            <p className="font-bold tabular-nums">{formatCurrency(doc.totals?.vat)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Grand Total</p>
            <p className="text-lg font-bold tabular-nums text-primary">{formatCurrency(doc.totals?.grandTotal)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 print:hidden">
        <h3 className="text-sm font-semibold mb-3">Approval workflow</h3>
        <BoqApprovalTimeline history={history} />
        <p className="text-xs text-muted-foreground mt-3">
          QS → Senior QS → PM → Director → Client.{" "}
          <Link to={ROUTES.ADMIN.BOQ_INBOX} className="underline">Open approval inbox</Link>
        </p>
      </div>

      {editable && (
        <BoqChargesEditor
          lines={additionalLines}
          onAdd={addAdditionalLine}
          onUpdate={updateAdditionalLine}
          onRemove={removeAdditionalLine}
        />
      )}

      <BoqInvoiceTemplate boq={doc} floors={floors} rooms={rooms} />

      <div className="flex justify-between pt-4 border-t print:hidden">
        {editable ? (
          <Button type="button" variant="outline" onClick={prevStep}>
            ← Back to Survey
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" variant="outline" onClick={resetSession}>
          Start New QAS
        </Button>
      </div>
    </div>
  );
}
