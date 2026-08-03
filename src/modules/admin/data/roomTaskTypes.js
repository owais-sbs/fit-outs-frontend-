/** Fit-out room approval task types (aligned with backend RoomTaskType). */
export const ROOM_TASK_TYPES = [
  { value: "DESIGN", label: "Design" },
  { value: "CONCEPT_MOODBOARD", label: "Concept / moodboard" },
  { value: "LAYOUT_PLAN", label: "Layout plan" },
  { value: "THREE_D_RENDER", label: "3D render" },
  { value: "TILE_SELECTION", label: "Tile selection" },
  { value: "FLOORING_SELECTION", label: "Flooring selection" },
  { value: "PAINT_COLOR", label: "Paint color" },
  { value: "WALLPAPER", label: "Wallpaper" },
  { value: "JOINERY", label: "Joinery" },
  { value: "KITCHEN", label: "Kitchen" },
  { value: "WARDROBE", label: "Wardrobe" },
  { value: "BATHROOM_FITTINGS", label: "Bathroom fittings" },
  { value: "LIGHTING", label: "Lighting" },
  { value: "ELECTRICAL_POINTS", label: "Electrical points" },
  { value: "AC_LOCATION", label: "AC location" },
  { value: "CURTAINS_BLINDS", label: "Curtains / blinds" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "MATERIAL", label: "Material" },
  { value: "SAMPLE_APPROVAL", label: "Sample approval" },
  { value: "MEASUREMENT_CONFIRMATION", label: "Measurement confirmation" },
  { value: "CHANGE_ORDER", label: "Change order" },
  { value: "OTHER", label: "Other" },
  { value: "CUSTOM", label: "Custom (manual)…" },
];

export function formatTaskType(task) {
  if (task?.typeLabel) return task.typeLabel;
  const found = ROOM_TASK_TYPES.find((t) => t.value === task?.taskType);
  return found?.label || (task?.taskType || "Other").replace(/_/g, " ");
}
