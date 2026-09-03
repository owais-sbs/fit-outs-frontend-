import axiosInstance from "@/lib/axiosInstance";
import { fetchRoomTypeById } from "./room-type.api";
import { buildSelectionsFromWorkItems, calcLineAmount } from "../pages/boq/quantityCalcUtils";

const unwrap = (r) => r.data?.data ?? r.data;

export function fetchProjectQasSurveySeed(projectId) {
  return axiosInstance
    .get(`/projects/${projectId}/qas-survey-seed`)
    .then((r) => {
      const data = unwrap(r);
      if (!data) return null;
      return {
        projectId: data.projectId,
        sourceEstimateUuid: data.sourceEstimateUuid || null,
        floors: Array.isArray(data.floors) ? data.floors : [],
        rooms: Array.isArray(data.rooms) ? data.rooms : [],
      };
    })
    .catch((err) => {
      const status = err?.response?.status;
      if (status === 404 || status === 400) return null;
      throw err;
    });
}

function applySavedLinesToSelections(selections, savedLines = []) {
  const byWorkItem = new Map(
    (savedLines || []).filter((l) => l.workItemId).map((l) => [String(l.workItemId), l])
  );
  const matched = new Set();
  const next = selections.map((sel) => {
    const saved = byWorkItem.get(String(sel.workItemId));
    if (!saved) return sel;
    matched.add(String(sel.workItemId));
    const quantity = Number(saved.qty) || sel.quantity || 1;
    const defaultRate = Number(saved.rate) || sel.defaultRate || 0;
    return {
      ...sel,
      selected: true,
      quantity,
      defaultRate,
      lineSource: saved.lineSource || sel.lineSource || "CATALOG",
      scopeRef: saved.scopeRef || sel.scopeRef || null,
      amount: calcLineAmount(quantity, defaultRate),
      qtyLocked: true,
    };
  });

  // Keep non-catalog / unmatched lines as selected stubs so amounts aren't lost
  (savedLines || []).forEach((saved) => {
    const id = saved.workItemId ? String(saved.workItemId) : null;
    if (id && matched.has(id)) return;
    const quantity = Number(saved.qty) || 1;
    const defaultRate = Number(saved.rate) || 0;
    next.push({
      workItemId: id || `manual-${next.length}`,
      workItemName: saved.description || "Work item",
      workItemMasterId: null,
      workItemMasterName: saved.category || "Other",
      unitType: (saved.unit || "LS").toUpperCase(),
      defaultRate,
      costPrice: 0,
      markupPercentage: 0,
      materialLines: [],
      quantityFormulaType: "MANUAL",
      floorApplicable: false,
      wallApplicable: false,
      ceilingApplicable: false,
      selected: true,
      dimensionSource: "room",
      customLength: "",
      customWidth: "",
      customHeight: "",
      quantity,
      amount: calcLineAmount(quantity, defaultRate),
      lineSource: saved.lineSource || "MANUAL",
      scopeRef: saved.scopeRef || null,
      qtyLocked: true,
      isCustomScope: !id,
    });
  });

  return next;
}

/** Hydrate seed rooms with catalog selections from room types + saved estimate lines. */
export async function hydrateQasSurveySeed(seed) {
  if (!seed) return null;
  const floors = Array.isArray(seed.floors) ? seed.floors : [];
  const roomsIn = Array.isArray(seed.rooms) ? seed.rooms : [];
  if (!floors.length) return null;

  const rooms = await Promise.all(
    roomsIn.map(async (room) => {
      const savedLines = Array.isArray(room.savedLines) ? room.savedLines : [];
      let selections = [];
      let roomTypeName = room.roomTypeName || "";
      let name = room.name || "Room";

      if (room.roomTypeId) {
        try {
          const detail = await fetchRoomTypeById(room.roomTypeId);
          const workItems = detail?.workItems || [];
          selections = buildSelectionsFromWorkItems(workItems, {
            length: room.length,
            width: room.width,
            height: room.height,
          });
          selections = applySavedLinesToSelections(selections, savedLines);
          roomTypeName = detail?.roomTypeName || roomTypeName;
          name = room.name || detail?.roomTypeName || name;
        } catch {
          selections = applySavedLinesToSelections([], savedLines);
        }
      } else {
        selections = applySavedLinesToSelections([], savedLines);
      }

      return {
        ...room,
        roomTypeId: room.roomTypeId || "",
        roomTypeName,
        name,
        length: room.length ?? "",
        width: room.width ?? "",
        height: room.height ?? "3",
        selections,
        workItemsLoaded: true,
        savedLines: undefined,
      };
    })
  );

  return {
    floors,
    rooms,
    sourceEstimateUuid: seed.sourceEstimateUuid || null,
  };
}
