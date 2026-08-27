import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Trash2, Upload } from "lucide-react";
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

export default function ProjectDocumentsPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const detailPath = (isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL)
    .replace(":projectId", projectId);
  const fileRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", category: "drawings", file: null });

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
              <Label className="text-xs">Category</Label>
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
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={busy || !form.title.trim() || !form.file}
          >
            <Upload className="h-4 w-4 mr-1" /> Upload
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Library ({docs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No documents yet</p>
          ) : (
            <div className="divide-y divide-border/40">
              {docs.map((d) => {
                const href = resolveFileUrl(d.filePath);
                return (
                  <div key={d.uuid} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {d.category} · {d.filePath || "—"} · v{d.version ?? 1}
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
                      {d.publishedToClient ? (
                        <Badge className="border-none bg-emerald-500/15 text-emerald-700">Published</Badge>
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
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
