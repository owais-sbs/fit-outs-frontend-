import { Navigate } from "react-router-dom";
import { useAuth } from "../../shared/context/auth-context";
import { ROLES } from "../../shared/constants/roles";
import { Loader2 } from "lucide-react";

export default function RoleRoute({ allowedRoles, children }) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="mt-4 text-sm text-muted-foreground animate-pulse font-medium">Verifying permissions...</span>
      </div>
    );
  }

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
      [ROLES.EMPLOYEE]: "/employee",
    };

    return <Navigate to={roleDefaultRoutes[role] || "/login"} replace />;
  }

  return children;
}
