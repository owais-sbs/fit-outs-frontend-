import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PROJECT_TYPES } from "../../constants/project.constants";

function formatCurrency(n) {
  return n ? `$${n.toLocaleString()}` : "\u2014";
}

export default function ReadyForConversionTable({
  leads,
  loading,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  managerFilter,
  onManagerChange,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={managerFilter} onValueChange={onManagerChange}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Manager" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All managers</SelectItem>
            {[...new Set(leads.map((l) => l.manager))].map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border/60">
        <div className="max-h-[240px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 w-10" />
                <TableHead>Lead ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full max-w-[80px]" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className={`cursor-pointer ${selectedId === lead.id ? "bg-primary/5" : ""}`}
                      onClick={() => onSelect(lead)}
                    >
                      <TableCell className="pl-4">
                        <div className={`h-2.5 w-2.5 rounded-full ${selectedId === lead.id ? "bg-primary" : "bg-border"}`} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{lead.id}</TableCell>
                      <TableCell className="font-medium">{lead.clientName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{lead.projectType}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.manager}</TableCell>
                      <TableCell className="tabular-nums font-medium">{formatCurrency(lead.finalNegotiatedAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={lead.paymentStatus === "Paid" ? "success" : "warning"} className="text-[10px]">
                          {lead.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
