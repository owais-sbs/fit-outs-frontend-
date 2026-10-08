import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Download,
  Eye,
  ExternalLink,
  File,
  FileImage,
  FileText,
  Folder,
  HardDrive,
  History,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import ProjectPageFrame from "@/components/layout/ProjectPageFrame";
import ProjectPathLine from "@/components/shared/ProjectPathLine";
import { useProjectName } from "../../hooks/useProjectName";
import LoadingPanel from "@/components/shared/LoadingPanel";
import { loadingMessages } from "@/components/shared/loadingMessages";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchProjectDocuments,
  uploadDocument,
  deleteDocument,
  publishDocumentToClient,
  unpublishDocumentFromClient,
  publishDocumentToSc,
  unpublishDocumentFromSc,
  fetchDocumentVersions,
  syncDrawingsIntoDocuments,
  resolveFileUrl,
  fetchDocumentFileBlob,
} from "../../api/documents.api";
import { FillDemoDataButton } from "@/components/shared/FillDemoDataButton";
import {
  assignDemoFileToInput,
  buildDemoDocumentUpload,
  buildDemoDocumentVersionFile,
} from "@/shared/demo/formDemoData";
import ProjectLifecycleBanner from "../../components/projects/ProjectLifecycleBanner";
import { useProjectLifecycle } from "../../hooks/useProjectLifecycle";
import { cn } from "@/lib/utils";

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

function fileExt(doc) {
  const path = String(doc?.filePath || doc?.title || "");
  const m = path.match(/\.([a-z0-9]+)(?:\?|$)/i);
  return m ? m[1].toLowerCase() : "";
}

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
const PDF_EXTS = ["pdf"];
const TEXT_EXTS = ["txt", "csv", "log", "md", "json", "xml"];

function previewKind(doc) {
  const ext = fileExt(doc);
  if (IMAGE_EXTS.includes(ext) || doc?.category === "photos") return "image";
  if (PDF_EXTS.includes(ext)) return "pdf";
  if (TEXT_EXTS.includes(ext)) return "text";
  return "other";
}

function FileTypeIcon({ doc, className }) {
  const kind = previewKind(doc);
  if (kind === "image") {
    return <FileImage className={cn("text-sky-600", className)} />;
  }
  if (kind === "pdf" || ["doc", "docx", "rtf"].includes(fileExt(doc))) {
    return <FileText className={cn("text-rose-600", className)} />;
  }
  return <File className={cn("text-muted-foreground", className)} />;
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
  const { name: projectName } = useProjectName(projectId);
  const { commercialStage, archived } = useProjectLifecycle(projectId);
  const fileRef = useRef(null);
  const versionFileRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", category: "drawings", file: null });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [versionTarget, setVersionTarget] = useState(null);
  const [versionFile, setVersionFile] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [activeFolder, setActiveFolder] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [query, setQuery] = useState("");

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
  const totalCurrent = useMemo(
    () => folders.reduce((n, f) => n + f.docs.length, 0),
    [folders]
  );

  const visibleDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source =
      activeFolder === "all"
        ? folders.flatMap((f) => f.docs)
        : folders.find((f) => f.category === activeFolder)?.docs || [];
    if (!q) return source;
    return source.filter((d) => String(d.title || "").toLowerCase().includes(q));
  }, [folders, activeFolder, query]);

  const currentFolderLabel =
    activeFolder === "all" ? "My Drive" : categoryLabel(activeFolder);

  const run = async (fn, okMsg) => {
    if (archived) {
      setMessage("This project is archived and read-only.");
      return;
    }
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

  const resetUploadForm = () => {
    setForm({ title: "", category: activeFolder !== "all" ? activeFolder : "drawings", file: null });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = () =>
    run(async () => {
      await uploadDocument(projectId, {
        title: form.title.trim(),
        category: form.category,
        file: form.file,
      });
      resetUploadForm();
      setUploadOpen(false);
      setActiveFolder(form.category);
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

  const openUpload = () => {
    setForm((f) => ({
      ...f,
      category: activeFolder !== "all" ? activeFolder : f.category || "drawings",
    }));
    setUploadOpen(true);
  };

  if (loading) {
    return (
      <PageShell>
        <LoadingPanel size="page" messages={loadingMessages.documents} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ProjectPageFrame>
        <ProjectPathLine projectId={projectId} initialName={projectName} />
        <PageHeader title="Documents" subtitle={projectName} />
        <ProjectLifecycleBanner commercialStage={commercialStage} />
        {message && (
          <p className="text-sm text-muted-foreground rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            {message}
          </p>
        )}

        <div className="flex min-h-[70vh] overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
          {/* Drive-style folder rail */}
          <aside className="hidden w-56 shrink-0 border-r border-border/60 bg-muted/20 p-3 sm:flex sm:flex-col gap-1">
            {!archived && (
              <Button className="mb-3 h-10 justify-start gap-2 rounded-full shadow-sm" onClick={openUpload}>
                <Plus className="h-4 w-4" /> New
              </Button>
            )}
            <button
              type="button"
              onClick={() => setActiveFolder("all")}
              className={cn(
                "flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm transition-colors",
                activeFolder === "all"
                  ? "bg-primary/15 font-medium text-primary"
                  : "text-foreground/80 hover:bg-muted"
              )}
            >
              <HardDrive className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">My Drive</span>
              <span className="text-xs text-muted-foreground">{totalCurrent}</span>
            </button>
            <p className="mt-3 px-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Folders
            </p>
            {CATEGORIES.map((c) => {
              const count = folders.find((f) => f.category === c.value)?.docs.length || 0;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setActiveFolder(c.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm transition-colors",
                    activeFolder === c.value
                      ? "bg-primary/15 font-medium text-primary"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  <Folder className="h-4 w-4 shrink-0 text-amber-600" />
                  <span className="flex-1 truncate">{c.label}</span>
                  {count > 0 && (
                    <span className="text-xs text-muted-foreground">{count}</span>
                  )}
                </button>
              );
            })}
            {!archived && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-auto justify-start gap-2 text-muted-foreground"
                disabled={busy}
                onClick={() =>
                  run(() => syncDrawingsIntoDocuments(projectId), "Drawings synced into library")
                }
              >
                <RefreshCw className="h-3.5 w-3.5" /> Sync drawings
              </Button>
            )}
          </aside>

          {/* Main drive surface */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3">
              <div className="relative min-w-[180px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search in Drive"
                  className="h-9 rounded-full border-border/70 bg-muted/40 pl-9"
                />
              </div>
              <div className="flex items-center rounded-lg border border-border/60 p-0.5">
                <Button
                  size="icon"
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              {!archived && (
                <Button size="sm" className="sm:hidden" onClick={openUpload}>
                  <Plus className="h-4 w-4 mr-1" /> New
                </Button>
              )}
            </div>

            {/* Mobile folder chips */}
            <div className="flex gap-2 overflow-x-auto border-b border-border/40 px-4 py-2 sm:hidden">
              <Button
                size="sm"
                variant={activeFolder === "all" ? "default" : "outline"}
                className="rounded-full shrink-0"
                onClick={() => setActiveFolder("all")}
              >
                My Drive
              </Button>
              {CATEGORIES.map((c) => (
                <Button
                  key={c.value}
                  size="sm"
                  variant={activeFolder === c.value ? "default" : "outline"}
                  className="rounded-full shrink-0"
                  onClick={() => setActiveFolder(c.value)}
                >
                  {c.label}
                </Button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{currentFolderLabel}</h2>
                  <p className="text-xs text-muted-foreground">
                    {visibleDocs.length} item{visibleDocs.length === 1 ? "" : "s"}
                    {query.trim() ? ` matching “${query.trim()}”` : ""}
                  </p>
                </div>
              </div>

              {visibleDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center">
                  <Folder className="mb-3 h-12 w-12 text-muted-foreground/40" />
                  <p className="text-sm font-medium">This folder is empty</p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    {archived
                      ? "No documents in this folder."
                      : "Upload a file with New, or sync drawings from the project library."}
                  </p>
                  {!archived && (
                    <Button size="sm" className="mt-4" onClick={openUpload}>
                      <Upload className="h-4 w-4 mr-1" /> Upload file
                    </Button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {visibleDocs.map((d) => (
                    <DocCard
                      key={d.uuid}
                      doc={d}
                      archived={archived}
                      busy={busy}
                      onPreview={() => setPreviewDoc(d)}
                      onDownload={resolveFileUrl(d.filePath)}
                      onVersion={() => setVersionTarget(d)}
                      onHistory={() => openHistory(d)}
                      onPublishClient={() =>
                        run(() => publishDocumentToClient(projectId, d.uuid), "Published to client")
                      }
                      onUnpublishClient={() =>
                        run(
                          () => unpublishDocumentFromClient(projectId, d.uuid),
                          "Unpublished from client"
                        )
                      }
                      onPublishSc={() =>
                        run(() => publishDocumentToSc(projectId, d.uuid), "Published to subcontractors")
                      }
                      onUnpublishSc={() =>
                        run(
                          () => unpublishDocumentFromSc(projectId, d.uuid),
                          "Unpublished from subcontractors"
                        )
                      }
                      onDelete={() =>
                        run(() => deleteDocument(projectId, d.uuid), "Document deleted")
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <div className="grid grid-cols-[minmax(0,1fr)_88px_120px_40px] gap-2 border-b border-border/50 bg-muted/30 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <span>Name</span>
                    <span>Version</span>
                    <span>Shared</span>
                    <span />
                  </div>
                  <div className="divide-y divide-border/40">
                    {visibleDocs.map((d) => (
                      <DocRow
                        key={d.uuid}
                        doc={d}
                        showFolder={activeFolder === "all"}
                        archived={archived}
                        busy={busy}
                        onPreview={() => setPreviewDoc(d)}
                        onDownload={resolveFileUrl(d.filePath)}
                        onVersion={() => setVersionTarget(d)}
                        onHistory={() => openHistory(d)}
                        onPublishClient={() =>
                          run(() => publishDocumentToClient(projectId, d.uuid), "Published to client")
                        }
                        onUnpublishClient={() =>
                          run(
                            () => unpublishDocumentFromClient(projectId, d.uuid),
                            "Unpublished from client"
                          )
                        }
                        onPublishSc={() =>
                          run(() => publishDocumentToSc(projectId, d.uuid), "Published to subcontractors")
                        }
                        onUnpublishSc={() =>
                          run(
                            () => unpublishDocumentFromSc(projectId, d.uuid),
                            "Unpublished from subcontractors"
                          )
                        }
                        onDelete={() =>
                          run(() => deleteDocument(projectId, d.uuid), "Document deleted")
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload dialog */}
        <Dialog
          open={uploadOpen}
          onOpenChange={(open) => {
            setUploadOpen(open);
            if (!open) resetUploadForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload file</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div className="flex justify-end">
                <FillDemoDataButton
                  disabled={busy}
                  onClick={() => {
                    const demo = buildDemoDocumentUpload();
                    setForm({ title: demo.title, category: demo.category, file: demo.file });
                    assignDemoFileToInput(fileRef.current, demo.file);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Document title"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Folder</Label>
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
                {form.file && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    Selected: {form.file.name}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
              <Button
                disabled={busy || !form.title.trim() || !form.file}
                onClick={handleUpload}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New version dialog */}
        <Dialog
          open={!!versionTarget}
          onOpenChange={(open) => {
            if (!open) {
              setVersionTarget(null);
              setVersionFile(null);
              if (versionFileRef.current) versionFileRef.current.value = "";
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload new version</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground truncate">{versionTarget?.title}</p>
            <div className="space-y-3 py-1">
              <div className="flex justify-end">
                <FillDemoDataButton
                  disabled={busy || !versionTarget}
                  onClick={() => {
                    if (!versionTarget) return;
                    const file = buildDemoDocumentVersionFile(versionTarget.title);
                    setVersionFile(file);
                    assignDemoFileToInput(versionFileRef.current, file);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">File</Label>
                <Input
                  ref={versionFileRef}
                  type="file"
                  onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                />
                {versionFile && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    Selected: {versionFile.name}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setVersionTarget(null);
                  setVersionFile(null);
                }}
              >
                Cancel
              </Button>
              <Button disabled={busy || !versionFile} onClick={handleVersionUpload}>
                Upload version
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History dialog */}
        <Dialog open={!!historyFor} onOpenChange={(open) => !open && setHistoryFor(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Version history</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground truncate">{historyFor?.title}</p>
            {historyLoading ? (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No versions found</p>
            ) : (
              <div className="max-h-72 divide-y divide-border/40 overflow-auto rounded-lg border border-border/50">
                {history.map((v) => {
                  const href = resolveFileUrl(v.filePath);
                  return (
                    <div key={v.uuid} className="flex items-center gap-3 px-3 py-2.5">
                      <FileTypeIcon doc={v} className="h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Version {v.version ?? 1}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {v.sourceType === "DRAWING" ? "From drawings" : "Uploaded file"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {href && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewDoc(v)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                          </Button>
                        )}
                        {href && (
                          <Button asChild size="sm" variant="outline">
                            <a href={href} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3.5 w-3.5 mr-1" /> Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <DocumentPreviewDialog
          doc={previewDoc}
          open={!!previewDoc}
          onOpenChange={(open) => !open && setPreviewDoc(null)}
        />
      </ProjectPageFrame>
    </PageShell>
  );
}

function DocumentPreviewDialog({ doc, open, onOpenChange }) {
  const href = resolveFileUrl(doc?.filePath);
  const kind = doc ? previewKind(doc) : "other";
  const [blobUrl, setBlobUrl] = useState(null);
  const [textBody, setTextBody] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTextBody("");
    setLoadError("");
    setBlobUrl(null);
    if (!open || !doc?.filePath || (kind !== "pdf" && kind !== "image" && kind !== "text")) {
      return undefined;
    }
    let cancelled = false;
    let objectUrl = null;
    setLoading(true);
    fetchDocumentFileBlob(doc.filePath)
      .then(async (blob) => {
        if (cancelled) return;
        if (kind === "text") {
          const text = await blob.text();
          if (!cancelled) setTextBody(text.slice(0, 200_000));
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
          return;
        }
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        if (cancelled) return;
        const status = err?.response?.status;
        const msg =
          status === 401 || status === 403
            ? "You don’t have permission to view this file."
            : status === 404
              ? "File not found on the server."
              : err?.message || "Could not load preview";
        setLoadError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, kind, doc?.uuid, doc?.filePath]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(960px,95vw)] max-w-4xl flex-col gap-3 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="space-y-1 pr-8">
          <DialogTitle className="truncate text-base">{doc?.title || "Preview"}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {doc ? `${categoryLabel(doc.category)} · v${doc.version ?? 1}` : ""}
            {fileExt(doc) ? ` · .${fileExt(doc)}` : ""}
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border/60 bg-muted/20">
          {!href ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No file available to preview.</p>
          ) : loading ? (
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : loadError ? (
            <p className="p-8 text-center text-sm text-destructive">{loadError}</p>
          ) : kind === "image" ? (
            blobUrl ? (
              <div className="flex min-h-[50vh] items-center justify-center p-4">
                <img
                  src={blobUrl}
                  alt={doc?.title || "Preview"}
                  className="max-h-[70vh] max-w-full object-contain"
                />
              </div>
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">Could not load image preview.</p>
            )
          ) : kind === "pdf" ? (
            blobUrl ? (
              <iframe
                title={doc?.title || "PDF preview"}
                src={blobUrl}
                className="h-[70vh] w-full border-0 bg-white"
              />
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">Could not load PDF preview.</p>
            )
          ) : kind === "text" ? (
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed">
              {textBody}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <FileTypeIcon doc={doc} className="h-12 w-12 opacity-50" />
              <p className="text-sm font-medium">Inline preview not available for this file type</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                You can open it in a new tab or download it instead.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="text-[11px] text-muted-foreground">
            Preview stays in the app — use Download if you need a local copy.
          </div>
          <div className="flex flex-wrap gap-2">
            {href && (
              <Button asChild size="sm" variant="outline">
                <a href={href} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open in new tab
                </a>
              </Button>
            )}
            {href && (
              <Button asChild size="sm">
                <a href={href} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-3.5 w-3.5 mr-1" /> Download
                </a>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SharingBadges({ doc }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {doc.publishedToClient && (
        <Badge className="border-none bg-emerald-500/15 text-emerald-700 text-[10px]">Client</Badge>
      )}
      {doc.publishedToSc && (
        <Badge className="border-none bg-sky-500/15 text-sky-700 text-[10px]">SC</Badge>
      )}
      {!doc.publishedToClient && !doc.publishedToSc && (
        <span className="text-xs text-muted-foreground">Private</span>
      )}
    </div>
  );
}

function DocActionsMenu({
  doc,
  archived,
  busy,
  onPreview,
  onDownload,
  onVersion,
  onHistory,
  onPublishClient,
  onUnpublishClient,
  onPublishSc,
  onUnpublishSc,
  onDelete,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          disabled={busy}
          aria-label="File actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {onPreview && (
          <DropdownMenuItem onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" /> Preview
          </DropdownMenuItem>
        )}
        {onDownload && (
          <DropdownMenuItem asChild>
            <a href={onDownload} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <Download className="h-4 w-4 mr-2" /> Download
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onHistory}>
          <History className="h-4 w-4 mr-2" /> Version history
        </DropdownMenuItem>
        {!archived && (
          <DropdownMenuItem onClick={onVersion}>
            <Upload className="h-4 w-4 mr-2" /> Upload new version
          </DropdownMenuItem>
        )}
        {!archived && (
          <>
            <DropdownMenuSeparator />
            {doc.publishedToClient ? (
              <DropdownMenuItem onClick={onUnpublishClient}>Unpublish from client</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onPublishClient}>Publish to client</DropdownMenuItem>
            )}
            {doc.publishedToSc ? (
              <DropdownMenuItem onClick={onUnpublishSc}>Unpublish from SC</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onPublishSc}>Publish to SC</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DocRow({
  doc,
  showFolder,
  archived,
  busy,
  onPreview,
  onDownload,
  onVersion,
  onHistory,
  onPublishClient,
  onUnpublishClient,
  onPublishSc,
  onUnpublishSc,
  onDelete,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPreview}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPreview?.();
        }
      }}
      className="grid grid-cols-[minmax(0,1fr)_88px_120px_40px] items-center gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors cursor-pointer"
    >
      <div className="flex min-w-0 items-center gap-3">
        <FileTypeIcon doc={doc} className="h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{doc.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {showFolder ? categoryLabel(doc.category) : null}
            {showFolder && doc.sourceType === "DRAWING" ? " · " : null}
            {doc.sourceType === "DRAWING" ? "From drawings" : showFolder ? null : "File"}
          </p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">v{doc.version ?? 1}</span>
      <SharingBadges doc={doc} />
      <div onClick={(e) => e.stopPropagation()}>
        <DocActionsMenu
          doc={doc}
          archived={archived}
          busy={busy}
          onPreview={onPreview}
          onDownload={onDownload}
          onVersion={onVersion}
          onHistory={onHistory}
          onPublishClient={onPublishClient}
          onUnpublishClient={onUnpublishClient}
          onPublishSc={onPublishSc}
          onUnpublishSc={onUnpublishSc}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function DocCard({
  doc,
  archived,
  busy,
  onPreview,
  onDownload,
  onVersion,
  onHistory,
  onPublishClient,
  onUnpublishClient,
  onPublishSc,
  onUnpublishSc,
  onDelete,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPreview}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPreview?.();
        }
      }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-shadow hover:shadow-md cursor-pointer"
    >
      <div
        className="absolute right-1 top-1 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <DocActionsMenu
          doc={doc}
          archived={archived}
          busy={busy}
          onPreview={onPreview}
          onDownload={onDownload}
          onVersion={onVersion}
          onHistory={onHistory}
          onPublishClient={onPublishClient}
          onUnpublishClient={onUnpublishClient}
          onPublishSc={onPublishSc}
          onUnpublishSc={onUnpublishSc}
          onDelete={onDelete}
        />
      </div>
      <div className="flex h-28 items-center justify-center bg-muted/40">
        <FileTypeIcon doc={doc} className="h-12 w-12 opacity-80" />
      </div>
      <div className="space-y-1.5 p-3">
        <p className="truncate text-sm font-medium" title={doc.title}>{doc.title}</p>
        <p className="text-[11px] text-muted-foreground">
          {categoryLabel(doc.category)} · v{doc.version ?? 1}
        </p>
        <SharingBadges doc={doc} />
      </div>
    </div>
  );
}
