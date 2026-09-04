/** JCT Renovation Prototype — floor → room → category → items */

export const PROPERTY_TYPES = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "CUSTOM", label: "Custom" },
];

export const RENOVATION_CATALOG = [
  {
    category: "Flooring & Skirting",
    items: [
      "Flooring: Retain / No Modification",
      "Flooring: Tile (size: _______)",
      "Flooring: SPC flooring",
      "Flooring: Tile on top",
      "Flooring: Removal of Existing",
      "Flooring: Others / Specific Item",
      "Skirting: Retain / No Modification",
      "Skirting: MDF Skirting",
      "Skirting: Tile Skirting",
      "Skirting: Client to Supplied",
      "Skirting: Removal and Repair Only",
      "Skirting: Others (Marble, Engineered wood, Microcement, etc.)",
    ],
  },
  {
    category: "Staircase Flooring and Balustrade",
    items: [
      "Retain Existing Flooring",
      "New Flooring",
      "Polishing of Existing Flooring",
      "Retain Existing Balustrade",
      "Repainting of Existing Balustrade",
      "New Balustrade / Specify Type",
    ],
  },
  {
    category: "Ceiling Works",
    items: [
      "Retain / No Modification",
      "New Ceiling Everywhere",
      "Ceiling with Cove Lights",
      "Ceiling with Moulding / Cornice",
      "Regular Ceiling",
      "Renovated Areas Only",
      "Others / Specific Item",
    ],
  },
  {
    category: "Painting Works",
    items: [
      "Internal",
      "External",
      "Others / Please Specify Area",
    ],
  },
  {
    category: "Plumbing Works",
    items: [
      "Concealed WC",
      "Concealed Mixers",
      "Pre-existing Layout",
      "Water Heater: Retain Existing",
      "Water Heater: New Normal Waterheater",
      "Water Heater: Solar Waterheater",
      "Others",
    ],
  },
  {
    category: "Electrical Works",
    items: [
      "New Switches & Sockets",
      "Others",
    ],
  },
  {
    category: "AC Works",
    items: [
      "New AC Unit",
      "New AC Grills",
      "New Thermostats",
      "Deep Cleaning of ACU and Ducts",
    ],
  },
  {
    category: "Joinery Works",
    items: [
      "New Kitchen Laminated",
      "Kitchen Accessories / Specify",
      "Wardrobes",
      "Vanity Units Laminated",
      "Vanity Units Shutters",
      "Vanity Units Drawers",
      "New Kitchen Painted",
      "Vanity Units Painted",
      "TV Unit",
      "Internal Doors Repainting",
      "Wardrobe Shutters Repainting",
      "New Ironmongeries and Door Handle",
    ],
  },
  {
    category: "Aluminum Works",
    items: [
      "Retain Existing",
      "New Windows and Doors",
      "Others",
    ],
  },
  {
    category: "Patio Enclosure",
    items: [
      "No",
      "Yes / Specify Location",
      "Others",
    ],
  },
  {
    category: "Extension Work",
    items: [
      "No",
      "Yes / Specify Location",
      "Others",
    ],
  },
  {
    category: "Balcony / Terrace Works",
    items: [
      "No",
      "Yes / Specify Location",
      "Others",
    ],
  },
  {
    category: "External Works",
    items: [
      "Landscaping",
      "Specify works",
    ],
  },
  {
    category: "Other Information",
    items: [
      "Pictures / Attachment notes",
      "As-Built Drawings notes",
      "Designer",
      "Recommended by",
      "Referral Commission (%)",
    ],
  },
];

export const RENOVATION_CATEGORIES = RENOVATION_CATALOG.map((entry) => entry.category);

export const FLOOR_PRESETS = {
  RESIDENTIAL: ["Ground Floor", "First Floor", "Second Floor", "Basement", "Roof / Terrace", "General"],
  COMMERCIAL: ["Ground Floor", "Mezzanine", "First Floor", "Basement", "Roof", "General"],
  CUSTOM: [],
};

export const ROOM_PRESETS = {
  RESIDENTIAL: [
    "Living Room",
    "Dining",
    "Kitchen",
    "Master Bedroom",
    "Bedroom",
    "Powder Room",
    "Maid's Bathroom",
    "Bathroom 1",
    "Bathroom 2",
    "Master Bathroom",
    "Water Heater",
    "Balcony",
    "General",
  ],
  COMMERCIAL: [
    "Reception",
    "Open Plan",
    "Meeting Room",
    "Store",
    "Washroom",
    "Pantry",
    "Server Room",
    "General",
  ],
  CUSTOM: [],
};

/** @deprecated Prefer FLOOR_PRESETS / ROOM_PRESETS */
export const RENOVATION_ROOMS = [...FLOOR_PRESETS.RESIDENTIAL, ...ROOM_PRESETS.RESIDENTIAL];

export function itemsForCategory(category) {
  const entry = RENOVATION_CATALOG.find((c) => c.category === category);
  return entry ? entry.items : [];
}

export function floorPresetsForType(propertyType) {
  return FLOOR_PRESETS[propertyType] || [];
}

export function roomPresetsForType(propertyType) {
  return ROOM_PRESETS[propertyType] || [];
}

/** Normalize legacy flat scopes `{ roomName, selections }` into floor → rooms. */
export function normalizeRoomScopes(scopes = []) {
  if (!Array.isArray(scopes)) return [];
  return scopes
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;

      // New shape: floor with nested rooms
      if (Array.isArray(entry.rooms) || entry.floorName) {
        const floorName = String(entry.floorName || "General").trim() || "General";
        const rooms = (Array.isArray(entry.rooms) ? entry.rooms : [])
          .filter((room) => room?.roomName)
          .map((room) => ({
            roomName: String(room.roomName).trim(),
            selections: normalizeSelections(room.selections),
          }))
          .filter((room) => room.roomName);
        return { floorName, rooms };
      }

      // Legacy flat: treat former "room" as a room under General floor
      if (entry.roomName) {
        return {
          floorName: "General",
          rooms: [
            {
              roomName: String(entry.roomName).trim(),
              selections: normalizeSelections(entry.selections),
            },
          ],
        };
      }
      return null;
    })
    .filter(Boolean);
}

function normalizeSelections(selections) {
  if (!Array.isArray(selections)) return [];
  return selections
    .filter((sel) => sel?.category)
    .map((sel) => ({
      category: String(sel.category).trim(),
      items: Array.isArray(sel.items)
        ? sel.items.map((item) => String(item).trim()).filter(Boolean)
        : [],
    }))
    .filter((sel) => sel.category && sel.items.length > 0);
}

export function deriveCategoriesFromScopes(roomScopes = []) {
  const set = new Set();
  normalizeRoomScopes(roomScopes).forEach((floor) => {
    (floor.rooms || []).forEach((room) => {
      (room.selections || []).forEach((sel) => {
        if (sel?.category) set.add(sel.category);
      });
    });
  });
  return [...set];
}

export function deriveRoomsFromScopes(roomScopes = []) {
  const labels = [];
  normalizeRoomScopes(roomScopes).forEach((floor) => {
    (floor.rooms || []).forEach((room) => {
      if (room?.roomName) {
        labels.push(`${floor.floorName} / ${room.roomName}`);
      }
    });
  });
  return labels;
}

export function countScopedItems(roomScopes = []) {
  return normalizeRoomScopes(roomScopes).reduce((sum, floor) => {
    return (
      sum +
      (floor.rooms || []).reduce(
        (roomSum, room) =>
          roomSum +
          (room.selections || []).reduce((inner, sel) => inner + (sel.items?.length || 0), 0),
        0
      )
    );
  }, 0);
}

export function countScopedRooms(roomScopes = []) {
  return normalizeRoomScopes(roomScopes).reduce(
    (sum, floor) => sum + (floor.rooms || []).length,
    0
  );
}

export function isValidRoomScopes(roomScopes = []) {
  const floors = normalizeRoomScopes(roomScopes);
  if (floors.length === 0) return false;
  return floors.some((floor) =>
    (floor.rooms || []).some(
      (room) =>
        room?.roomName?.trim() &&
        (room.selections || []).some((sel) => sel?.category && (sel.items || []).length > 0)
    )
  );
}

export function checklistItemsFromScopes(roomScopes = []) {
  const items = [];
  normalizeRoomScopes(roomScopes).forEach((floor) => {
    const floorName = floor.floorName || "General";
    (floor.rooms || []).forEach((room) => {
      const roomName = room?.roomName?.trim() || "General";
      const locationLabel = `${floorName} · ${roomName}`;
      (room.selections || []).forEach((sel) => {
        const category = sel?.category || "General";
        (sel.items || []).forEach((question) => {
          const parsed = parseScopeItem(question);
          items.push({
            id: `${floorName}|${roomName}|${category}|${parsed.raw}`,
            floorName,
            roomName: locationLabel,
            roomOnly: roomName,
            sectionName: category,
            label: parsed.label,
            question: parsed.label,
            rateAed: parsed.custom ? parsed.rateAed : null,
            required: true,
            custom: parsed.custom,
          });
        });
      });
    });
  });
  return items;
}

/** Legacy helper */
export function suggestedRoomsForCategories(categories = []) {
  if (!categories?.length) return [];
  return ["General"];
}

/** Parse "Floor · Room" tab label from checklistItemsFromScopes */
export function parseRoomTabLabel(roomTabLabel = "") {
  const parts = String(roomTabLabel).split("·").map((p) => p.trim());
  if (parts.length >= 2) {
    return { floorName: parts[0], roomOnly: parts.slice(1).join(" · ") };
  }
  return { floorName: "General", roomOnly: roomTabLabel.trim() || "General" };
}

const CUSTOM_CATEGORY = "Additional works";

/** Encode a custom on-site work item (label + AED rate) for roomScopes JSON storage. */
export function encodeCustomScopeItem(label, rateAed) {
  return JSON.stringify({
    __customScopeItem: true,
    label: String(label || "").trim(),
    rateAed: Number(rateAed) || 0,
  });
}

/** Parse a scope item string — plain catalog text or encoded custom item. */
export function parseScopeItem(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { label: "", rateAed: null, custom: false, raw: text };
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.__customScopeItem === true) {
      return {
        label: String(parsed.label || "").trim(),
        rateAed: Number(parsed.rateAed) || 0,
        custom: true,
        raw: text,
      };
    }
  } catch {
    /* plain string item */
  }
  return { label: text, rateAed: null, custom: false, raw: text };
}

/** Scope item label for display / matching (never the raw JSON). */
export function scopeItemLabel(raw) {
  return parseScopeItem(raw).label;
}

/** Append a custom inspection item to room scopes (persisted via checklist-scope PATCH). */
export function appendCustomItemToRoomScopes(
  roomScopes = [],
  floorName,
  roomOnly,
  question,
  category = CUSTOM_CATEGORY,
  rateAed = 0
) {
  const trimmed = (question || "").trim();
  if (!trimmed) return normalizeRoomScopes(roomScopes);
  const encoded = encodeCustomScopeItem(trimmed, rateAed);

  const next = normalizeRoomScopes(roomScopes).map((floor) => ({
    ...floor,
    rooms: (floor.rooms || []).map((room) => ({ ...room, selections: [...(room.selections || [])] })),
  }));

  let floorIndex = next.findIndex(
    (f) => (f.floorName || "").trim().toLowerCase() === (floorName || "").trim().toLowerCase()
  );
  if (floorIndex === -1) {
    next.push({ floorName: floorName || "General", rooms: [] });
    floorIndex = next.length - 1;
  }

  let roomIndex = (next[floorIndex].rooms || []).findIndex(
    (r) => (r.roomName || "").trim().toLowerCase() === (roomOnly || "").trim().toLowerCase()
  );
  if (roomIndex === -1) {
    next[floorIndex].rooms = [...(next[floorIndex].rooms || []), { roomName: roomOnly || "General", selections: [] }];
    roomIndex = next[floorIndex].rooms.length - 1;
  }

  const room = next[floorIndex].rooms[roomIndex];
  const cat = (category || CUSTOM_CATEGORY).trim();
  let selIndex = (room.selections || []).findIndex((s) => s.category === cat);
  const existingLabels = new Set(
    (selIndex >= 0 ? room.selections[selIndex].items || [] : []).map((item) => scopeItemLabel(item).toLowerCase())
  );
  if (existingLabels.has(trimmed.toLowerCase())) {
    return normalizeRoomScopes(next);
  }

  if (selIndex === -1) {
    room.selections = [...(room.selections || []), { category: cat, items: [encoded] }];
  } else {
    room.selections[selIndex] = {
      ...room.selections[selIndex],
      items: [...(room.selections[selIndex].items || []), encoded],
    };
  }

  return normalizeRoomScopes(next);
}

/** Remove a custom checklist item from room scopes by question text. */
export function removeCustomItemFromRoomScopes(roomScopes = [], floorName, roomOnly, question) {
  const q = (question || "").trim();
  if (!q) return normalizeRoomScopes(roomScopes);

  return normalizeRoomScopes(roomScopes).map((floor) => {
    if ((floor.floorName || "").trim().toLowerCase() !== (floorName || "").trim().toLowerCase()) {
      return floor;
    }
    return {
      ...floor,
      rooms: (floor.rooms || []).map((room) => {
        if ((room.roomName || "").trim().toLowerCase() !== (roomOnly || "").trim().toLowerCase()) {
          return room;
        }
        const selections = (room.selections || [])
          .map((sel) => ({
            ...sel,
            items: (sel.items || []).filter((item) => scopeItemLabel(item) !== q),
          }))
          .filter((sel) => (sel.items || []).length > 0);
        return { ...room, selections };
      }),
    };
  });
}

export function buildCustomChecklistItem(floorName, roomOnly, category, question, rateAed = 0) {
  const label = (question || "").trim();
  const cat = (category || CUSTOM_CATEGORY).trim();
  const locationLabel = `${floorName} · ${roomOnly}`;
  const raw = encodeCustomScopeItem(label, rateAed);
  return {
    id: `custom|${floorName}|${roomOnly}|${cat}|${Date.now()}`,
    floorName,
    roomName: locationLabel,
    roomOnly,
    sectionName: cat,
    label,
    question: label,
    rateAed: Number(rateAed) || 0,
    required: true,
    custom: true,
    scopeRaw: raw,
  };
}

/** Stable key linking a checklist scope item to a BoQ line. */
export function buildScopeRef(floorName, roomName, category, label) {
  return `${floorName || "General"}|${roomName || "General"}|${category || "General"}|${label || ""}`;
}

/** Flatten roomScopes into scope rows with stable refs. */
export function flattenScopedItems(roomScopes = []) {
  const items = [];
  normalizeRoomScopes(roomScopes).forEach((floor) => {
    const floorName = floor.floorName || "General";
    (floor.rooms || []).forEach((room) => {
      const roomName = room?.roomName?.trim() || "General";
      const roomTabLabel = `${floorName} · ${roomName}`;
      (room.selections || []).forEach((sel) => {
        const category = sel?.category || "General";
        (sel.items || []).forEach((raw) => {
          const parsed = parseScopeItem(raw);
          if (!parsed.label) return;
          items.push({
            scopeRef: buildScopeRef(floorName, roomName, category, parsed.label),
            floorName,
            roomName,
            roomTabLabel,
            category,
            label: parsed.label,
            rateAed: parsed.custom ? parsed.rateAed : null,
            custom: parsed.custom,
          });
        });
      });
    });
  });
  return items;
}

/** Match a submitted report row to a flattened scope item. */
export function reportItemMatchesScope(reportItem = {}, scopeItem = {}) {
  if (String(reportItem.response || "").toUpperCase() !== "YES") return false;
  const question = String(reportItem.question || "").trim().toLowerCase();
  const label = String(scopeItem.label || "").trim().toLowerCase();
  const section = String(reportItem.sectionName || "").trim().toLowerCase();
  const category = String(scopeItem.category || "").trim().toLowerCase();
  const room = String(reportItem.roomName || "").trim().toLowerCase();
  const tab = String(scopeItem.roomTabLabel || "").trim().toLowerCase();
  return question === label && section === category && room === tab;
}

/** Keep only scope items answered YES on the submitted site visit report. */
export function filterScopeItemsByReportYes(roomScopes = [], reportItems = []) {
  const all = flattenScopedItems(roomScopes);
  if (!Array.isArray(reportItems) || reportItems.length === 0) return [];
  return all.filter((scope) => reportItems.some((row) => reportItemMatchesScope(row, scope)));
}

/** Rebuild floor → room → selections using only checklist items marked YES. */
export function filterRoomScopesByReportYes(roomScopes = [], reportItems = []) {
  const approved = filterScopeItemsByReportYes(roomScopes, reportItems);
  if (approved.length === 0) return [];

  const floorOrder = [];
  const floorMap = new Map();

  approved.forEach((item) => {
    const floorName = item.floorName || "General";
    const roomName = item.roomName || "General";
    const category = item.category || "General";
    const label = item.label;
    if (!label) return;

    if (!floorMap.has(floorName)) {
      floorMap.set(floorName, { roomOrder: [], rooms: new Map() });
      floorOrder.push(floorName);
    }
    const floor = floorMap.get(floorName);

    if (!floor.rooms.has(roomName)) {
      floor.rooms.set(roomName, { catOrder: [], categories: new Map() });
      floor.roomOrder.push(roomName);
    }
    const room = floor.rooms.get(roomName);

    if (!room.categories.has(category)) {
      room.categories.set(category, []);
      room.catOrder.push(category);
    }
    room.categories.get(category).push(label);
  });

  return floorOrder.map((floorName) => {
    const floor = floorMap.get(floorName);
    return {
      floorName,
      rooms: floor.roomOrder.map((roomName) => {
        const room = floor.rooms.get(roomName);
        return {
          roomName,
          selections: room.catOrder.map((category) => ({
            category,
            items: room.categories.get(category),
          })),
        };
      }),
    };
  });
}

/** Client-side search over the renovation checklist catalog (for typeahead). */
export function searchRenovationCatalogItems(query = "", limit = 6) {
  const q = String(query).trim().toLowerCase();
  if (q.length < 2) return [];
  const results = [];
  for (const entry of RENOVATION_CATALOG) {
    for (const item of entry.items || []) {
      if (item.toLowerCase().includes(q)) {
        results.push({
          id: `catalog:${entry.category}:${item}`,
          label: item,
          category: entry.category,
          source: "catalog",
        });
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}
