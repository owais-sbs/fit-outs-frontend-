import { useNavigate } from "react-router-dom";
import { RotateCcw, Calendar, User, MessageSquare } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEED_CLIENT_DESIGNS } from "@/shared/store/designWorkflowStore";
import StatusBadge from "@/modules/client/components/design/StatusBadge";

function formatDate(d) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

// Mock revision history entries
const REVISION_HISTORY = SEED_CLIENT_DESIGNS
  .filter((d) => d.status === "Revision Requested")
  .map((d) => ({
    id: d.id,
    design: d,
    requestedDate: d.uploadDate,
    feedback:
      d.id === "cd-1002"
        ? "The reception desk needs to face the main entrance. Please revise the material palette for the executive floor — prefer darker walnut over the current oak veneer."
        : "Please adjust the spatial layout per the site visit notes. Updated reference images attached.",
    priority: "High",
    adminStatus: "In Progress",
  }));

export default function RevisionHistoryPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revision History"
        description="All revision requests you've submitted to the design team."
      />

      {REVISION_HISTORY.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-24">
          <RotateCcw className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="font-medium">No revision requests yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {REVISION_HISTORY.map((rev) => (
            <Card key={rev.id} className="border-border/60 shadow-sm hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <img
                    src={rev.design.thumbnail}
                    alt=""
                    className="h-24 w-32 rounded-lg object-cover shrink-0"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />

                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{rev.design.projectName}</h3>
                        <p className="text-sm text-muted-foreground">{rev.design.designType}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={rev.design.status} />
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-semibold">{rev.design.version}</span>
                      </div>
                    </div>

                    {/* Feedback excerpt */}
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                        <MessageSquare className="h-3 w-3" />
                        Your Feedback
                      </div>
                      <p className="text-sm line-clamp-2">{rev.feedback}</p>
                    </div>

                    {/* Meta + action */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(rev.requestedDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {rev.design.designer}
                        </span>
                        <span className={`font-medium ${rev.priority === "High" ? "text-amber-600" : "text-muted-foreground"}`}>
                          {rev.priority} Priority
                        </span>
                        <span className="font-medium text-primary">Admin: {rev.adminStatus}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => navigate(`/client/designs/${rev.id}`)}
                      >
                        View Design
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
