import { Building2, Download, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/components/ui/button";
import { useTenantManagement } from "../../context/tenant-management-context";

export default function TenantQuickActions() {
  const navigate = useNavigate();
  const { setExportOpen } = useTenantManagement();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setExportOpen(true)}>
        <Download className="h-4 w-4" />
        Export
      </Button>
      <Button
        size="sm"
        className="gap-2"
        onClick={() => navigate(ROUTES.SUPER_ADMIN.TENANTS_CREATE)}>
        <Plus className="h-4 w-4" />
        Add company
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() => navigate(ROUTES.SUPER_ADMIN.TENANTS)}>
        <Building2 className="h-4 w-4" />
        View all tenants
      </Button>
    </div>
  );
}
