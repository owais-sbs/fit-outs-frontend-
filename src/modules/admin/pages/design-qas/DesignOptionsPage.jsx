import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Grid, Clock, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ROUTES } from "@/shared/constants/routes";
import { useAdminDesignOptions } from "@/modules/admin/hooks/useAdminDesignTasks";
import { DesignQasPageShell, DesignQasStat } from "./DesignQasShell";

const STATUS_CLASS = {
  Draft: "bg-slate-600 text-white",
  Reviewing: "bg-amber-500 text-white",
  Submitted: "bg-blue-600 text-white",
};

export default function DesignOptionsPage() {
  const [search, setSearch] = useState("");
  const { items, loading, error } = useAdminDesignOptions();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (o) =>
        o.project.toLowerCase().includes(q) ||
        o.variant.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.roomLabel || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      draft: items.filter((o) => o.status === "Draft").length,
      reviewing: items.filter((o) => o.status === "Reviewing").length,
      submitted: items.filter((o) => o.status === "Submitted").length,
    }),
    [items]
  );

  return (
    <DesignQasPageShell
      title="Design Options"
      description="Design deliverables and file versions submitted from project room tasks."
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search variants or projects…"
      resultCount={loading ? undefined : filtered.length}
      actions={
        <Button size="sm" asChild>
          <Link to={ROUTES.ADMIN.PROJECTS}>Go to projects</Link>
        </Button>
      }
      stats={
        <>
          <DesignQasStat label="Total" value={loading ? "—" : stats.total} />
          <DesignQasStat label="Draft" value={loading ? "—" : stats.draft} />
          <DesignQasStat label="Reviewing" value={loading ? "—" : stats.reviewing} tone="amber" />
          <DesignQasStat label="Submitted" value={loading ? "—" : stats.submitted} tone="blue" />
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
          <Grid className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="font-medium text-lg">
            {items.length === 0 ? "No design options yet" : "No options found"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length === 0
              ? "Upload files on project room tasks to manage variants here."
              : "Adjust search to see more results."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((opt) => (
            <Card
              key={opt.taskId}
              className="flex flex-col overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/10] bg-gradient-to-br from-muted/80 to-muted/30">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <FileText className="h-9 w-9 text-muted-foreground/35" />
                  {opt.versionLabel && (
                    <span className="rounded-md bg-background/80 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {opt.versionLabel}
                    </span>
                  )}
                </div>
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="border border-border/60 bg-background/95 text-[10px] shadow-sm">
                    {opt.id}
                  </Badge>
                  <Badge className={`text-[10px] ${STATUS_CLASS[opt.status] || STATUS_CLASS.Draft}`}>
                    {opt.status}
                  </Badge>
                </div>
              </div>

              <CardHeader className="space-y-1 pb-2 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Task / variant
                </p>
                <h3 className="text-lg font-semibold leading-tight">{opt.variant}</h3>
                {opt.fileName && (
                  <p className="truncate text-xs text-muted-foreground">{opt.fileName}</p>
                )}
              </CardHeader>

              <CardContent className="space-y-2 pb-3 pt-0 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Project</span>
                  <span className="truncate font-medium text-right" title={opt.project}>
                    {opt.project}
                  </span>
                </div>
                {opt.roomLabel && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Room</span>
                    <span className="truncate text-right font-medium">{opt.roomLabel}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{opt.designType}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="flex items-center font-medium">
                    <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    {opt.date}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="mt-auto border-t border-border/40 bg-muted/10 px-5 py-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link to={opt.detailRoute}>Open task</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DesignQasPageShell>
  );
}
