import { jsPDF } from "jspdf";

function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "-";
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED`;
}

function activityPercent(a) {
  return Math.min(100, Math.max(0, Number(a?.percentComplete) || 0));
}

function weightedConstructionPercent(activities) {
  let weightSum = 0;
  let weightedPercentSum = 0;
  for (const a of activities) {
    const weight = Number(a.weight);
    const w = Number.isFinite(weight) && weight > 0 ? weight : 1;
    const pct = activityPercent(a);
    weightSum += w;
    weightedPercentSum += w * pct;
  }
  if (weightSum <= 0) return 0;
  return Math.round((weightedPercentSum / weightSum) * 100) / 100;
}

function normalizePaymentRows(invoices, milestones) {
  if (Array.isArray(invoices) && invoices.length) {
    return invoices.map((inv) => ({
      label: inv.invoiceNumber || inv.name || inv.description || `Payment ${String(inv.uuid || inv.id || "").slice(0, 8)}`,
      amount: inv.amount,
      status: inv.status || "-",
      dueDate: inv.dueDate || inv.paymentDueDate || null,
    }));
  }
  if (Array.isArray(milestones) && milestones.length) {
    return milestones.map((m) => ({
      label: m.name || `Milestone ${String(m.uuid || "").slice(0, 8)}`,
      amount: m.amount,
      status: m.status || m.latestPaymentRequest?.status || "-",
      dueDate: m.dueDate || null,
      percentCompleteRequired: m.percentCompleteRequired,
    }));
  }
  return [];
}

function truncateToWidth(doc, text, maxWidth) {
  const raw = String(text || "");
  if (!raw) return "-";
  if (doc.getTextWidth(raw) <= maxWidth) return raw;
  const ellipsis = "...";
  let lo = 0;
  let hi = raw.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = raw.slice(0, mid) + ellipsis;
    if (doc.getTextWidth(candidate) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return raw.slice(0, lo) + ellipsis;
}

/**
 * @param {object} report final room-approvals report
 * @param {string} projectName
 * @param {{ schedule?: object, invoices?: array, milestones?: array }} [extras]
 */
export async function downloadFinalApprovedPdf(report, projectName, extras = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  const contentRight = pageWidth - margin;

  // Construction table columns (left-aligned positions)
  const colActivity = margin;
  const colStart = margin + 250;
  const colEnd = margin + 330;
  const colPct = margin + 410;
  const colFlag = margin + 455;
  const activityMaxW = colStart - colActivity - 8;

  const ensureSpace = (needed = 60) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionTitle = (title) => {
    ensureSpace(40);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(title, margin, y);
    y += 8;
    doc.setDrawColor(180);
    doc.setLineWidth(0.6);
    doc.line(margin, y, contentRight, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Final approved package", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(projectName || report?.projectName || `Project #${report?.projectId}`, margin, y);
  y += 16;
  doc.text(`Generated ${new Date().toLocaleString()}`, margin, y);
  y += 28;
  doc.setTextColor(0);

  // --- Room approvals ---
  sectionTitle("Room approvals");
  const rooms = Array.isArray(report?.rooms) ? report.rooms : [];
  if (rooms.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text("No finalized (approved) items yet.", margin, y);
    doc.setTextColor(0);
    y += 22;
  } else {
    rooms.forEach((room) => {
      ensureSpace(80);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${room.floorLabel || "General"} - ${room.roomName}`, margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      (room.items || []).forEach((item) => {
        ensureSpace(70);
        doc.setFont("helvetica", "bold");
        doc.text(`- ${item.title}`, margin, y);
        y += 14;
        doc.setFont("helvetica", "normal");
        const lines = [
          `Type: ${(item.taskType || "").replace(/_/g, " ")}`,
          `File: ${item.fileName || "-"}`,
          item.approvedAt ? `Approved: ${new Date(item.approvedAt).toLocaleString()}` : null,
          item.clientApprovalDays != null ? `Client approval time: ${item.clientApprovalDays} day(s)` : null,
          item.revisionCount != null ? `Revisions: ${item.revisionCount}` : null,
        ].filter(Boolean);
        lines.forEach((line) => {
          const wrapped = doc.splitTextToSize(line, maxWidth - 12);
          doc.text(wrapped, margin + 12, y);
          y += wrapped.length * 12;
        });
        y += 8;
      });
      y += 10;
    });
  }

  // --- Construction progress (only activities with progress > 1%) ---
  sectionTitle("Construction progress (programme)");
  const allActivities = Array.isArray(extras?.schedule?.activities) ? extras.schedule.activities : [];
  const progressed = allActivities.filter((a) => activityPercent(a) > 1);

  if (allActivities.length === 0) {
    doc.setTextColor(90);
    doc.text("Programme not published yet.", margin, y);
    doc.setTextColor(0);
    y += 20;
  } else {
    const overall = weightedConstructionPercent(allActivities);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Overall construction progress: ${overall}%`, margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90);
    doc.text(
      `Showing ${progressed.length} of ${allActivities.length} activities with progress over 1%`,
      margin,
      y + 12
    );
    doc.setTextColor(0);
    y += 28;

    if (progressed.length === 0) {
      doc.setTextColor(90);
      doc.text("No activities with progress over 1% yet.", margin, y);
      doc.setTextColor(0);
      y += 20;
    } else {
      const drawHeader = () => {
        ensureSpace(28);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(60);
        doc.text("Activity", colActivity, y);
        doc.text("Start", colStart, y);
        doc.text("End", colEnd, y);
        doc.text("Progress", colPct, y);
        doc.text("Flag", colFlag, y);
        y += 4;
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(margin, y, contentRight, y);
        y += 14;
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
      };

      drawHeader();

      progressed.forEach((a, index) => {
        if (y + 18 > pageHeight - margin) {
          doc.addPage();
          y = margin;
          drawHeader();
        }

        const name = truncateToWidth(
          doc,
          a.name || a.activityCode || "Activity",
          activityMaxW
        );
        const start = a.startDate || "-";
        const end = a.endDate || "-";
        const pct = `${activityPercent(a)}%`;
        const flag = a.critical ? "Critical" : "";

        if (index % 2 === 1) {
          doc.setFillColor(246, 247, 249);
          doc.rect(margin - 2, y - 10, maxWidth + 4, 16, "F");
        }

        doc.setTextColor(0);
        doc.text(name, colActivity, y);
        doc.text(String(start), colStart, y);
        doc.text(String(end), colEnd, y);
        doc.text(pct, colPct, y);
        if (flag) {
          doc.setTextColor(150, 90, 20);
          doc.text(flag, colFlag, y);
          doc.setTextColor(0);
        }
        y += 16;
      });
      y += 10;
    }
  }

  // --- Payment progress ---
  sectionTitle("Payment progress");
  const paymentRows = normalizePaymentRows(extras?.invoices, extras?.milestones);
  if (paymentRows.length === 0) {
    doc.setTextColor(90);
    doc.text("No payment requests issued yet.", margin, y);
    doc.setTextColor(0);
    y += 20;
  } else {
    const total = paymentRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const paid = paymentRows
      .filter((r) => String(r.status).toUpperCase() === "PAID")
      .reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const outstanding = total - paid;

    const payColName = margin;
    const payColAmt = margin + 280;
    const payColStatus = margin + 380;
    const payColDue = margin + 460;
    const payNameMax = payColAmt - payColName - 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      `Total ${formatMoney(total)}  |  Paid ${formatMoney(paid)}  |  Outstanding ${formatMoney(outstanding)}`,
      margin,
      y
    );
    y += 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text("Payment", payColName, y);
    doc.text("Amount", payColAmt, y);
    doc.text("Status", payColStatus, y);
    doc.text("Due", payColDue, y);
    y += 4;
    doc.setDrawColor(200);
    doc.line(margin, y, contentRight, y);
    y += 14;
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");

    paymentRows.forEach((row, index) => {
      ensureSpace(20);
      if (index % 2 === 1) {
        doc.setFillColor(246, 247, 249);
        doc.rect(margin - 2, y - 10, maxWidth + 4, 16, "F");
      }
      const label = truncateToWidth(doc, row.label, payNameMax);
      const status = String(row.status || "-").replace(/_/g, " ");
      doc.text(label, payColName, y);
      doc.text(formatMoney(row.amount), payColAmt, y);
      doc.text(status, payColStatus, y);
      doc.text(row.dueDate ? String(row.dueDate) : "-", payColDue, y);
      y += 16;
    });
  }

  doc.save(`${(projectName || report?.projectName || "project").replace(/\s+/g, "_")}_final_approved.pdf`);
}
