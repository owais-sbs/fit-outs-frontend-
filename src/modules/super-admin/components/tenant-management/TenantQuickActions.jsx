import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/components/ui/button";

export default function TenantQuickActions({ variant = "list" }) {
  const navigate = useNavigate();

  if (variant !== "list") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        className="gap-2"
        onClick={() => navigate(ROUTES.SUPER_ADMIN.COMPANIES_CREATE)}>
        <Plus className="h-4 w-4" />
        Add company
      </Button>
    </div>
  );
}
