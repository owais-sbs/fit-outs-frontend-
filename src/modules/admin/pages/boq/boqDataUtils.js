import {
  buildSelectionsFromWorkItems,
  calcLineAmount,
  formatSelectionDims,
  recalcRoomSelections,
  resolveWorkItemQuantity,
  roomSurveyTotal,
  VAT_RATE,
  unitLabel,
  formatCurrency,
} from "./quantityCalcUtils";

export { formatCurrency, unitLabel, VAT_RATE };

/** JCT-style BOQ summary categories (from Summary sheet) */
export const BOQ_CATEGORIES = [
  { code: "A", name: "Approvals & Drawings" },
  { code: "B", name: "Preliminaries" },
  { code: "C", name: "Demolition Work" },
  { code: "D", name: "Building Works" },
  { code: "E", name: "Floor & Wall Cladding" },
  { code: "F", name: "Ceiling Works" },
  { code: "G", name: "Painting Works" },
  { code: "H", name: "Plumbing Works" },
  { code: "I", name: "Electrical Works" },
  { code: "J", name: "Exhaust & A/C Works" },
  { code: "K", name: "Joinery Works" },
  { code: "L", name: "Counter Top & Marble Works" },
  { code: "M", name: "Aluminum and Glass Works" },
  { code: "N", name: "Purchases" },
  { code: "OPT", name: "Optional Works" },
  { code: "OTHER", name: "Other Charges" },
];

export const CUSTOM_CATEGORY_VALUE = "__CUSTOM__";

export function getCategoryName(code, fallback = "Other Charges") {
  if (!code || code === CUSTOM_CATEGORY_VALUE) return fallback;
  return BOQ_CATEGORIES.find((c) => c.code === code)?.name || fallback;
}

export function resolveAdditionalLineMeta(overrides = {}) {
  const isCustom = overrides.categoryCode === CUSTOM_CATEGORY_VALUE || overrides.isCustomCategory;
  const customName = (overrides.customCategoryName || overrides.categoryName || "").trim();
  const customCode = (overrides.customCategoryCode || "").trim().toUpperCase();

  if (isCustom) {
    return {
      categoryCode: customCode || "CUSTOM",
      categoryName: customName || "Custom",
      isCustomCategory: true,
    };
  }

  const categoryCode = overrides.categoryCode || "OTHER";
  const categoryName = overrides.categoryName || getCategoryName(categoryCode);
  return { categoryCode, categoryName, isCustomCategory: false };
}

export const BOQ_STATUS = {
  DRAFT: "draft",
  FINAL: "final",
};

export function createAdditionalLine(overrides = {}) {
  const qty = parseFloat(overrides.qty) || 1;
  const rate = parseFloat(overrides.rate) || 0;
  const { categoryCode, categoryName, isCustomCategory } = resolveAdditionalLineMeta(overrides);
  const description = (overrides.description || "").trim() || categoryName;

  return {
    id: overrides.id || `add-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: "additional",
    categoryCode,
    categoryName,
    isCustomCategory,
    sr: 0,
    floorId: null,
    roomId: null,
    floor: null,
    room: null,
    parent: categoryName,
    description,
    unit: overrides.unit || "lot",
    unitShort: overrides.unitShort || overrides.unit || "lot",
    unitId: overrides.unitId || "LOT",
    qty,
    rate,
    amount: calcLineAmount(qty, rate),
    dims: overrides.dims || null,
    remarks: overrides.remarks || "",
  };
}

export function renumberBoqLines(qasLines = [], additionalLines = []) {
  let sr = 1;
  const qas = qasLines.map((line) => ({ ...line, source: line.source || "qas", sr: sr++ }));
  const additional = additionalLines.map((line) => ({
    ...line,
    source: "additional",
    sr: sr++,
  }));
  return [...qas, ...additional];
}

export function buildBoqLines(floors, rooms) {
  const lines = [];

  floors.forEach((floor) => {
    const floorRooms = rooms.filter((r) => String(r.floorId) === String(floor.id));
    floorRooms.forEach((room) => {
      (room.selections || [])
        .filter((s) => s.selected)
        .forEach((sel) => {
          const qty = parseFloat(sel.quantity) || 0;
          const rate = parseFloat(sel.defaultRate) || 0;
          const amount = calcLineAmount(qty, rate);
          lines.push({
            id: `${room.id}-${sel.workItemId}`,
            source: "qas",
            sr: 0,
            floorId: floor.id,
            roomId: room.id,
            floor: floor.name,
            room: room.name || room.roomTypeName,
            roomCategory: room.roomTypeName,
            parent: sel.workItemMasterName || "—",
            description: sel.workItemName || "Work Item",
            unit: unitLabel(sel.unitType),
            unitShort: unitLabel(sel.unitType),
            unitId: sel.unitType,
            qty,
            rate,
            amount,
            dims: formatSelectionDims(sel, {
              length: room.length,
              width: room.width,
              height: room.height,
            }),
          });
        });
    });
  });

  return lines;
}

export function mergeBoqLines(qasLines, additionalLines = []) {
  return renumberBoqLines(qasLines, additionalLines);
}

export function getQasStats(floors, rooms) {
  const selectedItems = rooms.reduce(
    (n, r) => n + (r.selections || []).filter((s) => s.selected).length,
    0
  );
  return {
    floors: floors.length,
    rooms: rooms.length,
    workItems: selectedItems,
  };
}

export function computeBoqTotals(lines, options = {}) {
  const qasSubtotal = lines
    .filter((l) => l.source !== "additional")
    .reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const additionalSubtotal = lines
    .filter((l) => l.source === "additional")
    .reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const vat = parseFloat((subtotal * VAT_RATE).toFixed(2));
  const grandTotal = parseFloat((subtotal + vat).toFixed(2));
  return {
    subtotal,
    qasSubtotal,
    additionalSubtotal,
    vat,
    grandTotal,
    vatRate: VAT_RATE,
    ...options,
  };
}

export function generateBoqDocument(floors, rooms, session, additionalLines = [], options = {}) {
  const qasLines = buildBoqLines(floors, rooms);
  const lines = mergeBoqLines(qasLines, additionalLines);
  const totals = computeBoqTotals(lines);
  const ref = options.ref || `BOQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
  const stats = getQasStats(floors, rooms);

  return {
    ref,
    status: options.status || BOQ_STATUS.DRAFT,
    qasRef: session?.ref || "—",
    generatedAt: options.generatedAt || new Date().toISOString(),
    savedAt: options.savedAt || null,
    project: session?.project || {},
    stats,
    qasLineCount: qasLines.length,
    additionalLineCount: additionalLines.length,
    lines,
    qasLines,
    additionalLines,
    totals,
    currency: "AED",
  };
}

export {
  buildSelectionsFromWorkItems,
  recalcRoomSelections,
  resolveWorkItemQuantity,
  roomSurveyTotal,
};
