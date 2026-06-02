import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, RotateCcw } from "lucide-react";

const CONFIG = {
  "Pending Approval": { variant: "warning", icon: Clock, label: "Pending Approval" },
  "Approved":          { variant: "success", icon: CheckCircle2, label: "Approved" },
  "Revision Requested":{ variant: "destructive", icon: RotateCcw, label: "Revision Requested" },
  "Under Review":      { variant: "warning", icon: Clock, label: "Under Review" },
  "Started":           { variant: "default", icon: null, label: "Started" },
  "Assigned":          { variant: "default", icon: null, label: "Assigned" },
  "Pending":           { variant: "secondary", icon: null, label: "Pending" },
};

export default function StatusBadge({ status, className = "" }) {
  const cfg = CONFIG[status] || { variant: "secondary", icon: null, label: status };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className={`gap-1.5 ${className}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {cfg.label}
    </Badge>
  );
}
