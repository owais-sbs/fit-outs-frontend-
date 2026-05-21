import { Navigate } from "react-router-dom";
import { useAuth } from "../../shared/context/auth-context";
import { ROLES } from "../../shared/constants/roles";

export default function RoleRoute({ allowedRoles, children }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const roleDefaultRoutes = {
      [ROLES.SUPER_ADMIN]: "/super-admin",
      [ROLES.ADMIN]: "/admin",
      [ROLES.BUSINESS_OWNER]: "/business-owner",
      [ROLES.PROJECT_MANAGER]: "/project-manager",
      [ROLES.DESIGNER]: "/designer",
      [ROLES.QAS]: "/qas",
      [ROLES.FINANCE]: "/finance",
      [ROLES.SUBCONTRACTOR]: "/subcontractor",
      [ROLES.CLIENT]: "/client",
      [ROLES.SALES]: "/sales",
    };

    return <Navigate to={roleDefaultRoutes[role] || "/login"} replace />;
  }

  return children;
}
