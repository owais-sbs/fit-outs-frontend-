import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SEED_CLIENT_DESIGNS } from "@/shared/store/designWorkflowStore";
import DesignCard from "@/modules/client/components/design/DesignCard";

const STATUS_OPTIONS = ["All", "Pending Approval", "Approved", "Revision Requested"];

export default function MyDesignsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SEED_CLIENT_DESIGNS.filter((d) => {
      const matchQ = !q || d.projectName.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q);
      const matchS = statusFilter === "All" || d.status === statusFilter;
      return matchQ && matchS;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Designs"
        description="All interior design concepts and fit-out proposals submitted by your design team."
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by project or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground shrink-0">{filtered.length} design{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-24">
          <p className="font-medium text-muted-foreground">No designs found</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              detailRoute={`/client/designs/${design.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
