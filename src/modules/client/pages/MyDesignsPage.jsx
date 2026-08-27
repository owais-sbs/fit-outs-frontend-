import { useNavigate } from "react-router-dom";
import { Loader2, Palette } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import DesignCard from "@/modules/client/components/design/DesignCard";
import { useClientDesignTasks } from "@/modules/client/hooks/useClientDesignTasks";

export default function MyDesignsPage() {
  const navigate = useNavigate();
  const { designs, loading, error } = useClientDesignTasks();

  return (
    <PageShell>
      <PageTitle
        title="My Designs"
        subtitle="All design options shared with you for review and approval."
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Palette className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No designs yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Your design team will share options here when they submit them for your review.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.CLIENT.PROJECTS_MY)}>
            View my projects
          </Button>
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
