import { Badge } from "@/components/ui/badge";

export default function CrBadge({ number, className = "" }) {
  return (
    <Badge variant="outline" className={`font-mono whitespace-nowrap ${className}`}>
      {number || "CR pending"}
    </Badge>
  );
}
