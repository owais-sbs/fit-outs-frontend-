import { Loader2, Award } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import DesignCard from "@/modules/client/components/design/DesignCard";
import { useClientDesignTasks } from "@/modules/client/hooks/useClientDesignTasks";

export default function ApprovedDesignsPage() {
  const { designs, loading, error } = useClientDesignTasks("approved");

  return (
    <PageShell>
      <PageTitle
        title="Approved Designs"
        subtitle="All designs you've approved. The team is cleared to proceed with construction documentation."
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
        <Surface className="flex flex-col items-center gap-3 py-16 text-center">
          <Award className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">No approved designs yet</p>
          <p className="text-sm text-muted-foreground">Approved designs will appear here.</p>
        </Surface>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {designs.map((design) => (
            <DesignCard key={design.id} design={design} detailRoute={design.detailRoute} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
