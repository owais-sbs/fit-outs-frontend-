const UNIT_LABELS = {
  SQM: "Sq Mtr",
  SQFT: "Sq Ft",
  SQF: "Sq Ft",
  MTR: "Running Mtr",
  NOS: "Nos",
  LUMPSUM: "Lumpsum",
};

/** Default selling rates (AED) — aligned with work item configuration */
export const ITEM_RATES = {
  scope_dem_wall: 42.5,
  scope_dem_window: 1250,
  scope_dem_door: 890,
  scope_dem_partition: 38,
  scope_paint_emulsion: 28,
  scope_paint_texture: 45,
  scope_paint_primer: 18,
  scope_paint_waterproof: 52,
  scope_floor_skirting: 35,
  scope_floor_cladding: 185,
  scope_floor_panel: 95,
  scope_floor_tile: 72,
};

const DEFAULT_RATE = 55;
const VAT_RATE = 0.05;

export function formatCurrency(amount, currency = "AED") {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${currency} 0.00`;
  return `${currency} ${n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function unitLabel(unitId) {
  if (!unitId) return UNIT_LABELS.SQM;
  const key = String(unitId).toUpperCase();
  return UNIT_LABELS[key] || unitId;
}

export function calcWallSqMtr(length, height) {
  const l = parseFloat(length);
  const b = parseFloat(height);
  if (Number.isNaN(l) || Number.isNaN(b) || l <= 0 || b <= 0) return null;
  return parseFloat((l * b).toFixed(2));
}

export function getWallsForRoom(roomId) {
  return window.__boq_walls?.[roomId] || [];
}

export function getQasStats(floors, rooms) {
  const wallCount = rooms.reduce((n, r) => n + getWallsForRoom(r.id).length, 0);
  const workItemCount = rooms.reduce((n, r) => {
    const walls = getWallsForRoom(r.id);
    return n + walls.reduce((w, wall) => w + (wall.workScopeEntries?.length || 0), 0);
  }, 0);
  return {
    floors: floors.length,
    rooms: rooms.length,
    walls: wallCount,
    workItems: workItemCount,
  };
}

function resolveQty(entry, wall) {
  if (entry?.qty != null && entry.qty !== "" && entry.qty !== "—") {
    const q = parseFloat(entry.qty);
    if (!Number.isNaN(q) && q > 0) return q;
  }
  const unit = (entry?.unit || "SQM").toUpperCase();
  if (unit === "NOS") return 1;
  if (entry?.dims?.width && entry?.dims?.height) {
    const w = parseFloat(entry.dims.width);
    const h = parseFloat(entry.dims.height);
    if (!Number.isNaN(w) && !Number.isNaN(h)) return parseFloat((w * h).toFixed(2));
  }
  const area = calcWallSqMtr(wall?.length, wall?.height);
  if (area) return area;
  return 1;
}

function resolveRate(entry) {
  if (entry?.itemId && ITEM_RATES[entry.itemId] != null) return ITEM_RATES[entry.itemId];
  if (entry?.categoryId === "DEMOLITION") return 42.5;
  if (entry?.categoryId === "PAINTING") return 28;
  if (entry?.categoryId === "FLOORING") return 72;
  return DEFAULT_RATE;
}

export function buildBoqLines(floors, rooms) {
  const lines = [];
  let sr = 1;

  floors.forEach((floor) => {
    const floorRooms = rooms.filter((r) => String(r.floorId) === String(floor.id));
    floorRooms.forEach((room) => {
      const walls = getWallsForRoom(room.id);
      walls.forEach((wall) => {
        (wall.workScopeEntries || []).forEach((entry) => {
          const qty = resolveQty(entry, wall);
          const rate = resolveRate(entry);
          const amount = parseFloat((qty * rate).toFixed(2));
          lines.push({
            id: entry.entryId || `${room.id}-${wall.id}-${entry.itemId}-${sr}`,
            sr: sr++,
            floorId: floor.id,
            roomId: room.id,
            floor: floor.name,
            room: room.name,
            roomCategory: room.roomCategory,
            wall: wall.name,
            surface: wall.name,
            parent: entry.categoryLabel || "—",
            description: entry.itemName || "Work Item",
            unit: unitLabel(entry.unit),
            unitShort: (entry.unit || "SQM").toUpperCase() === "SQM" ? "m²" : unitLabel(entry.unit),
            unitId: entry.unit || "SQM",
            qty,
            rate,
            amount,
            dims:
              entry.dims?.width && entry?.dims?.height
                ? `${entry.dims.width}m × ${entry.dims.height}m`
                : null,
          });
        });
      });
    });
  });

  return lines;
}

export function computeBoqTotals(lines) {
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const vat = parseFloat((subtotal * VAT_RATE).toFixed(2));
  const grandTotal = parseFloat((subtotal + vat).toFixed(2));
  return { subtotal, vat, grandTotal, vatRate: VAT_RATE };
}

export function generateBoqDocument(floors, rooms, session) {
  const lines = buildBoqLines(floors, rooms);
  const totals = computeBoqTotals(lines);
  const ref = `BOQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
  const stats = getQasStats(floors, rooms);

  return {
    ref,
    qasRef: session?.ref || "—",
    generatedAt: new Date().toISOString(),
    project: session?.project || {},
    stats,
    lines,
    totals,
    currency: "AED",
  };
}

export function buildRoomDetailRows(walls = []) {
  const rows = [];
  walls.forEach((wall) => {
    const entries = wall.workScopeEntries?.length ? wall.workScopeEntries : [];
    if (entries.length === 0) {
      rows.push({ key: wall.id, wall, entry: null });
    } else {
      entries.forEach((entry) => rows.push({ key: entry.entryId || entry.itemId, wall, entry }));
    }
  });
  return rows;
}
