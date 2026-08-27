import { AlertTriangle, Search, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { fetchClientSnags } from "@/modules/admin/api/snags.api";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";

const statusClass = {
  OPEN: "bg-amber-500/15 text-amber-700",
  IN_PROGRESS: "bg-blue-500/15 text-blue-700",
  READY_FOR_INSPECTION: "bg-violet-500/15 text-violet-700",
  RESOLVED: "bg-emerald-500/15 text-emerald-700",
  CLOSED: "bg-muted text-muted-foreground",
};

function formatDate(d) {
  if (!d) return null;
  try {
    return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
  } catch {
    return String(d).slice(0, 10);
  }
}

export default function ClientSnagsPage() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [snags, setSnags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snagsLoading, setSnagsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAllProjects()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setProjects(arr);
        if (arr[0]?.id) setProjectId(String(arr[0].id));
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const loadSnags = useCallback(() => {
    if (!projectId) {
      setSnags([]);
      return;
    }
    setSnagsLoading(true);
    fetchClientSnags(projectId)
      .then((list) => setSnags(Array.isArray(list) ? list : []))
      .catch(() => setSnags([]))
      .finally(() => setSnagsLoading(false));
  }, [projectId]);

  useEffect(() => {
    loadSnags();
  }, [loadSnags]);

  const filtered = snags.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(s.title || "").toLowerCase().includes(q) ||
      String(s.location || "").toLowerCase().includes(q) ||
      String(s.status || "").toLowerCase().includes(q) ||
      String(s.severity || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title="Snags"
        subtitle="Defects and punch-list items visible on your projects."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full space-y-1 sm:max-w-xs">
          <Label className="text-xs">Project</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.projectName || p.name}</option>
            ))}
          </select>
        </div>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search snags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Surface className="overflow-hidden">
        {snagsLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <AlertTriangle className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">No snags found</p>
            <p className="mt-1 text-xs">
              {projectId ? "Nothing visible for this project yet." : "Select a project to view snags."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((s) => (
              <div key={s.uuid || s.id} className="flex items-start gap-4 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <Badge className={`border-none ${statusClass[s.status] || ""}`}>
                      {String(s.status || "OPEN").replace(/_/g, " ")}
                    </Badge>
                    {s.severity && <Badge variant="secondary">{s.severity}</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.location || "—"}
                    {s.dueDate ? ` · Due ${formatDate(s.dueDate)}` : ""}
                  </p>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
