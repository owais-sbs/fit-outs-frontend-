import { useEffect, useMemo, useState } from "react";
import { CheckSquare, ClipboardList, Loader2 } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { PageShell, SearchInput } from "@/components/layout/PageShell";
import { fetchAllChecklists } from "../api/checklists.api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function ChecklistCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border">
      <CardContent className="space-y-0 p-0">
        <div className="space-y-2 border-b border-border/60 px-4 py-3.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-3 px-4 py-3.5">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChecklistsPage({ embedded = false }) {
  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchAllChecklists()
      .then((list) => {
        if (!cancelled) setTemplates(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Unable to load checklists");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.categories.some((cat) => cat.toLowerCase().includes(q))
    );
  }, [templates, search]);

  const body = (
    <>
      {!embedded && (
        <PageHeader
          title="Checklists Configuration"
          description="Standard checklists used during site inspections, including the seeded JCT Renovation Checklist."
        />
      )}

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mb-4 max-w-sm">
        <SearchInput
          placeholder="Search checklists…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <ChecklistCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/10 px-6 py-14 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "No checklists found"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Restart the backend to apply the renovation seed if needed.
            </p>
          </div>
        ) : (
          filtered.map((checklist) => (
            <Card
              key={checklist.uuid}
              className="group overflow-hidden border border-border bg-card shadow-sm transition-all hover:border-primary/35 hover:shadow-md"
            >
              <CardContent className="p-0">
                <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-muted/15 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground">{checklist.name}</p>
                    {checklist.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {checklist.description}
                      </p>
                    ) : null}
                  </div>
                  <Badge className="shrink-0 border-[#C9A96E]/35 bg-[#C9A96E]/15 text-[#8a6d3b] dark:text-[#d9be8a]">
                    Active
                  </Badge>
                </div>

                <div className="space-y-3 px-4 py-3.5">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CheckSquare className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-foreground">{checklist.itemCount} check items</span>
                  </div>

                  <Badge variant="outline" className="bg-muted/50 font-medium">
                    {checklist.categories.length > 1
                      ? `${checklist.categories.length} categories`
                      : checklist.category}
                  </Badge>

                  {checklist.categories?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {checklist.categories.slice(0, 4).map((cat) => (
                        <span
                          key={cat}
                          className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {cat}
                        </span>
                      ))}
                      {checklist.categories.length > 4 ? (
                        <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                          +{checklist.categories.length - 4}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );

  if (embedded) return body;
  return <PageShell>{body}</PageShell>;
}
