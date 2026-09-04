import { FileText, Download, Eye, Search, FolderOpen, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { fetchClientDocuments, resolveFileUrl } from "@/modules/admin/api/documents.api";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";

const FOLDER_ORDER = ["drawings", "H&S", "commercial", "photos", "method statements", "other"];

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
  } catch {
    return String(d);
  }
}

function groupByCategory(docs) {
  const map = new Map();
  for (const d of docs) {
    const cat = d.category || "other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(d);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      const ia = FOLDER_ORDER.indexOf(a);
      const ib = FOLDER_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .map(([category, items]) => ({ category, items }));
}

export default function ClientDocumentsPage() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);

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

  const loadDocs = useCallback(() => {
    if (!projectId) {
      setDocs([]);
      return;
    }
    setDocsLoading(true);
    fetchClientDocuments(projectId)
      .then((list) => setDocs(Array.isArray(list) ? list : []))
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false));
  }, [projectId]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter(
      (d) =>
        String(d.title || d.name || "").toLowerCase().includes(q) ||
        String(d.category || "").toLowerCase().includes(q)
    );
  }, [docs, search]);

  const folders = useMemo(() => groupByCategory(filtered), [filtered]);

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
        title="Documents"
        subtitle="Published design briefs, schedules, drawings, and approvals for your projects."
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
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Surface className="overflow-hidden">
        {docsLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderOpen className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">No documents found</p>
            <p className="mt-1 text-xs">
              {projectId ? "Nothing published for this project yet." : "Select a project to view documents."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {folders.map((folder) => (
              <div key={folder.category}>
                <div className="flex items-center gap-2 bg-muted/40 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <FolderOpen className="h-3.5 w-3.5" />
                  {folder.category}
                </div>
                {folder.items.map((doc) => {
                  const href = resolveFileUrl(doc.filePath);
                  return (
                    <div key={doc.uuid || doc.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                        <FileText className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{doc.title || doc.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          v{doc.version ?? 1}
                          {doc.updatedAt || doc.createdAt ? ` · ${formatDate(doc.updatedAt || doc.createdAt)}` : ""}
                        </p>
                      </div>
                      {doc.category && (
                        <Badge variant="secondary" className="hidden shrink-0 sm:flex">
                          {doc.category}
                        </Badge>
                      )}
                      <div className="flex shrink-0 items-center gap-1">
                        {href ? (
                          <>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <a href={href} target="_blank" rel="noopener noreferrer" title="View">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <a href={href} target="_blank" rel="noopener noreferrer" title="Download">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
