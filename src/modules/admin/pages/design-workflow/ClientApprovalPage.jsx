import { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { CLIENT_APPROVALS } from "../../data/design-workflow";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_VARIANT = {
  "Waiting Approval": "warning",
  "Approved": "success",
  "Revision Requested": "destructive",
};

const STATUS_ICONS = {
  "Waiting Approval": Clock,
  "Approved": CheckCircle2,
  "Revision Requested": AlertCircle,
};

function formatDate(d) {
  if (!d) return null;
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

const TIMELINE_DOT = {
  completed: "bg-emerald-500 border-emerald-500",
  pending: "border-dashed border-border bg-background",
  revision: "bg-destructive border-destructive",
};

const TIMELINE_TEXT = {
  completed: "text-foreground",
  pending: "text-muted-foreground italic",
  revision: "text-destructive",
};

function TimelineItem({ event, type, date, isLast }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-2.5 w-2.5 rounded-full border-2 mt-0.5 shrink-0 ${TIMELINE_DOT[type]}`} />
        {!isLast && <div className="w-px flex-1 bg-border/50 my-1" />}
      </div>
      <div className="pb-3">
        <p className={`text-sm font-medium ${TIMELINE_TEXT[type]}`}>{event}</p>
        {date
          ? <p className="text-xs text-muted-foreground mt-0.5">{formatDate(date)}</p>
          : <p className="text-xs text-muted-foreground mt-0.5 italic">Awaiting...</p>
        }
      </div>
    </div>
  );
}

function ApprovalCard({ item }) {
  const [timelineOpen, setTimelineOpen] = useState(false);
  const StatusIcon = STATUS_ICONS[item.approvalStatus];

  return (
    <Card className="border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold leading-tight">{item.projectName}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{item.clientName}</p>
          </div>
          <Badge variant={STATUS_VARIANT[item.approvalStatus]} className="gap-1.5 shrink-0 whitespace-nowrap">
            <StatusIcon className="h-3 w-3" />
            {item.approvalStatus}
          </Badge>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Version</p>
            <p className="font-mono font-semibold">{item.version}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Designer</p>
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary shrink-0">
                {item.designer.split(" ").map(n => n[0]).join("")}
              </div>
              <span className="text-xs font-medium truncate">{item.designer}</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Sent</p>
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              {formatDate(item.sentDate)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className={`h-full rounded-full transition-all ${
              item.approvalStatus === "Approved" ? "bg-emerald-500 w-full"
              : item.approvalStatus === "Revision Requested" ? "bg-destructive w-3/4"
              : "bg-amber-500 w-1/2"
            }`}
          />
        </div>

        {/* Timeline toggle */}
        <button
          onClick={() => setTimelineOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
        >
          Approval Timeline
          {timelineOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {timelineOpen && (
          <div className="rounded-lg border border-border/40 bg-muted/10 p-4 pt-3">
            {item.timeline.map((step, idx) => (
              <TimelineItem
                key={idx}
                event={step.event}
                type={step.type}
                date={step.date}
                isLast={idx === item.timeline.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClientApprovalPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all"
    ? CLIENT_APPROVALS
    : CLIENT_APPROVALS.filter((i) => i.approvalStatus === statusFilter);

  const counts = {
    "Waiting Approval": CLIENT_APPROVALS.filter(i => i.approvalStatus === "Waiting Approval").length,
    "Approved": CLIENT_APPROVALS.filter(i => i.approvalStatus === "Approved").length,
    "Revision Requested": CLIENT_APPROVALS.filter(i => i.approvalStatus === "Revision Requested").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Approval"
        description="Track interior design submissions sent to clients and monitor approval status in real time."
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-3">
        {[
          { key: "all", label: "All Projects", count: CLIENT_APPROVALS.length, style: "border-border/60" },
          { key: "Waiting Approval", label: "Awaiting", count: counts["Waiting Approval"], style: "border-amber-400/40 bg-amber-500/5 text-amber-700 dark:text-amber-400" },
          { key: "Approved", label: "Approved", count: counts["Approved"], style: "border-emerald-400/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" },
          { key: "Revision Requested", label: "Revision", count: counts["Revision Requested"], style: "border-destructive/30 bg-destructive/5 text-destructive" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              statusFilter === tab.key ? `${tab.style} shadow-sm` : "border-border/40 hover:bg-muted/40"
            }`}
          >
            {tab.label}
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-muted px-1 text-xs font-bold">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-24">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No records found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((item) => (
            <ApprovalCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
