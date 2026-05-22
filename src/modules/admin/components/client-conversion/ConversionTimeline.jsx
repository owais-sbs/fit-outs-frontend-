import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

const TYPE_COLORS = {
  lead: "bg-blue-500",
  followUp: "bg-violet-500",
  siteVisit: "bg-cyan-500",
  proposal: "bg-amber-500",
  negotiation: "bg-orange-500",
  payment: "bg-emerald-500",
  ready: "bg-primary",
};

const TYPE_ICONS = {
  lead: "\u2605",
  followUp: "\u2192",
  siteVisit: "\u25C6",
  proposal: "\u25A0",
  negotiation: "\u2194",
  payment: "$",
  ready: "\u2713",
};

function formatDate(d) {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(new Date(d));
}

export default function ConversionTimeline({ lead }) {
  if (!lead) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Timeline Activity</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Select a lead to view activity timeline.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Timeline Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {lead.timeline.map((event, i) => (
            <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
              {i < lead.timeline.length - 1 && (
                <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
              )}
              <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${TYPE_COLORS[event.type] || "bg-muted"} text-[9px] text-white`}>
                {TYPE_ICONS[event.type] || "\u2022"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{event.title}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{formatDate(event.time)}</span>
                  {event.user && (
                    <>
                      <span>&middot;</span>
                      <span>{event.user}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
