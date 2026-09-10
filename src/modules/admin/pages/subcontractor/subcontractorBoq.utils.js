export function findApprovedBoq(boqs = []) {
  const list = Array.isArray(boqs) ? boqs : [];
  return (
    list.find((b) => b.status === "APPROVED" || b.status === "FINAL") ||
    list.find((b) => b.live === true) ||
    null
  );
}

/** Flat BOQ lines in sort order — one package per line after generate-from-boq. */
export function sortBoqLines(lines = []) {
  return [...(Array.isArray(lines) ? lines : [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function truncate(text, max = 72) {
  const s = String(text || "").trim();
  if (!s) return "BOQ item";
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function formatBoqLineMeta(line) {
  if (!line) return "";
  const parts = [];
  if (line.quantity != null) parts.push(`Qty ${line.quantity}`);
  if (line.unit) parts.push(line.unit);
  if (line.roomLabel) parts.push(line.roomLabel);
  if (line.floorLabel) parts.push(line.floorLabel);
  return parts.join(" · ");
}

export function findPackageForBoqLine(packages, line) {
  if (!line?.id) return null;
  return (packages || []).find((p) => String(p.boqLineId) === String(line.id)) || null;
}

export function formatBoqLineOptionLabel(line, pkg) {
  const desc = truncate(line?.description || line?.categoryName, 80);
  const meta = formatBoqLineMeta(line);
  const assigned = pkg?.appointedCompanyName || pkg?.appointedAccountId;
  const status = assigned
    ? ` — Assigned to ${pkg.appointedCompanyName || `account #${pkg.appointedAccountId}`}`
    : " — Unassigned";
  return `${desc}${meta ? ` (${meta})` : ""}${status}`;
}

export function isLineAssigned(pkg) {
  return Boolean(pkg?.appointedCompanyName || pkg?.appointedAccountId);
}
