import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ROUTES } from "@/shared/constants/routes";
import { useSubcontractorPortal } from "../context/SubcontractorPortalContext";
import { isScAdmin, SC_ROLES } from "../utils/scPortalRoles";

export default function ScPortalGate({ roles, children }) {
  const portal = useSubcontractorPortal();

  if (!portal.loaded) {
    return (
      <PageShell className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  if (roles?.length) {
    let allowed = isScAdmin(portal.portalRole);
    if (!allowed) {
      if (roles.includes(SC_ROLES.ESTIMATOR) && portal.canAccessTendering) allowed = true;
      if (roles.includes(SC_ROLES.SUPERVISOR) && portal.canAccessExecution) allowed = true;
      if (roles.includes(SC_ROLES.QS) && portal.canAccessCommercial) allowed = true;
      if (roles.includes(SC_ROLES.DOC_CONTROLLER) && portal.canAccessDocuments) allowed = true;
    }
    if (!allowed) {
      return <Navigate to={ROUTES.SUBCONTRACTOR.DASHBOARD} replace />;
    }
  }

  return children;
}
