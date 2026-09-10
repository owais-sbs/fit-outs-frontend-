import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { useSubcontractorPortal } from "../context/SubcontractorPortalContext";
import { roleLabel } from "../utils/scPortalRoles";

export default function ScPlaceholderPage({ title, subtitle, specRef }) {
  const { portalRole } = useSubcontractorPortal();

  return (
    <PageShell className="max-w-2xl mx-auto">
      <PageTitle
        title={title}
        subtitle={subtitle}
        actions={<Badge variant="outline">{roleLabel(portalRole)}</Badge>}
      />
      <Surface className="p-6 space-y-3">
        <p className="text-sm text-muted-foreground">
          This module is defined in the subcontractor portal specification and will be wired to live
          data in a later wave. Navigation and access control are already enforced for your role.
        </p>
        {specRef ? (
          <p className="text-xs text-muted-foreground">
            Spec reference: {specRef}
          </p>
        ) : null}
      </Surface>
    </PageShell>
  );
}
