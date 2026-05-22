import { Mail, Phone, Tag, User, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || "\u2014"}</p>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "\u2014";
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

function formatCurrency(n) {
  return n ? `$${n.toLocaleString()}` : "\u2014";
}

export default function ClientInfoCard({ lead }) {
  if (!lead) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Client Summary</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Select a lead to view client details.</p>
        </CardContent>
      </Card>
    );
  }

  const initials = lead.clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </div>
          <div>
            <CardTitle className="text-base">{lead.clientName}</CardTitle>
            <p className="text-xs text-muted-foreground">{lead.company}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0.5">
        <Row icon={Mail} label="Email" value={lead.email} />
        <Row icon={Phone} label="Phone" value={lead.phone} />
        <Row icon={Tag} label="Project Type" value={lead.projectType} />
        <Row icon={User} label="Manager" value={lead.manager} />
        <Row icon={MapPin} label="Source" value={lead.source} />
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-[11px] text-muted-foreground">Budget</p>
            <p className="text-sm font-semibold tabular-nums">{formatCurrency(lead.budget)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Lead Created</p>
            <p className="text-sm tabular-nums">{formatDate(lead.leadCreated)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
