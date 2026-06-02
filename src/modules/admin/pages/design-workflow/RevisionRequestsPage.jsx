import { useState } from "react";
import { MessageSquare, ImageIcon, ArrowRight, CheckCheck, Calendar, User } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { REVISION_REQUESTS } from "../../data/design-workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_VARIANT = {
  Open: "warning",
  "In Progress": "default",
  Fixed: "success",
};

function formatDate(d) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

function RevisionCard({ item, onMoveToProgress, onMarkFixed }) {
  return (
    <Card className="border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold leading-tight">{item.projectName}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{item.clientName}</p>
          </div>
          <Badge variant={STATUS_VARIANT[item.status]}>{item.status}</Badge>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3" />
            {item.designer}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(item.requestedDate)}
          </div>
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono font-semibold">{item.version}</span>
        </div>

        {/* Client feedback */}
        <div className="rounded-lg border border-border/40 bg-muted/10 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <MessageSquare className="h-3.5 w-3.5" />
            Client Revision Notes
          </div>
          <p className="text-sm leading-relaxed">{item.comments}</p>
        </div>

        {/* Reference images */}
        {item.referenceImages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <ImageIcon className="h-3.5 w-3.5" />
              Reference Images ({item.referenceImages.length})
            </div>
            <div className="grid grid-cols-3 gap-2">
              {item.referenceImages.map((url, idx) => (
                <div key={idx} className="group relative h-24 overflow-hidden rounded-lg border border-border/40 bg-muted">
                  <img
                    src={url}
                    alt={`Reference ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {item.status === "Open" && (
            <Button size="sm" className="flex-1 gap-2 h-8" onClick={() => onMoveToProgress(item.id)}>
              <ArrowRight className="h-3.5 w-3.5" />
              Move to In Progress
            </Button>
          )}
          {item.status === "In Progress" && (
            <Button
              size="sm"
              className="flex-1 gap-2 h-8 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onMarkFixed(item.id)}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark as Fixed
            </Button>
          )}
          {item.status === "Fixed" && (
            <div className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCheck className="h-3.5 w-3.5" />
              Revision Completed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RevisionRequestsPage() {
  const [requests, setRequests] = useState(REVISION_REQUESTS);

  const moveToProgress = (id) =>
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "In Progress" } : r));

  const markFixed = (id) =>
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "Fixed" } : r));

  const counts = {
    Open: requests.filter(r => r.status === "Open").length,
    "In Progress": requests.filter(r => r.status === "In Progress").length,
    Fixed: requests.filter(r => r.status === "Fixed").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revision Requests"
        description="Manage client feedback and revision notes on interior design and fit-out concepts."
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Open", count: counts.Open, color: "text-amber-600" },
          { label: "In Progress", count: counts["In Progress"], color: "text-primary" },
          { label: "Fixed", count: counts.Fixed, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {requests.map((req) => (
          <RevisionCard
            key={req.id}
            item={req}
            onMoveToProgress={moveToProgress}
            onMarkFixed={markFixed}
          />
        ))}
      </div>
    </div>
  );
}
