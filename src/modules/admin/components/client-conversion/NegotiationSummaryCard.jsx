import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const NEG_VARIANTS = {
  Ongoing: "default",
  Approved: "success",
  Rejected: "destructive",
  Closed: "secondary",
};

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

export default function NegotiationSummaryCard({ lead }) {
  if (!lead) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Negotiation</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Select a lead to view negotiation details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Negotiation</CardTitle>
          </div>
          <Badge variant={NEG_VARIANTS[lead.negotiationStatus] || "secondary"} className="text-[10px]">
            {lead.negotiationStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <Row label="Original Quote" value={formatCurrency(lead.originalQuote)} />
        <Row label="Negotiated Amount" value={formatCurrency(lead.negotiatedAmount)} />
        <Row label="Discount" value={lead.discountPercent ? `${lead.discountPercent}%` : "\u2014"} />
        <Separator className="my-1.5" />
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold">Final Amount</span>
          <span className="text-sm font-bold tabular-nums">{formatCurrency(lead.negotiatedAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
