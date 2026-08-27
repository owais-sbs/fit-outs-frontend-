import { FolderKanban, FileText, Palette, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";

export default function clientDashboard() {
  return (
    <PageShell>
      <PageTitle
        title="Client Dashboard"
        subtitle="Welcome to your fit-out workspace"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Projects" value="—" icon={FolderKanban} hint="Track execution" />
        <StatTile label="Designs" value="—" icon={Palette} hint="Review & approve" />
        <StatTile label="Documents" value="—" icon={FileText} hint="Published files" />
        <StatTile label="Invoices" value="—" icon={CreditCard} hint="Payment schedule" />
      </div>

      <Surface className="p-5">
        <p className="text-sm text-muted-foreground">
          Jump into your projects, designs, and billing from the sidebar — or open a quick link below.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to={ROUTES.CLIENT.PROJECTS_MY}>My projects</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.CLIENT.DESIGNS}>Designs</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.CLIENT.DOCUMENTS}>Documents</Link>
          </Button>
        </div>
      </Surface>
    </PageShell>
  );
}
