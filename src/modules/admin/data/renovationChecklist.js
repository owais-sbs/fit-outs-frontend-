/** JCT Renovation Prototype — categories (A–M) and rooms for site-visit scheduling */

export const RENOVATION_CATEGORIES = [
  "Flooring & Skirting",
  "Staircase Flooring and Balustrade",
  "Ceiling Works",
  "Painting Works",
  "Plumbing Works",
  "Electrical Works",
  "AC Works",
  "Joinery Works",
  "Aluminum Works",
  "Patio Enclosure",
  "Extension Work",
  "Balcony / Terrace Works",
  "External Works",
  "Other Information",
];

export const RENOVATION_ROOMS = [
  "Ground Floor",
  "First Floor",
  "Powder Room",
  "Maid's Bathroom",
  "Bathroom 1",
  "Bathroom 2",
  "Master Bathroom",
  "Water Heater",
  "General",
];

/** Suggested rooms when a category is selected */
export const CATEGORY_ROOM_SUGGESTIONS = {
  "Flooring & Skirting": ["Ground Floor", "First Floor"],
  "Staircase Flooring and Balustrade": ["General"],
  "Ceiling Works": ["General"],
  "Painting Works": ["General"],
  "Plumbing Works": [
    "Powder Room",
    "Maid's Bathroom",
    "Bathroom 1",
    "Bathroom 2",
    "Master Bathroom",
    "Water Heater",
  ],
  "Electrical Works": ["General"],
  "AC Works": ["General"],
  "Joinery Works": ["General"],
  "Aluminum Works": ["General"],
  "Patio Enclosure": ["General"],
  "Extension Work": ["General"],
  "Balcony / Terrace Works": ["General"],
  "External Works": ["General"],
  "Other Information": ["General"],
};

export function suggestedRoomsForCategories(categories = []) {
  const set = new Set();
  categories.forEach((cat) => {
    (CATEGORY_ROOM_SUGGESTIONS[cat] || ["General"]).forEach((r) => set.add(r));
  });
  return [...set];
}
