import { useState, useEffect } from "react";
import { Plus, ChevronRight, DoorOpen, Building2, CheckCircle2, ArrowLeft, Camera, X, Check, Circle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useBoq } from "../BoqEngine";

const WALL_AREA_UNITS = [
  { id: "SQM", label: "Sq Mtr" },
  { id: "SQFT", label: "Sq Ft" },
  { id: "MTR", label: "Running Mtr" },
  { id: "NOS", label: "Nos" },
];

const UNIT_LABELS = {
  SQM: "Sq Mtr",
  SQFT: "Sq Ft",
  SQF: "Sq Ft",
  MTR: "Running Mtr",
  NOS: "Nos",
  LUMPSUM: "Lumpsum",
};

// Predefined wall work scope — parent categories with named child options
const WALL_SCOPE_GROUPS = [
  {
    id: "DEMOLITION",
    label: "Demolition",
    children: [
      { id: "scope_dem_wall", name: "Wall Demolition", unit: "SQM" },
      { id: "scope_dem_window", name: "Window Installation", unit: "NOS" },
      { id: "scope_dem_door", name: "Door Frame Removal", unit: "NOS" },
      { id: "scope_dem_partition", name: "Partition Dismantling", unit: "SQM" },
    ],
  },
  {
    id: "PAINTING",
    label: "Painting",
    children: [
      { id: "scope_paint_emulsion", name: "Wall Emulsion Paint", unit: "SQM" },
      { id: "scope_paint_texture", name: "Texture Finish", unit: "SQM" },
      { id: "scope_paint_primer", name: "Primer Application", unit: "SQM" },
      { id: "scope_paint_waterproof", name: "Waterproof Coating", unit: "SQM" },
    ],
  },
  {
    id: "FLOORING",
    label: "Flooring",
    children: [
      { id: "scope_floor_skirting", name: "Skirting Installation", unit: "Running Mtr" },
      { id: "scope_floor_cladding", name: "Stone Wall Cladding", unit: "SQM" },
      { id: "scope_floor_panel", name: "Wall Panel Fixing", unit: "SQM" },
      { id: "scope_floor_tile", name: "Wall Tile Fixing", unit: "SQM" },
    ],
  },
];

const ALL_SCOPE_ITEMS = WALL_SCOPE_GROUPS.flatMap((g) =>
  g.children.map((c) => ({ ...c, parentLabel: g.label }))
);

function getScopeItemById(id) {
  return ALL_SCOPE_ITEMS.find((item) => item.id === id);
}

const ROOM_TYPES = ["Room", "Balcony", "Kitchen"];
const ROOM_SUB_TYPES = ["Master Room", "Bedroom", "Living Room", "Dining Room", "Study Room"];

const SELECT_CLASS =
  "w-full h-9 rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

const PHASE = {
  CREATE: "create",
  OVERVIEW: "overview",
  WALLS: "walls",
  WORK_ITEMS: "workItems",
};

function calcWallSqMtr(length, breadth) {
  const l = parseFloat(length);
  const b = parseFloat(breadth);
  if (isNaN(l) || isNaN(b) || l <= 0 || b <= 0) return "—";
  return (l * b).toFixed(2);
}

// Items that require width × height dimensions (window, door, etc.)
const ITEMS_NEED_DIMS = new Set(["scope_dem_window", "scope_dem_door"]);

function normalizeWorkUnit(unit) {
  if (!unit) return "SQM";
  const u = String(unit).toUpperCase();
  if (u.includes("SQ") && u.includes("FT")) return "SQFT";
  if (u === "SQM" || u.includes("SQ M")) return "SQM";
  if (u === "NOS") return "NOS";
  if (u.includes("MTR") || u.includes("RUNNING")) return "MTR";
  return "SQM";
}

function RoomWorkItemsPanel({ walls, activeWallIndex, onSelectWall, onWallPatch, onUpdateEntries, onCalculate }) {
  const [parentCat, setParentCat] = useState("");
  const [childItem, setChildItem] = useState("");
  const [childUnit, setChildUnit] = useState("SQM");
  const [customName, setCustomName] = useState("");
  const [dimW, setDimW] = useState("");
  const [dimH, setDimH] = useState("");
  const [notes, setNotes] = useState("");

  const wall = walls[activeWallIndex];
  if (!wall) return null;

  const entries = wall.workScopeEntries || [];
  const confirmedParents = wall.confirmedParents || [];
  const activeGroup = WALL_SCOPE_GROUPS.find((g) => g.id === parentCat);
  const isCustom = childItem === "__custom__";
  const showDims = isCustom || ITEMS_NEED_DIMS.has(childItem);
  const wallSqMtr = calcWallSqMtr(wall.length, wall.height);

  const resetChildForm = () => {
    setChildItem("");
    setChildUnit("SQM");
    setCustomName("");
    setDimW("");
    setDimH("");
    setNotes("");
  };

  const handleChildSelect = (value) => {
    setChildItem(value);
    setCustomName("");
    setDimW("");
    setDimH("");
    if (value === "__custom__") {
      setChildUnit("NOS");
      return;
    }
    const child = activeGroup?.children.find((c) => c.id === value);
    if (child) setChildUnit(normalizeWorkUnit(child.unit));
  };

  const addParentCategory = () => {
    if (!parentCat || confirmedParents.includes(parentCat)) return;
    onWallPatch(activeWallIndex, {
      confirmedParents: [...confirmedParents, parentCat],
    });
    resetChildForm();
  };

  const removeParentCategory = (catId) => {
    onWallPatch(activeWallIndex, {
      confirmedParents: confirmedParents.filter((id) => id !== catId),
      workScopeEntries: entries.filter((e) => e.categoryId !== catId),
    });
    if (parentCat === catId) {
      setParentCat("");
      resetChildForm();
    }
  };

  const addChildItem = () => {
    if (!parentCat || !confirmedParents.includes(parentCat) || !activeGroup) return;

    let itemId, itemName, unit;
    if (isCustom) {
      if (!customName.trim()) return;
      itemId = `custom_${Date.now()}`;
      itemName = customName.trim();
      unit = childUnit || "NOS";
    } else {
      if (!childItem) return;
      const child = activeGroup.children.find((c) => c.id === childItem);
      if (!child) return;
      itemId = child.id;
      itemName = child.name;
      unit = childUnit || normalizeWorkUnit(child.unit);
    }

    if (showDims && (!dimW || !dimH)) {
      alert("Please enter width and height for this item.");
      return;
    }

    let qty = "";
    const unitKey = normalizeWorkUnit(unit);
    if (unitKey === "SQM" && wallSqMtr !== "—") qty = wallSqMtr;
    else if (unitKey === "MTR" && wall.length) qty = String(parseFloat(wall.length) || "");
    else if (showDims && dimW && dimH) qty = (parseFloat(dimW) * parseFloat(dimH)).toFixed(2);

    onUpdateEntries(activeWallIndex, [
      ...entries,
      {
        entryId: `entry_${Date.now()}`,
        categoryId: parentCat,
        categoryLabel: activeGroup.label,
        itemId,
        itemName,
        unit,
        qty,
        dims: showDims ? { width: dimW, height: dimH } : null,
        notes: notes.trim(),
      },
    ]);
    resetChildForm();
  };

  const removeEntry = (entryId, wallIndex) => {
    const wallEntries = walls[wallIndex]?.workScopeEntries || [];
    onUpdateEntries(wallIndex, wallEntries.filter((e) => e.entryId !== entryId));
  };

  const allEntries = walls.flatMap((w, wi) =>
    (w.workScopeEntries || []).map((e) => ({ ...e, wallName: w.name, wallIndex: wi }))
  );

  return (
    <div className="space-y-5">
      {/* Wall tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {walls.map((w, idx) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onSelectWall(idx)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 shrink-0 ${
              idx === activeWallIndex
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-muted/40 border-border text-foreground hover:bg-muted"
            }`}
          >
            {w.name}
            <span className="text-[9px] opacity-80">{calcWallSqMtr(w.length, w.height)} sq mtr</span>
          </button>
        ))}
      </div>

      {/* Step 1 — Parent category */}
      <div className="rounded-lg border border-border/60 p-4 space-y-3 bg-muted/10">
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">Step 1 — Add Parent Category</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[180px] space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Work Category (Parent)</label>
            <select value={parentCat} onChange={(e) => { setParentCat(e.target.value); resetChildForm(); }} className={SELECT_CLASS}>
              <option value="">Select parent category...</option>
              {WALL_SCOPE_GROUPS.map((g) => (
                <option key={g.id} value={g.id} disabled={confirmedParents.includes(g.id)}>{g.label}</option>
              ))}
            </select>
          </div>
          <Button type="button" size="sm" onClick={addParentCategory} disabled={!parentCat || confirmedParents.includes(parentCat)} className="h-9 gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add Parent
          </Button>
        </div>
        {confirmedParents.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {confirmedParents.map((catId) => {
              const g = WALL_SCOPE_GROUPS.find((x) => x.id === catId);
              return (
                <Badge key={catId} variant="secondary" className="gap-1 pr-1 text-[10px]">
                  {g?.label}
                  <button type="button" onClick={() => removeParentCategory(catId)} className="hover:text-destructive ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2 — Child work item */}
      <div className="rounded-lg border border-primary/20 p-4 space-y-3 bg-primary/5">
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">Step 2 — Add Child Work Item</p>
        <p className="text-[11px] text-muted-foreground">
          Select a parent category first, then add child items with dimensions where required.
          Wall area: <span className="font-bold text-primary">{wallSqMtr} Sq Mtr</span>
        </p>
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Parent Category</label>
              <select
                value={parentCat}
                onChange={(e) => { setParentCat(e.target.value); resetChildForm(); }}
                className={SELECT_CLASS}
              >
                <option value="">
                  {confirmedParents.length === 0 ? "Add a parent in Step 1 first..." : "Select parent category..."}
                </option>
                {confirmedParents.map((catId) => {
                  const g = WALL_SCOPE_GROUPS.find((x) => x.id === catId);
                  return <option key={catId} value={catId}>{g?.label}</option>;
                })}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Child Work Item</label>
              <select
                value={childItem}
                onChange={(e) => handleChildSelect(e.target.value)}
                disabled={!parentCat || !confirmedParents.includes(parentCat)}
                className={SELECT_CLASS}
              >
                <option value="">
                  {!parentCat || !confirmedParents.includes(parentCat)
                    ? "Select parent category first..."
                    : "Select child work item..."}
                </option>
                {activeGroup?.children.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                {parentCat && confirmedParents.includes(parentCat) && (
                  <option value="__custom__">+ Custom item...</option>
                )}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Unit</label>
              <select
                value={childUnit}
                onChange={(e) => setChildUnit(e.target.value)}
                disabled={!childItem && !isCustom}
                className={SELECT_CLASS}
              >
                {WALL_AREA_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
          {childUnit === "SQM" && wallSqMtr !== "—" && (
            <p className="text-[10px] text-primary font-semibold md:text-right">Qty: {wallSqMtr} Sq Mtr</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {isCustom && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Custom Name</label>
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Window" className="h-9 text-xs" />
            </div>
          )}
          {showDims && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Width (m)</label>
                <Input type="number" value={dimW} onChange={(e) => setDimW(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Height (m)</label>
                <Input type="number" value={dimH} onChange={(e) => setDimH(e.target.value)} className="h-9 text-xs" />
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="h-9 text-xs" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            onClick={addChildItem}
            disabled={!parentCat || !confirmedParents.includes(parentCat) || (!childItem && !isCustom) || (isCustom && !customName.trim())}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Child Item
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCalculate} className="gap-1 border-primary text-primary hover:bg-primary/10">
            Calculate Work Items
          </Button>
        </div>
      </div>

      {/* All work items table */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-bold">Wall</TableHead>
              <TableHead className="text-xs font-bold">Parent</TableHead>
              <TableHead className="text-xs font-bold">Child Item</TableHead>
              <TableHead className="text-xs font-bold">Unit</TableHead>
              <TableHead className="text-xs font-bold">Qty / Sq Mtr</TableHead>
              <TableHead className="text-xs font-bold">Dimensions</TableHead>
              <TableHead className="text-xs font-bold w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {allEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                  Add parent categories, then child work items for each wall.
                </TableCell>
              </TableRow>
            ) : (
              allEntries.map((entry) => (
                <TableRow key={entry.entryId}>
                  <TableCell className="text-xs font-medium">{entry.wallName}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px]">{entry.categoryLabel}</Badge></TableCell>
                  <TableCell className="text-xs font-semibold">{entry.itemName}</TableCell>
                  <TableCell className="text-xs">{UNIT_LABELS[(entry.unit || "").toUpperCase()] || entry.unit}</TableCell>
                  <TableCell className="text-xs font-bold text-primary">{entry.qty || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.dims?.width && entry.dims?.height ? `${entry.dims.width}m × ${entry.dims.height}m` : "—"}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.entryId, entry.wallIndex)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function migrateWallData(wall) {
  const base = {
    ...wall,
    areaUnit: wall.areaUnit || "SQM",
    workScopeEntries: wall.workScopeEntries || [],
    confirmedParents: wall.confirmedParents || [],
    workItemDescriptions: wall.workItemDescriptions || {},
  };
  if (base.workScopeEntries.length === 0 && wall.workItems?.length > 0) {
    base.workScopeEntries = wall.workItems.map((itemId) => {
      const item = getScopeItemById(itemId);
      const group = WALL_SCOPE_GROUPS.find((g) => g.children.some((c) => c.id === itemId));
      return {
        entryId: `entry_${itemId}_${Date.now()}`,
        categoryId: group?.id || "OTHER",
        categoryLabel: group?.label || "Other",
        itemId,
        itemName: item?.name || itemId,
        unit: item?.unit || "SQM",
        dims: null,
        notes: wall.workItemDescriptions?.[itemId] || "",
      };
    });
  }
  return base;
}

function RoomDetailsPopup({ open, onOpenChange, room, floor, measurements, walls, onEdit }) {
  if (!room) return null;

  const dims = measurements[room.id] || {};
  const isComplete = walls?.length > 0 && walls.every((w) => w.length && w.height) &&
    walls.some((w) => (w.workScopeEntries?.length || 0) > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold truncate">{room.name}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {floor?.name || "—"} · {room.roomCategory}
              </p>
            </div>
            {isComplete && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                Complete
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {room.description && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground">{room.description}</p>
            </div>
          )}

          {(dims.length || dims.width) && (
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Room Dimensions</p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Length</span>
                  <p className="font-bold">{dims.length} m</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Width</span>
                  <p className="font-bold">{dims.width} m</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Height</span>
                  <p className="font-bold">{dims.height ? `${Number(dims.height).toFixed(2)} m` : "—"}</p>
                </div>
              </div>
            </div>
          )}

          {walls?.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Walls &amp; Work Items</p>
              {walls.map((wall) => (
                <div key={wall.id} className="rounded-lg border border-border/60 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/30 border-b border-border/40">
                    <span className="font-semibold text-xs">{wall.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {wall.length && wall.height ? `${wall.length}m × ${wall.height}m` : "No dimensions"}
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    {(wall.workScopeEntries?.length > 0 ? wall.workScopeEntries : (wall.workItems || []).map((id) => ({ itemId: id, itemName: getScopeItemById(id)?.name || id, categoryLabel: getScopeItemById(id)?.parentLabel, notes: wall.workItemDescriptions?.[id] }))).map((entry) => (
                      <div key={entry.entryId || entry.itemId} className="text-xs border-l-2 border-primary/40 pl-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.categoryLabel && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">{entry.categoryLabel}</Badge>
                          )}
                          <span className="font-semibold text-foreground">{entry.itemName}</span>
                        </div>
                        {entry.dims?.width && entry.dims?.height && (
                          <p className="text-[11px] text-primary mt-0.5">{entry.dims.width}m × {entry.dims.height}m</p>
                        )}
                        {entry.notes && (
                          <p className="text-muted-foreground mt-0.5 text-[11px]">{entry.notes}</p>
                        )}
                      </div>
                    ))}
                    {!(wall.workScopeEntries?.length || wall.workItems?.length) && (
                      <p className="text-[11px] text-muted-foreground italic">No work items added</p>
                    )}
                    {wall.photo && (
                      <img src={wall.photo} alt={wall.name} className="h-16 w-24 rounded border object-cover mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">
              No wall data recorded yet.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onEdit && (
            <Button type="button" onClick={onEdit} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              Edit Room
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Step03RoomCreation() {
  const { floors, rooms, setRooms, measurements, setMeas, workItems, setWorkItems, photos, setPhotos, prevStep, goToStep } = useBoq();

  // Room creation states
  const [selectedFloorId, setSelectedFloorId] = useState(floors[0]?.id || "");
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [selectedRoomSubType, setSelectedRoomSubType] = useState("");
  const [customRoomName, setCustomRoomName] = useState("");

  useEffect(() => {
    if (floors.length > 0 && !floors.find((f) => f.id === selectedFloorId)) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);

  // Step 3 internal phases: create → overview grid → room detail
  const [phase, setPhase] = useState(PHASE.CREATE);
  const [activeDetailRoomId, setActiveDetailRoomId] = useState(null);
  const [detailPopupRoomId, setDetailPopupRoomId] = useState(null);
  const [walls, setWalls] = useState([]);
  const [activeWallIndex, setActiveWallIndex] = useState(0);

  // Helpers for Session Walls Storage
  const getInitialWalls = (roomId) => {
    window.__boq_walls = window.__boq_walls || {};
    if (window.__boq_walls[roomId]) {
      return window.__boq_walls[roomId];
    }
    return [];
  };

  const isRoomCompleted = (roomId) => {
    const w = window.__boq_walls?.[roomId];
    if (!w?.length) return false;
    const wallsOk = w.every((wall) => wall.length && wall.height);
    const workOk = w.some((wall) => (wall.workScopeEntries?.length || 0) > 0);
    return wallsOk && workOk;
  };

  const startDetailingRoom = (roomId) => {
    setDetailPopupRoomId(null);
    setPhase(PHASE.WALLS);
    setActiveDetailRoomId(roomId);
    const w = getInitialWalls(roomId).map(migrateWallData);
    const initial =
      w.length > 0
        ? w
        : [{
            id: "wall_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
            name: "Wall 1",
            length: "",
            height: "",
            workItems: [],
            workScopeEntries: [],
            confirmedParents: [],
            workItemDescriptions: {},
            photo: null,
            areaUnit: "SQM",
          }];
    setWalls(initial);
    setActiveWallIndex(0);
    setPhase(initial.every((wall) => wall.length && wall.height) ? PHASE.WORK_ITEMS : PHASE.WALLS);
  };

  const openRoomDetails = (roomId) => {
    setDetailPopupRoomId(roomId);
  };

  const getWallsForRoom = (roomId) => {
    if (activeDetailRoomId === roomId && walls.length > 0) {
      return walls;
    }
    return window.__boq_walls?.[roomId] || [];
  };

  const popupRoom = detailPopupRoomId ? rooms.find((r) => r.id === detailPopupRoomId) : null;
  const popupFloor = popupRoom ? floors.find((f) => f.id === popupRoom.floorId) : null;
  const popupWalls = detailPopupRoomId ? getWallsForRoom(detailPopupRoomId) : [];
  const popupRoomDisplay = popupRoom;
  const popupMeasurements = measurements;

  // Room management
  const addRoom = () => {
    if (!selectedFloorId || !selectedRoomType) return;
    if (selectedRoomType === "Room" && !selectedRoomSubType) return;

    const roomCategory = selectedRoomType === "Room" ? selectedRoomSubType : selectedRoomType;
    const name = customRoomName.trim() || roomCategory;

    const floorRooms = rooms.filter((r) => String(r.floorId) === String(selectedFloorId));
    if (floorRooms.find((r) => r.name.toLowerCase() === name.toLowerCase())) return;

    setRooms((prev) => [
      ...prev,
      {
        id: "room_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
        floorId: selectedFloorId,
        roomCategory,
        roomType: selectedRoomType,
        name,
      },
    ]);
    setCustomRoomName("");
  };

  const canSaveRoom =
    !!selectedFloorId &&
    !!selectedRoomType &&
    (selectedRoomType !== "Room" || !!selectedRoomSubType);

  const removeRoom = (id) => {
    setRooms((r) => r.filter((x) => x.id !== id));
    // clean window persistence too
    if (window.__boq_walls && window.__boq_walls[id]) {
      delete window.__boq_walls[id];
    }
  };

  // Wall Management inside room details
  const addWall = () => {
    const newWallName = `Wall ${walls.length + 1}`;
    setWalls((w) => [
      ...w,
      {
        id: "wall_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
        name: newWallName,
        length: "",
        height: "",
        workItems: [],
        workScopeEntries: [],
        confirmedParents: [],
        workItemDescriptions: {},
        photo: null,
        areaUnit: "SQM",
      },
    ]);
    setActiveWallIndex(walls.length);
  };

  const removeWall = (index) => {
    const updated = walls.filter((_, idx) => idx !== index);
    setWalls(updated);
    setActiveWallIndex(Math.max(0, Math.min(index, updated.length - 1)));
  };

  const handleWallChange = (index, field, value) => {
    const updated = [...walls];
    updated[index][field] = value;
    setWalls(updated);
  };

  const handleWallPhotoUpload = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...walls];
      updated[index].photo = reader.result; // base64 preview
      setWalls(updated);
    };
    reader.readAsDataURL(file);
  };

  const updateWallWorkEntries = (index, entries) => {
    const updated = [...walls];
    updated[index] = { ...updated[index], workScopeEntries: entries };
    setWalls(updated);
  };

  const patchWall = (index, patch) => {
    const updated = [...walls];
    updated[index] = { ...updated[index], ...patch };
    setWalls(updated);
  };

  const wallsAreComplete = () =>
    walls.length > 0 && walls.every((w) => w.length && w.height);

  const goToWorkItemsScreen = () => {
    if (walls.length === 0) {
      alert("Please add at least one wall.");
      return;
    }
    if (!wallsAreComplete()) {
      alert("Please enter length and breadth for every wall before continuing.");
      return;
    }
    setPhase(PHASE.WORK_ITEMS);
    setActiveWallIndex(0);
  };

  const calculateWorkItems = () => {
    setWalls((prev) =>
      prev.map((wall) => {
        const sqm = parseFloat(calcWallSqMtr(wall.length, wall.height));
        if (isNaN(sqm)) return wall;
        const updatedEntries = (wall.workScopeEntries || []).map((entry) => {
          if (entry.unit === "SQM") {
            return { ...entry, qty: sqm.toFixed(2) };
          }
          if (entry.unit === "NOS" && entry.dims?.width && entry.dims?.height) {
            const w = parseFloat(entry.dims.width);
            const h = parseFloat(entry.dims.height);
            if (!isNaN(w) && !isNaN(h)) {
              return { ...entry, qty: (w * h).toFixed(2) };
            }
          }
          return entry;
        });
        return { ...wall, workScopeEntries: updatedEntries };
      })
    );
  };

  const deriveRoomMeasurements = (wallList) => {
    const lengths = wallList.map((w) => parseFloat(w.length)).filter((n) => !isNaN(n) && n > 0);
    const heights = wallList.map((w) => parseFloat(w.height)).filter((n) => !isNaN(n) && n > 0);
    const sorted = [...lengths].sort((a, b) => b - a);
    const L = sorted[0] || 0;
    const W = sorted[1] || sorted[0] || 0;
    const height = heights.length ? heights.reduce((a, b) => a + b, 0) / heights.length : 0;
    return { length: L, width: W, height };
  };

  // Complete detailing for room (from work items screen)
  const saveAndCompleteRoom = () => {
    if (!wallsAreComplete()) {
      alert("Please complete all wall dimensions.");
      return;
    }

    const hasWorkItems = walls.some((w) => (w.workScopeEntries?.length || 0) > 0);
    if (!hasWorkItems) {
      alert("Please add at least one work item before saving.");
      return;
    }

    const { length: L, width: W, height } = deriveRoomMeasurements(walls);

    setMeas((prev) => ({
      ...prev,
      [activeDetailRoomId]: { length: L, width: W, height },
    }));

    const mergedWorkItems = [];
    walls.forEach((w) => {
      (w.workScopeEntries || []).forEach((entry) => {
        mergedWorkItems.push({ id: entry.itemId, surface: "walls" });
      });
      (w.workItems || []).forEach((id) => {
        if (!mergedWorkItems.some((x) => x.id === id)) {
          mergedWorkItems.push({ id, surface: "walls" });
        }
      });
    });

    setWorkItems((prev) => ({
      ...prev,
      [activeDetailRoomId]: mergedWorkItems,
    }));

    const wallPhotos = walls.map((w) => w.photo).filter(Boolean);
    setPhotos((prev) => ({
      ...prev,
      [activeDetailRoomId]: wallPhotos,
    }));

    window.__boq_walls = window.__boq_walls || {};
    window.__boq_walls[activeDetailRoomId] = walls;

    const savedRoomId = activeDetailRoomId;
    setActiveDetailRoomId(null);
    setPhase(PHASE.OVERVIEW);
    setDetailPopupRoomId(savedRoomId);
  };

  const activeRoom = activeDetailRoomId ? rooms.find((r) => r.id === activeDetailRoomId) : null;

  const phaseTitle =
    phase === PHASE.WALLS
      ? "Wall Dimensions"
      : phase === PHASE.WORK_ITEMS
        ? "Work Items"
        : phase === PHASE.OVERVIEW
          ? "Select Room"
          : "Room & Floor Management";

  const phaseSubtitle =
    phase === PHASE.WALLS
      ? `Add all walls with length, breadth and photos for ${activeRoom?.name || "this room"}.`
      : phase === PHASE.WORK_ITEMS
        ? `Add parent categories, then child work items with dimensions for ${activeRoom?.name || "this room"}.`
        : phase === PHASE.OVERVIEW
          ? "Choose a room from the floor-wise grid to add dimensions and work items."
          : "Create rooms for each floor, then continue to configure dimensions.";

  // General counters
  const totalRooms = rooms.length;
  const completedFloors = floors.filter(
    (f) => rooms.filter((r) => r.floorId === f.id).length > 0
  ).length;

  const completedRooms = rooms.filter((r) => isRoomCompleted(r.id)).length;

  const selectedFloor = floors.find((f) => f.id === selectedFloorId);
  const roomsOnSelectedFloor = rooms.filter((r) => String(r.floorId) === String(selectedFloorId));

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
            3
          </span>
          Step 3 of 5
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{phaseTitle}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{phaseSubtitle}</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-2.5 text-sm">
        <CheckCircle2 className={`h-4 w-4 shrink-0 ${completedFloors === floors.length ? "text-emerald-500" : "text-muted-foreground/40"}`} />
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{completedFloors}</span> of{" "}
          <span className="font-semibold text-foreground">{floors.length}</span> floors have rooms ·{" "}
          <span className="font-semibold text-foreground">{totalRooms}</span> total rooms
        </span>
      </div>

      <div className="space-y-6">
        
        {/* Main content — left room list + right add form */}
        <div className="min-w-0">
          
          {phase === PHASE.CREATE && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,300px)_1fr] gap-4 items-start">
            {/* Left — rooms list for selected floor */}
            <Card className="border-border/60 shadow-sm lg:sticky lg:top-4">
              <CardHeader className="py-3.5 px-4 border-b border-border/40 bg-muted/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-bold truncate">
                      Rooms on {selectedFloor?.name || "Floor"}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {roomsOnSelectedFloor.filter((r) => isRoomCompleted(r.id)).length}/{roomsOnSelectedFloor.length} complete
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {roomsOnSelectedFloor.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {roomsOnSelectedFloor.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 py-10 px-3 text-center">
                    <DoorOpen className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No rooms on this floor yet.</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">Add a room using the form on the right.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5">
                    {roomsOnSelectedFloor.map((r) => {
                      const done = isRoomCompleted(r.id);
                      return (
                        <div
                          key={r.id}
                          className={`relative flex flex-col rounded-lg border p-3 transition-all hover:shadow-sm ${
                            done
                              ? "border-emerald-200/70 bg-emerald-50/25"
                              : "border-border/60 bg-background hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              {done ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-foreground truncate">{r.name}</p>
                                <Badge variant="outline" className="w-fit mt-1 text-[9px]">{r.roomCategory}</Badge>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRoom(r.id)}
                              className="text-muted-foreground hover:text-destructive p-0.5 shrink-0"
                              title="Remove room"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right — add new room form */}
            <Card className="border-border/60 shadow-sm border-t-4 border-t-primary min-w-0">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <DoorOpen className="h-5 w-5 text-primary" />
                  Add New Room
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                {/* 1. Floor selection — option buttons */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Select Floor</label>
                  <div className="flex flex-wrap gap-2">
                    {floors.map((f) => {
                      const count = rooms.filter((r) => String(r.floorId) === String(f.id)).length;
                      const isActive = String(selectedFloorId) === String(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFloorId(f.id)}
                          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all ${
                            isActive
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border/60 bg-background text-foreground hover:border-primary/40 hover:bg-muted/30"
                          }`}
                        >
                          <Building2 className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-primary"}`} />
                          {f.name}
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Room configure — dropdowns + optional name */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Add to <span className="font-semibold text-foreground">{selectedFloor?.name || "selected floor"}</span>
                  </p>

                  <div className={`grid gap-4 ${selectedRoomType === "Room" ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Room</label>
                      <select
                        value={selectedRoomType}
                        onChange={(e) => {
                          setSelectedRoomType(e.target.value);
                          setSelectedRoomSubType("");
                        }}
                        className={SELECT_CLASS}
                      >
                        <option value="" disabled>Select room type...</option>
                        {ROOM_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {selectedRoomType === "Room" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Room Type</label>
                        <select
                          value={selectedRoomSubType}
                          onChange={(e) => setSelectedRoomSubType(e.target.value)}
                          className={SELECT_CLASS}
                        >
                          <option value="" disabled>Select room...</option>
                          {ROOM_SUB_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Name to that Room (Optional)
                    </label>
                    <Input
                      value={customRoomName}
                      onChange={(e) => setCustomRoomName(e.target.value)}
                      placeholder={
                        selectedRoomType === "Room" && selectedRoomSubType
                          ? `e.g. ${selectedRoomSubType} 1`
                          : selectedRoomType
                            ? `e.g. ${selectedRoomType} 1`
                            : "e.g. Master Bedroom 1"
                      }
                      className="h-10"
                    />
                  </div>

                  <Button
                    onClick={addRoom}
                    disabled={!canSaveRoom}
                    className="h-10 px-8 text-sm font-bold bg-primary hover:bg-primary/95 text-white"
                  >
                    Save Room
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {phase === PHASE.OVERVIEW && (
            <Card className="border-border/60 shadow-sm border-t-4 border-t-primary">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base font-bold">Floor-wise Rooms</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedRooms}/{totalRooms} rooms configured · click a room to add dimensions and work items
                </p>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                {floors.map((floor) => {
                  const floorRooms = rooms.filter((r) => String(r.floorId) === String(floor.id));
                  if (floorRooms.length === 0) return null;
                  return (
                    <div key={floor.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">{floor.name}</h3>
                        <Badge variant="secondary" className="text-[10px]">{floorRooms.length} rooms</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {floorRooms.map((r) => {
                          const done = isRoomCompleted(r.id);
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => startDetailingRoom(r.id)}
                              className={`text-left rounded-xl border p-4 transition-all hover:shadow-md ${
                                done
                                  ? "border-emerald-200/70 bg-emerald-50/25 hover:border-emerald-300"
                                  : "border-border/60 bg-background hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                {done ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="h-4 w-4 text-amber-400 shrink-0" />
                                )}
                                <Badge variant="outline" className="text-[9px] shrink-0">{r.roomCategory}</Badge>
                              </div>
                              <p className="font-bold text-sm text-foreground truncate">{r.name}</p>
                              <p className="text-[10px] font-bold text-primary mt-2 uppercase tracking-wide">
                                {done ? "Edit Dimensions" : "Take Dimensions"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {totalRooms === 0 && (
                  <div className="rounded-xl border border-dashed border-border/60 py-14 text-center">
                    <DoorOpen className="h-9 w-9 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No rooms created yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {phase === PHASE.WALLS && (
            <Card className="border-primary/20 shadow-md border-t-4 border-t-primary">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <CardTitle className="text-base font-bold text-foreground truncate">
                      {activeRoom?.name} — Walls
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {floors.find((f) => f.id === activeRoom?.floorId)?.name} · {activeRoom?.roomCategory}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveDetailRoomId(null);
                      setPhase(PHASE.OVERVIEW);
                    }}
                    className="h-8 text-xs font-semibold gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Grid
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Add Walls</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enter length, breadth, Sq Mtr and photo for each wall. Continue to work items when all walls are done.
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={addWall} className="h-8 gap-1 shrink-0">
                    <Plus className="h-3.5 w-3.5" />
                    Add Wall
                  </Button>
                </div>

                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-xs font-bold">Wall</TableHead>
                        <TableHead className="text-xs font-bold">Length (m)</TableHead>
                        <TableHead className="text-xs font-bold">Breadth (m)</TableHead>
                        <TableHead className="text-xs font-bold">
                          <div>Area</div>
                          <div className="text-[9px] font-normal text-muted-foreground normal-case">Unit: Sq Mtr</div>
                        </TableHead>
                        <TableHead className="text-xs font-bold">Photo</TableHead>
                        <TableHead className="text-xs font-bold w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {walls.map((wall, idx) => (
                        <TableRow key={wall.id}>
                          <TableCell className="font-semibold text-xs">{wall.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="4.0"
                              value={wall.length}
                              onChange={(e) => handleWallChange(idx, "length", e.target.value)}
                              className="h-8 text-xs w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="3.0"
                              value={wall.height}
                              onChange={(e) => handleWallChange(idx, "height", e.target.value)}
                              className="h-8 text-xs w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5">
                              <span className="text-xs font-bold text-primary block">
                                {calcWallSqMtr(wall.length, wall.height)}
                              </span>
                              <select
                                value={wall.areaUnit || "SQM"}
                                onChange={(e) => handleWallChange(idx, "areaUnit", e.target.value)}
                                className="h-7 w-full min-w-[88px] rounded-md border border-input bg-background px-1.5 text-[10px] focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                {WALL_AREA_UNITS.map((u) => (
                                  <option key={u.id} value={u.id}>{u.label}</option>
                                ))}
                              </select>
                            </div>
                          </TableCell>
                          <TableCell>
                            {wall.photo ? (
                              <div className="relative h-10 w-14 rounded border overflow-hidden">
                                <img src={wall.photo} alt={wall.name} className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleWallChange(idx, "photo", null)}
                                  className="absolute top-0 right-0 h-3 w-3 bg-black/60 text-white text-[8px] flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <label className="inline-flex h-8 items-center gap-1 rounded border border-dashed px-2 text-[10px] text-muted-foreground cursor-pointer hover:bg-muted/20">
                                <Camera className="h-3 w-3" />
                                Upload
                                <input type="file" accept="image/*" onChange={(e) => handleWallPhotoUpload(e, idx)} className="hidden" />
                              </label>
                            )}
                          </TableCell>
                          <TableCell>
                            {walls.length > 1 && (
                              <button type="button" onClick={() => removeWall(idx)} className="text-muted-foreground hover:text-destructive p-1">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {phase === PHASE.WORK_ITEMS && (
            <Card className="border-primary/20 shadow-md border-t-4 border-t-primary">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <CardTitle className="text-base font-bold text-foreground truncate">
                      {activeRoom?.name} — Work Items
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Add parent category first, then child items with dimensions per wall.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openRoomDetails(activeDetailRoomId)}
                      className="h-8 text-xs font-semibold gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPhase(PHASE.WALLS)}
                      className="h-8 text-xs font-semibold gap-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to Walls
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <RoomWorkItemsPanel
                  walls={walls}
                  activeWallIndex={activeWallIndex}
                  onSelectWall={setActiveWallIndex}
                  onWallPatch={patchWall}
                  onUpdateEntries={updateWallWorkEntries}
                  onCalculate={calculateWorkItems}
                />
              </CardContent>
            </Card>
          )}

        </div>

      </div>

      <RoomDetailsPopup
        open={!!detailPopupRoomId}
        onOpenChange={(open) => {
          if (!open) setDetailPopupRoomId(null);
        }}
        room={popupRoomDisplay}
        floor={popupFloor}
        measurements={popupMeasurements}
        walls={popupWalls}
        onEdit={
          popupRoom
            ? () => {
                setDetailPopupRoomId(null);
                startDetailingRoom(popupRoom.id);
              }
            : undefined
        }
      />

      {/* Navigation — phase-aware, stays within Step 3 until Review */}
      <div className="flex items-center justify-between pt-2 border-t border-t-border/40 mt-4">
        {phase === PHASE.CREATE && (
          <>
            <Button variant="outline" onClick={prevStep}>Back</Button>
            <Button
              onClick={() => setPhase(PHASE.OVERVIEW)}
              disabled={totalRooms === 0}
              className="gap-2 bg-primary text-white hover:bg-primary/90"
            >
              Next: Select Rooms
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        {phase === PHASE.OVERVIEW && (
          <>
            <Button variant="outline" onClick={() => setPhase(PHASE.CREATE)} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back: Add Rooms
            </Button>
            <Button
              onClick={() => goToStep(4)}
              disabled={totalRooms === 0 || completedRooms < totalRooms}
              className="gap-2 bg-primary text-white hover:bg-primary/90"
            >
              Next: Review
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        {phase === PHASE.WALLS && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setActiveDetailRoomId(null);
                setPhase(PHASE.OVERVIEW);
              }}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Grid
            </Button>
            <Button
              onClick={goToWorkItemsScreen}
              disabled={!wallsAreComplete()}
              className="gap-2 bg-primary text-white hover:bg-primary/90"
            >
              Next: Work Items
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        {phase === PHASE.WORK_ITEMS && (
          <>
            <Button variant="outline" onClick={() => setPhase(PHASE.WALLS)} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Walls
            </Button>
            <Button
              onClick={saveAndCompleteRoom}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="h-4 w-4" />
              Save &amp; Complete
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
