// ─── Calendar mock data ───────────────────────────────────────────────────────

export const CALENDAR_EMPLOYEES = [
  "James Wu", "Emma Walsh", "Tom Bradley", "Lisa Park",
  "David Chen", "Sarah Thompson", "Michael Ross", "Priya Nair",
];

export const CALENDAR_PROJECTS = [
  "Sydney Office Fit-out",
  "Harbour Retail Interior",
  "Moss Interiors Showroom",
  "Brisbane Tower Renovation",
  "Tanaka Foods Production",
  "Grant Hospitality Renovation",
];

export const CALENDAR_SITES = [
  "Sydney CBD, NSW",
  "Circular Quay, NSW",
  "Surry Hills, NSW",
  "Brisbane CBD, QLD",
  "Alexandria, NSW",
  "Melbourne CBD, VIC",
];

export const VISIT_STATUSES = ["Scheduled", "Completed", "Cancelled"];

// Build visits relative to current month so the calendar always has data
function today() {
  return new Date();
}

function dateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildVisits() {
  const t = today();
  const y = t.getFullYear();
  const m = t.getMonth() + 1; // 1-based
  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? y - 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const ny = m === 12 ? y + 1 : y;

  return [
    // Current month — spread across the month
    { id: "cv-001", employee: "James Wu",       project: "Sydney Office Fit-out",       site: "Sydney CBD, NSW",       date: dateStr(y, m, 3),  time: "09:00", status: "Completed",  assignedBy: "Lisa Park",  remarks: "Foundation inspection completed." },
    { id: "cv-002", employee: "Emma Walsh",      project: "Harbour Retail Interior",     site: "Circular Quay, NSW",    date: dateStr(y, m, 5),  time: "10:30", status: "Completed",  assignedBy: "Lisa Park",  remarks: "Interior fit-out check done." },
    { id: "cv-003", employee: "Tom Bradley",     project: "Brisbane Tower Renovation",   site: "Brisbane CBD, QLD",     date: dateStr(y, m, 7),  time: "08:00", status: "Scheduled",  assignedBy: "Lisa Park",  remarks: "Structural review." },
    { id: "cv-004", employee: "David Chen",      project: "Moss Interiors Showroom",     site: "Surry Hills, NSW",      date: dateStr(y, m, 9),  time: "14:00", status: "Scheduled",  assignedBy: "Admin",      remarks: "Budget review on site." },
    { id: "cv-005", employee: "James Wu",        project: "Tanaka Foods Production",     site: "Alexandria, NSW",       date: dateStr(y, m, 11), time: "09:30", status: "Cancelled",  assignedBy: "Lisa Park",  remarks: "Client postponed." },
    { id: "cv-006", employee: "Priya Nair",      project: "Sydney Office Fit-out",       site: "Sydney CBD, NSW",       date: dateStr(y, m, 12), time: "11:00", status: "Scheduled",  assignedBy: "Tom Bradley",remarks: "QA walkthrough." },
    { id: "cv-007", employee: "Emma Walsh",      project: "Grant Hospitality Renovation",site: "Melbourne CBD, VIC",    date: dateStr(y, m, 14), time: "13:30", status: "Scheduled",  assignedBy: "Lisa Park",  remarks: "Design signoff visit." },
    { id: "cv-008", employee: "Tom Bradley",     project: "Sydney Office Fit-out",       site: "Sydney CBD, NSW",       date: dateStr(y, m, 14), time: "15:00", status: "Scheduled",  assignedBy: "Admin",      remarks: "Electrical inspection." },
    { id: "cv-009", employee: "Michael Ross",    project: "Brisbane Tower Renovation",   site: "Brisbane CBD, QLD",     date: dateStr(y, m, 17), time: "08:30", status: "Scheduled",  assignedBy: "Lisa Park",  remarks: "Civil works inspection." },
    { id: "cv-010", employee: "Lisa Park",       project: "Moss Interiors Showroom",     site: "Surry Hills, NSW",      date: dateStr(y, m, 18), time: "10:00", status: "Scheduled",  assignedBy: "Admin",      remarks: "Project milestone check." },
    { id: "cv-011", employee: "Sarah Thompson",  project: "Harbour Retail Interior",     site: "Circular Quay, NSW",    date: dateStr(y, m, 20), time: "09:00", status: "Scheduled",  assignedBy: "Lisa Park",  remarks: "HR compliance walkthrough." },
    { id: "cv-012", employee: "James Wu",        project: "Grant Hospitality Renovation",site: "Melbourne CBD, VIC",    date: dateStr(y, m, 21), time: "11:30", status: "Scheduled",  assignedBy: "Admin",      remarks: "Client presentation site." },
    { id: "cv-013", employee: "Priya Nair",      project: "Brisbane Tower Renovation",   site: "Brisbane CBD, QLD",     date: dateStr(y, m, 23), time: "14:00", status: "Scheduled",  assignedBy: "Tom Bradley",remarks: "QA final inspection." },
    { id: "cv-014", employee: "Emma Walsh",      project: "Moss Interiors Showroom",     site: "Surry Hills, NSW",      date: dateStr(y, m, 25), time: "10:00", status: "Scheduled",  assignedBy: "Lisa Park",  remarks: "Design review." },
    { id: "cv-015", employee: "David Chen",      project: "Sydney Office Fit-out",       site: "Sydney CBD, NSW",       date: dateStr(y, m, 27), time: "09:00", status: "Scheduled",  assignedBy: "Admin",      remarks: "Cost audit." },
    // Previous month
    { id: "cv-016", employee: "Tom Bradley",     project: "Sydney Office Fit-out",       site: "Sydney CBD, NSW",       date: dateStr(py, pm, 10), time: "09:00", status: "Completed", assignedBy: "Lisa Park", remarks: "Foundation complete." },
    { id: "cv-017", employee: "James Wu",        project: "Harbour Retail Interior",     site: "Circular Quay, NSW",    date: dateStr(py, pm, 18), time: "14:00", status: "Completed", assignedBy: "Admin",     remarks: "Client walkthrough." },
    // Next month
    { id: "cv-018", employee: "Emma Walsh",      project: "Grant Hospitality Renovation",site: "Melbourne CBD, VIC",    date: dateStr(ny, nm, 4),  time: "10:00", status: "Scheduled", assignedBy: "Lisa Park", remarks: "Pre-construction visit." },
    { id: "cv-019", employee: "Priya Nair",      project: "Sydney Office Fit-out",       site: "Sydney CBD, NSW",       date: dateStr(ny, nm, 8),  time: "11:30", status: "Scheduled", assignedBy: "Tom Bradley",remarks: "Quality pre-check." },
  ];
}

export const CALENDAR_VISITS = buildVisits();

export function getVisitsForDate(dateStr) {
  return CALENDAR_VISITS.filter((v) => v.date === dateStr);
}

export function getVisitsForMonth(year, month) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return CALENDAR_VISITS.filter((v) => v.date.startsWith(prefix));
}
