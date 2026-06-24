import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, FileText, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBoq } from "../BoqEngine";
import BoqInvoiceTemplate from "../BoqInvoiceTemplate";
import BoqChargesEditor from "../BoqChargesEditor";
import { BOQ_STATUS, getQasStats } from "../boqDataUtils";
import { formatCurrency } from "../quantityCalcUtils";
import { downloadBoqPdf, printBoqDocument } from "../boqPdfExport";

export default function Step03GenerateQuotation() {
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
    finalizeBoq,
    saveNotice,
    prevStep,
    resetSession,
  } = useBoq();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!generatedBoq) {
      generateBoq();
    }
  }, [generatedBoq, generateBoq]);

  const stats = getQasStats(floors, rooms);
  const doc = generatedBoq;
  const isDraft = !doc || doc.status !== BOQ_STATUS.FINAL;

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
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">BOQ &amp; Quotation</h2>
            <Badge variant={isDraft ? "secondary" : "default"} className="capitalize">
              {doc.status || BOQ_STATUS.DRAFT}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.floors} floors · {stats.rooms} rooms · {doc.qasLineCount ?? stats.workItems} survey items
            {(doc.additionalLineCount ?? additionalLines.length) > 0 &&
              ` · ${doc.additionalLineCount ?? additionalLines.length} additional charges`}
          </p>
          {saveNotice && (
            <p className="text-xs text-emerald-600 mt-1">{saveNotice}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={prevStep}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Edit Survey
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleRefreshSurvey} disabled={refreshing}>
            <Sparkles className="h-4 w-4 mr-1" /> Refresh Survey Lines
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => printBoqDocument()}>
            <FileText className="h-4 w-4 mr-1" /> Print
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => downloadBoqPdf(doc)}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={saveBoqDraft}>
            <Save className="h-4 w-4 mr-1" /> Save Draft
          </Button>
          {isDraft && (
            <Button type="button" size="sm" onClick={finalizeBoq}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Finalize BOQ
            </Button>
          )}
        </div>
      </div>

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

      <BoqChargesEditor
        lines={additionalLines}
        onAdd={addAdditionalLine}
        onUpdate={updateAdditionalLine}
        onRemove={removeAdditionalLine}
      />

      <BoqInvoiceTemplate boq={doc} floors={floors} rooms={rooms} />

      <div className="flex justify-between pt-4 border-t print:hidden">
        <Button type="button" variant="outline" onClick={prevStep}>
          ← Back to Survey
        </Button>
        <Button type="button" variant="outline" onClick={resetSession}>
          Start New QAS
        </Button>
      </div>
    </div>
  );
}
