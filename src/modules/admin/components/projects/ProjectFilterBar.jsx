import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROJECT_STATUS_LIST,
  PAYMENT_STATUS_LIST,
  PROJECT_TYPES,
} from "../../constants/project.constants";

const MANAGERS = ["James Wu", "Emma Walsh", "Tom Bradley", "Lisa Park"];

export default function ProjectFilterBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  managerFilter,
  onManagerChange,
  statusFilter,
  onStatusChange,
  paymentFilter,
  onPaymentChange,
  onResetPage,
}) {
  const handleChange = (setter) => (value) => {
    setter(value);
    if (onResetPage) onResetPage();
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by client or project..."
              value={search}
              onChange={(e) => { onSearchChange(e.target.value); if (onResetPage) onResetPage(); }}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={handleChange(onTypeChange)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={managerFilter} onValueChange={handleChange(onManagerChange)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Manager" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All managers</SelectItem>
                {MANAGERS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleChange(onStatusChange)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {PROJECT_STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={handleChange(onPaymentChange)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                {PAYMENT_STATUS_LIST.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
