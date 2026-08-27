import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fetchRoomTypes, fetchRoomTypeById } from "../../api/room-type.api";
import { computeSubtotal, flattenSurveyToEstimateLines, surveyShellFromEstimateLines } from "../../api/site-visit-estimate.api";
import { formatEstimateAmount } from "../../data/jctCoverLetterCopy";
import AppendixPicker from "./AppendixPicker";
import { countScopedItems, normalizeRoomScopes } from "../../data/renovationChecklist";
import {
  buildSelectionsFromWorkItems,
  calcLineAmount,
  formatCurrency,
  recalcSelection,
  roomSurveyTotal,
  unitLabel,
} from "../../pages/boq/quantityCalcUtils";

const FLOOR_PRESETS = ["Ground Floor", "First Floor", "Second Floor", "Basement", "Roof"];

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

function applySavedLinesToSelections(selections, savedLines = []) {
  const byWorkItem = new Map(
    savedLines.filter((l) => l.workItemId).map((l) => [String(l.workItemId), l])
  );
  return selections.map((sel) => {
    const saved = byWorkItem.get(String(sel.workItemId));
    if (!saved) return sel;
    const quantity = Number(saved.qty) || sel.quantity || 1;
    const defaultRate = Number(saved.rate) || sel.defaultRate || 0;
    return {
      ...sel,
      selected: true,
      quantity,
      defaultRate,
      amount: calcLineAmount(quantity, defaultRate),
      qtyLocked: true,
    };
  });
}

function matchesWorkItemSearch(sel, query) {
  const haystack = [
    sel.workItemName,
    sel.workItemMasterName,
    unitLabel(sel.unitType),
    formatCurrency(sel.defaultRate),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function WorkItemRow({ sel, disabled, onUpdateSelection }) {
  return (
    <div className="rounded-md border border-border/70 bg-background px-3 py-2 hover:bg-muted/30">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={!!sel.selected}
          disabled={disabled}
          className="mt-1"
          onCheckedChange={(checked) =>
            onUpdateSelection(sel.workItemId, (s) => ({
              ...s,
              selected: !!checked,
            }))
          }
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">{sel.workItemName}</p>
              <p className="text-[11px] text-muted-foreground">
                {unitLabel(sel.unitType)} · list rate {formatCurrency(sel.defaultRate)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {sel.selected ? formatCurrency(sel.amount) : "—"}
            </span>
          </div>
          {sel.selected && (
            <div className="grid max-w-sm grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Qty</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-8 text-xs"
                  disabled={disabled}
                  value={sel.quantity}
                  onChange={(e) =>
                    onUpdateSelection(sel.workItemId, (s) => ({
                      ...s,
                      quantity: e.target.value,
                      qtyLocked: true,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Rate</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-8 text-xs"
                  disabled={disabled}
                  value={sel.defaultRate}
                  onChange={(e) =>
                    onUpdateSelection(sel.workItemId, (s) => ({
                      ...s,
                      defaultRate: e.target.value,
                      qtyLocked: true,
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoomBoqCard({ room, floorName, roomTypes, disabled, onUpdate, onRemove }) {
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const roomDimensions = useMemo(
    () => ({ length: room.length, width: room.width, height: room.height }),
    [room.length, room.width, room.height]
  );
  const total = roomSurveyTotal(room.selections);

  const loadWorkItemsForType = useCallback(
    async (roomTypeId, existingRoom = room) => {
      if (!roomTypeId) return;
      setLoadingItems(true);
      try {
        const detail = await fetchRoomTypeById(roomTypeId);
        const dims = {
          length: existingRoom.length,
          width: existingRoom.width,
          height: existingRoom.height,
        };
        let selections = buildSelectionsFromWorkItems(
          detail.workItems || [],
          dims,
          existingRoom.selections
        );
        if (existingRoom.savedLines?.length) {
          selections = applySavedLinesToSelections(selections, existingRoom.savedLines);
        }
        onUpdate({
          ...existingRoom,
          roomTypeId,
          roomTypeName: detail.roomTypeName,
          name: existingRoom.name || detail.roomTypeName,
          selections,
          savedLines: undefined,
          workItemsLoaded: true,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingItems(false);
      }
    },
    [onUpdate, room]
  );

  useEffect(() => {
    if (
      room.roomTypeId &&
      !room.workItemsLoaded &&
      (!room.selections || room.selections.length === 0) &&
      !loadingItems
    ) {
      loadWorkItemsForType(room.roomTypeId, room);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once when room type set from saved lines
  }, [room.roomTypeId, room.workItemsLoaded]);

  const handleTypeChange = (roomTypeId) => {
    if (disabled) return;
    setItemSearch("");
    setActiveCategory("");
    const rt = roomTypes.find((r) => r.id === roomTypeId);
    loadWorkItemsForType(roomTypeId, {
      ...room,
      roomTypeId,
      roomTypeName: rt?.roomTypeName || "",
      name: room.name || rt?.roomTypeName || "",
      selections: [],
      savedLines: undefined,
      workItemsLoaded: false,
    });
  };

  const patchDimensions = (field, value) => {
    if (disabled) return;
    const next = { ...room, [field]: value };
    const selections = (next.selections || []).map((sel) => {
      if (sel.qtyLocked || sel.dimensionSource === "custom") {
        return {
          ...sel,
          amount: sel.selected ? calcLineAmount(sel.quantity, sel.defaultRate) : 0,
        };
      }
      return recalcSelection(sel, {
        length: next.length,
        width: next.width,
        height: next.height,
      });
    });
    onUpdate({ ...next, selections });
  };

  const updateSelection = (workItemId, updater) => {
    if (disabled) return;
    const selections = (room.selections || []).map((sel) => {
      if (sel.workItemId !== workItemId) return sel;
      const next = updater(sel);
      if (next.qtyLocked) {
        return {
          ...next,
          amount: next.selected ? calcLineAmount(next.quantity, next.defaultRate) : 0,
        };
      }
      return recalcSelection(next, roomDimensions);
    });
    onUpdate({ ...room, selections });
  };

  const allSelections = useMemo(() => room.selections || [], [room.selections]);
  const totalSelectable = allSelections.length;

  const masterCategories = useMemo(() => {
    const counts = new Map();
    allSelections.forEach((sel) => {
      const name = sel.workItemMasterName || "Other";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [allSelections]);

  const selectedItems = useMemo(
    () => allSelections.filter((sel) => sel.selected),
    [allSelections]
  );

  const browseActive = Boolean(itemSearch.trim() || activeCategory);
  const searchQuery = itemSearch.trim().toLowerCase();

  const browseItems = useMemo(() => {
    if (!browseActive) return [];
    return allSelections.filter((sel) => {
      if (sel.selected) return false;
      const category = sel.workItemMasterName || "Other";
      if (activeCategory && category !== activeCategory) return false;
      if (searchQuery && !matchesWorkItemSearch(sel, searchQuery)) return false;
      return true;
    });
  }, [allSelections, browseActive, activeCategory, searchQuery]);

  const groupedBrowse = groupSelectionsByMaster(browseItems);

  const clearBrowse = () => {
    setItemSearch("");
    setActiveCategory("");
  };

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
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Room type</Label>
            <Select
              value={room.roomTypeId || ""}
              onValueChange={handleTypeChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.roomMasterName ? `${rt.roomMasterName} — ` : ""}
                    {rt.roomTypeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Display name</Label>
            <Input
              value={room.name || ""}
              disabled={disabled}
              placeholder={room.roomTypeName || "Room name"}
              onChange={(e) => onUpdate({ ...room, name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["length", "width", "height"].map((field) => (
            <div key={field} className="space-y-1.5">
              <Label className="text-xs capitalize">{field} (m)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                disabled={disabled}
                value={room[field] ?? ""}
                placeholder={field === "height" ? "3.0" : undefined}
                onChange={(e) => patchDimensions(field, e.target.value)}
              />
            </div>
          ))}
        </div>

        {loadingItems && (
          <p className="text-xs text-muted-foreground">Loading work items…</p>
        )}

        {!loadingItems && room.roomTypeId && (!room.selections || room.selections.length === 0) && (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
            No work items on this room type. Configure them under Project Configuration → Room.
          </p>
        )}

        {!loadingItems && totalSelectable > 0 && (
          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Work items</p>
                <p className="text-[11px] text-muted-foreground">
                  {totalSelectable} items · pick a category or search to browse
                </p>
              </div>
              {selectedItems.length > 0 ? (
                <Badge variant="secondary">{selectedItems.length} selected</Badge>
              ) : null}
            </div>

            {selectedItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Selected for this room
                </p>
                <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {selectedItems.map((sel) => (
                    <WorkItemRow
                      key={sel.workItemId}
                      sel={sel}
                      disabled={disabled}
                      onUpdateSelection={updateSelection}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 border-t border-border/50 pt-3">
              <Label className="text-xs text-muted-foreground">Browse by category</Label>
              <div className="flex flex-wrap gap-1.5">
                {masterCategories.map(({ name, count }) => (
                  <button
                    key={name}
                    type="button"
                    disabled={disabled}
                    onClick={() => setActiveCategory((current) => (current === name ? "" : name))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-left text-[11px] font-medium transition-colors",
                      activeCategory === name
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {name}
                    <span className="ml-1 opacity-70">({count})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={itemSearch}
                disabled={disabled}
                placeholder="Or search by name, unit, rate…"
                className="h-9 pl-9 pr-9"
                onChange={(e) => setItemSearch(e.target.value)}
              />
              {browseActive && (
                <button
                  type="button"
                  aria-label="Clear browse filters"
                  disabled={disabled}
                  onClick={clearBrowse}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {!browseActive && (
              <p className="rounded-md border border-dashed border-border/60 bg-background px-3 py-4 text-center text-xs text-muted-foreground">
                Select a category above or type in the search box to show work items.
              </p>
            )}

            {browseActive && browseItems.length === 0 && (
              <p className="rounded-md border border-dashed border-border/60 py-4 text-center text-xs text-muted-foreground">
                No items match your filters.
              </p>
            )}

            {browseActive && browseItems.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  Showing {browseItems.length} item{browseItems.length === 1 ? "" : "s"}
                  {activeCategory ? ` in ${activeCategory}` : ""}
                  {searchQuery ? ` matching “${itemSearch.trim()}”` : ""}
                </p>
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {Object.entries(groupedBrowse).map(([masterName, items]) => (
                    <div key={masterName} className="space-y-1.5">
                      {!activeCategory && (
                        <p className="sticky top-0 z-10 bg-muted/10 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                          {masterName}
                        </p>
                      )}
                      {items.map((sel) => (
                        <WorkItemRow
                          key={sel.workItemId}
                          sel={sel}
                          disabled={disabled}
                          onUpdateSelection={updateSelection}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VisitDraftBoqEditor({
  estimate,
  roomScopes = [],
  onChange,
  disabled = false,
}) {
  const floorsFromScopes = normalizeRoomScopes(roomScopes);
  const scopedItemCount = countScopedItems(floorsFromScopes);
  const bootstrapped = useRef(false);

  const [floors, setFloors] = useState(() => [{ id: uid("floor"), name: "Ground Floor" }]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [activeFloorId, setActiveFloorId] = useState(null);
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
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const lines = Array.isArray(estimate?.lines) ? estimate.lines : [];
    if (lines.length > 0) {
      const shell = surveyShellFromEstimateLines(lines);
      setFloors(shell.floors.length ? shell.floors : [{ id: uid("floor"), name: "Ground Floor" }]);
      setRooms(shell.rooms);
      setActiveFloorId(shell.floors[0]?.id || null);
      return;
    }
    const id = uid("floor");
    setFloors([{ id, name: "Ground Floor" }]);
    setRooms([]);
    setActiveFloorId(id);
  }, [estimate?.uuid, estimate?.lines]);

  useEffect(() => {
    if (!activeFloorId && floors.length > 0) {
      setActiveFloorId(floors[0].id);
    }
  }, [floors, activeFloorId]);

  const syncEstimate = useCallback(
    (nextFloors, nextRooms) => {
      if (disabled) return;
      const lines = flattenSurveyToEstimateLines(nextFloors, nextRooms);
      onChange?.({
        ...estimate,
        lines,
        subtotal: computeSubtotal(lines),
      });
    },
    [disabled, estimate, onChange]
  );

  const updateRooms = (nextRooms) => {
    setRooms(nextRooms);
    syncEstimate(floors, nextRooms);
  };

  const updateFloors = (nextFloors) => {
    setFloors(nextFloors);
    syncEstimate(nextFloors, rooms);
  };

  const activeFloor = floors.find((f) => f.id === activeFloorId);
  const floorRooms = rooms.filter((r) => String(r.floorId) === String(activeFloorId));
  const projectTotal = useMemo(
    () => rooms.reduce((sum, r) => sum + roomSurveyTotal(r.selections), 0),
    [rooms]
  );

  const addFloor = (name) => {
    if (disabled) return;
    const trimmed = (name || newFloorName).trim();
    if (!trimmed) return;
    if (floors.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) return;
    const id = uid("floor");
    const next = [...floors, { id, name: trimmed }];
    updateFloors(next);
    setActiveFloorId(id);
    setNewFloorName("");
  };

  const removeFloor = (floorId) => {
    if (disabled) return;
    const nextFloors = floors.filter((f) => f.id !== floorId);
    const nextRooms = rooms.filter((r) => String(r.floorId) !== String(floorId));
    setFloors(nextFloors);
    setRooms(nextRooms);
    syncEstimate(nextFloors, nextRooms);
    if (activeFloorId === floorId) {
      setActiveFloorId(nextFloors[0]?.id || null);
    }
  };

  const addRoom = () => {
    if (disabled || !activeFloorId) return;
    const next = [
      ...rooms,
      {
        id: uid("room"),
        floorId: activeFloorId,
        name: "",
        roomTypeId: "",
        roomTypeName: "",
        length: "",
        width: "",
        height: "3",
        selections: [],
      },
    ];
    updateRooms(next);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.85fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Draft BoQ</h2>
            <p className="text-xs text-muted-foreground">
              Add floors and rooms, pick room types, select work items with selling rates. Not a
              finalized project BoQ.
            </p>
          </div>
          <Badge variant="secondary">
            {formatEstimateAmount(projectTotal, estimate?.currency || "AED")}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {floors.map((floor) => (
            <button
              key={floor.id}
              type="button"
              onClick={() => setActiveFloorId(floor.id)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-all ${
                activeFloorId === floor.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-background text-muted-foreground hover:border-primary/40"
              }`}
            >
              {floor.name}
            </button>
          ))}
        </div>

        {!disabled && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Add floor</Label>
              <Input
                value={newFloorName}
                placeholder="Floor name"
                className="h-9 w-44"
                onChange={(e) => setNewFloorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFloor();
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {FLOOR_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => addFloor(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
            {activeFloor && floors.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => removeFloor(activeFloor.id)}
              >
                Remove floor
              </Button>
            )}
          </div>
        )}

        {activeFloor ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{activeFloor.name} rooms</p>
              {!disabled && (
                <Button type="button" variant="outline" size="sm" onClick={addRoom}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add room
                </Button>
              )}
            </div>

            {floorRooms.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
                No rooms yet. Add a room and choose a room type to load work items.
              </p>
            ) : (
              floorRooms.map((room) => (
                <RoomBoqCard
                  key={room.id}
                  room={room}
                  floorName={activeFloor.name}
                  roomTypes={roomTypes}
                  disabled={disabled}
                  onUpdate={(nextRoom) => {
                    updateRooms(rooms.map((r) => (r.id === nextRoom.id ? nextRoom : r)));
                  }}
                  onRemove={() => updateRooms(rooms.filter((r) => r.id !== room.id))}
                />
              ))
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Add a floor to start the draft BoQ.</p>
        )}

        <div className="space-y-2">
          <Label>Internal notes</Label>
          <Textarea
            value={estimate?.notes || ""}
            disabled={disabled}
            rows={3}
            placeholder="Optional notes for the surveyor / QS"
            onChange={(e) => onChange?.({ ...estimate, notes: e.target.value })}
          />
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Draft BoQ total (excl. VAT)
          </p>
          <p className="text-lg font-semibold">
            {formatEstimateAmount(
              computeSubtotal(estimate?.lines || []),
              estimate?.currency || "AED"
            )}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Checklist reference</h3>
            <Badge variant="outline">{scopedItemCount} items</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Use the site-visit checklist as context while building the draft BoQ from real work
            items.
          </p>
          {floorsFromScopes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No room scope on this visit.</p>
          ) : (
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {floorsFromScopes.map((floor) => (
                <div
                  key={floor.floorName}
                  className="rounded-md border border-border/50 bg-background p-2.5"
                >
                  <p className="text-sm font-medium">{floor.floorName}</p>
                  <ul className="mt-1.5 space-y-1.5 text-xs text-muted-foreground">
                    {(floor.rooms || []).map((room) => (
                      <li key={`${floor.floorName}-${room.roomName}`}>
                        <span className="font-medium text-foreground">{room.roomName}</span>
                        {(room.selections || []).map((sel) => (
                          <div key={sel.category} className="ml-2 mt-0.5">
                            {sel.category}: {(sel.items || []).join(", ")}
                          </div>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Appendix selection</CardTitle>
        </CardHeader>
        <CardContent>
          <AppendixPicker
            selectedIds={estimate?.selectedAppendixIds || []}
            disabled={disabled}
            onChange={(ids, appendices) =>
              onChange?.({
                ...estimate,
                selectedAppendixIds: ids,
                selectedAppendices: appendices || [],
              })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
