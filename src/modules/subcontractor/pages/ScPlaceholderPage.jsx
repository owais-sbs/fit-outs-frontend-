import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { useSubcontractorPortal } from "../context/SubcontractorPortalContext";
import { roleLabel } from "../utils/scPortalRoles";

export default function ScPlaceholderPage({ title, subtitle, specRef }) {
  const { portalRole } = useSubcontractorPortal();

  return (
    <PageShell className="max-w-4xl space-y-6">
      <PageTitle
        title={title}
        subtitle={subtitle}
        actions={<Badge variant="outline">{roleLabel(portalRole)}</Badge>}
      />
      <Surface className="space-y-3 p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
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
