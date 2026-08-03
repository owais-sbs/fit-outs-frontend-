import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, DoorOpen, FileDown, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/shared/constants/routes";
import {
  fetchFinalReport,
  fetchPendingClientTasks,
  fetchProjectRooms,
  fetchRoomTasks,
} from "@/modules/admin/api/room-collab.api";
import { downloadFinalApprovedPdf } from "@/modules/admin/pages/roomcollab/finalReportPdf";

export default function ClientProjectRoomsSection({ projectId, projectName }) {
  const [rooms, setRooms] = useState([]);
  const [pending, setPending] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        fetchProjectRooms(projectId),
        fetchPendingClientTasks(projectId),
      ]);
      setRooms(r);
      setPending(p);
      if (r.length && !selectedRoomId) setSelectedRoomId(r[0].uuid);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load rooms");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedRoomId]);

  useEffect(() => {
    load();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedRoomId) return;
    fetchRoomTasks(projectId, selectedRoomId).then(setTasks).catch(() => setTasks([]));
  }, [projectId, selectedRoomId]);

  const taskPath = (id) =>
    ROUTES.CLIENT.PROJECT_ROOM_TASK.replace(":projectId", projectId).replace(":taskId", id);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <DoorOpen className="h-4 w-4 text-primary" /> Room approvals &amp; chat
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              const report = await fetchFinalReport(projectId);
              await downloadFinalApprovedPdf(report, projectName);
            } catch (err) {
              setError(err.response?.data?.error || "PDF failed");
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <FileDown className="h-3.5 w-3.5 mr-1" />}
          Final PDF
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Awaiting your approval</p>
                {pending.map((t) => (
                  <Link
                    key={t.uuid}
                    to={taskPath(t.uuid)}
                    className="flex items-center justify-between rounded-lg border border-amber-300/50 bg-amber-50/50 px-3 py-2 text-sm"
                  >
                    <span>
                      {t.floorLabel} · {t.roomName} — {t.title}
                    </span>
                    <Badge variant="warning" className="text-[10px]">Review</Badge>
                  </Link>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {rooms.map((r) => (
                  <button
                    key={r.uuid}
                    type="button"
                    onClick={() => setSelectedRoomId(r.uuid)}
                    className={[
                      "w-full text-left rounded-md border px-2.5 py-2 text-sm",
                      selectedRoomId === r.uuid ? "border-primary/40 bg-primary/5" : "border-border/60",
                    ].join(" ")}
                  >
                    <p className="font-medium truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.floorLabel}</p>
                  </button>
                ))}
                {rooms.length === 0 && (
                  <p className="text-sm text-muted-foreground">No rooms on this project yet.</p>
                )}
              </div>

              <div className="space-y-2">
                {selectedRoomId && (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to={ROUTES.CLIENT.PROJECT_ROOM_CHAT.replace(":projectId", projectId).replace(
                        ":roomId",
                        selectedRoomId
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Room chat
                    </Link>
                  </Button>
                )}
                {tasks.map((t) => (
                  <Link
                    key={t.uuid}
                    to={taskPath(t.uuid)}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/20"
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="flex items-center gap-1.5">
                      {(t.status === "APPROVED" || t.status === "CLOSED") && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {t.status.replace(/_/g, " ")}
                      </Badge>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
