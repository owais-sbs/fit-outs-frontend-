import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/shared/constants/routes";
import { fetchRoomMessages, fetchRoomTasks, postRoomMessage } from "../../api/room-collab.api";

export default function RoomChatPage({ clientMode = false }) {
  const { projectId, roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const taskRoute = (taskId) =>
    (clientMode ? ROUTES.CLIENT.PROJECT_ROOM_TASK : ROUTES.ADMIN.PROJECT_ROOM_TASK)
      .replace(":projectId", projectId)
      .replace(":taskId", taskId);

  const backTo = (clientMode ? ROUTES.CLIENT.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL).replace(
    ":projectId",
    projectId
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [msgs, t] = await Promise.all([
        fetchRoomMessages(projectId, roomId),
        fetchRoomTasks(projectId, roomId),
      ]);
      setMessages(msgs);
      setTasks(t);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load room chat");
    } finally {
      setLoading(false);
    }
  }, [projectId, roomId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await postRoomMessage(projectId, roomId, body);
      setBody("");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Send failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to={backTo}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-xl font-bold">Room conversation</h1>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Messages</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="max-h-[480px] overflow-y-auto space-y-2">
                {messages.map((m) => (
                  <div key={m.uuid} className="rounded-lg border px-3 py-2 text-sm">
                    <p className="text-[10px] text-muted-foreground">
                      #{m.senderAccountId} · {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap">{m.body}</p>
                    {m.linkedTaskId && (
                      <Link className="text-xs text-primary underline mt-1 inline-block" to={taskRoute(m.linkedTaskId)}>
                        Open linked task
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message this room…" />
              <Button onClick={send} disabled={busy || !body.trim()}>Send</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 h-fit">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Task threads</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tasks</p>
            ) : (
              tasks.map((t) => (
                <Link
                  key={t.uuid}
                  to={taskRoute(t.uuid)}
                  className="block rounded-md border px-2.5 py-2 text-sm hover:bg-muted/30"
                >
                  <p className="font-medium truncate">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground">{t.status.replace(/_/g, " ")}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
