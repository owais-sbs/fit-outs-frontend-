/** UAE Dirham symbol (Arabic: د.إ) */
export const DIRHAM_SYMBOL = "د.إ";

export const CURRENCY_CODE = "AED";

function resolveDecimals(optionsOrLegacy) {
  if (typeof optionsOrLegacy === "number") return optionsOrLegacy;
  if (typeof optionsOrLegacy === "string") return 2;
  if (optionsOrLegacy && typeof optionsOrLegacy === "object") {
    return optionsOrLegacy.decimals ?? 2;
  }
  return 2;
}

/** Format a numeric amount with the Dirham symbol, e.g. "د.إ 1,234.56" */
export function formatCurrency(amount, optionsOrLegacy) {
  const decimals = resolveDecimals(optionsOrLegacy);
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  const formatted = safe.toLocaleString("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${DIRHAM_SYMBOL} ${formatted}`;
}

/** Compact amounts for dashboards: د.إ 1.2M, د.إ 450k */
export function formatCurrencyCompact(amount) {
  const n = Number(amount) || 0;
  if (n >= 1_000_000) return `${DIRHAM_SYMBOL} ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${DIRHAM_SYMBOL} ${Math.round(n / 1000)}k`;
  return formatCurrency(n, { decimals: 0 });
}

/** Table cells: show dash when empty/zero unless zero is meaningful */
export function formatCurrencyOrDash(amount, decimals = 0) {
  const n = Number(amount);
  if (amount == null || amount === "" || Number.isNaN(n) || n === 0) {
    return n === 0 ? formatCurrency(0, { decimals }) : "—";
  }
  return formatCurrency(n, { decimals });
}

/** Whole-number amounts (project budgets, director views) */
export function formatAed(value) {
  return formatCurrency(value, { decimals: 0 });
}

/** Cover letters / estimates — same as formatCurrency with 2 decimals */
export function formatEstimateAmount(amount) {
  return formatCurrency(amount, { decimals: 2 });
}
