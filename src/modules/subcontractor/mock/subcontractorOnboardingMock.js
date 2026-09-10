const STORAGE_KEY = "jct_sc_onboarding_applications";

const SEED_APPLICATIONS = [
  {
    id: "sc-app-001",
    legalName: "Gulf Fitout Contracting LLC",
    tradeName: "Gulf Fitout",
    crNumber: "CR-1029384",
    vatId: "TRN-1002948371",
    contactEmail: "ops@gulffitout.demo",
    contactPhone: "+971 50 111 2233",
    officeAddress: "Office 1204, Business Bay, Dubai, UAE",
    tradeSpecializations: ["Joinery", "Drywall", "Ceiling"],
    status: "UNDER_REVIEW",
    registeredAt: "2026-08-12T09:30:00.000Z",
    documents: [
      { id: "doc-1", type: "Trade License", filename: "trade-license.pdf", expiryDate: "2027-03-01", status: "Pending" },
      { id: "doc-2", type: "VAT Certificate", filename: "vat-certificate.pdf", expiryDate: null, status: "Pending" },
      { id: "doc-3", type: "Insurance — CAR", filename: "car-insurance.pdf", expiryDate: "2026-12-31", status: "Pending" },
    ],
    primaryAdmin: {
      fullName: "Ahmed Al Mansoori",
      email: "ahmed@gulffitout.demo",
      phone: "+971 50 111 2233",
    },
    verificationHistory: [
      {
        action: "Application Submitted",
        actor: "Ahmed Al Mansoori",
        date: "12 Aug 2026",
        notes: "Community registration submitted with compliance documents.",
      },
    ],
  },
  {
    id: "sc-app-002",
    legalName: "Precision MEP Services FZCO",
    tradeName: "Precision MEP",
    crNumber: "CR-4482190",
    vatId: "TRN-1008837462",
    contactEmail: "bids@precisionmep.demo",
    contactPhone: "+971 55 444 7788",
    officeAddress: "Warehouse 7, Al Quoz Industrial 3, Dubai, UAE",
    tradeSpecializations: ["MEP", "Electrical", "HVAC"],
    status: "REGISTERED",
    registeredAt: "2026-07-28T14:10:00.000Z",
    documents: [
      { id: "doc-1", type: "Trade License", filename: "precision-license.pdf", expiryDate: "2027-01-15", status: "Approved" },
      { id: "doc-2", type: "Insurance — WC", filename: "wc-policy.pdf", expiryDate: "2026-11-30", status: "Pending" },
    ],
    primaryAdmin: {
      fullName: "Sara Khan",
      email: "sara@precisionmep.demo",
      phone: "+971 55 444 7788",
    },
    verificationHistory: [
      {
        action: "Application Submitted",
        actor: "Sara Khan",
        date: "28 Jul 2026",
        notes: null,
      },
    ],
  },
  {
    id: "sc-app-003",
    legalName: "Desert Stone Finishes LLC",
    tradeName: "Desert Stone",
    crNumber: "CR-7712045",
    vatId: "TRN-1001122334",
    contactEmail: "admin@desertstone.demo",
    contactPhone: "+971 52 900 1122",
    officeAddress: "Shop 4, Al Ain Road, Dubai, UAE",
    tradeSpecializations: ["Stone", "Flooring", "Cladding"],
    status: "VERIFIED",
    registeredAt: "2026-06-05T11:00:00.000Z",
    verifiedAt: "2026-06-18T08:45:00.000Z",
    verifiedBy: "JCT Procurement Admin",
    tierRating: "TIER_2",
    documents: [
      { id: "doc-1", type: "Trade License", filename: "desert-license.pdf", expiryDate: "2027-06-01", status: "Approved" },
      { id: "doc-2", type: "Insurance — TPL", filename: "tpl.pdf", expiryDate: "2027-01-01", status: "Approved" },
    ],
    primaryAdmin: {
      fullName: "Omar Farouk",
      email: "omar@desertstone.demo",
      phone: "+971 52 900 1122",
    },
    verificationHistory: [
      {
        action: "Application Submitted",
        actor: "Omar Farouk",
        date: "05 Jun 2026",
        notes: null,
      },
      {
        action: "Verified",
        actor: "JCT Procurement Admin",
        date: "18 Jun 2026",
        notes: "Prequalification approved. Assigned tier: TIER_2",
      },
    ],
  },
];

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    // fall through to seed
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_APPLICATIONS));
  return structuredClone(SEED_APPLICATIONS);
}

function writeStore(apps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  return apps;
}

function formatHistoryDate(date = new Date()) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function getStoredApplications() {
  return readStore();
}

export function getApplicationById(id) {
  return readStore().find((app) => String(app.id) === String(id)) || null;
}

export function updateApplicationStatus(id, status, notes, actor = "JCT Procurement Admin") {
  const apps = readStore();
  const idx = apps.findIndex((app) => String(app.id) === String(id));
  if (idx < 0) return null;

  const app = { ...apps[idx] };
  app.status = status;
  app.verificationHistory = [
    ...(app.verificationHistory || []),
    {
      action: status === "VERIFIED" ? "Verified" : status === "REJECTED" ? "Rejected" : status,
      actor,
      date: formatHistoryDate(),
      notes: notes || null,
    },
  ];

  if (status === "VERIFIED") {
    app.verifiedAt = new Date().toISOString();
    app.verifiedBy = actor;
    app.rejectionReason = undefined;
    const tierMatch = typeof notes === "string" ? notes.match(/TIER_[123]/) : null;
    if (tierMatch) app.tierRating = tierMatch[0];
  }

  if (status === "REJECTED") {
    app.rejectionReason = notes || "";
  }

  apps[idx] = app;
  writeStore(apps);
  return app;
}

export function updateDocumentStatus(applicationId, docId, newStatus) {
  const apps = readStore();
  const idx = apps.findIndex((app) => String(app.id) === String(applicationId));
  if (idx < 0) return null;

  const app = {
    ...apps[idx],
    documents: (apps[idx].documents || []).map((doc) =>
      String(doc.id) === String(docId) ? { ...doc, status: newStatus } : doc
    ),
  };
  app.verificationHistory = [
    ...(app.verificationHistory || []),
    {
      action: `Document ${newStatus}`,
      actor: "JCT Procurement Admin",
      date: formatHistoryDate(),
      notes: `Document ${docId} marked ${newStatus}.`,
    },
  ];

  apps[idx] = app;
  writeStore(apps);
  return app;
}
