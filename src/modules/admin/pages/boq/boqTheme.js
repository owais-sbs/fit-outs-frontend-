/** Fit-outs BOQ document theme — matches branded invoice template */
export const BOQ_THEME = {
  navy: "#1a1c2e",
  navyDark: "#141824",
  orange: "#c8662a",
  orangeLight: "#d4844a",
  orangeAccent: "#d97706",
  orangeGradientFrom: "#7a4a24",
  orangeGradientTo: "#c8662a",
  cream: "#fff8e7",
  creamRoom: "#fff8e7",
  roomTotalBg: "#fdecd8",
  metaBg: "#ffffff",
  metaBorder: "#e5e7eb",
  metaLabel: "#9ca3af",
  tableHeader: "#1a1c2e",
  surfaceBadge: "#eef0f3",
  surfaceBadgeText: "#4b5563",
  grandTotalBg: "#1a1c2e",
  sectionBg: "#fafafa",
  lineAlt: "#f9fafb",
};

export const COMPANY = {
  name: "Fitouts Interiors",
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
  return floors
    .map((floor) => {
      const floorRooms = rooms.filter((r) => String(r.floorId) === String(floor.id));
      const roomGroups = floorRooms
        .map((room) => {
          const roomLines = lines.filter((l) => l.room === room.name && l.floor === floor.name);
          const roomTotal = roomLines.reduce((s, l) => s + l.amount, 0);
          return { room, lines: roomLines, total: roomTotal };
        })
        .filter((g) => g.lines.length > 0);

      const floorTotal = roomGroups.reduce((s, g) => s + g.total, 0);
      return { floor, rooms: roomGroups, total: floorTotal };
    })
    .filter((f) => f.rooms.length > 0);
}
