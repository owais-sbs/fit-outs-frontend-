import { Badge } from "@/components/ui/badge";
import {
  COMMERCIAL_LIFECYCLE,
  COMMERCIAL_LIFECYCLE_COLORS,
  COMMERCIAL_LIFECYCLE_LABELS,
} from "../../constants/project.constants";
import { cn } from "@/lib/utils";

export default function CommercialLifecycleBadge({ stage, className }) {
  if (!stage) return null;
  const label = COMMERCIAL_LIFECYCLE_LABELS[stage] || stage;
  const color = COMMERCIAL_LIFECYCLE_COLORS[stage] || COMMERCIAL_LIFECYCLE_COLORS[COMMERCIAL_LIFECYCLE.NOT_READY];
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", color, className)}>
      {label}
    </Badge>
  );
}
