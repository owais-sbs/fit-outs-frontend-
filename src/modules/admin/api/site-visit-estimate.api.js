import axiosInstance from "@/lib/axiosInstance";

export function normalizeEstimateLine(line = {}) {
  const qty = Number(line.qty ?? 1);
  const rate = Number(line.rate ?? 0);
  const amount = Number(line.amount ?? qty * rate);
  return {
    uuid: line.uuid || null,
    workItemId: line.workItemId || null,
    roomTypeId: line.roomTypeId || null,
    floorName: line.floorName || "",
    roomName: line.roomName || "",
    category: line.category || "",
    description: line.description || "",
    qty: Number.isFinite(qty) ? qty : 1,
    unit: line.unit || "LS",
    rate: Number.isFinite(rate) ? rate : 0,
    amount: Number.isFinite(amount) ? amount : 0,
    displayOrder: line.displayOrder ?? 0,
  };
}

export function normalizeEstimate(item = {}) {
  const lines = Array.isArray(item.lines) ? item.lines.map(normalizeEstimateLine) : [];
  const subtotal = Number(
    item.subtotal ?? lines.reduce((sum, line) => sum + Number(line.amount || 0), 0)
  );
  return {
    uuid: item.uuid || null,
    siteVisitUuid: item.siteVisitUuid || null,
    quoteNo: item.quoteNo || "",
    validUntil: item.validUntil
      ? String(item.validUntil).slice(0, 10)
      : "",
    revision: item.revision || "R0",
    clientName: item.clientName || "",
    clientAddress: item.clientAddress || "",
    projectLabel: item.projectLabel || "",
    locationLabel: item.locationLabel || "",
    subject: item.subject || "",
    preparedBy: item.preparedBy || "",
    currency: item.currency || "AED",
    notes: item.notes || "",
    subtotal: Number.isFinite(subtotal) ? subtotal : 0,
    status: item.status || "DRAFT",
    lines,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  };
}

export const fetchSiteVisitEstimate = (visitUuid) =>
  axiosInstance
    .get(`/site-visits/${visitUuid}/estimate`)
    .then((r) => normalizeEstimate(r.data?.data ?? r.data));

export const saveSiteVisitEstimate = (visitUuid, form) => {
  const lines = Array.isArray(form.lines)
    ? form.lines.map((line, index) => ({
        workItemId: line.workItemId || null,
        roomTypeId: line.roomTypeId || null,
        floorName: line.floorName || null,
        roomName: line.roomName || null,
        category: line.category || null,
        description: line.description,
        qty: Number(line.qty ?? 1),
        unit: line.unit || "LS",
        rate: Number(line.rate ?? 0),
        displayOrder: line.displayOrder ?? index,
      }))
    : [];

  return axiosInstance
    .put(`/site-visits/${visitUuid}/estimate`, {
      quoteNo: form.quoteNo || null,
      validUntil: form.validUntil || null,
      revision: form.revision || "R0",
      clientName: form.clientName || null,
      clientAddress: form.clientAddress || null,
      projectLabel: form.projectLabel || null,
      locationLabel: form.locationLabel || null,
      subject: form.subject || null,
      preparedBy: form.preparedBy || null,
      currency: form.currency || "AED",
      notes: form.notes || null,
      lines,
    })
    .then((r) => normalizeEstimate(r.data?.data ?? r.data));
};

export const issueSiteVisitEstimate = (visitUuid) =>
  axiosInstance
    .post(`/site-visits/${visitUuid}/estimate/issue`)
    .then((r) => normalizeEstimate(r.data?.data ?? r.data));

export function computeLineAmount(qty, rate) {
  const q = Number(qty);
  const r = Number(rate);
  if (!Number.isFinite(q) || !Number.isFinite(r)) return 0;
  return Math.round(q * r * 100) / 100;
}

export function computeSubtotal(lines = []) {
  return lines.reduce((sum, line) => sum + computeLineAmount(line.qty, line.rate), 0);
}

/** Flatten QAS-style floor/room survey into estimate lines for API save. */
export function flattenSurveyToEstimateLines(floors = [], rooms = []) {
  const lines = [];
  let order = 0;
  floors.forEach((floor) => {
    rooms
      .filter((room) => String(room.floorId) === String(floor.id))
      .forEach((room) => {
        (room.selections || [])
          .filter((sel) => sel.selected)
          .forEach((sel) => {
            const qty = Number(sel.quantity) || 0;
            const rate = Number(sel.defaultRate) || 0;
            lines.push({
              workItemId: sel.workItemId || null,
              roomTypeId: room.roomTypeId || null,
              floorName: floor.name || "",
              roomName: room.name || room.roomTypeName || "",
              category: sel.workItemMasterName || "",
              description: sel.workItemName || "Work item",
              qty,
              unit: (sel.unitType || "LS").toUpperCase(),
              rate,
              amount: computeLineAmount(qty, rate),
              displayOrder: order++,
            });
          });
      });
  });
  return lines;
}

/** Rebuild a minimal floor/room survey shell from saved estimate lines. */
export function surveyShellFromEstimateLines(lines = []) {
  const floors = [];
  const rooms = [];
  const floorMap = new Map();
  const roomMap = new Map();

  lines.forEach((line) => {
    const floorName = line.floorName || "General";
    const roomName = line.roomName || "Room";
    if (!floorMap.has(floorName)) {
      const id = `floor-${floorMap.size + 1}`;
      floorMap.set(floorName, id);
      floors.push({ id, name: floorName });
    }
    const floorId = floorMap.get(floorName);
    const roomKey = `${floorName}::${roomName}`;
    if (!roomMap.has(roomKey)) {
      const id = `room-${roomMap.size + 1}`;
      roomMap.set(roomKey, id);
      rooms.push({
        id,
        floorId,
        name: roomName,
        roomTypeId: line.roomTypeId || "",
        roomTypeName: "",
        length: "",
        width: "",
        height: "3",
        selections: [],
        savedLines: [],
      });
    }
    const room = rooms.find((r) => r.id === roomMap.get(roomKey));
    if (room) {
      if (!room.roomTypeId && line.roomTypeId) room.roomTypeId = line.roomTypeId;
      room.savedLines.push(line);
    }
  });

  return { floors, rooms };
}
