import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/shared/constants/routes";
import {
  approveRoomTask,
  fetchRoomTask,
  fetchTaskMessages,
  fetchTaskTimeline,
  requestTaskChanges,
  uploadTaskVersion,
} from "@/modules/admin/api/room-collab.api";
import TaskChatPanel from "@/modules/admin/pages/roomcollab/TaskChatPanel";

/** Client-facing task page with approve / request-changes */
export default function ClientRoomTaskPage() {
  const { projectId, taskId } = useParams();
  const [task, setTask] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
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
      // ignore
    }
  }, [projectId, taskId]);

  useEffect(() => {
    load();
  }, [load]);

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
    return <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!task) {
    return (
      <div className="py-16 text-center">
        <p>Task not found</p>
        <Button asChild className="mt-4" size="sm">
          <Link to={ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", projectId)}>Back</Link>
        </Button>
      </div>
    );
  }

  const awaiting = task.status === "AWAITING_CLIENT";
  const readOnly = task.status === "APPROVED" || task.status === "CLOSED";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to={ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", projectId)}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{task.floorLabel} · {task.roomName}</p>
          <h1 className="text-xl font-bold truncate">{task.title}</h1>
        </div>
        <Badge variant="outline">{task.status.replace(/_/g, " ")}</Badge>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Versions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(task.versions || []).map((v) => (
                <div
                  key={v.uuid}
                  className={[
                    "rounded-lg border px-3 py-2 text-sm",
                    v.isFinal ? "border-emerald-500/40 bg-emerald-500/5" : "",
                  ].join(" ")}
                >
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        v{v.versionNo} · {v.originalName}
                        {v.isFinal ? " · Final approved" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{v.uploaderRole}</p>
                    </div>
                    {v.downloadUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={v.downloadUrl} target="_blank" rel="noreferrer">View</a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {awaiting && (
                <div className="border-t pt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={busy}
                      onClick={() => run(() => approveRoomTask(projectId, taskId))}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve final
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Request changes</Label>
                    <Textarea
                      rows={3}
                      placeholder="Describe the changes you need…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Label>Upload marked-up file (optional)</Label>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <Button
                      variant="outline"
                      disabled={busy || !notes.trim()}
                      onClick={() =>
                        run(async () => {
                          if (file) {
                            await uploadTaskVersion(projectId, taskId, file, notes);
                          }
                          await requestTaskChanges(projectId, taskId, notes);
                          setNotes("");
                          setFile(null);
                        })
                      }
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" /> Submit change request
                    </Button>
                  </div>
                </div>
              )}

              {readOnly && (
                <p className="text-sm text-emerald-700">
                  This item is finalized
                  {task.clientApprovalDays != null ? ` (you took ${task.clientApprovalDays} day(s) to approve)` : ""}.
                  Conversation remains available below.
                </p>
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

        <Card className="h-fit">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {timeline
              .filter((ev) => ev.eventType !== "MESSAGE")
              .map((ev) => (
              <div key={ev.uuid} className="border-l-2 border-primary/30 pl-3 py-1 text-sm">
                <p className="text-[10px] text-muted-foreground uppercase">
                  {ev.eventType.replace(/_/g, " ")} · {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ""}
                </p>
                <p>{ev.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
