import { useAuth } from "../context/auth-context";
import { ROLES, ROLE_PERMISSIONS } from "../constants/roles";

export function usePermission() {
  const { role } = useAuth();

  const hasPermission = (permission) => {
    if (role === ROLES.SUPER_ADMIN) return true;
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    return permissions.some(hasPermission);
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every(hasPermission);
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}

export function useRoleRedirect() {
  const { role, isAuthenticated } = useAuth();

  const getDefaultRoute = () => {
    const roleRoutes = {
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

    return isAuthenticated && role ? roleRoutes[role] : "/login";
  };

  return { getDefaultRoute };
}
