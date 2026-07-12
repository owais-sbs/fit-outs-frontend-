import { useAuth } from "@/shared/context/auth-context";
import { ROLES } from "@/shared/constants/roles";
import AdminLayout from "./AdminLayout";
import DirectorLayout from "@/modules/business-owner/layouts/DirectorLayout";

/**
 * Directors use the Command Center chrome for admin module routes too,
 * so Operations links do not eject them into the Admin Panel layout.
 */
export default function AdminPortalLayout() {
  const { role } = useAuth();
  if (role === ROLES.BUSINESS_OWNER) {
    return <DirectorLayout />;
  }
  return <AdminLayout />;
}
