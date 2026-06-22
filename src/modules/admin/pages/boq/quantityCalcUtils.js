const VAT_RATE = 0.05;

export function calcFloorArea(length, width) {
  const l = parseFloat(length);
  const w = parseFloat(width);
  if (Number.isNaN(l) || Number.isNaN(w) || l <= 0 || w <= 0) return 0;
  return parseFloat((l * w).toFixed(2));
}

export function calcWallArea(length, width, height) {
  const l = parseFloat(length);
  const w = parseFloat(width);
  const h = parseFloat(height);
  if (Number.isNaN(l) || Number.isNaN(w) || Number.isNaN(h) || l <= 0 || w <= 0 || h <= 0) return 0;
  return parseFloat((2 * (l + w) * h).toFixed(2));
}

export function calcPerimeter(length, width) {
  const l = parseFloat(length);
  const w = parseFloat(width);
  if (Number.isNaN(l) || Number.isNaN(w) || l <= 0 || w <= 0) return 0;
  return parseFloat((2 * (l + w)).toFixed(2));
}

export function calcCeilingArea(length, width) {
  return calcFloorArea(length, width);
}

export function resolveWorkItemQuantity(workItem, dimensions) {
  const { length = 0, width = 0, height = 0 } = dimensions || {};
  const formula = workItem.quantityFormulaType || workItem.formula || "MANUAL";
  const unit = (workItem.unitType || workItem.unit || "SQM").toUpperCase();

  if (unit === "PCS" || unit === "SET" || unit === "LOT" || unit === "NOS") {
    return 1;
  }

  switch (formula) {
    case "AREA_ONLY":
    case "AREA_LENGTH":
    case "AREA_WIDTH":
      if (workItem.floorApplicable) return calcFloorArea(length, width);
      if (workItem.ceilingApplicable) return calcCeilingArea(length, width);
      return calcFloorArea(length, width);
    case "PERIMETER_HEIGHT":
      if (workItem.wallApplicable) return calcWallArea(length, width, height);
      return calcPerimeter(length, width);
    case "LENGTH_ONLY":
      return parseFloat(length) || 0;
    case "WIDTH_ONLY":
      return parseFloat(width) || 0;
    case "HEIGHT_ONLY":
      return parseFloat(height) || 0;
    case "CUSTOM":
    case "MANUAL":
    default:
      if (workItem.floorApplicable) return calcFloorArea(length, width);
      if (workItem.wallApplicable) return calcWallArea(length, width, height || 3);
      if (workItem.ceilingApplicable) return calcCeilingArea(length, width);
      return calcFloorArea(length, width) || 1;
  }
}

export function calcLineAmount(quantity, rate) {
  const q = parseFloat(quantity);
  const r = parseFloat(rate);
  if (Number.isNaN(q) || Number.isNaN(r)) return 0;
  return parseFloat((q * r).toFixed(2));
}

export function buildSelectionsFromWorkItems(workItems = [], dimensions = {}, existingSelections = []) {
  const existingMap = new Map(
    (existingSelections || []).map((s) => [s.workItemId, s])
  );

  return workItems.map((item) => {
    const existing = existingMap.get(item.id);
    const quantity = existing?.quantity ?? resolveWorkItemQuantity(item, dimensions);
    const rate = parseFloat(item.defaultRate) || 0;
    return {
      workItemId: item.id,
      workItemName: item.workItemName,
      workItemMasterId: item.workItemMasterId,
      workItemMasterName: item.workItemMasterName || "Other",
      unitType: item.unitType,
      defaultRate: rate,
      quantityFormulaType: item.quantityFormulaType,
      floorApplicable: item.floorApplicable,
      wallApplicable: item.wallApplicable,
      ceilingApplicable: item.ceilingApplicable,
      selected: existing?.selected ?? false,
      quantity,
      amount: calcLineAmount(quantity, rate),
    };
  });
}

export function recalcRoomSelections(selections = [], dimensions = {}) {
  return selections.map((sel) => {
    const quantity = resolveWorkItemQuantity(sel, dimensions);
    const rate = parseFloat(sel.defaultRate) || 0;
    return {
      ...sel,
      quantity,
      amount: sel.selected ? calcLineAmount(quantity, rate) : 0,
    };
  });
}

export function roomSurveyTotal(selections = []) {
  return selections
    .filter((s) => s.selected)
    .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
}

export function formatCurrency(amount, currency = "AED") {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${currency} 0.00`;
  return `${currency} ${n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function unitLabel(unitType) {
  const map = {
    SQM: "sqm",
    SQFT: "sqft",
    RMT: "m",
    RFT: "ft",
    PCS: "nos",
    SET: "set",
    LOT: "lot",
  };
  return map[(unitType || "SQM").toUpperCase()] || unitType;
}

export { VAT_RATE };
