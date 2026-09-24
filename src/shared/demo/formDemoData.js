/** Relevant UAE fit-out demo payloads for form prefills. */

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hoursFromNow(hours) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString().slice(0, 16);
}

export const DEMO = {
  scCompanyProfile: {
    legalCompanyName: "Gulf Precision MEP LLC",
    tradeLicenceNumber: "CN-7845123",
    tradeLicenceExpiry: daysFromNow(400),
    trn: "100345678900003",
    registeredAddress: "Warehouse 12, Al Quoz Industrial Area 3, Dubai, UAE",
    primaryContactName: "Ahmed Al Mansoori",
    primaryContactEmail: "ahmed@gulfprecision.demo",
    primaryContactPhone: "+971501234567",
    accountsContactName: "Sara Khan",
    accountsContactEmail: "accounts@gulfprecision.demo",
    accountsContactPhone: "+971509876543",
    tradeCategories: ["MEP — electrical", "Fire protection"],
    declaredCapacity: "4 crews / 45 skilled workers",
  },

  /** Reference + expiry prefills for Insurance & specialist certificates. */
  scComplianceDocs: {
    CAR_INSURANCE: { referenceNo: "CAR-DXB-2026-8841", expiryDate: daysFromNow(320) },
    TPL_INSURANCE: { referenceNo: "TPL-AE-557210", expiryDate: daysFromNow(300) },
    WC_INSURANCE: { referenceNo: "WC-ENBD-99102", expiryDate: daysFromNow(280) },
    CIVIL_DEFENCE: { referenceNo: "CD-DCD-FL-44102", expiryDate: daysFromNow(360) },
    SIRA: { referenceNo: "SIRA-SEC-77801", expiryDate: daysFromNow(250) },
    DEWA_ELECTRICAL: { referenceNo: "DEWA-EC-2026-1194", expiryDate: daysFromNow(340) },
    MUNICIPALITY_CLASSIFICATION: { referenceNo: "DM-CLS-B-5520", expiryDate: daysFromNow(400) },
    ISO_9001: { referenceNo: "ISO9001-UKAS-33421", expiryDate: daysFromNow(500) },
    ISO_45001: { referenceNo: "ISO45001-UKAS-33422", expiryDate: daysFromNow(500) },
    ISO_14001: { referenceNo: "ISO14001-UKAS-33423", expiryDate: daysFromNow(500) },
    CHAMBER_OF_COMMERCE: { referenceNo: "DCCI-MEM-90881", expiryDate: daysFromNow(200) },
  },

  scOrgExtension: {
    tradeLicenceAuthority: "Dubai Economy & Tourism",
    tradeLicenceActivities: "Electrical contracting, fire alarm & ELV works",
    yearsInBusiness: 12,
    annualTurnoverAed: "8500000",
    workforceSize: "45",
    hsePolicySummary: "ISO 45001 aligned HSE plan; weekly toolbox talks; PTW for hot works.",
  },

  scBankDetail: {
    bankName: "Emirates NBD",
    accountName: "Gulf Precision MEP LLC",
    iban: "AE070331234567890123456",
    accountNumber: "1234567890123",
    swiftCode: "EBILAEAD",
  },

  scCommunityRegistration: {
    authorityName: "Emaar Community Management",
    registrationNumber: "ECM-SC-2026-0142",
    expiryDate: daysFromNow(300),
    notes: "Approved for MEP packages on Downtown & Marina assets.",
  },

  scWorker: {
    fullName: "Ravi Kumar",
    trade: "Electrician",
    passportNumber: "Z1234567",
    visaExpiry: daysFromNow(280),
    emiratesIdExpiry: daysFromNow(320),
    insuranceExpiry: daysFromNow(200),
    inductionDate: daysFromNow(-14),
    accessCardExpiry: daysFromNow(180),
    accessCardNumber: "AC-77821",
    tradeCertExpiry: daysFromNow(365),
    inductionCompleted: true,
    active: true,
  },

  scTeamInvite: {
    fullName: "Layla Hassan",
    email: "estimator@gulfprecision.demo",
    phone: "+971504445566",
    portalRole: "SC_ESTIMATOR",
  },

  scTeamManual: {
    fullName: "Omar Farouk",
    email: "supervisor@gulfprecision.demo",
    phone: "+971507778899",
    portalRole: "SC_SUPERVISOR",
    password: "123456",
  },

  vendorInvite: {
    companyName: "Desert Arc Electrical LLC",
    fullName: "Yousef Nasser",
    email: `vendor.${Date.now().toString(36)}@fitouts.demo`,
    phone: "+971502223344",
  },

  scQuote: {
    leadTimeDays: "45",
    exclusionsText: "Scaffolding above 6m, builder's work openings, and utility authority fees excluded.",
    qualificationsText: "Rates based on issued drawings rev C; copper market fluctuation >8% subject to adjustment.",
    validityDate: daysFromNow(30),
  },

  packageCreate: {
    name: "Electrical package — main works",
    paymentTerms: "30 days from certified claim",
    retentionPct: "5",
    quoteValidityDays: "30",
    ldTerms: "AED 2,500 per calendar day, capped at 10% of package value",
    tenderDescription: "Supply and install conduits, wiring, DBs and containment as per issued BOQ and drawings.",
    siteVisitAt: hoursFromNow(72),
  },

  freeIssueMaterial: {
    itemDescription: "Main distribution board (MDB) — Schneider",
    suppliedBy: "MAIN_CONTRACTOR",
    quantity: "1",
    unit: "Nr",
    notes: "Free-issue to SC store 5 days before install start",
  },

  scClaim: {
    claimedQty: "25",
    notes: "First interim claim — conduits and first-fix wiring complete in Zone A.",
  },

  scProgressLog: {
    percentComplete: "35",
    manpowerCount: "8",
    notes: "Pulled cable to panels 1–3; waiting client decision on lighting fittings sample.",
  },

  scClarification: {
    question: "Please confirm whether emergency lighting batteries are free-issue or included in our scope.",
  },

  createProject: {
    name: "Marina Office Fit-Out — Tower B L12",
    location: "Dubai Marina, Dubai",
    clientName: "Horizon Developments LLC",
    budget: "1850000",
    description: "Cat A/B office fit-out including MEP, joinery and finishes for 1,200 sqm.",
  },

  employee: {
    fullName: "Fatima Al Zaabi",
    email: `qs.${Date.now().toString(36)}@fitouts.demo`,
    phone: "+971501112233",
    jobTitle: "Quantity Surveyor",
  },

  siteVisit: {
    notes: "Initial survey — verify existing MEP risers and landlord guidelines.",
    scheduledAt: hoursFromNow(48),
  },

  lead: {
    fullName: "Khalid Rahman",
    email: `lead.${Date.now().toString(36)}@client.demo`,
    phone: "+971509998877",
    companyName: "BlueBay Retail Group",
    projectType: "Retail fit-out",
    location: "Dubai Hills Mall",
    notes: "Interested in 800 sqm retail unit; target handover Q4.",
  },
};

/** Apply rates to BOQ lines for quote grid demo fill. */
export function demoQuoteLineRates(boqLines = []) {
  const lines = {};
  (boqLines || []).forEach((bl, i) => {
    const base = 85 + (i % 7) * 12.5;
    lines[bl.boqLineId] = {
      rate: String(Math.round(base * 100) / 100),
      lineStatus: i === Math.min(2, (boqLines.length || 1) - 1) ? "EXCLUDED" : "QUOTED",
      remarks: i === Math.min(2, (boqLines.length || 1) - 1) ? "Excluded — client free-issue" : "",
    };
  });
  return lines;
}

/**
 * Minimal valid single-page PDF as a File (for Fill Demo Data uploads).
 * Title must be simple ASCII — no parentheses.
 */
export function makeDemoPdf(fileName, title = "JCT Demo Document") {
  const safeTitle = String(title || "JCT Demo Document")
    .replace(/[()\\]/g, " ")
    .slice(0, 60);
  const stream = `BT /F1 16 Tf 72 720 Td (${safeTitle}) Tj T* /F1 11 Tf (Demo PDF for portal testing) Tj ET`;
  const objects = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n"
  );
  objects.push(`4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`);
  objects.push("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n");

  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj;
  }
  const xrefStart = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return new File([body], fileName || "demo.pdf", { type: "application/pdf" });
}

/** Worker document File map aligned with backend ScWorkerDocType. */
export function demoWorkerDocuments(workerName = "Ravi Kumar") {
  const name = String(workerName || "Worker").replace(/\s+/g, "_");
  return {
    PASSPORT: makeDemoPdf(`${name}_passport.pdf`, `Passport - ${workerName}`),
    VISA: makeDemoPdf(`${name}_visa.pdf`, `Visa - ${workerName}`),
    EMIRATES_ID: makeDemoPdf(`${name}_emirates_id.pdf`, `Emirates ID - ${workerName}`),
    INSURANCE: makeDemoPdf(`${name}_insurance.pdf`, `Workers Insurance - ${workerName}`),
    INDUCTION: makeDemoPdf(`${name}_induction.pdf`, `Site Induction - ${workerName}`),
    ACCESS_CARD: makeDemoPdf(`${name}_access_card.pdf`, `Access Card - ${workerName}`),
    TRADE_CERT: makeDemoPdf(`${name}_trade_cert.pdf`, `Trade Certificate - ${workerName}`),
  };
}

/** Pick a random item (new selection on every call). */
export function pickDemo(items = []) {
  if (!items.length) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Tiny valid PNG File for snag / photo demo uploads.
 * Each call gets a unique filename so consecutive fills look fresh.
 */
export function makeDemoPng(fileName) {
  const stamp = Date.now().toString(36);
  // 1×1 PNG (opaque grey pixel)
  const bytes = Uint8Array.from(atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
  ), (c) => c.charCodeAt(0));
  const safe = String(fileName || `demo-${stamp}.png`).replace(/[^\w.-]+/g, "_");
  return new File([bytes], safe.endsWith(".png") ? safe : `${safe}.png`, {
    type: "image/png",
    lastModified: Date.now(),
  });
}

/** Assign a File to a native <input type="file"> so the UI shows the name. */
export function assignDemoFileToInput(inputEl, file) {
  if (!inputEl || !file) return;
  try {
    const dt = new DataTransfer();
    dt.items.add(file);
    inputEl.files = dt.files;
  } catch {
    // Form state still holds the File even if the browser blocks DataTransfer.
  }
}

const SNAG_DEMO_SAMPLES = [
  {
    title: "Cracked floor tile near shower",
    description: "Hairline crack on the tile next to the shower tray. Needs replacement before handover.",
    location: "Master Bathroom — floor, right of shower",
    severity: "HIGH",
  },
  {
    title: "Uneven grout on kitchen backsplash",
    description: "Grout joint widens toward the cooker hood. Cosmetic but visible at eye level.",
    location: "Kitchen — wall backsplash above hob",
    severity: "MEDIUM",
  },
  {
    title: "Chipped skirting tile at door",
    description: "Corner chip on skirting where the bedroom door swings. Low risk of further damage.",
    location: "Guest Bedroom — doorway threshold",
    severity: "LOW",
  },
  {
    title: "Loose vanity splashback tile",
    description: "Tile above vanity taps is loose and clicking when pressed. Re-bed and re-grout.",
    location: "Powder Room — vanity wall",
    severity: "HIGH",
  },
  {
    title: "Paint touch-up required",
    description: "Scuff marks and uneven paint on the north wall. Light sand and matching touch-up coat needed.",
    location: "Living room, north wall beside the window",
    severity: "MEDIUM",
  },
  {
    title: "Missing silicone seal at bath edge",
    description: "Gap at the bath/wall junction. Water can track behind tiles if left open.",
    location: "Master Bathroom — junction of bath and wall tiles",
    severity: "CRITICAL",
  },
  {
    title: "Door latch misaligned",
    description: "Bedroom door latch does not catch cleanly. Strike plate needs adjustment.",
    location: "Bedroom 2 — door leaf / frame",
    severity: "MEDIUM",
  },
  {
    title: "Ceiling spot light flickering",
    description: "Downlight flickers intermittently after switch-on. Suspected loose connector.",
    location: "Corridor — second downlight from lift lobby",
    severity: "HIGH",
  },
];

/**
 * Fresh snag form payload on every call (text + photo File).
 * Pass rooms / activities / employees so selects get real options when available.
 */
export function buildDemoSnagForm({
  rooms = [],
  activities = [],
  employees = [],
  withAssignee = true,
  withClientVisible = true,
} = {}) {
  const sample = pickDemo(SNAG_DEMO_SAMPLES) || SNAG_DEMO_SAMPLES[0];
  const room = pickDemo(rooms);
  const roomId = room ? String(room.uuid || room.id || "") : "";
  const linkedActs = (activities || []).filter(
    (a) => !roomId || !a.projectRoomId || String(a.projectRoomId) === roomId
  );
  const activity = pickDemo(linkedActs.length ? linkedActs : activities);
  const assignee = withAssignee ? pickDemo(employees) : null;
  const stamp = Date.now().toString(36).slice(-5);
  const photo = makeDemoPng(`snag-${stamp}.png`);
  return {
    title: `${sample.title} [${stamp}]`,
    description: sample.description,
    location: sample.location,
    projectRoomId: roomId,
    activityUuid: activity?.uuid ? String(activity.uuid) : "",
    severity: sample.severity,
    dueDate: daysFromNow(5 + Math.floor(Math.random() * 25)),
    assigneeAccountId: assignee?.id != null ? String(assignee.id) : "",
    clientVisible: withClientVisible,
    photos: [photo],
  };
}

/** Client raise-snag form (no assignee / visibility fields). */
export function buildDemoClientSnagForm({ rooms = [], activities = [] } = {}) {
  const full = buildDemoSnagForm({ rooms, activities, employees: [], withAssignee: false });
  return {
    title: full.title,
    description: full.description,
    location: full.location,
    projectRoomId: full.projectRoomId,
    activityUuid: full.activityUuid,
    severity: full.severity,
    dueDate: full.dueDate,
    photos: full.photos,
  };
}

const DOCUMENT_DEMO_SAMPLES = [
  { title: "Level 1 floor plan", category: "drawings" },
  { title: "Reflected ceiling plan — Zone A", category: "drawings" },
  { title: "Site induction register", category: "H&S" },
  { title: "Method statement — tiling works", category: "method statements" },
  { title: "Payment certificate draft", category: "commercial" },
  { title: "Variation cost breakdown", category: "commercial" },
  { title: "Progress photo — lobby finishes", category: "photos" },
  { title: "As-built note — wet areas", category: "other" },
];

/** Fresh document upload payload (title, category, File) on every call. */
export function buildDemoDocumentUpload() {
  const sample = pickDemo(DOCUMENT_DEMO_SAMPLES) || DOCUMENT_DEMO_SAMPLES[0];
  const stamp = Date.now().toString(36).slice(-5);
  const title = `${sample.title} [${stamp}]`;
  const file =
    sample.category === "photos"
      ? makeDemoPng(`doc-${stamp}.png`)
      : makeDemoPdf(`doc-${stamp}.pdf`, title);
  return {
    title,
    category: sample.category,
    file,
  };
}

/** Fresh file for "new version" upload. */
export function buildDemoDocumentVersionFile(baseTitle = "Updated document") {
  const stamp = Date.now().toString(36).slice(-5);
  return makeDemoPdf(`doc-v-${stamp}.pdf`, `${baseTitle} revision ${stamp}`);
}
