import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProjectApprovalsSection({ href }) {
  if (!href) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Authority approvals
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Permits come from tagged work items on the approved BOQ, plus community and access requirements.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to={href}>
            Open approvals
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
