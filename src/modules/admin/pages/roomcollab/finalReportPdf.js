import { jsPDF } from "jspdf";

export async function downloadFinalApprovedPdf(report, projectName) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;

  const ensureSpace = (needed = 60) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFontSize(16);
  doc.text("Final approved package", margin, y);
  y += 22;
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(projectName || report?.projectName || `Project #${report?.projectId}`, margin, y);
  y += 16;
  doc.text(`Generated ${new Date().toLocaleString()}`, margin, y);
  y += 28;
  doc.setTextColor(0);

  const rooms = Array.isArray(report?.rooms) ? report.rooms : [];
  if (rooms.length === 0) {
    doc.setFontSize(11);
    doc.text("No finalized (approved) items yet.", margin, y);
    doc.save(`${(projectName || "project").replace(/\s+/g, "_")}_final_approved.pdf`);
    return;
  }

  rooms.forEach((room) => {
    ensureSpace(80);
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text(`${room.floorLabel || "General"} — ${room.roomName}`, margin, y);
    y += 18;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);

    (room.items || []).forEach((item) => {
      ensureSpace(70);
      doc.setFont(undefined, "bold");
      doc.text(`• ${item.title}`, margin, y);
      y += 14;
      doc.setFont(undefined, "normal");
      const lines = [
        `Type: ${(item.taskType || "").replace(/_/g, " ")}`,
        `File: ${item.fileName || "—"}`,
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

  doc.save(`${(projectName || report?.projectName || "project").replace(/\s+/g, "_")}_final_approved.pdf`);
}
