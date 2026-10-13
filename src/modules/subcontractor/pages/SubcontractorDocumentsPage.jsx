import { FileText, Download, Eye, FolderOpen, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageShell, PageTitle, Surface, FilterToolbar, SearchInput } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fetchScDocuments, resolveFileUrl } from "@/modules/admin/api/documents.api";
import { fetchMyScPackages } from "@/modules/admin/api/subcontractor.api";

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
  } catch {
    return String(d);
  }
}

export default function SubcontractorDocumentsPage() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchMyScPackages()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        const map = new Map();
        arr.forEach((pkg) => {
          const id = pkg.projectId;
          if (id == null || map.has(String(id))) return;
          map.set(String(id), {
            id,
            projectName: pkg.projectName || `Project #${id}`,
          });
        });
        const unique = Array.from(map.values());
        setProjects(unique);
        if (unique[0]?.id) setProjectId(String(unique[0].id));
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
    fetchScDocuments(projectId)
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
        String(d.title || "").toLowerCase().includes(q) ||
        String(d.category || "").toLowerCase().includes(q)
    );
  }, [docs, search]);

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
        subtitle="Documents published to subcontractors for your appointed packages."
      />

      <FilterToolbar className="items-center">
        <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? "" : v)}>
          <SelectTrigger
            aria-label="Project"
            className="h-8 w-full rounded-sm border-border bg-card shadow-sm sm:w-[240px]"
          >
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select project</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.projectName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SearchInput
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </FilterToolbar>

      <Surface className="overflow-hidden">
        {docsLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderOpen className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">No documents found</p>
            <p className="mt-1 text-xs">
              {projectId ? "No documents published to subcontractors for this project yet." : "Select a project to view documents."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((doc) => {
              const href = resolveFileUrl(doc.filePath);
              return (
                <div key={doc.uuid || doc.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {doc.category || "Document"}
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
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
