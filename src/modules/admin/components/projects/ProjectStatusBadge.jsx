import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_VARIANTS } from "../../constants/project.constants";

export default function ProjectStatusBadge({ status }) {
  return (
    <Badge variant={PROJECT_STATUS_VARIANTS[status] || "secondary"}>
      {status}
    </Badge>
  );
}
