import { MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProjectStatusBadge from "./ProjectStatusBadge";
import PaymentStatusBadge from "./PaymentStatusBadge";

function formatCurrency(n) {
  return n ? `$${n.toLocaleString()}` : "\u2014";
}

export default function ProjectCard({ project, onView, onEdit, onMarkCompleted }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">{project.id}</span>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="mt-1 font-semibold truncate">{project.projectName}</p>
            <p className="text-sm text-muted-foreground">{project.clientName}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(project)}>View Project</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(project)}>Edit</DropdownMenuItem>
              {project.status !== "Completed" && (
                <DropdownMenuItem onClick={() => onMarkCompleted(project)}>Mark Completed</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Type</span>
            <p><Badge variant="outline" className="mt-0.5 text-[10px]">{project.projectType}</Badge></p>
          </div>
          <div>
            <span className="text-muted-foreground">Manager</span>
            <p className="font-medium">{project.manager}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Budget</span>
            <p className="font-medium tabular-nums">{formatCurrency(project.budget)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Payment</span>
            <p className="mt-0.5"><PaymentStatusBadge status={project.paymentStatus} /></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
