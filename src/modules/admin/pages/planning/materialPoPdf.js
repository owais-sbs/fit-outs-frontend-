import { downloadBoqPdf, exportBoqPdfBlob } from "../boq/boqPdfExport";

/** Keep sidebar/chrome visible — capture already happens in an offscreen iframe. */
const PO_EXPORT_OPTS = { hideChrome: false };

/** Download PO PDF in the current tab. */
export async function downloadMaterialPoPdf(elementId, filename = "Purchase-Order.pdf") {
  await downloadBoqPdf(elementId, filename, PO_EXPORT_OPTS);
}

/** Open PO PDF in a new tab for preview (no download). */
export async function previewMaterialPoPdf(elementId) {
  const blob = await exportBoqPdfBlob(elementId, PO_EXPORT_OPTS);
  // Ensure MIME type so the browser renders inline instead of saving
  const pdfBlob =
    blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  const url = URL.createObjectURL(pdfBlob);

  // Do not pass "noopener" here — it makes window.open return null even when the
  // tab opens, which previously triggered a false download fallback.
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked. Allow popups for this site to preview the purchase order.");
  }
  try {
    win.opener = null;
  } catch {
    /* ignore cross-origin timing */
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return pdfBlob;
}

export function buildPoNumber(projectId, packageKey = "ALL") {
  const safe = String(packageKey || "ALL").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "ALL";
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `PO-${projectId}-${safe}-${ymd}`;
}

export function enrichPoLines(planLines, materialById) {
  return (planLines || []).map((line, idx) => {
    const mat = line.materialId ? materialById.get(String(line.materialId)) : null;
    const qty = Number(line.plannedQty) || 0;
    const unitCost = Number(mat?.costPrice ?? 0) || 0;
    const workNames = Array.isArray(line.workItemNames)
      ? line.workItemNames
      : typeof line.workItemNames === "string" && line.workItemNames
        ? line.workItemNames.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    return {
      key: line.uuid || `po-line-${idx}`,
      materialName: line.materialName || mat?.materialName || "Material",
      materialCode: mat?.materialCode || "",
      qty,
      unit: line.unit || mat?.unitType || "",
      unitCost,
      amount: qty * unitCost,
      notes: line.notes || "",
      workItemLabel: workNames.join(" · "),
      supplierName: mat?.supplierName || "",
    };
  });
}

export function dominantSupplier(enrichedLines) {
  const counts = new Map();
  for (const line of enrichedLines || []) {
    const name = (line.supplierName || "").trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}
