import { FileText, Download, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value || "\u2014"}</span>
    </div>
  );
}

function formatCurrency(n) {
  return n ? `$${n.toLocaleString()}` : "\u2014";
}

function formatDate(d) {
  if (!d) return "\u2014";
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export default function ProposalSummaryCard({ lead }) {
  if (!lead) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Proposal Summary</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Select a lead to view proposal details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Proposal Summary</CardTitle>
          </div>
          <Badge variant={lead.proposalStatus === "Approved" ? "success" : "secondary"}>
            {lead.proposalStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <Row label="Proposal Amount" value={formatCurrency(lead.proposalAmount)} />
        <Row label="Negotiated Amount" value={formatCurrency(lead.finalNegotiatedAmount)} />
        <Row label="Approved Date" value={formatDate(lead.proposalApprovedDate)} />
        <Row label="Version" value={lead.proposalVersion} />
        <Separator className="my-2" />
        <div className="flex gap-2 pt-1">
          <button className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline">
            <ExternalLink className="h-3 w-3" /> View
          </button>
          <button className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline">
            <Download className="h-3 w-3" /> Download
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
