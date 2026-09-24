import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import CommunicationsPage from "@/modules/admin/pages/communications/CommunicationsPage";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchClientPortalCommunicationLogs } from "@/modules/site-engineer/api/communication-logs.api";

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClientCommunicationsHubPage() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAllProjects()
      .then((list) => {
        if (cancelled) return;
        const projectsList = Array.isArray(list) ? list : [];
        setProjects(projectsList);
        if (projectsList[0]?.id != null) setProjectId(String(projectsList[0].id));
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectId) {
      setLogs([]);
      return;
    }
    fetchClientPortalCommunicationLogs(projectId)
      .then((list) => setLogs(Array.isArray(list) ? list : []))
      .catch(() => setLogs([]));
  }, [projectId]);

  return (
    <PageShell className="space-y-8">
      <PageTitle
        title="Communications"
        subtitle="Chat with the project team and review site engineer communication notes"
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      <div className="max-w-xs">
        <Label className="text-xs">Project</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name || p.projectName || `Project #${p.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Surface className="p-5 space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Site engineer notes</h2>
        <p className="text-xs text-muted-foreground">
          Summaries of calls, meetings, and agreed changes logged by your site engineer.
        </p>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No communication logs for this project yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.uuid} className="rounded-xl bg-secondary/40 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {log.channel}
                    {log.authorName ? ` · ${log.authorName}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDateTime(log.occurredAt || log.createdAt)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{log.summary}</p>
                {log.clientRequests && (
                  <p className="mt-1 text-xs">
                    <span className="font-medium">Your requests:</span> {log.clientRequests}
                  </p>
                )}
                {log.agreedChanges && (
                  <p className="mt-1 text-xs">
                    <span className="font-medium">Agreed changes:</span> {log.agreedChanges}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Surface>

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Chat</h2>
        <CommunicationsPage clientMode />
      </div>
    </PageShell>
  );
}
