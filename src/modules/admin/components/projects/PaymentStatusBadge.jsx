import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_VARIANTS } from "../../constants/project.constants";

export default function PaymentStatusBadge({ status }) {
  return (
    <Badge variant={PAYMENT_STATUS_VARIANTS[status] || "secondary"}>
      {status}
    </Badge>
  );
}
