import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, ChevronRight, Building2, Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBoq } from "../BoqEngine";
import { fetchRoomTypes, fetchRoomTypeById } from "@/modules/admin/api/room-type.api";
import {
  buildSelectionsFromWorkItems,
  recalcSelection,
  roomSurveyTotal,
  formatCurrency,
  unitLabel,
} from "../quantityCalcUtils";

const FLOOR_PRESETS = ["Ground Floor", "First Floor", "Second Floor", "Basement", "Roof"];

function uid() {
  return `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function groupSelectionsByMaster(selections = []) {
  const groups = {};
  selections.forEach((sel) => {
    const key = sel.workItemMasterName || "Other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(sel);
  });
  return groups;
}

function RoomSurveyCard({ room, floorName, roomTypes, onUpdate, onRemove }) {
  const [loadingItems, setLoadingItems] = useState(false);
  const roomDimensions = useMemo(
    () => ({
      length: room.length,
      width: room.width,
      height: room.height,
    }),
    [room.length, room.width, room.height]
  );

  const total = roomSurveyTotal(room.selections);

  const loadWorkItemsForType = useCallback(async (roomTypeId, existingRoom = room) => {
    if (!roomTypeId) return;
    setLoadingItems(true);
    try {
      const detail = await fetchRoomTypeById(roomTypeId);
      const dims = {
        length: existingRoom.length,
        width: existingRoom.width,
        height: existingRoom.height,
      };
      const selections = buildSelectionsFromWorkItems(
        detail.workItems || [],
        dims,
        existingRoom.selections
      );
      onUpdate({
        ...existingRoom,
        roomTypeId,
        roomTypeName: detail.roomTypeName,
        name: existingRoom.name || detail.roomTypeName,
        selections,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingItems(false);
    }
  }, [onUpdate, room]);

  const handleTypeChange = (roomTypeId) => {
    const rt = roomTypes.find((r) => r.id === roomTypeId);
    loadWorkItemsForType(roomTypeId, {
      ...room,
      roomTypeId,
      roomTypeName: rt?.roomTypeName || "",
      name: rt?.roomTypeName || room.name,
      selections: [],
    });
  };

  const patchDimensions = (field, value) => {
    const next = { ...room, [field]: value };
    const selections = (next.selections || []).map((sel) => {
      if (sel.dimensionSource === "custom") return sel;
      return recalcSelection(sel, {
        length: next.length,
        width: next.width,
        height: next.height,
      });
    });
    onUpdate({ ...next, selections });
  };

  const updateSelection = (workItemId, updater) => {
    const selections = (room.selections || []).map((sel) => {
      if (sel.workItemId !== workItemId) return sel;
      const next = updater(sel);
      return recalcSelection(next, roomDimensions);
    });
    onUpdate({ ...room, selections });
  };

  const toggleSelection = (workItemId, checked) => {
    updateSelection(workItemId, (sel) => ({ ...sel, selected: checked }));
  };

  const setDimensionSource = (workItemId, source) => {
    updateSelection(workItemId, (sel) => {
      if (source === "custom") {
        return {
          ...sel,
          dimensionSource: "custom",
          customLength: sel.customLength || room.length || "",
          customWidth: sel.customWidth || room.width || "",
          customHeight: sel.customHeight || room.height || "",
        };
      }
      return { ...sel, dimensionSource: "room" };
    });
  };

  const patchCustomDimension = (workItemId, field, value) => {
    updateSelection(workItemId, (sel) => ({ ...sel, [field]: value }));
  };

  const grouped = groupSelectionsByMaster(room.selections);

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base font-semibold">
              {room.name || room.roomTypeName || "Room"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{floorName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono tabular-nums">
              {formatCurrency(total)}
            </Badge>
            <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Room type</Label>
            <Select value={room.roomTypeId || ""} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.roomMasterName ? `${rt.roomMasterName} — ` : ""}{rt.roomTypeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Display name (optional)</Label>
            <Input
              value={room.name || ""}
              placeholder={room.roomTypeName || "Room name"}
              onChange={(e) => onUpdate({ ...room, name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Length (m)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={room.length ?? ""}
              onChange={(e) => patchDimensions("length", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Width (m)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={room.width ?? ""}
              onChange={(e) => patchDimensions("width", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Height (m)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={room.height ?? ""}
              placeholder="3.0"
              onChange={(e) => patchDimensions("height", e.target.value)}
            />
          </div>
        </div>

        {loadingItems && (
          <p className="text-xs text-muted-foreground">Loading work items…</p>
        )}

        {!loadingItems && room.roomTypeId && (!room.selections || room.selections.length === 0) && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
            No work items assigned to this room type. Configure them in Project Configuration → Room.
          </p>
        )}

        {Object.entries(grouped).map(([masterName, items]) => (
          <div key={masterName} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{masterName}</p>
            <div className="space-y-1.5">
              {items.map((sel) => (
                <div
                  key={sel.workItemId}
                  className="rounded-md border px-3 py-2 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={!!sel.selected}
                      onCheckedChange={(checked) => toggleSelection(sel.workItemId, !!checked)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sel.workItemName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {sel.quantity} {unitLabel(sel.unitType)} × {formatCurrency(sel.defaultRate)}
                        {sel.dimensionSource === "custom" && (
                          <span className="ml-1 text-amber-700">· custom dims</span>
                        )}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      {sel.selected ? formatCurrency(sel.amount) : "—"}
                    </span>
                  </div>

                  <div className="mt-2 ml-7 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Dimensions
                      </span>
                      <div className="flex rounded-md border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setDimensionSource(sel.workItemId, "room")}
                          className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            sel.dimensionSource !== "custom"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted/60"
                          }`}
                        >
                          Use room
                        </button>
                        <button
                          type="button"
                          onClick={() => setDimensionSource(sel.workItemId, "custom")}
                          className={`px-2.5 py-1 text-[11px] font-medium border-l transition-colors ${
                            sel.dimensionSource === "custom"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted/60"
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                      {sel.dimensionSource !== "custom" && (
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {room.length || "—"} × {room.width || "—"} × {room.height || "—"} m
                        </span>
                      )}
                    </div>

                    {sel.dimensionSource === "custom" && (
                      <div className="grid grid-cols-3 gap-2 max-w-xs">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">L (m)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-8 text-xs"
                            value={sel.customLength ?? ""}
                            onChange={(e) => patchCustomDimension(sel.workItemId, "customLength", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">W (m)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-8 text-xs"
                            value={sel.customWidth ?? ""}
                            onChange={(e) => patchCustomDimension(sel.workItemId, "customWidth", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">H (m)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-8 text-xs"
                            value={sel.customHeight ?? ""}
                            onChange={(e) => patchCustomDimension(sel.workItemId, "customHeight", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function Step02SurveyRooms() {
  const { floors, setFloors, rooms, setRooms, prevStep, nextStep } = useBoq();
  const [roomTypes, setRoomTypes] = useState([]);
  const [activeFloorId, setActiveFloorId] = useState(floors[0]?.id || null);
  const [newFloorName, setNewFloorName] = useState("");

  useEffect(() => {
    fetchRoomTypes({}, 0, 200)
      .then((res) => {
        const list = res?.content ?? res?.items ?? (Array.isArray(res) ? res : []);
        setRoomTypes(list.filter((r) => r.active !== false));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeFloorId && floors.length > 0) {
      setActiveFloorId(floors[0].id);
    }
  }, [floors, activeFloorId]);

  const activeFloor = floors.find((f) => f.id === activeFloorId);
  const floorRooms = rooms.filter((r) => String(r.floorId) === String(activeFloorId));

  const projectTotal = useMemo(
    () => rooms.reduce((sum, r) => sum + roomSurveyTotal(r.selections), 0),
    [rooms]
  );

  const addFloor = (name) => {
    const trimmed = (name || newFloorName).trim();
    if (!trimmed) return;
    const id = `floor-${Date.now()}`;
    setFloors((prev) => [...prev, { id, name: trimmed }]);
    setActiveFloorId(id);
    setNewFloorName("");
  };

  const addRoom = () => {
    if (!activeFloorId) return;
    const id = uid();
    setRooms((prev) => [
      ...prev,
      {
        id,
        floorId: activeFloorId,
        roomTypeId: "",
        roomTypeName: "",
        name: "",
        length: "",
        width: "",
        height: "3",
        selections: [],
      },
    ]);
  };

  const updateRoom = (roomId, patch) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, ...patch } : r)));
  };

  const removeRoom = (roomId) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  };

  const canContinue = rooms.length > 0 && rooms.some((r) =>
    (r.selections || []).some((s) => s.selected)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Survey Rooms</h2>
          <p className="text-sm text-muted-foreground">
            Pick room type, enter dimensions, tick applicable work items — prices calculate automatically.
          </p>
        </div>
        <Badge variant="outline" className="font-mono tabular-nums self-start">
          Project total: {formatCurrency(projectTotal)}
        </Badge>
      </div>

      {/* Floors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Floors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {floors.map((floor) => (
              <Button
                key={floor.id}
                type="button"
                size="sm"
                variant={floor.id === activeFloorId ? "default" : "outline"}
                onClick={() => setActiveFloorId(floor.id)}
              >
                {floor.name}
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                  {rooms.filter((r) => r.floorId === floor.id).length}
                </Badge>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {FLOOR_PRESETS.filter((p) => !floors.some((f) => f.name === p)).map((preset) => (
              <Button key={preset} type="button" size="sm" variant="ghost" className="text-xs" onClick={() => addFloor(preset)}>
                + {preset}
              </Button>
            ))}
            <div className="flex gap-2 items-center ml-auto">
              <Input
                className="h-8 w-40 text-sm"
                placeholder="Custom floor"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFloor()}
              />
              <Button type="button" size="sm" variant="outline" onClick={() => addFloor()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rooms on active floor */}
      {activeFloor && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{activeFloor.name}</h3>
            <Button type="button" size="sm" onClick={addRoom}>
              <Plus className="h-4 w-4 mr-1" /> Add Room
            </Button>
          </div>

          {floorRooms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No rooms on this floor yet. Click &quot;Add Room&quot; to start surveying.
              </CardContent>
            </Card>
          ) : (
            floorRooms.map((room) => (
              <RoomSurveyCard
                key={room.id}
                room={room}
                floorName={activeFloor.name}
                roomTypes={roomTypes}
                onUpdate={(patch) => updateRoom(room.id, patch)}
                onRemove={() => removeRoom(room.id)}
              />
            ))
          )}
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={prevStep}>
          ← Back
        </Button>
        <Button
          type="button"
          onClick={() => {
            nextStep();
          }}
          disabled={!canContinue}
          className="gap-1"
        >
          Generate BOQ Draft
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!canContinue && rooms.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Add at least one room with a selected work item to continue.
        </p>
      )}
    </div>
  );
}
