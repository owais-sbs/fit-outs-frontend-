import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROPERTY_TYPES,
  RENOVATION_CATALOG,
  countScopedItems,
  countScopedRooms,
  floorPresetsForType,
  itemsForCategory,
  normalizeRoomScopes,
  roomPresetsForType,
} from "../../data/renovationChecklist";

function emptyFloor(name = "") {
  return { floorName: name, rooms: [] };
}

function emptyRoom(name = "") {
  return { roomName: name, selections: [] };
}

function findFloorIndex(floors, floorName) {
  const key = (floorName || "").trim().toLowerCase();
  return floors.findIndex((f) => (f.floorName || "").trim().toLowerCase() === key);
}

function findRoomIndex(floor, roomName) {
  const key = (roomName || "").trim().toLowerCase();
  return (floor?.rooms || []).findIndex((r) => (r.roomName || "").trim().toLowerCase() === key);
}

export default function RoomChecklistScopeBuilder({
  propertyType,
  propertyTypeCustom = "",
  roomScopes = [],
  onPropertyTypeChange,
  onPropertyTypeCustomChange,
  onRoomScopesChange,
  disabled = false,
  showPropertyType = true,
}) {
  const floors = useMemo(() => normalizeRoomScopes(roomScopes), [roomScopes]);
  const floorPresets = useMemo(() => floorPresetsForType(propertyType), [propertyType]);
  const roomPresets = useMemo(() => roomPresetsForType(propertyType), [propertyType]);

  const [activeFloor, setActiveFloor] = useState("");
  const [activeRoom, setActiveRoom] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [customFloor, setCustomFloor] = useState("");
  const [customRoom, setCustomRoom] = useState("");
  const [expandedFloors, setExpandedFloors] = useState({});

  const itemCount = countScopedItems(floors);
  const roomCount = countScopedRooms(floors);

  const updateScopes = (next) => {
    if (disabled) return;
    onRoomScopesChange(normalizeRoomScopes(next));
  };

  const ensureFloorRoom = (floorName, roomName, base = floors) => {
    const fName = (floorName || "").trim();
    const rName = (roomName || "").trim();
    if (!fName || !rName) return { next: base, floorIndex: -1, roomIndex: -1 };

    let next = base.map((f) => ({ ...f, rooms: [...(f.rooms || [])] }));
    let floorIndex = findFloorIndex(next, fName);
    if (floorIndex === -1) {
      next = [...next, emptyFloor(fName)];
      floorIndex = next.length - 1;
    }
    let roomIndex = findRoomIndex(next[floorIndex], rName);
    if (roomIndex === -1) {
      next[floorIndex] = {
        ...next[floorIndex],
        rooms: [...(next[floorIndex].rooms || []), emptyRoom(rName)],
      };
      roomIndex = next[floorIndex].rooms.length - 1;
    }
    return { next, floorIndex, roomIndex };
  };

  const selectFloor = (name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    setActiveFloor(trimmed);
    setActiveRoom("");
    setActiveCategory("");
    setCustomFloor("");
    if (findFloorIndex(floors, trimmed) === -1) {
      updateScopes([...floors, emptyFloor(trimmed)]);
    }
    setExpandedFloors((current) => ({ ...current, [trimmed]: true }));
  };

  const selectRoom = (name) => {
    const trimmed = (name || "").trim();
    if (!trimmed || !activeFloor) return;
    setActiveRoom(trimmed);
    setActiveCategory("");
    setCustomRoom("");
    const { next } = ensureFloorRoom(activeFloor, trimmed);
    updateScopes(next);
    setExpandedFloors((current) => ({ ...current, [activeFloor]: true }));
  };

  const selectCategory = (category) => {
    if (!category || !activeFloor || !activeRoom) return;
    setActiveCategory(category);
    const { next, floorIndex, roomIndex } = ensureFloorRoom(activeFloor, activeRoom);
    if (floorIndex < 0 || roomIndex < 0) return;
    const room = next[floorIndex].rooms[roomIndex];
    if (!(room.selections || []).some((s) => s.category === category)) {
      next[floorIndex].rooms[roomIndex] = {
        ...room,
        selections: [...(room.selections || []), { category, items: [] }],
      };
      updateScopes(next);
    }
  };

  const activeSelectionItems = useMemo(() => {
    if (!activeFloor || !activeRoom || !activeCategory) return [];
    const floor = floors[findFloorIndex(floors, activeFloor)];
    const room = floor?.rooms?.[findRoomIndex(floor, activeRoom)];
    const selection = (room?.selections || []).find((s) => s.category === activeCategory);
    return selection?.items || [];
  }, [floors, activeFloor, activeRoom, activeCategory]);

  const toggleItem = (item) => {
    if (!activeFloor || !activeRoom || !activeCategory) return;
    const { next, floorIndex, roomIndex } = ensureFloorRoom(activeFloor, activeRoom);
    if (floorIndex < 0 || roomIndex < 0) return;
    const room = next[floorIndex].rooms[roomIndex];
    let selections = [...(room.selections || [])];
    let selIndex = selections.findIndex((s) => s.category === activeCategory);
    if (selIndex === -1) {
      selections.push({ category: activeCategory, items: [item] });
    } else {
      const items = selections[selIndex].items || [];
      const nextItems = items.includes(item)
        ? items.filter((x) => x !== item)
        : [...items, item];
      selections[selIndex] = { ...selections[selIndex], items: nextItems };
      if (nextItems.length === 0) {
        selections = selections.filter((_, i) => i !== selIndex);
      }
    }
    next[floorIndex].rooms[roomIndex] = { ...room, selections };
    updateScopes(next);
  };

  const selectAllItems = () => {
    if (!activeFloor || !activeRoom || !activeCategory) return;
    const catalogItems = itemsForCategory(activeCategory);
    const { next, floorIndex, roomIndex } = ensureFloorRoom(activeFloor, activeRoom);
    if (floorIndex < 0 || roomIndex < 0) return;
    const room = next[floorIndex].rooms[roomIndex];
    let selections = [...(room.selections || [])];
    const selIndex = selections.findIndex((s) => s.category === activeCategory);
    if (selIndex === -1) {
      selections.push({ category: activeCategory, items: catalogItems });
    } else {
      selections[selIndex] = { ...selections[selIndex], items: catalogItems };
    }
    next[floorIndex].rooms[roomIndex] = { ...room, selections };
    updateScopes(next);
  };

  const clearCategoryItems = () => {
    if (!activeFloor || !activeRoom || !activeCategory) return;
    const { next, floorIndex, roomIndex } = ensureFloorRoom(activeFloor, activeRoom);
    if (floorIndex < 0 || roomIndex < 0) return;
    const room = next[floorIndex].rooms[roomIndex];
    next[floorIndex].rooms[roomIndex] = {
      ...room,
      selections: (room.selections || []).filter((s) => s.category !== activeCategory),
    };
    updateScopes(next);
  };

  const removeFloor = (floorName) => {
    updateScopes(floors.filter((f) => f.floorName !== floorName));
    if (activeFloor === floorName) {
      setActiveFloor("");
      setActiveRoom("");
      setActiveCategory("");
    }
  };

  const removeRoom = (floorName, roomName) => {
    updateScopes(
      floors.map((floor) =>
        floor.floorName === floorName
          ? { ...floor, rooms: (floor.rooms || []).filter((r) => r.roomName !== roomName) }
          : floor
      )
    );
    if (activeFloor === floorName && activeRoom === roomName) {
      setActiveRoom("");
      setActiveCategory("");
    }
  };

  const focusRoom = (floorName, roomName) => {
    setActiveFloor(floorName);
    setActiveRoom(roomName);
    setActiveCategory("");
    setExpandedFloors((current) => ({ ...current, [floorName]: true }));
  };

  const quickResidentialLayout = () => {
    if (disabled) return;
    const layout = [
      {
        floorName: "Ground Floor",
        rooms: ["Living Room", "Kitchen", "Powder Room", "Dining"].map(emptyRoom),
      },
      {
        floorName: "First Floor",
        rooms: ["Master Bedroom", "Bedroom", "Master Bathroom", "Bathroom 1"].map(emptyRoom),
      },
    ];
    const merged = [...floors];
    layout.forEach((floor) => {
      let idx = findFloorIndex(merged, floor.floorName);
      if (idx === -1) {
        merged.push(emptyFloor(floor.floorName));
        idx = merged.length - 1;
      }
      floor.rooms.forEach((room) => {
        if (findRoomIndex(merged[idx], room.roomName) === -1) {
          merged[idx] = {
            ...merged[idx],
            rooms: [...(merged[idx].rooms || []), room],
          };
        }
      });
    });
    updateScopes(merged);
    setActiveFloor("Ground Floor");
    setActiveRoom("Living Room");
    setActiveCategory("");
    setExpandedFloors({ "Ground Floor": true, "First Floor": true });
  };

  const floorOptions = useMemo(() => {
    const names = new Set([
      ...floorPresets,
      ...floors.map((f) => f.floorName).filter(Boolean),
    ]);
    return [...names];
  }, [floorPresets, floors]);

  const roomOptions = useMemo(() => {
    const floor = floors[findFloorIndex(floors, activeFloor)];
    const names = new Set([
      ...roomPresets,
      ...((floor?.rooms || []).map((r) => r.roomName).filter(Boolean)),
    ]);
    return [...names];
  }, [roomPresets, floors, activeFloor]);

  const catalogItems = activeCategory ? itemsForCategory(activeCategory) : [];
  const canPickItems = Boolean(activeFloor && activeRoom && activeCategory);

  return (
    <div className="space-y-4 md:col-span-2">
      {showPropertyType ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Property type *</Label>
            <Badge variant="secondary">
              {floors.length} floor{floors.length === 1 ? "" : "s"} · {roomCount} room
              {roomCount === 1 ? "" : "s"} · {itemCount} item{itemCount === 1 ? "" : "s"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((type) => {
              const active = propertyType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPropertyTypeChange?.(type.value)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-all ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
          {propertyType === "CUSTOM" ? (
            <Input
              value={propertyTypeCustom}
              disabled={disabled}
              onChange={(e) => onPropertyTypeCustomChange?.(e.target.value)}
              placeholder="e.g. Warehouse, Mixed-use villa"
              className="max-w-md"
            />
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border border-border/70 bg-muted/10 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Label>Quick add</Label>
            <p className="text-xs text-muted-foreground">
              Pick floor → room → category → tap items. Changes save as you click.
            </p>
          </div>
          {propertyType === "RESIDENTIAL" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={quickResidentialLayout}
            >
              Typical villa layout
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">1. Floor</Label>
            <Select
              value={activeFloor || undefined}
              disabled={disabled}
              onValueChange={selectFloor}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select floor" />
              </SelectTrigger>
              <SelectContent>
                {floorOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                value={customFloor}
                disabled={disabled}
                placeholder="Or type floor…"
                onChange={(e) => setCustomFloor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    selectFloor(customFloor);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={disabled || !customFloor.trim()}
                onClick={() => selectFloor(customFloor)}
                aria-label="Add floor"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">2. Room</Label>
            <Select
              value={activeRoom || undefined}
              disabled={disabled || !activeFloor}
              onValueChange={selectRoom}
            >
              <SelectTrigger>
                <SelectValue placeholder={activeFloor ? "Select room" : "Pick floor first"} />
              </SelectTrigger>
              <SelectContent>
                {roomOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                value={customRoom}
                disabled={disabled || !activeFloor}
                placeholder="Or type room…"
                onChange={(e) => setCustomRoom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    selectRoom(customRoom);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={disabled || !activeFloor || !customRoom.trim()}
                onClick={() => selectRoom(customRoom)}
                aria-label="Add room"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">3. Category</Label>
            <Select
              value={activeCategory || undefined}
              disabled={disabled || !activeFloor || !activeRoom}
              onValueChange={selectCategory}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    activeFloor && activeRoom ? "Select category" : "Pick room first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {RENOVATION_CATALOG.map((entry) => (
                  <SelectItem key={entry.category} value={entry.category}>
                    {entry.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canPickItems ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={disabled}
                  onClick={selectAllItems}
                >
                  Select all items
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || activeSelectionItems.length === 0}
                  onClick={clearCategoryItems}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pt-1">Items appear after category.</p>
            )}
          </div>
        </div>

        {canPickItems ? (
          <div className="space-y-2 border-t border-border/50 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {activeFloor} · {activeRoom} · {activeCategory}
              </p>
              <Badge variant="outline">{activeSelectionItems.length} selected</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {catalogItems.map((item) => {
                const active = activeSelectionItems.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleItem(item)}
                    className={`rounded-full border px-2.5 py-1 text-left text-xs transition-all ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Selected scope</Label>
        {floors.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
            Nothing selected yet. Use Quick add above — start with a floor, then a room.
          </div>
        ) : (
          <div className="space-y-2">
            {floors.map((floor) => {
              const open = expandedFloors[floor.floorName] !== false;
              const floorItems = countScopedItems([floor]);
              return (
                <div
                  key={floor.floorName}
                  className="rounded-lg border border-border/60 bg-background overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
                      onClick={() =>
                        setExpandedFloors((current) => ({
                          ...current,
                          [floor.floorName]: !open,
                        }))
                      }
                    >
                      {open ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{floor.floorName}</span>
                      <Badge variant="secondary" className="ml-1">
                        {(floor.rooms || []).length} rooms · {floorItems} items
                      </Badge>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      onClick={() => removeFloor(floor.floorName)}
                      aria-label={`Remove ${floor.floorName}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {open ? (
                    <div className="divide-y divide-border/50">
                      {(floor.rooms || []).length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          No rooms yet — pick a room in Quick add.
                        </p>
                      ) : (
                        (floor.rooms || []).map((room) => {
                          const roomItemCount = (room.selections || []).reduce(
                            (sum, sel) => sum + (sel.items?.length || 0),
                            0
                          );
                          const isActive =
                            activeFloor === floor.floorName && activeRoom === room.roomName;
                          return (
                            <div
                              key={room.roomName}
                              className={`px-3 py-2 ${isActive ? "bg-primary/5" : ""}`}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  className="text-sm font-medium hover:text-primary"
                                  onClick={() => focusRoom(floor.floorName, room.roomName)}
                                >
                                  {room.roomName}
                                </button>
                                <Badge variant="outline" className="text-[10px]">
                                  {roomItemCount} items
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  disabled={disabled}
                                  onClick={() => focusRoom(floor.floorName, room.roomName)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="ml-auto h-7 w-7"
                                  disabled={disabled}
                                  onClick={() => removeRoom(floor.floorName, room.roomName)}
                                  aria-label={`Remove ${room.roomName}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                              {(room.selections || []).length > 0 ? (
                                <div className="mt-2 space-y-2">
                                  {(room.selections || []).map((sel) => (
                                    <div
                                      key={sel.category}
                                      className="rounded-md border border-border/40 bg-muted/20 px-2.5 py-2"
                                    >
                                      <p className="text-xs font-medium text-foreground">
                                        {sel.category}
                                        <span className="ml-1 font-normal text-muted-foreground">
                                          ({(sel.items || []).length})
                                        </span>
                                      </p>
                                      {(sel.items || []).length > 0 ? (
                                        <ul className="mt-1.5 space-y-0.5">
                                          {(sel.items || []).map((item) => (
                                            <li
                                              key={item}
                                              className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                            >
                                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
                                              <span>{item}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          No items selected
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  No categories yet — choose a category in Quick add.
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
