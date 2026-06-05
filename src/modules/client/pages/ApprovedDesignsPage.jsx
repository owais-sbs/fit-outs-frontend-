import { Award, Calendar, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEED_CLIENT_DESIGNS } from "@/shared/store/designWorkflowStore";

function formatDate(d) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export default function ApprovedDesignsPage() {
  const navigate = useNavigate();
  const approved = SEED_CLIENT_DESIGNS.filter((d) => d.status === "Approved");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approved Designs"
        description="All designs you've approved. The team is cleared to proceed with construction documentation."
      />

      {approved.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-24">
          <Award className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="font-medium">No approved designs yet</p>
          <p className="text-sm text-muted-foreground mt-1">Approved designs will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {approved.map((design) => (
            <Card key={design.id} className="group overflow-hidden border-border/60 shadow-sm hover:border-emerald-400/40 hover:shadow-lg transition-all duration-300">
              <div className="relative h-48 overflow-hidden bg-muted">
                <img
                  src={design.thumbnail}
                  alt={design.projectName}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                    ✓ Approved
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-semibold text-white">{design.projectName}</h3>
                  <p className="text-xs text-white/70">{design.clientName}</p>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {design.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary shrink-0">
                      {design.designerAvatar}
                    </div>
                    <span>{design.designer}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(design.uploadDate)}
                  </div>
                  <span className="font-mono font-bold text-emerald-600">{design.version}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => navigate(`/client/designs/${design.id}`)}>
                    View
                  </Button>
                  <Button size="sm" className="flex-1 h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
