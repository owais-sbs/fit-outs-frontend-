import { Loader2, RotateCcw } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useClientDesignTasks } from "@/modules/client/hooks/useClientDesignTasks";

export default function RevisionHistoryPage() {
  const { designs, loading, error } = useClientDesignTasks("revisions");

  return (
    <PageShell>
      <PageTitle
        title="Revision History"
        subtitle="Design items where you requested changes from the team."
      />

      {error && (
        <p className="mb-4 text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : designs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/40 py-24">
          <RotateCcw className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium">No revision requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {designs.map((design) => (
            <div
              key={design.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4"
            >
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{design.projectName}</p>
                <p className="font-semibold">{design.rawTask?.title || design.designType}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {[design.rawTask?.floorLabel, design.rawTask?.roomName].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <a href={design.detailRoute}>Open task</a>
              </Button>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
