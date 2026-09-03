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
import { computeSubtotal, flattenSurveyToEstimateLines, surveyShellFromEstimateLines, surveyShellFromRoomScopes, scopeItemsFromRoom, attachScopeMetadataToRooms, LINE_SOURCE } from "../../api/site-visit-estimate.api";
import { formatEstimateAmount } from "../../data/jctCoverLetterCopy";
import AppendixPicker from "./AppendixPicker";
import {
  countScopedItems,
  filterRoomScopesByReportYes,
  normalizeRoomScopes,
} from "../../data/renovationChecklist";
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
      lineSource: saved.lineSource || sel.lineSource || LINE_SOURCE.CATALOG,
      scopeRef: saved.scopeRef || sel.scopeRef || null,
      amount: calcLineAmount(quantity, defaultRate),
      qtyLocked: true,
    };
  });
}

function isCatalogWorkJob(sel) {
  return !sel?.isScopeChecklist && !sel?.isCustomScope && sel?.lineSource !== LINE_SOURCE.SITE_VISIT;
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

function WorkItemRow({ sel, disabled, onUpdateSelection, onRemove }) {
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
              lineSource: s.lineSource || (checked ? LINE_SOURCE.MANUAL : s.lineSource),
            }))
          }
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium leading-snug">{sel.workItemName}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[11px] text-muted-foreground">
                  {unitLabel(sel.unitType)} · rate {formatCurrency(sel.defaultRate)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="text-sm font-semibold tabular-nums">
                {sel.selected ? formatCurrency(sel.amount) : "—"}
              </span>
              {sel.selected && !disabled && onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => onRemove(sel.workItemId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
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

function BrowseWorkItemRow({ sel, disabled, pending, onToggle }) {
  return (
    <div className="rounded-md border border-border/70 bg-background px-3 py-2 hover:bg-muted/30">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={pending}
          disabled={disabled}
          className="mt-0.5"
          onCheckedChange={() => onToggle(sel.workItemId)}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">{sel.workItemName}</p>
          <p className="text-[11px] text-muted-foreground">
            {unitLabel(sel.unitType)} · rate {formatCurrency(sel.defaultRate)}
          </p>
        </div>
      </div>
    </div>
  );
}

function RoomBoqCard({
  room,
  floorName,
  roomTypes,
  disabled,
  onUpdate,
  onRemove,
}) {
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [showBrowse, setShowBrowse] = useState(false);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const roomDimensions = useMemo(
    () => ({ length: room.length, width: room.width, height: room.height }),
    [room.length, room.width, room.height]
  );
  const total = roomSurveyTotal((room.selections || []).filter(isCatalogWorkJob));

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
        selections = selections.filter(isCatalogWorkJob);
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
    setShowBrowse(false);
    setPendingIds(new Set());
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

  const allSelections = useMemo(
    () => (room.selections || []).filter(isCatalogWorkJob),
    [room.selections]
  );
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

  const browseActive = showBrowse || Boolean(itemSearch.trim() || activeCategory);
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

  const togglePending = (workItemId) => {
    if (disabled) return;
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(workItemId)) next.delete(workItemId);
      else next.add(workItemId);
      return next;
    });
  };

  const commitPendingSelections = () => {
    if (disabled || pendingIds.size === 0) return;
    const selections = (room.selections || []).map((sel) => {
      if (!pendingIds.has(sel.workItemId)) return sel;
      const withSelected = {
        ...sel,
        selected: true,
        lineSource: sel.lineSource || LINE_SOURCE.MANUAL,
      };
      if (withSelected.qtyLocked) {
        return {
          ...withSelected,
          amount: calcLineAmount(withSelected.quantity, withSelected.defaultRate),
        };
      }
      return recalcSelection(withSelected, roomDimensions);
    });
    onUpdate({ ...room, selections });
    setPendingIds(new Set());
    setItemSearch("");
    setActiveCategory("");
    setShowBrowse(false);
  };

  const clearBrowse = () => {
    setItemSearch("");
    setActiveCategory("");
    setShowBrowse(false);
    setPendingIds(new Set());
  };

  const removeWorkJob = (workItemId) => {
    updateSelection(workItemId, (s) => ({
      ...s,
      selected: false,
      lineSource: s.lineSource || LINE_SOURCE.MANUAL,
    }));
  };

  const unselectedCount = allSelections.filter((s) => !s.selected).length;

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
            {!disabled && !room.seededFromScope && onRemove && (
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
                <p className="text-sm font-medium">Work jobs</p>
                <p className="text-[11px] text-muted-foreground">
                  {totalSelectable} catalog items · use the checklist on the right for reference
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
                      onRemove={removeWorkJob}
                    />
                  ))}
                </div>
              </div>
            )}

            {!disabled && totalSelectable > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowBrowse(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add work job
                {unselectedCount > 0 ? ` (${unselectedCount} available)` : ""}
              </Button>
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
                        <BrowseWorkItemRow
                          key={sel.workItemId}
                          sel={sel}
                          disabled={disabled}
                          pending={pendingIds.has(sel.workItemId)}
                          onToggle={togglePending}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                {!disabled && (
                  <div className="sticky bottom-0 space-y-2 border-t border-border/50 bg-muted/10 pt-3">
                    {pendingIds.size > 0 ? (
                      <p className="text-center text-xs text-muted-foreground">
                        {pendingIds.size} selected — click Add to apply
                      </p>
                    ) : null}
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={clearBrowse}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={pendingIds.size === 0}
                        onClick={commitPendingSelections}
                      >
                        Add {pendingIds.size > 0 ? `${pendingIds.size} ` : ""}work job
                        {pendingIds.size === 1 ? "" : "s"}
                      </Button>
                    </div>
                  </div>
                )}
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
  reportItems = [],
  onChange,
  disabled = false,
}) {
  const floorsFromScopes = normalizeRoomScopes(roomScopes);
  const referenceFloorsFromScopes = useMemo(
    () => filterRoomScopesByReportYes(roomScopes, reportItems),
    [roomScopes, reportItems]
  );
  const scopedItemCount = countScopedItems(referenceFloorsFromScopes);
  const initKeyRef = useRef(null);
  const scopeHydrated = useRef(false);

  const [floors, setFloors] = useState(() => [{ id: uid("floor"), name: "Ground Floor" }]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [activeFloorId, setActiveFloorId] = useState(null);
  const [newFloorName, setNewFloorName] = useState("");
  const [seededFromScope, setSeededFromScope] = useState(false);

  useEffect(() => {
    initKeyRef.current = null;
    scopeHydrated.current = false;
  }, [estimate?.uuid]);

  useEffect(() => {
    fetchRoomTypes({}, 0, 200)
      .then((res) => {
        const list = res?.content ?? res?.items ?? (Array.isArray(res) ? res : []);
        setRoomTypes(list.filter((r) => r.active !== false));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const lines = Array.isArray(estimate?.lines) ? estimate.lines : [];
    if (lines.length > 0) {
      const key = `lines:${estimate?.uuid}:${lines.length}`;
      if (initKeyRef.current === key) return;
      initKeyRef.current = key;
      const shell = surveyShellFromEstimateLines(lines);
      const nextFloors = shell.floors.length
        ? shell.floors
        : [{ id: uid("floor"), name: "Ground Floor" }];
      const nextRooms =
        floorsFromScopes.length > 0 && roomTypes.length > 0
          ? attachScopeMetadataToRooms(
              shell.rooms,
              nextFloors,
              floorsFromScopes,
              roomTypes,
              reportItems
            )
          : shell.rooms;
      setFloors(nextFloors);
      setRooms(nextRooms);
      setActiveFloorId(nextFloors[0]?.id || null);
      setSeededFromScope(
        nextRooms.some(
          (r) =>
            r.seededFromScope ||
            scopeItemsFromRoom(r).length > 0 ||
            (Array.isArray(r.savedLines) && r.savedLines.length > 0)
        )
      );
      scopeHydrated.current = false;
      return;
    }

    if (floorsFromScopes.length > 0) {
      if (roomTypes.length === 0) return;
      const key = `scope:${estimate?.uuid}:${floorsFromScopes.length}:${roomTypes.length}`;
      if (initKeyRef.current === key) return;
      initKeyRef.current = key;
      const scopeShell = surveyShellFromRoomScopes(floorsFromScopes, roomTypes, reportItems);
      if (scopeShell.seededFromScope && scopeShell.floors.length > 0) {
        setFloors(scopeShell.floors);
        setRooms(scopeShell.rooms);
        setActiveFloorId(scopeShell.floors[0]?.id || null);
        setSeededFromScope(true);
        scopeHydrated.current = false;
        return;
      }
    }

    const key = `empty:${estimate?.uuid}`;
    if (initKeyRef.current === key) return;
    initKeyRef.current = key;
    const id = uid("floor");
    setFloors([{ id, name: "Ground Floor" }]);
    setRooms([]);
    setActiveFloorId(id);
    setSeededFromScope(false);
    scopeHydrated.current = true;
  }, [estimate?.uuid, estimate?.lines, floorsFromScopes, roomTypes, reportItems]);

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

  useEffect(() => {
    if (!seededFromScope || scopeHydrated.current) return;
    const needsLoad = rooms.some((r) => {
      if (r.workItemsLoaded) return false;
      return Boolean(r.roomTypeId) || (Array.isArray(r.savedLines) && r.savedLines.length > 0);
    });
    if (!needsLoad) {
      scopeHydrated.current = true;
      return;
    }
    const needsCatalogTypes = rooms.some((r) => !r.workItemsLoaded && r.roomTypeId);
    if (needsCatalogTypes && roomTypes.length === 0) return;

    let cancelled = false;
    (async () => {
      const nextRooms = [...rooms];
      let changed = false;
      for (let i = 0; i < nextRooms.length; i += 1) {
        const room = nextRooms[i];
        if (room.workItemsLoaded) continue;
        const hasCatalog = Boolean(room.roomTypeId);
        const hasSaved = Array.isArray(room.savedLines) && room.savedLines.length > 0;
        if (!hasCatalog && !hasSaved) continue;

        try {
          let selections = [];
          if (hasCatalog) {
            const detail = await fetchRoomTypeById(room.roomTypeId);
            selections = buildSelectionsFromWorkItems(detail.workItems || [], {
              length: room.length,
              width: room.width,
              height: room.height,
            });
            nextRooms[i] = {
              ...room,
              roomTypeName: detail.roomTypeName,
              name: room.name || detail.roomTypeName,
            };
          }
          if (hasSaved) {
            selections = applySavedLinesToSelections(selections, room.savedLines);
          }
          selections = selections.filter(isCatalogWorkJob);
          nextRooms[i] = {
            ...(nextRooms[i] || room),
            selections,
            workItemsLoaded: true,
          };
          changed = true;
        } catch (err) {
          console.error(err);
        }
      }
      if (!cancelled && changed) {
        setRooms(nextRooms);
        syncEstimate(floors, nextRooms);
      }
      scopeHydrated.current = true;
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate scope rooms once
  }, [seededFromScope, roomTypes, rooms, floors, syncEstimate, estimate?.lines]);

  const updateRooms = (nextRooms) => {
    const sanitized = nextRooms.map((room) => ({
      ...room,
      selections: (room.selections || []).filter(isCatalogWorkJob),
    }));
    setRooms(sanitized);
    syncEstimate(floors, sanitized);
  };

  const updateFloors = (nextFloors) => {
    setFloors(nextFloors);
    syncEstimate(nextFloors, rooms);
  };

  const activeFloor = floors.find((f) => f.id === activeFloorId);
  const floorRooms = rooms.filter((r) => String(r.floorId) === String(activeFloorId));
  const projectTotal = useMemo(
    () =>
      rooms.reduce(
        (sum, r) => sum + roomSurveyTotal((r.selections || []).filter(isCatalogWorkJob)),
        0
      ),
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
              Add floors and rooms, pick room types, then select work jobs from the catalog. Use the
              checklist on the right as reference only.
            </p>
          </div>
          <Badge variant="secondary">
            {formatEstimateAmount(projectTotal, estimate?.currency || "AED")}
          </Badge>
        </div>

        {seededFromScope && (
          <p className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Floor and room structure imported from the site visit checklist. Select work jobs from
            the catalog for each room — checklist items stay in the reference panel on the right.
          </p>
        )}

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

        {!disabled && !seededFromScope && (
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
              {!disabled && !seededFromScope && (
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
            Site-visit checklist for reference while you pick catalog work jobs on the left.
          </p>
          {referenceFloorsFromScopes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No checklist items marked on this visit.</p>
          ) : (
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {referenceFloorsFromScopes.map((floor) => (
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
