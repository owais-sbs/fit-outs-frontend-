import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fetchMyScBoqLines, fetchMyScPackages } from "@/modules/admin/api/subcontractor.api";
import { groupPackagesByProject } from "../utils/subcontractor.utils";

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SubcontractorBoqPage() {
  const [lines, setLines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(() => {
    fetchMyScPackages()
      .then((list) => setProjects(groupPackagesByProject(Array.isArray(list) ? list : [])))
      .catch(() => setProjects([]));
  }, []);

  const loadLines = useCallback(() => {
    setLoading(true);
    const projectId = projectFilter === "all" ? undefined : Number(projectFilter);
    fetchMyScBoqLines(projectId)
      .then((list) => setLines(Array.isArray(list) ? list : []))
      .catch(() => setLines([]))
      .finally(() => setLoading(false));
  }, [projectFilter]);

  useEffect(() => { loadProjects(); }, [loadProjects]);
  useEffect(() => { loadLines(); }, [loadLines]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter((l) =>
      l.description?.toLowerCase().includes(q) ||
      l.sectionCode?.toLowerCase().includes(q) ||
      l.projectName?.toLowerCase().includes(q) ||
      l.roomLabel?.toLowerCase().includes(q)
    );
  }, [lines, search]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((line) => {
      const key = `${line.projectId}::${line.sectionCode || "GENERAL"}`;
      if (!map.has(key)) {
        map.set(key, {
          projectName: line.projectName,
          sectionCode: line.sectionCode || "GENERAL",
          lines: [],
        });
      }
      map.get(key).lines.push(line);
    });
    return Array.from(map.values());
  }, [filtered]);

  const totals = useMemo(() => {
    let planned = 0;
    let approved = 0;
    let amount = 0;
    filtered.forEach((l) => {
      planned += Number(l.plannedQty ?? 0);
      approved += Number(l.approvedQty ?? 0);
      amount += Number(l.amount ?? 0);
    });
    return { planned, approved, remaining: Math.max(0, planned - approved), amount };
  }, [filtered]);

  return (
    <PageShell>
      <PageTitle
        title="BOQ — Your Scope"
        subtitle="Full bill-of-quantities lines appointed to your packages"
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">BOQ lines</p>
          <p className="text-2xl font-semibold">{filtered.length}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Planned qty</p>
          <p className="text-2xl font-semibold tabular-nums">{totals.planned}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Approved qty</p>
          <p className="text-2xl font-semibold tabular-nums">{totals.approved}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">BOQ value</p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(totals.amount)}</p>
        </Surface>
      </div>

      <Surface className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search description, section, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full lg:w-[220px]">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.projectId} value={String(p.projectId)}>{p.projectName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Surface>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : grouped.length === 0 ? (
        <Surface className="px-4 py-16 text-center text-sm text-muted-foreground">
          No BOQ lines on your appointed packages yet.
        </Surface>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <Surface key={`${group.projectName}-${group.sectionCode}`} className="overflow-hidden">
              <div className="border-b border-border/40 bg-muted/30 px-4 py-3">
                <p className="text-sm font-semibold">{group.projectName}</p>
                <p className="text-xs text-muted-foreground">Section: {group.sectionCode}</p>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground">
                    <th className="p-3">Description</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 text-right">Planned</th>
                    <th className="p-3 text-right">Approved</th>
                    <th className="p-3 text-right">Remaining</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 pr-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {group.lines.map((line) => (
                    <tr key={line.packageUuid}>
                      <td className="p-3">
                        <p className="font-medium">{line.description || line.packageName}</p>
                        <p className="text-xs text-muted-foreground">{line.unit || "—"}</p>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {[line.floorLabel, line.roomLabel].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="p-3 text-right tabular-nums">{line.plannedQty ?? 0}</td>
                      <td className="p-3 text-right tabular-nums">{line.approvedQty ?? 0}</td>
                      <td className="p-3 text-right tabular-nums">{line.remainingQty ?? 0}</td>
                      <td className="p-3 text-right tabular-nums">{formatMoney(line.rate)}</td>
                      <td className="p-3 pr-4 text-right tabular-nums">{formatMoney(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Surface>
          ))}
        </div>
      )}
    </PageShell>
  );
}
