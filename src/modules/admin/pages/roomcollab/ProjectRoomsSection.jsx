import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, DoorOpen, Loader2, MessageSquare, Plus, RefreshCw, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTES } from "@/shared/constants/routes";
import {
  createProjectRoom,
  createRoomTask,
  fetchFinalReport,
  fetchProjectRooms,
  fetchRoomTasks,
  syncRoomsFromBoq,
} from "../../api/room-collab.api";
import { downloadFinalApprovedPdf } from "./finalReportPdf";
import { ROOM_TASK_TYPES, formatTaskType } from "../../data/roomTaskTypes";

const STATUS_VARIANT = {
  OPEN: "outline",
  AWAITING_CLIENT: "warning",
  CHANGES_REQUESTED: "destructive",
  APPROVED: "success",
  CLOSED: "secondary",
};

export default function ProjectRoomsSection({ projectId, projectName }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: "", floorLabel: "Ground Floor" });
  const [taskForm, setTaskForm] = useState({ title: "", taskType: "DESIGN", typeLabel: "", clientDeadline: "" });
  const [exporting, setExporting] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchProjectRooms(projectId);
      setRooms(list);
      if (list.length && !selectedRoomId) {
        setSelectedRoomId(list[0].uuid);
      } else if (selectedRoomId && !list.some((r) => r.uuid === selectedRoomId)) {
        setSelectedRoomId(list[0]?.uuid || "");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load rooms");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedRoomId]);

  const loadTasks = useCallback(async () => {
    if (!selectedRoomId) {
      setTasks([]);
      return;
    }
    try {
      setTasks(await fetchRoomTasks(projectId, selectedRoomId));
    } catch {
      setTasks([]);
    }
  }, [projectId, selectedRoomId]);

  useEffect(() => {
    loadRooms();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const roomsByFloor = useMemo(() => {
    const map = new Map();
    rooms.forEach((r) => {
      const floor = r.floorLabel || "General";
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor).push(r);
    });
    return [...map.entries()];
  }, [rooms]);

  const selectedRoom = rooms.find((r) => r.uuid === selectedRoomId);

  const handleSync = async () => {
    setSyncing(true);
    setError("");
    try {
      await syncRoomsFromBoq(projectId);
      await loadRooms();
    } catch (err) {
      setError(err.response?.data?.error || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleAddRoom = async () => {
    if (!roomForm.name.trim()) return;
    try {
      const room = await createProjectRoom(projectId, roomForm);
      setAddRoomOpen(false);
      setRoomForm({ name: "", floorLabel: "Ground Floor" });
      await loadRooms();
      setSelectedRoomId(room.uuid);
    } catch (err) {
      setError(err.response?.data?.error || "Could not create room");
    }
  };

  const handleAddTask = async () => {
    if (!selectedRoomId || !taskForm.title.trim()) return;
    if (taskForm.taskType === "CUSTOM" && !taskForm.typeLabel.trim()) {
      setError("Enter a custom type label");
      return;
    }
    try {
      await createRoomTask(projectId, {
        projectRoomId: selectedRoomId,
        title: taskForm.title,
        taskType: taskForm.taskType,
        typeLabel: taskForm.taskType === "CUSTOM" ? taskForm.typeLabel.trim() : null,
        clientDeadline: taskForm.clientDeadline
          ? new Date(taskForm.clientDeadline).toISOString()
          : null,
      });
      setAddTaskOpen(false);
      setTaskForm({ title: "", taskType: "DESIGN", typeLabel: "", clientDeadline: "" });
      await loadTasks();
      await loadRooms();
    } catch (err) {
      setError(err.response?.data?.error || "Could not create task");
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const report = await fetchFinalReport(projectId);
      await downloadFinalApprovedPdf(report, projectName);
    } catch (err) {
      setError(err.response?.data?.error || "PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  const taskPath = (taskId) =>
    ROUTES.ADMIN.PROJECT_ROOM_TASK.replace(":projectId", projectId).replace(":taskId", taskId);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <DoorOpen className="h-4 w-4 text-primary" />
          Rooms &amp; approvals
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
            Sync from BOQ
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAddRoomOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add room
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPdf} disabled={exporting}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <FileDown className="h-3.5 w-3.5 mr-1" />}
            Final PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading rooms…</p>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No rooms yet. Sync from a BOQ survey or add a room manually.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {roomsByFloor.map(([floor, floorRooms]) => (
                <div key={floor}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    {floor}
                  </p>
                  <div className="space-y-1">
                    {floorRooms.map((room) => (
                      <button
                        key={room.uuid}
                        type="button"
                        onClick={() => setSelectedRoomId(room.uuid)}
                        className={[
                          "w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors",
                          selectedRoomId === room.uuid
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/60 hover:bg-muted/40",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{room.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {room.openTaskCount}/{room.taskCount}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{room.source}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm">
                    {selectedRoom ? `${selectedRoom.floorLabel} · ${selectedRoom.name}` : "Select a room"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Tasks, client deadlines, and room conversation
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedRoomId && (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to={ROUTES.ADMIN.PROJECT_ROOM_CHAT.replace(":projectId", projectId).replace(
                          ":roomId",
                          selectedRoomId
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1" /> Room chat
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setAddTaskOpen(true)} disabled={!selectedRoomId}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> New task
                  </Button>
                </div>
              </div>

              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
                  No tasks in this room yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <Link
                      key={task.uuid}
                      to={taskPath(task.uuid)}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:border-primary/30 hover:bg-muted/20 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTaskType(task)}
                          {task.clientDeadline
                            ? ` · Due ${new Date(task.clientDeadline).toLocaleDateString()}`
                            : ""}
                          {task.clientApprovalDays != null
                            ? ` · Approved in ${task.clientApprovalDays}d`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {task.status === "APPROVED" || task.status === "CLOSED" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : null}
                        <Badge variant={STATUS_VARIANT[task.status] || "outline"} className="text-[10px]">
                          {task.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add room</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Floor</Label>
              <Input
                value={roomForm.floorLabel}
                onChange={(e) => setRoomForm((f) => ({ ...f, floorLabel: e.target.value }))}
              />
            </div>
            <div>
              <Label>Room name</Label>
              <Input
                value={roomForm.name}
                onChange={(e) => setRoomForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Master Bedroom"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoomOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRoom}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New room task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Living room concept design"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={taskForm.taskType}
                onValueChange={(v) => setTaskForm((f) => ({ ...f, taskType: v, typeLabel: v === "CUSTOM" ? f.typeLabel : "" }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {ROOM_TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {taskForm.taskType === "CUSTOM" && (
              <div>
                <Label>Custom type</Label>
                <Input
                  value={taskForm.typeLabel}
                  onChange={(e) => setTaskForm((f) => ({ ...f, typeLabel: e.target.value }))}
                  placeholder="e.g. Marble skirting approval"
                />
              </div>
            )}
            <div>
              <Label>Client approval deadline</Label>
              <Input
                type="datetime-local"
                value={taskForm.clientDeadline}
                onChange={(e) => setTaskForm((f) => ({ ...f, clientDeadline: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTask}>Create task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
