import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../shared/context/auth-context";
import { ACCESS_PHASE, routeForAccessPhase } from "../../shared/constants/access-phase";
import { ROUTES } from "../../shared/constants/routes";
import { ROLES } from "../../shared/constants/roles";

const ROLE_HOME = {
  [ROLES.SUPER_ADMIN]: ROUTES.SUPER_ADMIN.DASHBOARD,
  [ROLES.ADMIN]: ROUTES.ADMIN.DASHBOARD,
  [ROLES.BUSINESS_OWNER]: ROUTES.BUSINESS_OWNER.DASHBOARD,
  [ROLES.PROJECT_MANAGER]: ROUTES.PROJECT_MANAGER.DASHBOARD,
  [ROLES.DESIGNER]: ROUTES.DESIGNER.DASHBOARD,
  [ROLES.QAS]: ROUTES.QAS.DASHBOARD,
  [ROLES.QS]: ROUTES.ADMIN.QAS,
  [ROLES.SENIOR_QS]: ROUTES.ADMIN.BOQ_INBOX,
  [ROLES.FINANCE]: ROUTES.FINANCE.DASHBOARD,
  [ROLES.SUBCONTRACTOR]: ROUTES.SUBCONTRACTOR.DASHBOARD,
  [ROLES.CLIENT]: ROUTES.CLIENT.DASHBOARD,
  [ROLES.SALES]: ROUTES.SALES.DASHBOARD,
  [ROLES.EMPLOYEE]: ROUTES.EMPLOYEE.DASHBOARD,
  [ROLES.SITE_ENGINEER]: ROUTES.SITE_ENGINEER.DASHBOARD,
};

/**
 * Redirects self-serve admins to subscribe/onboarding when they are not in PORTAL phase.
 * Use around product portals (admin, etc.). Landing + subscribe + onboarding stay reachable.
 */
export default function AccessPhaseGate({ children, allowPhases = [ACCESS_PHASE.PORTAL] }) {
  const { isAuthenticated, isLoading, user, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace state={{ from: location }} />;
  }

  const phase = user?.accessPhase || ACCESS_PHASE.PORTAL;
  if (allowPhases.includes(phase)) {
    return children;
  }

  const portalHome = ROLE_HOME[role] || ROUTES.ADMIN.DASHBOARD;
  return <Navigate to={routeForAccessPhase(phase, portalHome)} replace />;
}
