import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  fetchProjectSnags,
  createSnag,
  updateSnagStatus,
  SNAG_STATUSES,
  SNAG_SEVERITIES,
} from "../../api/snags.api";
import { ROUTES } from "@/shared/constants/routes";

const statusClass = {
  OPEN: "bg-amber-500/15 text-amber-700",
  IN_PROGRESS: "bg-blue-500/15 text-blue-700",
  READY_FOR_INSPECTION: "bg-violet-500/15 text-violet-700",
  RESOLVED: "bg-emerald-500/15 text-emerald-700",
  CLOSED: "bg-muted text-muted-foreground",
};

const severityClass = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-amber-500/15 text-amber-700",
  HIGH: "bg-orange-500/15 text-orange-700",
  CRITICAL: "bg-red-500/15 text-red-700",
};

export default function ProjectSnagsPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const detailPath = (isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL)
    .replace(":projectId", projectId);
  const photoRef = useRef(null);

  const [snags, setSnags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    severity: "MEDIUM",
    dueDate: "",
    photo: null,
  });

  const load = useCallback(() => {
    setLoading(true);
    fetchProjectSnags(projectId)
      .then((list) => setSnags(Array.isArray(list) ? list : []))
      .catch(() => setSnags([]))
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

  const handleCreate = () =>
    run(async () => {
      await createSnag(projectId, {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        severity: form.severity,
        dueDate: form.dueDate || null,
        photo: form.photo,
        clientVisible: true,
      });
      setForm({
        title: "",
        description: "",
        location: "",
        severity: "MEDIUM",
        dueDate: "",
        photo: null,
      });
      if (photoRef.current) photoRef.current.value = "";
    }, "Snag raised");

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
        <PageTitle title="Snags" subtitle={`Project #${projectId}`} />
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Raise snag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Paint touch-up required"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Room / area"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Severity</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              >
                {SNAG_SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Photo</Label>
            <Input
              ref={photoRef}
              type="file"
              accept="image/*"
              onChange={(e) => setForm((f) => ({ ...f, photo: e.target.files?.[0] || null }))}
            />
          </div>
          <Button size="sm" onClick={handleCreate} disabled={busy || !form.title.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">All snags ({snags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {snags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No snags yet</p>
          ) : (
            <div className="divide-y divide-border/40">
              {snags.map((s) => (
                <div key={s.uuid} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{s.title}</p>
                      <Badge className={`border-none ${statusClass[s.status] || ""}`}>
                        {String(s.status || "OPEN").replace(/_/g, " ")}
                      </Badge>
                      {s.severity && (
                        <Badge className={`border-none ${severityClass[s.severity] || ""}`}>
                          {s.severity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.location || "—"}
                      {s.dueDate ? ` · due ${String(s.dueDate).slice(0, 10)}` : ""}
                      {s.description ? ` · ${s.description}` : ""}
                    </p>
                  </div>
                  <select
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    value={s.status || "OPEN"}
                    disabled={busy}
                    onChange={(e) =>
                      run(() => updateSnagStatus(projectId, s.uuid, e.target.value), "Status updated")
                    }
                  >
                    {SNAG_STATUSES.map((st) => (
                      <option key={st} value={st}>{st.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
