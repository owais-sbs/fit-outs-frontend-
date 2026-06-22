import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileText, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBoq } from "../BoqEngine";
import BoqInvoiceTemplate from "../BoqInvoiceTemplate";
import { getQasStats } from "../boqDataUtils";
import { formatCurrency } from "../quantityCalcUtils";
import { downloadBoqPdf, printBoqDocument } from "../boqPdfExport";

export default function Step03GenerateQuotation() {
  const {
    session,
    floors,
    rooms,
    generatedBoq,
    generateBoq,
    saveBoq,
    completeSession,
    prevStep,
    resetSession,
  } = useBoq();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!generatedBoq) {
      generateBoq();
    }
  }, [generatedBoq, generateBoq]);

  useEffect(() => {
    if (session?.status !== "Completed") {
      completeSession();
    }
  }, [session?.status, completeSession]);

  const stats = getQasStats(floors, rooms);
  const doc = generatedBoq;

  const handleRegenerate = () => {
    setGenerating(true);
    generateBoq();
    setTimeout(() => setGenerating(false), 400);
  };

  if (!doc) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Preparing quotation…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-bold">Quotation</h2>
          <p className="text-sm text-muted-foreground">
            {stats.floors} floors · {stats.rooms} rooms · {stats.workItems} line items
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={prevStep}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Edit Survey
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleRegenerate} disabled={generating}>
            <Sparkles className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => printBoqDocument()}>
            <FileText className="h-4 w-4 mr-1" /> Print
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => downloadBoqPdf(doc)}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button type="button" size="sm" onClick={saveBoq}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 print:hidden">
        <div className="flex flex-wrap gap-6 text-sm">
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
