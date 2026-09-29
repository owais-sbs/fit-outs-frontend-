/**
 * Shared chart color palette — brand blue family + neutrals.
 * Use for admin dashboard charts (EvilCharts light/dark pairs).
 */
export const CHART_PALETTE = [
  "#2563eb", // brand blue
  "#0ea5e9", // sky
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#64748b", // slate neutral
  "#94a3b8", // light neutral
];

/** Darker companions for light-mode gradients (same order as CHART_PALETTE). */
const CHART_PALETTE_DARKER = [
  "#1d4ed8",
  "#0284c7",
  "#4f46e5",
  "#0d9488",
  "#475569",
  "#64748b",
];

/** Lighter companions for dark-mode gradients. */
const CHART_PALETTE_LIGHTER = [
  "#60a5fa",
  "#38bdf8",
  "#818cf8",
  "#2dd4bf",
  "#94a3b8",
  "#cbd5e1",
];

export function chartColor(i) {
  return CHART_PALETTE[i % CHART_PALETTE.length];
}

/**
 * EvilCharts-style light/dark color pairs: { light: [from, to], dark: [from, to] }
 */
export function chartPair(i) {
  const idx = i % CHART_PALETTE.length;
  return {
    light: [CHART_PALETTE[idx], CHART_PALETTE_DARKER[idx]],
    dark: [CHART_PALETTE_LIGHTER[idx], CHART_PALETTE[idx]],
  };
}

export default CHART_PALETTE;
