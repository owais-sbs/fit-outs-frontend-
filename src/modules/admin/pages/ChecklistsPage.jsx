import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Loader2 } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { PageShell, SearchInput } from "@/components/layout/PageShell";
import { fetchAllChecklists } from "../api/checklists.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
    return () => { cancelled = true; };
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
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <SearchInput
              placeholder="Search checklists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "No checklists found. Restart the backend to apply the renovation seed."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((checklist) => (
            <Card key={checklist.uuid} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="outline" className="bg-muted/50 font-medium">
                    {checklist.categories.length > 1
                      ? `${checklist.categories.length} categories`
                      : checklist.category}
                  </Badge>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Active
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3 font-display">{checklist.name}</CardTitle>
                {checklist.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{checklist.description}</p>
                )}
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckSquare className="w-4 h-4 mr-1.5" />
                  {checklist.itemCount} check items
                </div>
                {checklist.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {checklist.categories.slice(0, 6).map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-[10px] font-normal">
                        {cat}
                      </Badge>
                    ))}
                    {checklist.categories.length > 6 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{checklist.categories.length - 6}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return body;
  return <PageShell>{body}</PageShell>;
}
