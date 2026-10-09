/** Fit-outs BOQ document theme — navy + gold, matches admin / superadmin dashboard. */
import { formatCurrency } from "@/shared/utils/currency";

export const BOQ_THEME = {
  navy: "#0a1628",
  navyDark: "#06101c",
  orange: "#C9A96E",
  orangeLight: "#D9BE8A",
  orangeAccent: "#C9A96E",
  orangeGradientFrom: "#C9A96E",
  orangeGradientTo: "#A8894F",
  cream: "#FAF7F2",
  creamRoom: "#F5F0E8",
  roomTotalBg: "#EFE8DC",
  metaBg: "#ffffff",
  metaBorder: "#E5E1DA",
  metaLabel: "#6B6B6B",
  tableHeader: "#0a1628",
  surfaceBadge: "#F0EDE8",
  surfaceBadgeText: "#6B6B6B",
  grandTotalBg: "#0a1628",
  sectionBg: "#FAF7F2",
  lineAlt: "#FBFAF8",
};

export const COMPANY = {
  name: "Fitouts Contracting",
  tagline: "Premium Fit-Out & Interior Solutions",
  address: "Business Bay, Dubai, UAE",
  email: "projects@fitouts.com.au",
  phone: "+971 4 000 0000",
};

/** Force backgrounds to render in print/PDF */
export const BOQ_PRINT_COLOR = {
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
};

export function formatBoqDate(iso) {
  return new Date(iso || Date.now()).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatBoqAmount(amount) {
  return formatCurrency(amount, { decimals: 2 });
}

export function resolveSurface(wallName, categoryLabel) {
  if (/ceiling/i.test(wallName || "")) return "Ceiling";
  if (/floor/i.test(wallName || "")) return "Floor";
  if (/wall/i.test(wallName || "")) return "Walls";
  if (categoryLabel === "Flooring") return "Floor";
  if (categoryLabel === "Painting") return "Walls";
  return wallName || "Walls";
}

/** Group persisted BOQ lines by floor/room labels when no QAS survey tree exists. */
export function buildBoqHierarchyFromLines(lines = []) {
  const floors = new Map();

  (lines || []).forEach((line) => {
    const floorName = String(line.floor || line.floorLabel || "").trim() || "General";
    const roomName = String(line.room || line.roomLabel || "").trim() || "Items";
    if (!floors.has(floorName)) {
      floors.set(floorName, {
        floor: { id: `floor-${floorName}`, name: floorName },
        rooms: new Map(),
      });
    }
    const floorEntry = floors.get(floorName);
    if (!floorEntry.rooms.has(roomName)) {
      floorEntry.rooms.set(roomName, {
        room: { id: `room-${floorName}-${roomName}`, name: roomName },
        lines: [],
        total: 0,
      });
    }
    const roomEntry = floorEntry.rooms.get(roomName);
    roomEntry.lines.push(line);
    roomEntry.total += parseFloat(line.amount) || 0;
  });

  return Array.from(floors.values()).map(({ floor, rooms }) => {
    const roomGroups = Array.from(rooms.values());
    const total = roomGroups.reduce((sum, g) => sum + g.total, 0);
    return { floor, rooms: roomGroups, total };
  });
}

export function buildBoqHierarchy(floors, rooms, lines) {
  const qasLines = (lines || []).filter((l) => l.source !== "additional");
  const hasSurveyTree = Array.isArray(floors) && floors.length > 0 && Array.isArray(rooms) && rooms.length > 0;

  if (!hasSurveyTree) {
    return buildBoqHierarchyFromLines(qasLines);
  }

  const fromTree = floors
    .map((floor) => {
      const floorRooms = rooms.filter((r) => String(r.floorId) === String(floor.id));
      const roomGroups = floorRooms
        .map((room) => {
          const roomLines = qasLines.filter(
            (l) =>
              String(l.roomId) === String(room.id) ||
              (l.floor === floor.name && l.room === (room.name || room.roomTypeName))
          );
          const roomTotal = roomLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
          return { room, lines: roomLines, total: roomTotal };
        })
        .filter((g) => g.lines.length > 0);

      const floorTotal = roomGroups.reduce((s, g) => s + g.total, 0);
      return { floor, rooms: roomGroups, total: floorTotal };
    })
    .filter((f) => f.rooms.length > 0);

  if (fromTree.length === 0 && qasLines.length > 0) {
    return buildBoqHierarchyFromLines(qasLines);
  }
  return fromTree;
}

export function buildAdditionalHierarchy(lines = []) {
  const additional = (lines || []).filter((l) => l.source === "additional");
  const groups = {};

  additional.forEach((line) => {
    const key = line.categoryCode || "OTHER";
    if (!groups[key]) {
      groups[key] = {
        categoryCode: key,
        categoryName: line.categoryName || line.parent || "Other Charges",
        lines: [],
        total: 0,
      };
    }
    groups[key].lines.push(line);
    groups[key].total += parseFloat(line.amount) || 0;
  });

  return Object.values(groups).sort((a, b) => a.categoryCode.localeCompare(b.categoryCode));
}
