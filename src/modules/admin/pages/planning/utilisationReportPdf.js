import { downloadBoqPdf, exportBoqPdfBlob } from "../boq/boqPdfExport";

const EXPORT_OPTS = { hideChrome: false };

/** Download utilisation report PDF. */
export async function downloadUtilisationReportPdf(elementId, filename = "Utilisation-Report.pdf") {
  await downloadBoqPdf(elementId, filename, EXPORT_OPTS);
}

/** Open utilisation report PDF in a new tab for preview. */
export async function previewUtilisationReportPdf(elementId) {
  const blob = await exportBoqPdfBlob(elementId, EXPORT_OPTS);
  const pdfBlob =
    blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  const url = URL.createObjectURL(pdfBlob);

  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked. Allow popups for this site to preview the utilisation report.");
  }
  try {
    win.opener = null;
  } catch {
    /* ignore */
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return pdfBlob;
}

/** Inclusive calendar days between ISO date strings (YYYY-MM-DD). */
export function inclusiveDays(start, end) {
  if (!start || !end) return 0;
  const s = new Date(`${String(start).slice(0, 10)}T00:00:00`);
  const e = new Date(`${String(end).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0;
  return Math.floor((e.getTime() - s.getTime()) / 86_400_000) + 1;
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

function activityName(activityByUuid, activityUuid) {
  const act = activityByUuid?.get?.(String(activityUuid || ""));
  if (!act) return "—";
  return act.name || act.title || "Untitled activity";
}

/** Build labour utilisation report rows from assignments + lookups. */
export function buildLabourUtilisationRows(assignments, activityByUuid, crewByUuid) {
  return (assignments || []).map((a, idx) => {
    const crew = crewByUuid?.get?.(String(a.crewUuid || ""));
    return {
      key: a.uuid || `labour-row-${idx}`,
      crewName: a.crewName || crew?.name || "—",
      headcount: crew?.headcount ?? a.headcount ?? 0,
      activityName: activityName(activityByUuid, a.activityUuid),
      startDate: formatDate(a.startDate),
      endDate: formatDate(a.endDate),
      days: inclusiveDays(a.startDate, a.endDate),
    };
  });
}

/** Build resource utilisation report rows from assignments + lookups. */
export function buildResourceUtilisationRows(assignments, activityByUuid, typeByUuid) {
  return (assignments || []).map((a, idx) => {
    const type = typeByUuid?.get?.(String(a.resourceTypeUuid || ""));
    return {
      key: a.uuid || `resource-row-${idx}`,
      resourceName: a.resourceTypeName || type?.name || "—",
      kind: a.kind || type?.kind || "—",
      quantity: a.quantity ?? 1,
      activityName: activityName(activityByUuid, a.activityUuid),
      startDate: formatDate(a.startDate),
      endDate: formatDate(a.endDate),
      days: inclusiveDays(a.startDate, a.endDate),
    };
  });
}
