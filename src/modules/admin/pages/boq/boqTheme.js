/** Fit-outs BOQ document theme — matches branded invoice template */
export const BOQ_THEME = {
  navy: "#1F3A34",
  navyDark: "#0F2027",
  orange: "#E07B39",
  orangeLight: "#C8A97E",
  orangeAccent: "#C8A97E",
  orangeGradientFrom: "#C8A97E",
  orangeGradientTo: "#E07B39",
  cream: "#F7F5F2",
  creamRoom: "#F7F5F2",
  roomTotalBg: "#F0EDE8",
  metaBg: "#ffffff",
  metaBorder: "#E5E1DA",
  metaLabel: "#6B6B6B",
  tableHeader: "#1F3A34",
  surfaceBadge: "#F0EDE8",
  surfaceBadgeText: "#6B6B6B",
  grandTotalBg: "#1F3A34",
  sectionBg: "#F7F5F2",
  lineAlt: "#FBFAF8",
};

export const COMPANY = {
  name: "JCT Contracting",
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

export function formatBoqAmount(amount, currency = "AED") {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${currency} ${n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${currency} ${n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function resolveSurface(wallName, categoryLabel) {
  if (/ceiling/i.test(wallName || "")) return "Ceiling";
  if (/floor/i.test(wallName || "")) return "Floor";
  if (/wall/i.test(wallName || "")) return "Walls";
  if (categoryLabel === "Flooring") return "Floor";
  if (categoryLabel === "Painting") return "Walls";
  return wallName || "Walls";
}

export function buildBoqHierarchy(floors, rooms, lines) {
  const qasLines = (lines || []).filter((l) => l.source !== "additional");

  return floors
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
