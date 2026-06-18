import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  ClipboardList,
  Download,
  DoorOpen,
  FileText,
  Layers,
  Mail,
  Save,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBoq, QAS_TOTAL_STEPS } from "../BoqEngine";
import BoqInvoiceTemplate from "../BoqInvoiceTemplate";
import QasReviewTemplate from "../QasReviewTemplate";
import { BOQ_THEME, COMPANY, formatBoqAmount } from "../boqTheme";
import BoqSplitHeader from "../BoqSplitHeader";
import { getQasStats } from "../boqDataUtils";
import { downloadBoqPdf, printBoqDocument } from "../boqPdfExport";

const PHASE = {
  HUB: "hub",
  REVIEW: "review",
  INVOICE: "invoice",
};

function BoqHubPanel({ stats, session, onReview, onGenerate, generating, hasExistingBoq, onViewBoq }) {
  const projectName = session?.project?.projectName || session?.project?.name || "Project";

  const statCards = [
    { icon: Building2, label: "Floors", value: stats.floors },
    { icon: DoorOpen, label: "Rooms", value: stats.rooms },
    { icon: Layers, label: "Walls", value: stats.walls },
    { icon: Wrench, label: "Work Items", value: stats.workItems },
  ];

  return (
    <div className="space-y-6">
      {/* Themed intro banner — same split header as invoice/review, no white gap */}
      <div className="rounded-lg overflow-hidden shadow-md">
        <BoqSplitHeader
          minHeight={120}
          left={
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Step 6</p>
              <h2 className="text-lg font-bold mt-0.5 leading-tight">{COMPANY.name}</h2>
            </>
          }
          right={
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">BOQ Generation</p>
              <h3 className="text-xl font-bold truncate leading-tight">{projectName}</h3>
              <p className="text-xs text-white/60 mt-0.5 font-mono">{session?.ref}</p>
            </>
          }
        />

        <div
          className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10 border-t border-white/10"
          style={{ backgroundColor: BOQ_THEME.navyDark }}
        >
          {statCards.map(({ icon: Icon, label, value }) => (
            <div key={label} className="px-4 py-3 flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(200,102,42,0.25)" }}
              >
                <Icon className="h-4 w-4" style={{ color: BOQ_THEME.orangeLight }} />
              </div>
              <div>
                <p className="text-xl font-bold text-white leading-none tabular-nums">{value}</p>
                <p className="text-[9px] uppercase tracking-wide text-white/45 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button
          type="button"
          onClick={onReview}
          className="group text-left rounded-lg overflow-hidden border transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ borderColor: BOQ_THEME.metaBorder }}
        >
          <div className="px-5 py-3 flex items-center gap-3" style={{ backgroundColor: BOQ_THEME.navy }}>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-white/10">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Option 1</p>
              <h3 className="font-bold text-white text-sm">Review QAS Document</h3>
            </div>
          </div>
          <div className="px-5 py-4 bg-white">
            <p className="text-sm text-gray-600 leading-relaxed">
              Full quantity assessment report — every floor, room, wall dimension, and work item captured during the
              QAS workflow, formatted in the official document theme.
            </p>
            <span
              className="inline-flex items-center gap-1 text-xs font-bold mt-4"
              style={{ color: BOQ_THEME.orange }}
            >
              Open detailed review <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || stats.workItems === 0}
          className="group text-left rounded-lg overflow-hidden border-2 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
          style={{ borderColor: BOQ_THEME.orange }}
        >
          <div
            className="px-5 py-3 flex items-center gap-3"
            style={{ background: `linear-gradient(90deg, ${BOQ_THEME.orangeGradientFrom}, ${BOQ_THEME.orangeGradientTo})` }}
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-white/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Option 2</p>
              <h3 className="font-bold text-white text-sm">{generating ? "Generating BOQ…" : "Generate BOQ Invoice"}</h3>
            </div>
          </div>
          <div className="px-5 py-4 bg-white">
            <p className="text-sm text-gray-600 leading-relaxed">
              System applies unit rates, calculates line totals, VAT, and produces the priced BOQ invoice — ready to
              share, save, or download for your client.
            </p>
            <span
              className="inline-flex items-center gap-1 text-xs font-bold mt-4"
              style={{ color: BOQ_THEME.orange }}
            >
              {generating ? "Calculating prices…" : "Generate priced BOQ"} <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>
      </div>

      {stats.workItems === 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Add work items in Step 3 before generating a BOQ.
        </p>
      )}

      {hasExistingBoq && (
        <button
          type="button"
          onClick={onViewBoq}
          className="w-full flex items-center justify-between gap-3 rounded-lg border px-5 py-3.5 text-left transition-all hover:shadow-md"
          style={{ borderColor: BOQ_THEME.orange, backgroundColor: BOQ_THEME.cream }}
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" style={{ color: BOQ_THEME.orange }} />
            <div>
              <p className="text-xs font-bold text-gray-800">Previously Generated BOQ</p>
              <p className="text-[11px] text-gray-500 font-mono">{hasExistingBoq.ref}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}

export default function Step06BoqGeneration() {
  const { session, floors, rooms, measurements, generatedBoq, generateBoq, saveBoq, goToStep } = useBoq();
  const [phase, setPhase] = useState(PHASE.HUB);
  const [generating, setGenerating] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const stats = getQasStats(floors, rooms);
  const boq = generatedBoq;
  const projectEmail = session?.project?.clientEmail || session?.project?.email || "";

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      generateBoq();
      setGenerating(false);
      setPhase(PHASE.INVOICE);
    }, 800);
  };

  const handleSave = () => {
    saveBoq();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadBoqPdf("boq-invoice-print", `${boq?.ref || "BOQ-Invoice"}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintReview = () => {
    printBoqDocument("qas-review-print");
  };

  const handleSendEmail = () => {
    if (!clientEmail.trim()) return;
    setEmailSent(true);
    setTimeout(() => {
      setEmailOpen(false);
      setEmailSent(false);
    }, 1500);
  };

  if (phase === PHASE.HUB) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: BOQ_THEME.orange }}>
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-bold"
              style={{ backgroundColor: BOQ_THEME.orange }}
            >
              6
            </span>
            Step 6 of {QAS_TOTAL_STEPS}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Generate BOQ</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review your captured quantities or generate the priced BOQ invoice for{" "}
            <span className="font-semibold">{session?.project?.projectName || session?.project?.name}</span>.
          </p>
        </div>

        <BoqHubPanel
          stats={stats}
          session={session}
          onReview={() => setPhase(PHASE.REVIEW)}
          onGenerate={handleGenerate}
          generating={generating}
          hasExistingBoq={generatedBoq}
          onViewBoq={() => setPhase(PHASE.INVOICE)}
        />

        <Button variant="outline" onClick={() => goToStep(5)} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to QAS Complete
        </Button>
      </div>
    );
  }

  if (phase === PHASE.REVIEW) {
    return (
      <div className="space-y-5">
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 print:hidden"
          style={{ backgroundColor: BOQ_THEME.navy }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPhase(PHASE.HUB)}
            className="gap-1 text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrintReview}
              className="gap-1.5 border-white/20 text-white bg-transparent hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              Print Review
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={generating || stats.workItems === 0}
              className="gap-1.5 text-white border-0"
              style={{ backgroundColor: BOQ_THEME.orange }}
            >
              <Sparkles className="h-4 w-4" />
              {generating ? "Generating…" : "Generate BOQ"}
            </Button>
          </div>
        </div>

        <QasReviewTemplate
          session={session}
          floors={floors}
          rooms={rooms}
          measurements={measurements}
          stats={stats}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 print:hidden"
        style={{ backgroundColor: BOQ_THEME.navy }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPhase(PHASE.HUB)}
          className="gap-1 text-white hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Options
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setClientEmail(projectEmail); setEmailOpen(true); }}
            className="gap-1.5 border-white/20 text-white bg-transparent hover:bg-white/10"
          >
            <Mail className="h-4 w-4" />
            Share to Client
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            className="gap-1.5 border-white/20 text-white bg-transparent hover:bg-white/10"
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : "Save BOQ"}
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={downloading || !boq}
            className="gap-1.5 text-white border-0"
            style={{ backgroundColor: BOQ_THEME.orange }}
          >
            <Download className="h-4 w-4" />
            {downloading ? "Generating PDF…" : "Download BOQ"}
          </Button>
        </div>
      </div>

      {boq && (
        <>
          <BoqInvoiceTemplate boq={boq} floors={floors} rooms={rooms} />
          {boq.lines.length > 0 && (
            <p className="text-center text-xs text-muted-foreground print:hidden">
              Grand Total:{" "}
              <span className="font-bold" style={{ color: BOQ_THEME.orange }}>
                {formatBoqAmount(boq.totals.grandTotal, boq.currency)}
              </span>
              {" · "}
              {boq.lines.length} line items across {stats.floors} floor(s)
            </p>
          )}
        </>
      )}

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share BOQ with Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Send{" "}
              <span className="font-mono font-semibold" style={{ color: BOQ_THEME.orange }}>
                {boq?.ref}
              </span>{" "}
              ({formatBoqAmount(boq?.totals?.grandTotal, boq?.currency)}) to your client via email.
            </p>
            <Input
              type="email"
              placeholder="client@email.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
            {emailSent && <p className="text-sm text-emerald-600 font-medium">BOQ sent successfully!</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendEmail}
              disabled={!clientEmail.trim() || emailSent}
              className="gap-1.5 text-white"
              style={{ backgroundColor: BOQ_THEME.orange }}
            >
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
