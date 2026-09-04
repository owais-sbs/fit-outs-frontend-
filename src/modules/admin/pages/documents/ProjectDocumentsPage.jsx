import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FolderOpen,
  History,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  fetchProjectDocuments,
  uploadDocument,
  deleteDocument,
  publishDocumentToClient,
  unpublishDocumentFromClient,
  fetchDocumentVersions,
  syncDrawingsIntoDocuments,
  resolveFileUrl,
} from "../../api/documents.api";
import { ROUTES } from "@/shared/constants/routes";

const CATEGORIES = [
  { value: "drawings", label: "Drawings" },
  { value: "H&S", label: "H&S" },
  { value: "commercial", label: "Commercial" },
  { value: "photos", label: "Photos" },
  { value: "method statements", label: "Method statements" },
  { value: "other", label: "Other" },
];

const CATEGORY_ORDER = CATEGORIES.map((c) => c.value);

function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value || "Uncategorised";
}

function rootKey(doc) {
  return String(doc.parentDocumentUuid || doc.uuid);
}

/** Latest version per version family, then group by category. */
function groupLibrary(docs) {
  const latestByRoot = new Map();
  for (const d of docs) {
    const key = rootKey(d);
    const prev = latestByRoot.get(key);
    if (!prev || (d.version ?? 1) > (prev.version ?? 1)) {
      latestByRoot.set(key, d);
    }
  }
  const latest = Array.from(latestByRoot.values());
  const byCat = new Map();
  for (const d of latest) {
    const cat = d.category || "other";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(d);
  }
  const keys = Array.from(byCat.keys()).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return keys.map((cat) => ({
    category: cat,
    label: categoryLabel(cat),
    docs: byCat.get(cat).sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""))),
  }));
}

export default function ProjectDocumentsPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const detailPath = (isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL)
    .replace(":projectId", projectId);
  const fileRef = useRef(null);
  const versionFileRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", category: "drawings", file: null });
  const [versionTarget, setVersionTarget] = useState(null);
  const [versionFile, setVersionFile] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState("all");

  const load = useCallback(() => {
    setLoading(true);
    fetchProjectDocuments(projectId)
      .then((list) => setDocs(Array.isArray(list) ? list : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const folders = useMemo(() => groupLibrary(docs), [docs]);
  const visibleFolders = useMemo(() => {
    if (activeFolder === "all") return folders;
    return folders.filter((f) => f.category === activeFolder);
  }, [folders, activeFolder]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await load();
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = () =>
    run(async () => {
      await uploadDocument(projectId, {
        title: form.title.trim(),
        category: form.category,
        file: form.file,
      });
      setForm({ title: "", category: "drawings", file: null });
      if (fileRef.current) fileRef.current.value = "";
    }, "Document uploaded");

  const handleVersionUpload = () => {
    if (!versionTarget || !versionFile) return;
    run(async () => {
      await uploadDocument(projectId, {
        title: versionTarget.title,
        category: versionTarget.category,
        file: versionFile,
        parentDocumentUuid: versionTarget.uuid,
      });
      setVersionTarget(null);
      setVersionFile(null);
      if (versionFileRef.current) versionFileRef.current.value = "";
      if (historyFor && rootKey(historyFor) === rootKey(versionTarget)) {
        const list = await fetchDocumentVersions(projectId, versionTarget.uuid);
        setHistory(Array.isArray(list) ? list : []);
      }
    }, "New version uploaded");
  };

  const openHistory = async (doc) => {
    setHistoryFor(doc);
    setHistoryLoading(true);
    try {
      const list = await fetchDocumentVersions(projectId, doc.uuid);
      setHistory(Array.isArray(list) ? list : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell className="max-w-4xl mx-auto flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Link to={detailPath}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageTitle title="Documents" subtitle={`Project #${projectId}`} />
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Upload document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category / folder</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">File</Label>
              <Input
                ref={fileRef}
                type="file"
                onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={busy || !form.title.trim() || !form.file}
            >
              <Upload className="h-4 w-4 mr-1" /> Upload
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                run(
                  () => syncDrawingsIntoDocuments(projectId),
                  "Drawings synced into library"
                )
              }
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Sync drawings
            </Button>
          </div>
        </CardContent>
      </Card>

      {versionTarget && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Upload new version — {versionTarget.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">File</Label>
              <Input
                ref={versionFileRef}
                type="file"
                onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={busy || !versionFile} onClick={handleVersionUpload}>
                Upload version
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setVersionTarget(null);
                  setVersionFile(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeFolder === "all" ? "default" : "outline"}
          onClick={() => setActiveFolder("all")}
        >
          All folders
        </Button>
        {folders.map((f) => (
          <Button
            key={f.category}
            size="sm"
            variant={activeFolder === f.category ? "default" : "outline"}
            onClick={() => setActiveFolder(f.category)}
          >
            <FolderOpen className="h-3.5 w-3.5 mr-1" />
            {f.label} ({f.docs.length})
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Library ({folders.reduce((n, f) => n + f.docs.length, 0)} current)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {visibleFolders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No documents yet</p>
          ) : (
            visibleFolders.map((folder) => (
              <div key={folder.category}>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <FolderOpen className="h-3.5 w-3.5" />
                  {folder.label}
                </div>
                <div className="divide-y divide-border/40">
                  {folder.docs.map((d) => {
                    const href = resolveFileUrl(d.filePath);
                    return (
                      <div key={d.uuid} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{d.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            v{d.version ?? 1}
                            {d.sourceType === "DRAWING" ? " · from drawings" : ""}
                            {d.filePath ? ` · ${d.filePath}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {href && (
                            <Button asChild size="sm" variant="outline">
                              <a href={href} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" /> Download
                              </a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => setVersionTarget(d)}
                          >
                            <Upload className="h-4 w-4 mr-1" /> New version
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => openHistory(d)}
                          >
                            <History className="h-4 w-4 mr-1" /> History
                          </Button>
                          {d.publishedToClient ? (
                            <>
                              <Badge className="border-none bg-emerald-500/15 text-emerald-700">Published</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  run(
                                    () => unpublishDocumentFromClient(projectId, d.uuid),
                                    "Unpublished from client"
                                  )
                                }
                              >
                                Unpublish
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                run(() => publishDocumentToClient(projectId, d.uuid), "Published to client")
                              }
                            >
                              <Upload className="h-4 w-4 mr-1" /> Publish
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            disabled={busy}
                            onClick={() =>
                              run(() => deleteDocument(projectId, d.uuid), "Document deleted")
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {historyFor && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Version history — {historyFor.title}
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setHistoryFor(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No versions found</p>
            ) : (
              <div className="divide-y divide-border/40">
                {history.map((v) => {
                  const href = resolveFileUrl(v.filePath);
                  return (
                    <div key={v.uuid} className="flex items-center gap-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">v{v.version ?? 1}</p>
                        <p className="text-xs text-muted-foreground truncate">{v.filePath}</p>
                      </div>
                      {href && (
                        <Button asChild size="sm" variant="outline">
                          <a href={href} target="_blank" rel="noopener noreferrer">Download</a>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
