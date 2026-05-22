import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const VISIT_VARIANTS = {
  Scheduled: "default",
  Completed: "success",
  Cancelled: "destructive",
};

function formatDate(d) {
  if (!d) return "\u2014";
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export default function SiteVisitSummaryCard({ lead }) {
  if (!lead || !lead.siteVisitDate) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Site Visit</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No site visit recorded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Site Visit</CardTitle>
          <Badge variant={VISIT_VARIANTS[lead.siteVisitStatus] || "secondary"} className="ml-auto text-[10px]">
            {lead.siteVisitStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">{formatDate(lead.siteVisitDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Executive</span>
          <span className="font-medium">{lead.siteVisitStaff}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Address</span>
          <p className="mt-0.5 font-medium">{lead.siteVisitAddress}</p>
        </div>
        {lead.siteVisitNotes && (
          <div>
            <span className="text-muted-foreground">Notes</span>
            <p className="mt-0.5 text-muted-foreground">{lead.siteVisitNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
