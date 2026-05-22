import { DollarSign, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  return n ? `$${n.toLocaleString()}` : "$0";
}

function formatDate(d) {
  if (!d) return "\u2014";
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

const PAYMENT_VARIANTS = {
  Pending: "secondary",
  Partial: "warning",
  Paid: "success",
};

export default function PaymentSummaryCard({ lead }) {
  if (!lead) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Payment Summary</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Select a lead to view payment details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Payment Summary</CardTitle>
          </div>
          <Badge variant={PAYMENT_VARIANTS[lead.paymentStatus] || "secondary"}>
            {lead.paymentStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <Row label="Total Amount" value={formatCurrency(lead.finalNegotiatedAmount)} />
        <Row label="Paid" value={formatCurrency(lead.totalPaid)} />
        <Row label="Remaining" value={formatCurrency(lead.remainingAmount)} />
        <Row label="Last Payment" value={formatDate(lead.lastPaymentDate)} />
        <Separator className="my-2" />
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <DollarSign className="h-3 w-3" /> Add Payment
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <Download className="h-3 w-3" /> Invoice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
