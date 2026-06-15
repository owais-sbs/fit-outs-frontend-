import React from "react";
import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status, label }) {
  const isOk = status === "active" || status === true;
  return (
    <Badge variant={isOk ? "outline" : "secondary"} className={isOk ? "text-emerald-600 bg-emerald-50 border-emerald-200" : ""}>
      {label || (isOk ? "Active" : "Inactive")}
    </Badge>
  );
}
