import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/shared/constants/routes";
import {
  closeRoomTask,
  fetchRoomTask,
  fetchTaskMessages,
  fetchTaskTimeline,
  submitTaskToClient,
} from "../../api/room-collab.api";
import TaskChatPanel from "./TaskChatPanel";

function StatusStrip({ task, timeline, historyOpen, setHistoryOpen }) {
  const events = (timeline || []).filter((ev) => ev.eventType !== "MESSAGE");
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 space-y-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Deadline: {task.clientDeadline ? new Date(task.clientDeadline).toLocaleString() : "—"}</span>
        <span>First sent: {task.firstSentToClientAt ? new Date(task.firstSentToClientAt).toLocaleString() : "—"}</span>
        <span>Revisions: {task.revisionCount ?? 0}</span>
        {task.approvedAt && (
          <span>Approved: {new Date(task.approvedAt).toLocaleString()}</span>
        )}
      </div>
      {events.length > 0 && (
        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-foreground/80 hover:text-foreground"
            onClick={() => setHistoryOpen((o) => !o)}
          >
            {historyOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            History ({events.length})
          </button>
          {historyOpen && (
            <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto border-t border-border/40 pt-2">
              {events.map((ev) => (
                <div key={ev.uuid} className="text-xs">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {ev.eventType.replace(/_/g, " ")}
                    {ev.createdAt ? ` · ${new Date(ev.createdAt).toLocaleString()}` : ""}
                  </p>
                  <p className="text-sm text-foreground/90">{ev.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LatestFile({ versions }) {
  const list = versions || [];
  if (!list.length) return null;
  const latest = [...list].sort((a, b) => (b.versionNo || 0) - (a.versionNo || 0))[0];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm">
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          Latest: v{latest.versionNo} · {latest.originalName}
          {latest.isFinal && (
            <Badge className="ml-1.5 bg-emerald-600 text-white text-[10px] gap-1 align-middle">
              <CheckCircle2 className="h-3 w-3" /> Final
            </Badge>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {latest.uploaderRole}
          {latest.createdAt ? ` · ${new Date(latest.createdAt).toLocaleString()}` : ""}
        </p>
      </div>
      {latest.downloadUrl && (
        <Button asChild size="sm" variant="outline">
          <a href={latest.downloadUrl} target="_blank" rel="noreferrer">Open</a>
        </Button>
      )}
    </div>
  );
}

export default function RoomTaskDetailPage() {
  const { projectId, taskId } = useParams();
  const [task, setTask] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [t, tl, msgs] = await Promise.all([
        fetchRoomTask(projectId, taskId),
        fetchTaskTimeline(projectId, taskId),
        fetchTaskMessages(projectId, taskId),
      ]);
      setTask(t);
      setTimeline(tl);
      setMessages(msgs);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load task");
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId]);

  const softReload = useCallback(async () => {
    try {
      const [t, tl, msgs] = await Promise.all([
        fetchRoomTask(projectId, taskId),
        fetchTaskTimeline(projectId, taskId),
        fetchTaskMessages(projectId, taskId),
      ]);
      setTask(t);
      setTimeline(tl);
      setMessages(msgs);
    } catch {
      // ignore soft refresh errors
    }
  }, [projectId, taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const backTo = ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", projectId);

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Task not found</p>
        <Button asChild className="mt-4" size="sm"><Link to={backTo}>Back</Link></Button>
      </div>
    );
  }

  const closed = task.status === "APPROVED" || task.status === "CLOSED";
  const versions = task.versions || [];
  const latest = versions.length
    ? [...versions].sort((a, b) => (b.versionNo || 0) - (a.versionNo || 0))[0]
    : null;
  const canSubmit = !closed && latest && latest.uploaderRole === "STAFF";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-16">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to={backTo}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {task.floorLabel} · {task.roomName}
          </p>
          <h1 className="text-xl font-bold truncate">{task.title}</h1>
        </div>
        <Badge variant="outline">{task.status.replace(/_/g, " ")}</Badge>
      </div>

      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <StatusStrip
        task={task}
        timeline={timeline}
        historyOpen={historyOpen}
        setHistoryOpen={setHistoryOpen}
      />

      <LatestFile versions={versions} />

      {versions.length > 1 && (
        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setVersionsOpen((o) => !o)}
          >
            {versionsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Earlier versions ({versions.length - 1})
          </button>
          {versionsOpen && (
            <ul className="mt-2 space-y-1.5">
              {[...versions]
                .sort((a, b) => (b.versionNo || 0) - (a.versionNo || 0))
                .slice(1)
                .map((v) => (
                  <li
                    key={v.uuid}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/50 px-2.5 py-1.5 text-xs"
                  >
                    <span className="truncate">
                      v{v.versionNo} · {v.originalName}
                    </span>
                    {v.downloadUrl && (
                      <a
                        href={v.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-primary hover:underline"
                      >
                        Open
                      </a>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {(canSubmit || task.status === "APPROVED") && (
        <div className="flex flex-wrap gap-2">
          {canSubmit && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => run(() => submitTaskToClient(projectId, taskId))}
            >
              <Send className="h-3.5 w-3.5 mr-1" /> Submit to client
            </Button>
          )}
          {task.status === "APPROVED" && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => run(() => closeRoomTask(projectId, taskId))}
            >
              Close task
            </Button>
          )}
        </div>
      )}

      <TaskChatPanel
        projectId={projectId}
        taskId={taskId}
        messages={messages}
        onSent={softReload}
        disabled={closed}
      />
    </div>
  );
}
