/** Shared delay reason codes for progress updates and duration extensions. */
export const DELAY_REASON_PRESETS = [
  { code: "WEATHER", label: "Adverse weather" },
  { code: "MATERIAL_DELAY", label: "Material / delivery delay" },
  { code: "CLIENT_CHANGE", label: "Client instruction / scope change" },
  { code: "ACCESS_CONSTRAINT", label: "Site access / permit constraint" },
  { code: "LABOUR_SHORTAGE", label: "Labour shortage" },
  { code: "DESIGN_HOLD", label: "Design / drawing hold" },
  { code: "OTHER", label: "Custom" },
];

/**
 * Format for activity.delayReason / ProgressUpdateRequest.delayReason
 * (same style as ScheduleDurationExtensionService.formatDelayReason).
 */
export function formatDelayReason(code, text) {
  const preset = DELAY_REASON_PRESETS.find((r) => r.code === code);
  const label = preset?.label || code || "";
  const trimmed = String(text || "").trim();
  if (code === "OTHER") {
    return trimmed || label;
  }
  if (trimmed) {
    return `${label} — ${trimmed}`;
  }
  return label;
}
