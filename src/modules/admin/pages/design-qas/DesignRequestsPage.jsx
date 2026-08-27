import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PenTool, Clock, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useAdminDesignRequests } from "@/modules/admin/hooks/useAdminDesignTasks";
import { DesignQasPageShell, DesignQasStat } from "./DesignQasShell";

const STATUS_CLASS = {
  Pending: "bg-amber-50 text-amber-800 border-amber-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PRIORITY_CLASS = {
  High: "bg-red-50 text-red-700 border-red-100",
  Medium: "bg-slate-100 text-slate-700 border-slate-200",
  Low: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function DesignRequestsPage() {
  const [search, setSearch] = useState("");
  const { items, loading, error } = useAdminDesignRequests();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        r.project.toLowerCase().includes(q) ||
        r.client.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.roomLabel || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((r) => r.status === "Pending").length,
      inProgress: items.filter((r) => r.status === "In Progress").length,
      completed: items.filter((r) => r.status === "Completed").length,
    }),
    [items]
  );

  return (
    <DesignQasPageShell
      title="Design Requests"
      description="Room tasks and design deliverables across your projects — track status from draft to client approval."
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by ID, project, client, or task…"
      resultCount={loading ? undefined : filtered.length}
      stats={
        <>
          <DesignQasStat label="Total" value={loading ? "—" : stats.total} />
          <DesignQasStat label="Pending" value={loading ? "—" : stats.pending} tone="amber" />
          <DesignQasStat label="In progress" value={loading ? "—" : stats.inProgress} tone="blue" />
          <DesignQasStat label="Completed" value={loading ? "—" : stats.completed} tone="emerald" />
        </>
      }
    >
      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10 py-16 text-center">
          <PenTool className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="font-medium text-lg">
            {items.length === 0 ? "No design requests yet" : "No requests found"}
          </h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {items.length === 0
              ? "Create room tasks inside a project to track design deliverables here."
              : "Adjust your search to see more results."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((req) => (
            <Card
              key={req.taskId}
              className="flex flex-col border-border/60 shadow-sm transition-shadow hover:shadow-md"
            >
              <CardHeader className="space-y-3 pb-3 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className={STATUS_CLASS[req.status] || ""}>
                    {req.status}
                  </Badge>
                  <span className="font-mono text-[10px] text-muted-foreground">{req.id}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-tight">{req.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{req.project}</p>
                  {req.client && req.client !== "—" && (
                    <p className="mt-0.5 text-sm font-medium text-foreground/80">{req.client}</p>
                  )}
                  {req.roomLabel && (
                    <p className="mt-1 text-xs text-muted-foreground">{req.roomLabel}</p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 pb-3 pt-0">
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {req.date}
                  </span>
                  <Badge variant="outline" className={PRIORITY_CLASS[req.priority] || ""}>
                    {req.priority}
                  </Badge>
                </div>
              </CardContent>

              <CardFooter className="border-t border-border/40 bg-muted/10 px-5 py-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link to={req.detailRoute}>
                    View details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DesignQasPageShell>
  );
}
