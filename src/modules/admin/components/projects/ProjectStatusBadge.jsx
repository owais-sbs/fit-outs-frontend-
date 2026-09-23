import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS, PROJECT_STATUS_COLORS } from "../../constants/project.constants";

export default function ProjectStatusBadge({ status, className }) {
  const label = status || PROJECT_STATUS.PLANNING;
  return (
    <Badge
      className={cn(
        "rounded-full border-none px-2.5 py-0.5 text-xs font-medium",
        PROJECT_STATUS_COLORS[label] || "bg-secondary text-foreground",
        className
      )}
    >
      {label}
    </Badge>
  );
}
