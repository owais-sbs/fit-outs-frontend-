import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Send,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/shared/constants/routes";
import {
  closeRoomTask,
  fetchRoomTask,
  fetchTaskMessages,
  fetchTaskTimeline,
  submitTaskToClient,
  uploadTaskVersion,
} from "../../api/room-collab.api";
import TaskChatPanel from "./TaskChatPanel";

export default function RoomTaskDetailPage({ clientMode = false }) {
  const { projectId, taskId } = useParams();
  const [task, setTask] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const [changeNotes, setChangeNotes] = useState("");

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

  const backTo = clientMode
    ? ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", projectId)
    : ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", projectId);

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
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

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">File versions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(task.versions || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
              ) : (
                task.versions.map((v) => (
                  <div
                    key={v.uuid}
                    className={[
                      "rounded-lg border px-3 py-2.5 text-sm",
                      v.isFinal ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium flex items-center gap-1.5">
                          v{v.versionNo} · {v.originalName}
                          {v.isFinal && (
                            <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Final approved
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {v.uploaderRole} · {v.createdAt ? new Date(v.createdAt).toLocaleString() : ""}
                          {v.changeNotes ? ` · ${v.changeNotes}` : ""}
                        </p>
                      </div>
                      {v.downloadUrl && (
                        <Button asChild size="sm" variant="outline">
                          <a href={v.downloadUrl} target="_blank" rel="noreferrer">Open</a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {!closed && !clientMode && (
                <div className="pt-2 space-y-2 border-t">
                  <Label>Upload design / file</Label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <Textarea
                    placeholder="Notes for this version (optional)"
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={!file || busy}
                      onClick={() =>
                        run(async () => {
                          await uploadTaskVersion(projectId, taskId, file, changeNotes);
                          setFile(null);
                          setChangeNotes("");
                        })
                      }
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" /> Upload
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy || (task.versions || []).length === 0}
                      onClick={() => run(() => submitTaskToClient(projectId, taskId))}
                    >
                      <Send className="h-3.5 w-3.5 mr-1" /> Submit to client
                    </Button>
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
                </div>
              )}
            </CardContent>
          </Card>

          <TaskChatPanel
            projectId={projectId}
            taskId={taskId}
            messages={messages}
            versions={task.versions || []}
            onSent={softReload}
          />
        </div>

        <Card className="border-border/60 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Timeline &amp; SLA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1 text-xs">
              <p>Deadline: {task.clientDeadline ? new Date(task.clientDeadline).toLocaleString() : "—"}</p>
              <p>First sent: {task.firstSentToClientAt ? new Date(task.firstSentToClientAt).toLocaleString() : "—"}</p>
              <p>Approved: {task.approvedAt ? new Date(task.approvedAt).toLocaleString() : "—"}</p>
              <p>Client approval days: {task.clientApprovalDays ?? "—"}</p>
              <p>Revisions: {task.revisionCount}</p>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {timeline
                .filter((ev) => ev.eventType !== "MESSAGE")
                .map((ev) => (
                <div key={ev.uuid} className="border-l-2 border-primary/30 pl-3 py-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {ev.eventType.replace(/_/g, " ")} · {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ""}
                  </p>
                  <p className="text-sm">{ev.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
