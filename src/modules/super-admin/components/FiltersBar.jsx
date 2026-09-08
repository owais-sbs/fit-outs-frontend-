import { FilterToolbar, SearchInput } from "@/components/layout/PageShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FiltersBar({
  searchQuery,
  onSearchChange,
  planFilter,
  onPlanChange,
  statusFilter,
  onStatusChange,
}) {
  return (
    <FilterToolbar>
      <SearchInput
          type="search"
          placeholder="Search tenants..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      <div className="flex flex-wrap gap-2">
        <Select value={planFilter} onValueChange={onPlanChange}>
          <SelectTrigger className="h-8 w-[140px] rounded-lg bg-background">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 w-[140px] rounded-lg bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </FilterToolbar>
  );
}
