import axiosInstance from "@/lib/axiosInstance";
import { multipartConfig } from "./site-visits.api";
import { normalizeRoomScopes, parseScopeItem, filterScopeItemsByReportYes } from "../data/renovationChecklist";

export const LINE_SOURCE = {
  SITE_VISIT: "SITE_VISIT",
  CATALOG: "CATALOG",
  CATALOG_FROM_SCOPE: "CATALOG_FROM_SCOPE",
  MANUAL: "MANUAL",
};

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

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
    lineSource: line.lineSource || null,
    scopeRef: line.scopeRef || null,
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
    excludedScopeRefs: Array.isArray(item.excludedScopeRefs) ? item.excludedScopeRefs : [],
    selectedAppendixIds: Array.isArray(item.selectedAppendixIds) ? item.selectedAppendixIds : [],
    selectedAppendices: Array.isArray(item.selectedAppendices)
      ? item.selectedAppendices.map((a) => ({
          uuid: a.uuid,
          title: a.title || "",
          imageUrl: a.imageUrl || "",
          category: a.category || "",
        }))
      : [],
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
        workItemId: isUuid(line.workItemId) ? line.workItemId : null,
        roomTypeId: isUuid(line.roomTypeId) ? line.roomTypeId : null,
        floorName: line.floorName || null,
        roomName: line.roomName || null,
        category: line.category || null,
        description: line.description,
        qty: Number(line.qty ?? 1),
        unit: line.unit || "LS",
        rate: Number(line.rate ?? 0),
        displayOrder: line.displayOrder ?? index,
        lineSource: line.lineSource || null,
        scopeRef: line.scopeRef || null,
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
      excludedScopeRefs: Array.isArray(form.excludedScopeRefs) ? form.excludedScopeRefs : [],
      selectedAppendixIds: Array.isArray(form.selectedAppendixIds) ? form.selectedAppendixIds : [],
    })
    .then((r) => normalizeEstimate(r.data?.data ?? r.data));
};

export const issueSiteVisitEstimate = (visitUuid) =>
  axiosInstance
    .post(`/site-visits/${visitUuid}/estimate/issue`)
    .then((r) => normalizeEstimate(r.data?.data ?? r.data));

export const sendSiteVisitEstimateEmail = (visitUuid, { recipientEmail, subject, messageBody, attachments = [] }) => {
  const form = new FormData();
  form.append("recipientEmail", recipientEmail);
  if (subject) form.append("subject", subject);
  if (messageBody) form.append("messageBody", messageBody);
  attachments.forEach((file) => form.append("attachments", file));
  return axiosInstance.post(`/site-visits/${visitUuid}/estimate/send`, form, multipartConfig({ timeout: 120000 }));
};

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
            const qtyRaw = Number(sel.quantity);
            const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
            const rate = Number(sel.defaultRate) || 0;
            const lineSource =
              sel.lineSource ||
              (sel.scopeRef
                ? LINE_SOURCE.SITE_VISIT
                : isUuid(sel.workItemId)
                  ? LINE_SOURCE.CATALOG
                  : LINE_SOURCE.MANUAL);
            lines.push({
              workItemId: isUuid(sel.workItemId) ? sel.workItemId : null,
              roomTypeId: isUuid(room.roomTypeId) ? room.roomTypeId : null,
              floorName: floor.name || "",
              roomName: room.name || room.roomTypeName || "",
              category: sel.workItemMasterName || "",
              description: sel.workItemName || "Work item",
              qty,
              unit: (sel.unitType || "LS").toUpperCase(),
              rate,
              amount: computeLineAmount(qty, rate),
              displayOrder: order++,
              lineSource,
              scopeRef: sel.scopeRef || null,
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

/** Match a scope room name to a configured room type. */
export function matchRoomTypeByName(roomName, roomTypes = []) {
  const key = (roomName || "").trim().toLowerCase();
  if (!key) return null;
  const exact = roomTypes.find(
    (rt) =>
      (rt.roomMasterName || "").trim().toLowerCase() === key ||
      (rt.roomTypeName || "").trim().toLowerCase() === key
  );
  if (exact) return exact;
  return (
    roomTypes.find((rt) => (rt.roomTypeName || "").trim().toLowerCase().includes(key)) ||
    roomTypes.find((rt) => key.includes((rt.roomTypeName || "").trim().toLowerCase())) ||
    null
  );
}

/** Build floor/room survey shell from report-YES scope items. */
export function surveyShellFromRoomScopes(roomScopes = [], roomTypes = [], reportItems = []) {
  const approved = filterScopeItemsByReportYes(roomScopes, reportItems);
  const floors = [];
  const rooms = [];
  const floorIndex = new Map();
  let roomIdx = 0;

  approved.forEach((item) => {
    const floorName = item.floorName || "General";
    let floorId = floorIndex.get(floorName);
    if (!floorId) {
      floorId = `scope-floor-${floorIndex.size + 1}`;
      floorIndex.set(floorName, floorId);
      floors.push({ id: floorId, name: floorName });
    }

    const roomKey = `${floorName}::${item.roomName}`;
    let room = rooms.find((r) => r._key === roomKey);
    if (!room) {
      const matched = matchRoomTypeByName(item.roomName, roomTypes);
      room = {
        id: `scope-room-${++roomIdx}`,
        _key: roomKey,
        floorId,
        name: item.roomName || "Room",
        roomTypeId: matched?.id ? String(matched.id) : "",
        roomTypeName: matched?.roomTypeName || "",
        length: "",
        width: "",
        height: "3",
        selections: [],
        scopeItems: [],
        scopeItemNames: [],
        customScopeItems: [],
        seededFromScope: true,
      };
      rooms.push(room);
    }
    room.scopeItems.push(item);
    room.scopeItemNames.push(item.label);
    if (item.custom) {
      room.customScopeItems.push({
        label: item.label,
        rateAed: item.rateAed,
        category: item.category,
        scopeRef: item.scopeRef,
      });
    }
  });

  return {
    floors,
    rooms: rooms.map(({ _key, ...rest }) => rest),
    seededFromScope: floors.length > 0,
  };
}

/** Whether a scope checklist label matches a catalog selection name. */
export function scopeLabelMatchesSelection(scopeLabel, sel) {
  const s = String(scopeLabel || "").trim().toLowerCase();
  const name = (sel?.workItemName || "").trim().toLowerCase();
  if (!s || !name) return false;
  return s === name || name.includes(s) || s.includes(name);
}

export function savedLinesByScopeRef(savedLines = []) {
  const map = {};
  (savedLines || []).forEach((line) => {
    if (line.scopeRef) map[line.scopeRef] = line;
  });
  return map;
}

/** Pre-select work items whose names overlap checklist scope labels. */
export function applyScopePreselection(selections = [], scopeItemNames = [], scopeItems = []) {
  if (!scopeItemNames.length) return selections;
  const scopeByLabel = new Map(
    (scopeItems || []).map((item) => [String(item.label || "").trim().toLowerCase(), item])
  );

  return selections.map((sel) => {
    const name = (sel.workItemName || "").trim().toLowerCase();
    const matchedLabel = scopeItemNames.find((scope) => {
      const parsed = parseScopeItem(scope);
      const label = parsed.label.trim().toLowerCase();
      return label && (label === name || name.includes(label) || label.includes(name));
    });
    if (!matchedLabel) return sel;
    const parsed = parseScopeItem(matchedLabel);
    const scopeItem = scopeByLabel.get(parsed.label.trim().toLowerCase());
    return {
      ...sel,
      selected: true,
      lineSource: LINE_SOURCE.CATALOG_FROM_SCOPE,
      scopeRef: scopeItem?.scopeRef || sel.scopeRef || null,
      amount: sel.amount || sel.defaultRate * (sel.quantity || 1),
    };
  });
}

/** Turn custom on-site scope items into BoQ line selections (no catalog workItemId). */
export function buildCustomWorkSelections(customItems = []) {
  return customItems.map((item, index) => {
    const rate = Number(item.rateAed) || 0;
    const label = item.label || "Custom work";
    return {
      workItemId: `custom-scope-${index}-${label}`,
      workItemName: label,
      workItemMasterName: item.category || "Additional works",
      unitType: "LS",
      quantity: 1,
      defaultRate: rate,
      amount: rate,
      selected: true,
      isCustomScope: true,
      isScopeChecklist: true,
      lineSource: LINE_SOURCE.SITE_VISIT,
      scopeRef: item.scopeRef || null,
      qtyLocked: false,
    };
  });
}

/** Add scoped checklist items that did not match any catalog work item. */
export function buildScopedChecklistSelections(scopeItems = [], existingSelections = [], savedByRef = {}) {
  const coveredRefs = new Set(
    (existingSelections || [])
      .filter((sel) => sel.selected && sel.scopeRef)
      .map((sel) => sel.scopeRef)
  );

  const extras = [];
  (scopeItems || []).forEach((item) => {
    if (!item?.scopeRef || coveredRefs.has(item.scopeRef)) return;
    const saved = savedByRef[item.scopeRef];
    const rate = saved ? Number(saved.rate) || 0 : Number(item.rateAed) || 0;
    const qty = saved ? Number(saved.qty) || 1 : 1;
    extras.push({
      workItemId: `scope-checklist-${item.scopeRef}`,
      workItemName: saved?.description || item.label,
      workItemMasterName: item.category || "From checklist",
      unitType: "LS",
      quantity: qty,
      defaultRate: rate,
      amount: computeLineAmount(qty, rate),
      selected: true,
      isScopeChecklist: true,
      lineSource: LINE_SOURCE.SITE_VISIT,
      scopeRef: item.scopeRef,
      qtyLocked: false,
    });
    coveredRefs.add(item.scopeRef);
  });

  return [...(existingSelections || []), ...extras];
}

/** Merge catalog selections with priced custom scope lines (dedupe by scopeRef / name). */
export function mergeCustomScopeSelections(selections = [], customItems = []) {
  const customSels = buildCustomWorkSelections(customItems);
  const refs = new Set((selections || []).map((sel) => sel.scopeRef).filter(Boolean));
  const names = new Set(
    (selections || []).map((sel) => (sel.workItemName || "").trim().toLowerCase())
  );
  const extras = customSels.filter((sel) => {
    if (sel.scopeRef && refs.has(sel.scopeRef)) return false;
    const key = (sel.workItemName || "").trim().toLowerCase();
    return key && !names.has(key);
  });
  return [...(selections || []), ...extras];
}

/** Apply catalog pre-selection, custom priced items, and unmatched scope checklist lines. */
export function applyAllScopeToSelections(
  selections = [],
  scopeItems = [],
  customItems = [],
  { savedByRef = {} } = {}
) {
  const labels = (scopeItems || []).map((item) => item.label).filter(Boolean);
  let next = applyScopePreselection(selections, labels, scopeItems);

  next = next.map((sel) => {
    if (!sel.selected || !isUuid(sel.workItemId)) return sel;
    if (sel.lineSource || sel.scopeRef) return sel;
    return { ...sel, lineSource: LINE_SOURCE.CATALOG };
  });

  next = mergeCustomScopeSelections(next, customItems);

  next = next.map((sel) => {
    if (!sel.scopeRef || !savedByRef[sel.scopeRef]) return sel;
    const saved = savedByRef[sel.scopeRef];
    const qty = Number(saved.qty) || sel.quantity || 1;
    const rate = Number(saved.rate) ?? sel.defaultRate ?? 0;
    return {
      ...sel,
      quantity: qty,
      defaultRate: rate,
      workItemName: saved.description || sel.workItemName,
      amount: computeLineAmount(qty, rate),
      lineSource: saved.lineSource || sel.lineSource,
    };
  });

  next = buildScopedChecklistSelections(scopeItems, next, savedByRef);
  return next;
}

/** Attach YES-filtered scope metadata onto rooms rebuilt from saved estimate lines. */
export function attachScopeMetadataToRooms(
  rooms = [],
  floors = [],
  roomScopes = [],
  roomTypes = [],
  reportItems = []
) {
  if (!roomScopes?.length) return rooms;
  const scopeShell = surveyShellFromRoomScopes(roomScopes, roomTypes, reportItems);
  const scopeFloorNames = new Map(scopeShell.floors.map((f) => [f.id, f.name]));
  return rooms.map((room) => {
    const floorName = floors.find((f) => f.id === room.floorId)?.name;
    const scopeRoom = scopeShell.rooms.find((sr) => {
      const srFloor = scopeFloorNames.get(sr.floorId);
      return srFloor === floorName && sr.name === room.name;
    });
    if (!scopeRoom) return room;
    return {
      ...room,
      scopeItems: scopeRoom.scopeItems || [],
      scopeItemNames: scopeRoom.scopeItemNames || [],
      customScopeItems: scopeRoom.customScopeItems || [],
      seededFromScope: true,
    };
  });
}

/** Normalize scope items from a seeded room object. */
export function scopeItemsFromRoom(room = {}) {
  if (Array.isArray(room.scopeItems) && room.scopeItems.length > 0) {
    return room.scopeItems;
  }
  return (room.scopeItemNames || []).map((label) => ({
    label,
    category: "From checklist",
    scopeRef: null,
  }));
}

/** Scope items excluded from BoQ for a room (for add-back UI). */
export function excludedScopeItemsForRoom(scopeItems = [], excludedScopeRefs = []) {
  const excluded = new Set((excludedScopeRefs || []).map((ref) => ref.toLowerCase()));
  return (scopeItems || []).filter((item) => item.scopeRef && excluded.has(item.scopeRef.toLowerCase()));
}
