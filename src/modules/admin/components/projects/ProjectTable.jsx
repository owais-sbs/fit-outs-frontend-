import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function formatDate(d) {
  if (!d) return "\u2014";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

export default function ProjectTable({
  projects,
  loading,
  onView,
  onClientProfile,
  onViewPayments,
  onViewProposal,
  onEdit,
  onMarkCompleted,
}) {
  if (loading) {
    return (
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">Project ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Project Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 10 }).map((__, j) => (
                <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (projects.length === 0) {
    return (
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">Project ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Project Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={10} className="h-48 text-center">
              <div className="flex flex-col items-center gap-2">
                <p className="font-medium">No projects found</p>
                <p className="text-sm text-muted-foreground">Adjust filters or search terms</p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-6">Project ID</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Project Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Manager</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead className="pr-6 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((p) => (
          <TableRow
            key={p.id}
            className="cursor-pointer"
            onClick={() => onView(p)}
          >
            <TableCell className="pl-6 font-mono text-xs font-medium text-muted-foreground">
              {p.id}
            </TableCell>
            <TableCell className="font-medium">{p.clientName}</TableCell>
            <TableCell className="max-w-[180px] truncate">{p.projectName}</TableCell>
            <TableCell><Badge variant="outline">{p.projectType}</Badge></TableCell>
            <TableCell className="text-muted-foreground">{p.manager}</TableCell>
            <TableCell className="tabular-nums font-medium">{formatCurrency(p.budget)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{formatDate(p.startDate)}</TableCell>
            <TableCell><ProjectStatusBadge status={p.status} /></TableCell>
            <TableCell><PaymentStatusBadge status={p.paymentStatus} /></TableCell>
            <TableCell className="pr-6 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(p); }}>
                    View Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClientProfile(p); }}>
                    Open Client Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewPayments(p); }}>
                    View Payments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewProposal(p); }}>
                    View Proposal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                    Edit Project
                  </DropdownMenuItem>
                  {p.status !== "Completed" && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkCompleted(p); }}>
                      Mark Completed
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
