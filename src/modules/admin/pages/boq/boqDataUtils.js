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

export function buildBoqLines(floors, rooms) {
  const lines = [];
  let sr = 1;

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
            sr: sr++,
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

export {
  buildSelectionsFromWorkItems,
  recalcRoomSelections,
  resolveWorkItemQuantity,
  roomSurveyTotal,
};
