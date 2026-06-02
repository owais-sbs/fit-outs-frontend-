/**
 * Shared in-memory store for design workflow state.
 * Simulates real-time sync between admin and client dashboards.
 * Replace listeners with Socket.io / Redux Toolkit in production.
 */

const CLIENT_ID = "client-001"; // current logged-in client

export const SEED_CLIENT_DESIGNS = [
  {
    id: "cd-1001",
    projectName: "Luxury Penthouse Fit-Out",
    clientName: "Al Barari Developments",
    clientId: CLIENT_ID,
    version: "v1.2",
    status: "Pending Approval",
    uploadDate: "2026-06-01",
    designer: "Sarah Mitchell",
    designerAvatar: "SM",
    designType: "Residential Interior",
    description:
      "Revised concept for the master suite and open-plan living area. Updated material palette with Calacatta marble, custom joinery in smoked oak, and a refined lighting scheme throughout.",
    thumbnail: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    ],
    pdfUrl: null,
    tags: ["Penthouse", "Luxury", "Residential"],
  },
  {
    id: "cd-1002",
    projectName: "Corporate HQ Office Fit-Out",
    clientName: "Meridian Capital Group",
    clientId: CLIENT_ID,
    version: "v1.0",
    status: "Revision Requested",
    uploadDate: "2026-05-30",
    designer: "James Al-Farsi",
    designerAvatar: "JA",
    designType: "Commercial Interior",
    description:
      "Initial concept design for the 12-floor commercial fit-out. Includes open-plan workspaces, executive boardrooms, reception lobby, and breakout zones.",
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&q=80",
    ],
    pdfUrl: null,
    tags: ["Office", "Corporate", "Commercial"],
  },
  {
    id: "cd-1003",
    projectName: "Boutique Hotel Lobby",
    clientName: "Crescent Hospitality",
    clientId: CLIENT_ID,
    version: "v1.3",
    status: "Approved",
    uploadDate: "2026-05-28",
    designer: "James Al-Farsi",
    designerAvatar: "JA",
    designType: "Hospitality Interior",
    description:
      "Final approved lobby concept featuring bespoke furniture, curated art wall, dramatic double-height ceiling treatment, and integrated ambient lighting design.",
    thumbnail: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    ],
    pdfUrl: null,
    tags: ["Hotel", "Lobby", "Hospitality"],
  },
  {
    id: "cd-1004",
    projectName: "High-End Villa Interior",
    clientName: "Emirates Elite Properties",
    clientId: CLIENT_ID,
    version: "v1.1",
    status: "Pending Approval",
    uploadDate: "2026-06-01",
    designer: "Priya Sharma",
    designerAvatar: "PS",
    designType: "Residential Interior",
    description:
      "Updated villa concept covering entrance foyer, majlis, formal dining room, and 6 bedroom suites. Includes full FF&E schedule and material board.",
    thumbnail: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    ],
    pdfUrl: null,
    tags: ["Villa", "Luxury", "Residential"],
  },
  {
    id: "cd-1005",
    projectName: "Flagship Retail Store",
    clientName: "Maison Luxe Fashion",
    clientId: CLIENT_ID,
    version: "v2.1",
    status: "Pending Approval",
    uploadDate: "2026-06-03",
    designer: "Lucas Brennan",
    designerAvatar: "LB",
    designType: "Retail Interior",
    description:
      "Final retail layout with custom display systems, premium fitting rooms, integrated brand statement wall, and bespoke lighting concept for the main floor.",
    thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
    ],
    pdfUrl: null,
    tags: ["Retail", "Luxury", "Fit-Out"],
  },
];

// ─── Notification seed ────────────────────────────────────────────────────────

export const SEED_NOTIFICATIONS = {
  client: [
    { id: "n-c1", type: "upload",        message: "New design uploaded: Luxury Penthouse Fit-Out v1.2",   time: "2026-06-01T09:00:00", read: false },
    { id: "n-c2", type: "revision_done", message: "Your revision for Corporate HQ has been addressed",    time: "2026-05-31T14:30:00", read: false },
    { id: "n-c3", type: "approved",      message: "Boutique Hotel Lobby design approved successfully",    time: "2026-05-28T11:00:00", read: true  },
  ],
  admin: [
    { id: "n-a1", type: "approved", message: "Client approved: Boutique Hotel Lobby v1.3",              time: "2026-06-01T10:00:00", read: false },
    { id: "n-a2", type: "revision", message: "Revision requested: Corporate HQ Office Fit-Out v1.0",    time: "2026-05-30T16:00:00", read: false },
    { id: "n-a3", type: "upload",   message: "Design uploaded: Flagship Retail Store v2.1",             time: "2026-06-03T09:30:00", read: true  },
  ],
};
