import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { fetchProjectRooms } from "@/modules/admin/api/room-collab.api";
import { fetchProjectSchedule } from "@/modules/admin/api/schedule.api";

export default function VariationLinksPanel({ projectId, links, onChange, disabled = false }) {
  const [rooms, setRooms] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      fetchProjectRooms(projectId).catch(() => []),
      fetchProjectSchedule(projectId).catch(() => null),
    ]).then(([roomList, schedule]) => {
      setRooms(Array.isArray(roomList) ? roomList : []);
      setActivities(schedule?.activities || schedule?.scheduleActivities || []);
    });
  }, [projectId]);

  const selected = (type, id) => links.some((link) =>
    link.linkType === type && String(type === "ROOM" ? link.roomId : link.activityUuid) === String(id)
  );
  const toggle = (type, id) => {
    if (selected(type, id)) {
      onChange(links.filter((link) => !(link.linkType === type &&
        String(type === "ROOM" ? link.roomId : link.activityUuid) === String(id))));
    } else {
      onChange([...links, type === "ROOM"
        ? { linkType: "ROOM", roomId: id }
        : { linkType: "ACTIVITY", activityUuid: id }]);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label>Linked rooms</Label>
        <div className="mt-2 max-h-44 space-y-1 overflow-auto rounded-md border p-2">
          {rooms.length === 0 && <p className="text-xs text-muted-foreground">No project rooms available.</p>}
          {rooms.map((room) => (
            <label key={room.uuid} className="flex cursor-pointer items-center gap-2 rounded p-1 text-sm hover:bg-muted">
              <input type="checkbox" disabled={disabled} checked={selected("ROOM", room.uuid)} onChange={() => toggle("ROOM", room.uuid)} />
              <span>{room.floorLabel} · {room.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>Linked schedule activities</Label>
        <div className="mt-2 max-h-44 space-y-1 overflow-auto rounded-md border p-2">
          {activities.length === 0 && <p className="text-xs text-muted-foreground">No schedule activities available.</p>}
          {activities.map((activity) => {
            const id = activity.uuid || activity.id;
            return (
              <label key={id} className="flex cursor-pointer items-center gap-2 rounded p-1 text-sm hover:bg-muted">
                <input type="checkbox" disabled={disabled} checked={selected("ACTIVITY", id)} onChange={() => toggle("ACTIVITY", id)} />
                <span>{activity.name || activity.title || activity.activityName || id}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
