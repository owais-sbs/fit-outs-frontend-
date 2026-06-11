// ─── Initial Data Seeds ────────────────────────────────────────────────────────

const INITIAL_PROJECT_REQUESTS = [
  {
    id: "REQ-1001",
    clientName: "Claire Moss",
    clientId: "client-001",
    projectName: "Moss Showroom Expansion",
    projectType: "Interior",
    location: "Surry Hills, NSW",
    expectedStartDate: "2026-07-01",
    budgetRange: "$150,000 - $200,000",
    description: "Expanding the existing showroom to include a new lighting showcase room and dedicated consultant offices.",
    submissionDate: "2026-06-10",
    status: "Pending", // Pending, Approved, Rejected
  },
  {
    id: "REQ-1002",
    clientName: "Marcus Reid",
    clientId: "client-002",
    projectName: "Harbour Retail Lounge",
    projectType: "Commercial",
    location: "Sydney CBD, NSW",
    expectedStartDate: "2026-08-15",
    budgetRange: "$80,000 - $120,000",
    description: "Bespoke VIP customer lounge within the flagship retail store, featuring premium fittings and acoustic panelling.",
    submissionDate: "2026-06-08",
    status: "Approved",
  },
  {
    id: "REQ-1003",
    clientName: "Helen Frost",
    clientId: "client-003",
    projectName: "Acoustic Meeting Rooms",
    projectType: "Commercial",
    location: "Brisbane CBD, QLD",
    expectedStartDate: "2026-09-01",
    budgetRange: "$50,000 - $70,000",
    description: "Installation of three high-performance soundproof meeting rooms in the main office floor.",
    submissionDate: "2026-06-05",
    status: "Rejected",
  }
];

const INITIAL_PROJECTS = [
  {
    id: "PRJ-201",
    projectName: "Luxury Penthouse Fit-Out",
    clientName: "Claire Moss",
    clientId: "client-001",
    projectType: "Residential",
    location: "Surry Hills, NSW",
    assignedManager: "Lisa Park",
    progress: 65,
    status: "In Progress", // Planning, In Progress, On Hold, Completed, Cancelled
    startDate: "2026-03-15",
    expectedCompletionDate: "2026-08-30",
    budget: 142000,
    description: "Boutique high-end penthouse renovation with structural steel modifications and bespoke marble finishings."
  },
  {
    id: "PRJ-202",
    projectName: "Corporate HQ Open-Plan",
    clientName: "Marcus Reid",
    clientId: "client-002",
    projectType: "Commercial",
    location: "Sydney CBD, NSW",
    assignedManager: "Tom Bradley",
    progress: 15,
    status: "Planning",
    startDate: "2026-06-01",
    expectedCompletionDate: "2026-11-15",
    budget: 320000,
    description: "Full-floor office conversion with custom workstations, acoustic ceiling grids, and dynamic boardrooms."
  },
  {
    id: "PRJ-203",
    projectName: "Clinic Renovation",
    clientName: "Priya Nair",
    clientId: "client-003",
    projectType: "Interior",
    location: "Parramatta, NSW",
    assignedManager: "Emma Walsh",
    progress: 100,
    status: "Completed",
    startDate: "2026-01-10",
    expectedCompletionDate: "2026-05-15",
    budget: 85000,
    description: "Medical clinic fit-out compliant with local healthcare accessibility guidelines and antimicrobial coating specifications."
  }
];

const INITIAL_UPDATES = [
  {
    id: "upd-001",
    projectId: "PRJ-201",
    title: "Foundation Work Completed",
    description: "Structural reinforcing bars installed and concrete slab poured. Core inspection approved by the engineering consultant.",
    date: "2026-04-10",
    photo: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80"
  },
  {
    id: "upd-002",
    projectId: "PRJ-201",
    title: "Ground Floor Framing Completed",
    description: "Timber and structural steel framing for the ground partition layout is now completed. Ready for electrical wiring rough-ins.",
    date: "2026-05-18",
    photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80"
  },
  {
    id: "upd-003",
    projectId: "PRJ-201",
    title: "Electrical Installation Started",
    description: "A-Grade certified electricians have begun running cabling for main distribution boards, lighting controls, and wall sockets.",
    date: "2026-06-05",
    photo: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&q=80"
  },
  {
    id: "upd-004",
    projectId: "PRJ-202",
    title: "Initial Site Mobilisation",
    description: "Temporary site fencing, safety signage, waste disposal bins, and designer site offices successfully installed. Site induction completed for all contractors.",
    date: "2026-06-03",
    photo: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80"
  }
];

const INITIAL_DOCUMENTS = [
  {
    id: "doc-101",
    projectId: "PRJ-201",
    name: "Architectural_Drawings_Rev3.pdf",
    type: "Drawings", // Contracts, Approvals, Drawings, BOQ, Invoices, Other
    size: "14.5 MB",
    uploadedAt: "2026-03-10"
  },
  {
    id: "doc-102",
    projectId: "PRJ-201",
    name: "Executed_Client_Agreement.pdf",
    type: "Contracts",
    size: "4.8 MB",
    uploadedAt: "2026-03-12"
  },
  {
    id: "doc-103",
    projectId: "PRJ-201",
    name: "Bill_of_Quantities_Final.xlsx",
    type: "BOQ",
    size: "1.2 MB",
    uploadedAt: "2026-03-14"
  },
  {
    id: "doc-104",
    projectId: "PRJ-202",
    name: "Council_Development_Approval.pdf",
    type: "Approvals",
    size: "3.1 MB",
    uploadedAt: "2026-05-28"
  },
  {
    id: "doc-105",
    projectId: "PRJ-202",
    name: "Invoice_Deposit_001.pdf",
    type: "Invoices",
    size: "820 KB",
    uploadedAt: "2026-06-01"
  }
];

const INITIAL_SITE_VISITS = [
  {
    id: "sv-201",
    projectId: "PRJ-201",
    date: "2026-06-18",
    time: "10:00 AM",
    employee: "Tom Bradley",
    purpose: "Pre-plasterboard wall inspection and plumbing pressure test.",
    status: "Scheduled" // Scheduled, Completed, Cancelled
  },
  {
    id: "sv-202",
    projectId: "PRJ-201",
    date: "2026-06-25",
    time: "02:00 PM",
    employee: "Lisa Park",
    purpose: "Client material walkthrough and sign-off on joinery finishes.",
    status: "Scheduled"
  },
  {
    id: "sv-203",
    projectId: "PRJ-201",
    date: "2026-06-04",
    time: "09:30 AM",
    employee: "James Wu",
    purpose: "Inspecting steel portal frame connections post-torque testing.",
    status: "Completed"
  },
  {
    id: "sv-204",
    projectId: "PRJ-202",
    date: "2026-06-20",
    time: "11:00 AM",
    employee: "Tom Bradley",
    purpose: "Site framing audit and spatial layout validation with site manager.",
    status: "Scheduled"
  }
];

// ─── LocalStorage Helpers ──────────────────────────────────────────────────────

const STORE_VERSION = "pms-v3"; // bumped: employees now use roles[] array

function getStored(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Trigger storage event for local updates (same-tab listeners)
    window.dispatchEvent(new Event("storage_update"));
  } catch (e) {
    console.error("Failed to write to localStorage:", e);
  }
}

/**
 * On every page load, check whether the stored version matches STORE_VERSION.
 * If it doesn't (first ever load, or seed data was bumped), wipe the old data
 * and re-seed from the INITIAL_* constants so the demo always has rich data.
 */
function initializeStore() {
  try {
    const storedVersion = localStorage.getItem("project_store_version");
    if (storedVersion !== STORE_VERSION) {
      localStorage.setItem("projects",             JSON.stringify(INITIAL_PROJECTS));
      localStorage.setItem("project_requests",     JSON.stringify(INITIAL_PROJECT_REQUESTS));
      localStorage.setItem("project_updates",      JSON.stringify(INITIAL_UPDATES));
      localStorage.setItem("project_documents",    JSON.stringify(INITIAL_DOCUMENTS));
      localStorage.setItem("project_site_visits",  JSON.stringify(INITIAL_SITE_VISITS));
      localStorage.setItem("project_store_version", STORE_VERSION);
      console.info("[projectStore] Seeded fresh data at version:", STORE_VERSION);
    }
  } catch (e) {
    console.error("[projectStore] Initialization failed:", e);
  }
}

// Run once when the module is imported (i.e., at app startup)
initializeStore();

// ─── API Methods ──────────────────────────────────────────────────────────────

export const projectStore = {
  // Project Requests
  getRequests: () => getStored("project_requests", INITIAL_PROJECT_REQUESTS),
  addRequest: (request) => {
    const list = projectStore.getRequests();
    const newReq = {
      ...request,
      id: `REQ-${1000 + list.length + 1}`,
      submissionDate: new Date().toISOString().split("T")[0],
      status: "Pending",
    };
    list.unshift(newReq);
    setStored("project_requests", list);
    return newReq;
  },
  updateRequestStatus: (id, status) => {
    const list = projectStore.getRequests();
    const updated = list.map((r) => (r.id === id ? { ...r, status } : r));
    setStored("project_requests", updated);
  },

  // Projects
  getProjects: () => getStored("projects", INITIAL_PROJECTS),
  getProjectById: (id) => projectStore.getProjects().find((p) => p.id === id) || null,
  addProject: (proj) => {
    const list = projectStore.getProjects();
    const newProj = {
      ...proj,
      id: `PRJ-${200 + list.length + 1}`,
      progress: parseInt(proj.progress || 0, 10),
    };
    list.push(newProj);
    setStored("projects", list);
    return newProj;
  },
  updateProject: (id, data) => {
    const list = projectStore.getProjects();
    const updated = list.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          ...data,
          progress: data.progress !== undefined ? parseInt(data.progress, 10) : p.progress,
        };
      }
      return p;
    });
    setStored("projects", updated);
  },

  // Progress Updates
  getUpdates: (projectId) => {
    const all = getStored("project_updates", INITIAL_UPDATES);
    return all.filter((u) => u.projectId === projectId).sort((a, b) => b.date.localeCompare(a.date));
  },
  addUpdate: (projectId, update) => {
    const all = getStored("project_updates", INITIAL_UPDATES);
    const newUpd = {
      ...update,
      id: `upd-${Date.now()}`,
      projectId,
      date: update.date || new Date().toISOString().split("T")[0],
    };
    all.push(newUpd);
    setStored("project_updates", all);
    return newUpd;
  },

  // Documents
  getDocuments: (projectId) => {
    const all = getStored("project_documents", INITIAL_DOCUMENTS);
    return all.filter((d) => d.projectId === projectId);
  },
  addDocument: (projectId, doc) => {
    const all = getStored("project_documents", INITIAL_DOCUMENTS);
    const newDoc = {
      ...doc,
      id: `doc-${Date.now()}`,
      projectId,
      uploadedAt: new Date().toISOString().split("T")[0],
    };
    all.push(newDoc);
    setStored("project_documents", all);
    return newDoc;
  },

  // Site Visits
  getSiteVisits: (projectId) => {
    const all = getStored("project_site_visits", INITIAL_SITE_VISITS);
    return all.filter((v) => v.projectId === projectId);
  },
  addSiteVisit: (projectId, visit) => {
    const all = getStored("project_site_visits", INITIAL_SITE_VISITS);
    const newVisit = {
      ...visit,
      id: `sv-${Date.now()}`,
      projectId,
      status: "Scheduled",
    };
    all.push(newVisit);
    setStored("project_site_visits", all);
    return newVisit;
  }
};
