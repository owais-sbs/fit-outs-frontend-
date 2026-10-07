import { jsPDF } from "jspdf";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 32;
const FOOTER_H = 26;
const BOTTOM = PAGE_H - FOOTER_H;
const CONTENT_W = PAGE_W - MARGIN * 2;

const NAVY = [27, 58, 75];
const SLATE = [71, 85, 105];
const MUTED = [100, 116, 139];
const LINE = [226, 232, 240];
const ZEBR = [248, 250, 252];
const TEAL = [15, 118, 110];
const TRACK = [226, 232, 240];

function money(amount) {
  if (amount == null || amount === "") return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `AED ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
}

function pctLabel(value) {
  const n = pct(value);
  return n == null ? "—" : `${n}%`;
}

function dash(value) {
  if (value == null || value === "") return "—";
  return String(value);
}

function label(value) {
  if (value == null || value === "") return "—";
  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(value) {
  if (!value) return "—";
  const raw = String(value);
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const d = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 16);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildFinalProjectReportDoc(report) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const ctx = { doc, y: MARGIN, visuals: 0, report };

  const ensure = (height) => {
    if (ctx.y + height <= BOTTOM) return;
    doc.addPage();
    ctx.y = drawContinuation(ctx);
  };

  const gap = (n) => {
    ctx.y += n;
  };

  const section = (title) => {
    ensure(28);
    if (ctx.y > MARGIN + 8) gap(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text(title, MARGIN, ctx.y);
    ctx.y += 5;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.7);
    doc.line(MARGIN, ctx.y, PAGE_W - MARGIN, ctx.y);
    ctx.y += 12;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
  };

  const note = (text) => {
    ensure(16);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    doc.text(lines, MARGIN, ctx.y);
    ctx.y += lines.length * 11 + 2;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
  };

  const allowVisual = () => {
    if (ctx.visuals >= 5) return false;
    ctx.visuals += 1;
    return true;
  };

  const progressBar = (caption, value) => {
    const n = pct(value);
    if (n == null || !allowVisual()) return;
    ensure(28);
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(`${caption}  ${n}%`, MARGIN, ctx.y);
    ctx.y += 6;
    const width = CONTENT_W;
    doc.setFillColor(...TRACK);
    doc.rect(MARGIN, ctx.y, width, 7, "F");
    const fill = Math.max(0, Math.min(100, n)) / 100 * width;
    doc.setFillColor(...TEAL);
    if (fill > 0) doc.rect(MARGIN, ctx.y, fill, 7, "F");
    ctx.y += 14;
    doc.setTextColor(0);
  };

  const distribution = (caption, counts) => {
    const rows = (counts || []).filter((c) => Number(c.count) > 0);
    if (rows.length < 2 || !allowVisual()) return;
    const total = rows.reduce((s, c) => s + Number(c.count), 0);
    if (total <= 0) return;
    ensure(32);
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(caption, MARGIN, ctx.y);
    ctx.y += 6;
    const colors = [
      [15, 118, 110],
      [30, 64, 175],
      [180, 83, 9],
      [185, 28, 28],
      [100, 116, 139],
    ];
    let x = MARGIN;
    rows.forEach((row, index) => {
      const w = (Number(row.count) / total) * CONTENT_W;
      doc.setFillColor(...colors[index % colors.length]);
      doc.rect(x, ctx.y, Math.max(w, 0.5), 8, "F");
      x += w;
    });
    ctx.y += 14;
    doc.setFontSize(8);
    const legend = rows.map((row) => `${row.label} ${row.count}`).join("   ·   ");
    const legendLines = doc.splitTextToSize(legend, CONTENT_W);
    doc.text(legendLines, MARGIN, ctx.y);
    ctx.y += legendLines.length * 10 + 4;
    doc.setTextColor(0);
  };

  const barList = (caption, rows) => {
    const items = (rows || []).filter((row) => row.amount != null && Number.isFinite(Number(row.amount)));
    if (items.length < 2 || !allowVisual()) return;
    const shown = items.slice(-8);
    const max = Math.max(...shown.map((row) => Number(row.amount)), 1);
    ensure(16 + shown.length * 14);
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(caption, MARGIN, ctx.y);
    ctx.y += 12;
    shown.forEach((row) => {
      ensure(14);
      doc.setFontSize(8);
      doc.setTextColor(...NAVY);
      const name = String(row.version || "BOQ").slice(0, 18);
      doc.text(name, MARGIN, ctx.y);
      const barX = MARGIN + 78;
      const barW = 250;
      doc.setFillColor(...TRACK);
      doc.rect(barX, ctx.y - 7, barW, 8, "F");
      doc.setFillColor(...TEAL);
      doc.rect(barX, ctx.y - 7, Math.max(1, (Number(row.amount) / max) * barW), 8, "F");
      doc.setTextColor(...SLATE);
      doc.text(money(row.amount), barX + barW + 8, ctx.y);
      ctx.y += 14;
    });
    doc.setTextColor(0);
  };

  const metrics = (pairs) => {
    const text = pairs
      .filter((pair) => pair.value != null && pair.value !== "")
      .map((pair) => `${pair.label} ${pair.value}`)
      .join("    ·    ");
    if (!text) return;
    ensure(16);
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    doc.text(lines, MARGIN, ctx.y);
    ctx.y += lines.length * 12 + 2;
    doc.setTextColor(0);
  };

  const kpis = (items) => {
    const cells = items.filter(Boolean);
    if (!cells.length) return;
    const cols = 3;
    const gapX = 8;
    const cardW = (CONTENT_W - gapX * (cols - 1)) / cols;
    const cardH = 36;
    for (let i = 0; i < cells.length; i += cols) {
      const slice = cells.slice(i, i + cols);
      ensure(cardH + 8);
      slice.forEach((cell, index) => {
        const x = MARGIN + index * (cardW + gapX);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(...LINE);
        doc.rect(x, ctx.y, cardW, cardH, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(cell.label, x + 6, ctx.y + 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...NAVY);
        const value = doc.splitTextToSize(String(cell.value), cardW - 12);
        doc.text(value[0], x + 6, ctx.y + 26);
      });
      ctx.y += cardH + 8;
    }
    doc.setTextColor(0);
  };

  const table = (columns, rows) => {
    if (!rows || !rows.length) return;
    const drawHeader = () => {
      ensure(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...SLATE);
      let x = MARGIN;
      columns.forEach((col) => {
        const anchor = col.align === "right" ? x + col.width - 2 : x;
        doc.text(col.title, anchor, ctx.y, { align: col.align || "left" });
        x += col.width;
      });
      ctx.y += 4;
      doc.setDrawColor(...LINE);
      doc.line(MARGIN, ctx.y, PAGE_W - MARGIN, ctx.y);
      ctx.y += 11;
    };
    drawHeader();
    rows.forEach((row, index) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const cells = columns.map((col) => {
        const raw = col.value(row);
        const text = raw == null || raw === "" ? "—" : String(raw);
        return doc.splitTextToSize(text, Math.max(12, col.width - 6));
      });
      const lineCount = Math.max(1, ...cells.map((cell) => cell.length));
      const rowH = lineCount * 10 + 4;
      if (ctx.y + rowH > BOTTOM) {
        doc.addPage();
        ctx.y = drawContinuation(ctx);
        drawHeader();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
      }
      if (index % 2 === 1) {
        doc.setFillColor(...ZEBR);
        doc.rect(MARGIN, ctx.y - 8, CONTENT_W, rowH, "F");
      }
      let x = MARGIN;
      cells.forEach((cell, cellIndex) => {
        const col = columns[cellIndex];
        doc.setTextColor(20);
        cell.forEach((line, lineIndex) => {
          const anchor = col.align === "right" ? x + col.width - 2 : x;
          doc.text(line, anchor, ctx.y + lineIndex * 10, { align: col.align || "left" });
        });
        x += col.width;
      });
      ctx.y += rowH;
    });
    gap(4);
  };

  drawCover(ctx);
  drawProgress(ctx, { section, note, progressBar, kpis });
  drawBoq(ctx, { section, note, metrics, barList, table });
  drawAuthorities(ctx, { section, note, metrics, table });
  drawProgramme(ctx, { section, note, metrics, progressBar, distribution, table });
  drawRooms(ctx, { section, note, table });
  drawTasks(ctx, { section, note, metrics, distribution, table });
  drawSnags(ctx, { section, note, metrics, distribution, table });
  drawSubcontractors(ctx, { section, note, metrics, distribution, table });
  drawBilling(ctx, { section, note, metrics, progressBar, table });
  drawScCommercial(ctx, { section, note, metrics });
  drawVariations(ctx, { section, note, metrics, table });
  drawDocuments(ctx, { section, note, table });
  drawTimeline(ctx, { section, note, table });
  drawAttention(ctx, { section, note, table });
  drawDetails(ctx, { section, note, table });

  const pages = doc.getNumberOfPages();
  const projectName = report?.project?.projectName || "Project";
  const generated = fmtDateTime(report?.generatedAt);
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(truncate(doc, projectName, 180), MARGIN, PAGE_H - 14);
    doc.text("JCT Project Report", PAGE_W / 2, PAGE_H - 14, { align: "center" });
    doc.text(`Page ${page} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 14, { align: "right" });
    doc.text(generated, PAGE_W / 2, PAGE_H - 6, { align: "center" });
  }
  return doc;
}

function drawContinuation(ctx) {
  const { doc, report } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const name = report?.project?.projectName || "Project";
  const status = report?.project?.status ? `  ·  ${label(report.project.status)}` : "";
  doc.text(truncate(doc, `${name}${status}`, CONTENT_W), MARGIN, 18);
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, 22, PAGE_W - MARGIN, 22);
  doc.setTextColor(0);
  return 34;
}

function drawCover(ctx) {
  const { doc, report } = ctx;
  const project = report?.project || {};
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  const title = doc.splitTextToSize(project.projectName || "Project", CONTENT_W);
  doc.text(title, MARGIN, ctx.y);
  ctx.y += title.length * 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...SLATE);
  doc.text("Final Project Report", MARGIN, ctx.y);
  ctx.y += 14;
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const facts = [
    project.status ? `Status ${label(project.status)}` : null,
    project.projectId != null ? `Project ID ${project.projectId}` : null,
    project.leadReference ? `Lead ${project.leadReference}` : null,
    report.generatedAt ? `Generated ${fmtDateTime(report.generatedAt)}` : null,
    project.manager ? `Manager ${project.manager}` : null,
    project.projectType ? `Type ${project.projectType}` : null,
    project.projectNature ? `Nature ${project.projectNature}` : null,
    project.developer ? `Developer ${project.developer}` : null,
    project.clientName ? `Client ${project.clientName}` : null,
    project.location ? `Location ${project.location}` : null,
  ].filter(Boolean);
  const factLines = doc.splitTextToSize(facts.join("   ·   "), CONTENT_W);
  doc.text(factLines, MARGIN, ctx.y);
  ctx.y += factLines.length * 11 + 8;

  const kpis = report?.kpis || {};
  const cells = [
    { label: "Contract value", value: money(kpis.contractValue) },
    { label: "Current approved BOQ", value: money(kpis.approvedBoqValue) },
    { label: "Overall progress", value: pctLabel(kpis.overallProgress) },
    { label: "Start date", value: kpis.startDate ? fmtDate(kpis.startDate) : "Not set" },
    { label: "Target completion", value: kpis.targetCompletion ? fmtDate(kpis.targetCompletion) : "Not set" },
    { label: "Project status", value: kpis.projectStatus ? label(kpis.projectStatus) : "—" },
  ];
  const cols = 3;
  const gapX = 8;
  const cardW = (CONTENT_W - gapX * (cols - 1)) / cols;
  const cardH = 36;
  cells.forEach((cell, index) => {
    if (index % cols === 0) {
      if (ctx.y + cardH > BOTTOM) {
        doc.addPage();
        ctx.y = drawContinuation(ctx);
      }
    }
    const col = index % cols;
    const x = MARGIN + col * (cardW + gapX);
    doc.setFillColor(...ZEBR);
    doc.setDrawColor(...LINE);
    doc.rect(x, ctx.y, cardW, cardH, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(cell.label, x + 6, ctx.y + 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(doc.splitTextToSize(cell.value, cardW - 12)[0], x + 6, ctx.y + 26);
    if (col === cols - 1 || index === cells.length - 1) ctx.y += cardH + 8;
  });
  doc.setTextColor(0);
}

function drawProgress(ctx, ui) {
  const progress = ctx.report?.progress;
  if (progress?.actualPercent == null) return;
  ui.section("Project progress");
  if (progress.source) ui.note(progress.source);
  ui.progressBar("Overall progress", progress.actualPercent);
}

function drawBoq(ctx, ui) {
  const boq = ctx.report?.boq;
  if (!boq || (!boq.hasApproved && !(boq.versions || []).length)) {
    ui.section("BOQ / commercial summary");
    ui.note("No BOQ recorded.");
    return;
  }
  ui.section("BOQ / commercial summary");
  if (!boq.hasApproved) ui.note("No approved BOQ yet.");
  else {
    ui.metrics([
      { label: "Version", value: dash(boq.version) },
      { label: "Status", value: label(boq.status) },
      { label: "Reference", value: dash(boq.reference) },
      { label: "Lines", value: boq.lineCount == null ? "—" : String(boq.lineCount) },
      { label: "Approved", value: boq.approvedDate ? fmtDate(boq.approvedDate) : "—" },
      { label: "Amount", value: money(boq.approvedAmount) },
    ]);
  }
  if (boq.contractValue != null && boq.approvedAmount != null && Number(boq.difference) !== 0) {
    ui.metrics([
      { label: "Contract value", value: money(boq.contractValue) },
      { label: "Current approved BOQ", value: money(boq.approvedAmount) },
      { label: "Difference", value: money(boq.difference) },
    ]);
  }
  ui.barList("BOQ value by version", boq.versions);
  ui.table(
    [
      { title: "Version", width: 140, value: (row) => row.version },
      { title: "Status", width: 140, value: (row) => label(row.status) },
      { title: "Date", width: 110, value: (row) => fmtDate(row.date) },
      { title: "Amount", width: CONTENT_W - 390, align: "right", value: (row) => money(row.amount) },
    ],
    boq.versions || []
  );
}

function drawAuthorities(ctx, ui) {
  const block = ctx.report?.authorities;
  if (!block) return;
  const any = block.live || block.blocked || block.awaiting || block.expiring || (block.blockers || []).length;
  if (!any) return;
  ui.section("Authority / approval status");
  ui.metrics([
    { label: "Live", value: block.live },
    { label: "Blocked", value: block.blocked },
    { label: "Awaiting", value: block.awaiting },
    { label: "Expiring", value: block.expiring },
  ]);
  if (!(block.blockers || []).length) ui.note("No authority blockers.");
  else {
    ui.table(
      [
        { title: "Approval", width: 130, value: (row) => row.approval },
        { title: "Authority", width: 100, value: (row) => row.authority },
        { title: "Status", width: 90, value: (row) => label(row.status) },
        { title: "Reason", width: 130, value: (row) => row.reason },
        { title: "Due / expiry", width: CONTENT_W - 450, value: (row) => fmtDate(row.dueDate) },
      ],
      block.blockers
    );
  }
}

function drawProgramme(ctx, ui) {
  const programme = ctx.report?.programme;
  ui.section("Programme / schedule summary");
  if (!programme?.published) {
    ui.note("Programme not published yet.");
    return;
  }
  ui.metrics([
    { label: "Baseline", value: programme.baselineName },
    { label: "Start", value: programme.startDate ? fmtDate(programme.startDate) : null },
    { label: "Target", value: programme.targetDate ? fmtDate(programme.targetDate) : null },
    { label: "Activities", value: programme.total },
    { label: "Completed", value: programme.completed },
    { label: "In progress", value: programme.inProgress },
    { label: "Delayed", value: programme.delayed },
    { label: "Progress", value: pctLabel(programme.progressPercent) },
  ]);
  ui.progressBar("Programme progress", programme.progressPercent);
  ui.distribution("Activity status", programme.statusCounts);
  if ((programme.delayedActivities || []).length) {
    ui.table(
      [
        { title: "Activity", width: 150, value: (row) => row.activity },
        { title: "Planned finish", width: 80, value: (row) => fmtDate(row.plannedFinish) },
        { title: "Progress", width: 55, value: (row) => row.forecastOrActual },
        { title: "Variance", width: 100, value: (row) => row.variance },
        { title: "Owner", width: 70, value: (row) => row.owner },
        { title: "Status", width: CONTENT_W - 455, value: (row) => row.status },
      ],
      programme.delayedActivities
    );
  }
}

function drawRooms(ctx, ui) {
  const rooms = ctx.report?.rooms || [];
  if (!rooms.length) return;
  ui.section("Rooms / areas progress");
  const { doc } = ctx;
  rooms.forEach((row) => {
    if (ctx.y + 22 > BOTTOM) {
      doc.addPage();
      ctx.y = drawContinuation(ctx);
    }
    const n = pct(row.completionPercent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(truncate(doc, row.room || "Room", 190), MARGIN, ctx.y);
    doc.setTextColor(...SLATE);
    doc.text(`${row.completedTasks} / ${row.totalTasks}`, MARGIN + 198, ctx.y);
    const barX = MARGIN + 248;
    const barW = 120;
    doc.setFillColor(...TRACK);
    doc.rect(barX, ctx.y - 7, barW, 6, "F");
    if (n != null && n > 0) {
      doc.setFillColor(...TEAL);
      doc.rect(barX, ctx.y - 7, Math.min(barW, (n / 100) * barW), 6, "F");
    }
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text(n == null ? "—" : `${n}%`, barX + barW + 8, ctx.y);
    doc.setTextColor(...SLATE);
    doc.text(row.status || "—", MARGIN + 420, ctx.y);
    ctx.y += 16;
  });
  ctx.y += 4;
}

function drawTasks(ctx, ui) {
  const tasks = ctx.report?.tasks;
  if (!tasks || !tasks.total) {
    ui.section("Task summary");
    ui.note("No tasks recorded.");
    return;
  }
  ui.section("Task summary");
  ui.metrics([
    { label: "Total", value: tasks.total },
    { label: "Completed", value: tasks.completed },
    { label: "In progress", value: tasks.inProgress },
    { label: "Overdue", value: tasks.overdue },
    { label: "Upcoming", value: tasks.upcoming },
  ]);
  ui.distribution("Task status", tasks.statusCounts);
  if (!(tasks.openTasks || []).length) ui.note("No open tasks.");
  else {
    ui.table(
      [
        { title: "Task", width: 150, value: (row) => row.task },
        { title: "Room / location", width: 110, value: (row) => row.location },
        { title: "Type", width: 70, value: (row) => label(row.type) },
        { title: "Due", width: 70, value: (row) => fmtDate(row.dueDate) },
        { title: "Status", width: CONTENT_W - 400, value: (row) => label(row.status) },
      ],
      tasks.openTasks
    );
  }
}

function drawSnags(ctx, ui) {
  const snags = ctx.report?.snags;
  if (!snags || !snags.total) {
    ui.section("Snag summary");
    ui.note("No open snags.");
    return;
  }
  ui.section("Snag summary");
  ui.metrics([
    { label: "Total", value: snags.total },
    { label: "Open", value: snags.open },
    { label: "In progress", value: snags.inProgress },
    { label: "Ready for inspection", value: snags.readyForInspection },
    { label: "Resolved", value: snags.resolved },
    { label: "Closed", value: snags.closed },
  ]);
  ui.distribution("Snag status", snags.statusCounts);
  if (!(snags.openSnags || []).length) ui.note("No open snags.");
  else {
    ui.table(
      [
        { title: "Snag", width: 140, value: (row) => row.snag },
        { title: "Location", width: 90, value: (row) => row.location },
        { title: "Trade", width: 90, value: (row) => row.trade },
        { title: "Severity", width: 60, value: (row) => label(row.severity) },
        { title: "Due", width: 70, value: (row) => fmtDate(row.dueDate) },
        { title: "Status", width: CONTENT_W - 450, value: (row) => label(row.status) },
      ],
      snags.openSnags
    );
  }
}

function drawSubcontractors(ctx, ui) {
  const block = ctx.report?.subcontractors;
  if (!ctx.report?.internalView) return;
  if (!block || !block.total) {
    ui.section("Subcontractor summary");
    ui.note("No subcontract packages recorded.");
    return;
  }
  ui.section("Subcontractor summary");
  ui.metrics([
    { label: "Total packages", value: block.total },
    { label: "Tendering", value: block.tendering },
    { label: "Awarded", value: block.awarded },
    { label: "Active", value: block.active },
    { label: "Completed", value: block.completed },
  ]);
  ui.distribution("Package status", block.statusCounts);
  if (!(block.packages || []).length) ui.note("No awarded packages yet.");
  else {
    ui.table(
      [
        { title: "Package", width: 120, value: (row) => row.packageName },
        { title: "Trade", width: 80, value: (row) => row.trade },
        { title: "Subcontractor", width: 110, value: (row) => row.subcontractor },
        { title: "Package value", width: 90, align: "right", value: (row) => money(row.awardValue) },
        { title: "Progress", width: 50, value: (row) => pctLabel(row.progress) },
        { title: "Status", width: CONTENT_W - 450, value: (row) => label(row.status) },
      ],
      block.packages
    );
  }
}

function drawBilling(ctx, ui) {
  const billing = ctx.report?.billing;
  ui.section("Billing / payment summary");
  if (!billing?.hasRecords) {
    ui.note("No payment requests issued.");
    return;
  }
  ui.metrics([
    { label: "Total", value: money(billing.total) },
    { label: "Invoiced", value: money(billing.invoiced) },
    { label: "Received", value: money(billing.received) },
    { label: "Outstanding", value: money(billing.outstanding) },
    { label: "Collection", value: pctLabel(billing.collectionPercent) },
  ]);
  ui.progressBar("Collected", billing.collectionPercent);
  ui.table(
    [
      { title: "Invoice", width: 130, value: (row) => row.invoice },
      { title: "Amount", width: 80, align: "right", value: (row) => money(row.amount) },
      { title: "Issued", width: 70, value: (row) => fmtDate(row.issueDate) },
      { title: "Due", width: 70, value: (row) => fmtDate(row.dueDate) },
      { title: "Paid", width: 70, align: "right", value: (row) => money(row.paid) },
      { title: "Outstanding", width: 70, align: "right", value: (row) => money(row.outstanding) },
      { title: "Status", width: CONTENT_W - 490, value: (row) => label(row.status) },
    ],
    billing.invoices || []
  );
}

function drawScCommercial(ctx, ui) {
  const block = ctx.report?.scCommercial;
  if (!block) return;
  ui.section("Subcontractor commercial summary");
  if (!block.hasRecords) {
    ui.note("No subcontractor certificates recorded.");
    return;
  }
  ui.metrics([
    { label: "SC certified", value: money(block.certified) },
    { label: "SC payable", value: money(block.payable) },
    { label: "SC paid", value: money(block.paid) },
    { label: "Retention held", value: money(block.retentionHeld) },
    { label: "Outstanding SC liability", value: money(block.outstandingLiability) },
  ]);
}

function drawVariations(ctx, ui) {
  const block = ctx.report?.variations;
  if (!block || !block.total) {
    ui.section("Variations");
    ui.note("No variations recorded.");
    return;
  }
  ui.section("Variations");
  ui.metrics([
    { label: "Total", value: block.total },
    { label: "Approved", value: block.approved },
    { label: "Pending", value: block.pending },
    { label: "Rejected", value: block.rejected },
    { label: "Approved value", value: money(block.approvedValue) },
    { label: "Pending value", value: money(block.pendingValue) },
  ]);
  ui.table(
    [
      { title: "Variation", width: 80, value: (row) => row.variation },
      { title: "Description", width: 200, value: (row) => row.description },
      { title: "Cost impact", width: 90, align: "right", value: (row) => money(row.costImpact) },
      { title: "Schedule", width: 70, value: (row) => row.scheduleImpact },
      { title: "Status", width: CONTENT_W - 440, value: (row) => label(row.status) },
    ],
    block.rows || []
  );
}

function drawDocuments(ctx, ui) {
  const rows = ctx.report?.documents || [];
  if (!rows.length) return;
  ui.section("Documents / completion status");
  ui.table(
    [
      { title: "Category", width: 360, value: (row) => row.label },
      { title: "Count", width: CONTENT_W - 360, align: "right", value: (row) => String(row.count) },
    ],
    rows
  );
}

function drawTimeline(ctx, ui) {
  const rows = ctx.report?.timeline || [];
  ui.section("What has happened so far");
  if (!rows.length) {
    ui.note("No recorded events yet.");
    return;
  }
  ui.table(
    [
      { title: "Date", width: 110, value: (row) => fmtDateTime(row.at) },
      { title: "Event", width: 150, value: (row) => row.event },
      { title: "Description", width: CONTENT_W - 260, value: (row) => row.description },
    ],
    rows
  );
}

function drawAttention(ctx, ui) {
  const rows = ctx.report?.attention || [];
  ui.section("What needs attention");
  if (!rows.length) {
    ui.note("Nothing flagged from current records.");
    return;
  }
  ui.table(
    [
      { title: "Area", width: 70, value: (row) => row.area },
      { title: "Issue", width: 160, value: (row) => row.issue },
      { title: "Priority", width: 60, value: (row) => row.priority },
      { title: "Owner", width: 80, value: (row) => row.owner },
      { title: "Current state / next action", width: CONTENT_W - 370, value: (row) => row.nextAction },
    ],
    rows
  );
}

function drawDetails(ctx, ui) {
  const project = ctx.report?.project || {};
  const kpis = ctx.report?.kpis || {};
  const client = ctx.report?.client;
  ui.section("Project details");
  const details = [
    ["Project ID", project.projectId],
    ["Lead ref", project.leadReference],
    ["Project type", project.projectType],
    ["Project nature", project.projectNature],
    ["Status", project.status ? label(project.status) : null],
    ["Manager", project.manager],
    ["Client", project.clientName],
    ["Developer", project.developer],
    ["Location", project.location],
    ["Budget / contract", money(kpis.contractValue)],
    ["Start date", kpis.startDate ? fmtDate(kpis.startDate) : null],
    ["Target date", kpis.targetCompletion ? fmtDate(kpis.targetCompletion) : null],
  ].filter((row) => row[1] != null && row[1] !== "" && row[1] !== "—");
  ui.table(
    [
      { title: "Field", width: 160, value: (row) => row[0] },
      { title: "Value", width: CONTENT_W - 160, value: (row) => row[1] },
    ],
    details
  );
  ui.section("Client details");
  if (!client?.assigned) {
    ui.note("Client not assigned.");
    return;
  }
  ui.table(
    [
      { title: "Field", width: 160, value: (row) => row[0] },
      { title: "Value", width: CONTENT_W - 160, value: (row) => row[1] },
    ],
    [
      ["Client name", client.name],
      ["Client ID", client.clientId],
      ["Account", client.account],
      ["Location", client.location],
      ["Contact", client.contact],
    ].filter((row) => row[1])
  );
}

function truncate(doc, text, width) {
  const raw = String(text || "");
  if (doc.getTextWidth(raw) <= width) return raw;
  let lo = 0;
  let hi = raw.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (doc.getTextWidth(`${raw.slice(0, mid)}...`) <= width) lo = mid;
    else hi = mid - 1;
  }
  return `${raw.slice(0, lo)}...`;
}

export async function openFinalProjectReportPdf(report) {
  const doc = buildFinalProjectReportDoc(report);
  const name = report?.fileName || "Final_Project_Report.pdf";
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  doc.save(name);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
