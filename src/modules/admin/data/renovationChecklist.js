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
          items.push({
            id: `${floorName}|${roomName}|${category}|${question}`,
            floorName,
            roomName: locationLabel,
            roomOnly: roomName,
            sectionName: category,
            label: question,
            question,
            required: false,
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
