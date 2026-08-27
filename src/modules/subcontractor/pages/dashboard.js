import { Package, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";

export default function subcontractorDashboard() {
  return (
    <PageShell className="mx-auto max-w-4xl">
      <PageTitle
        title="Subcontractor Dashboard"
        subtitle="Manage appointed packages and progress claims"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Surface className="space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4" /> Packages
          </h2>
          <p className="text-sm text-muted-foreground">
            View packages appointed to your account and track status.
          </p>
          <Button asChild size="sm">
            <Link to={ROUTES.SUBCONTRACTOR.PACKAGES}>Open packages</Link>
          </Button>
        </Surface>
        <Surface className="space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4" /> Claims
          </h2>
          <p className="text-sm text-muted-foreground">
            Draft and submit progress claims for PM validation.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.SUBCONTRACTOR.CLAIMS}>Open claims</Link>
          </Button>
        </Surface>
      </div>
    </PageShell>
  );
}
