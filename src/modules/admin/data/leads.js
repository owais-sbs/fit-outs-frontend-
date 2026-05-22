// ─── Pipeline columns ────────────────────────────────────────────────────────
export const PIPELINE_COLUMNS = [
  { id: "new",        title: "New" },
  { id: "contacted",  title: "Contacted" },
  { id: "qualified",  title: "Qualified" },
  { id: "siteVisit",  title: "Site Visit" },
  { id: "proposalSent", title: "Proposal Sent" },
  { id: "won",        title: "Won" },
  { id: "lost",       title: "Lost" },
];

// ─── Dropdown options ─────────────────────────────────────────────────────────
export const LEAD_SOURCES = [
  "Walk-in",
  "Referral",
  "Website",
  "Social Media",
  "Facebook Ads",
  "Instagram",
  "Google Ads",
];

export const PROJECT_TYPES = [
  "Residential",
  "Commercial",
  "Interior",
  "Renovation",
  "Construction",
];

export const PRIORITIES = ["High", "Medium", "Low"];

export const SALES_REPS = [
  "James Wu",
  "Emma Walsh",
  "Tom Bradley",
  "Lisa Park",
];

// ─── Mock leads with full field set ──────────────────────────────────────────
export const INITIAL_LEADS = {
  new: [
    {
      id: "l1",
      clientName: "Marcus Reid",
      company: "Harbour Retail Group",
      phone: "+61 412 345 678",
      email: "marcus.reid@harbourretail.com.au",
      budget: 120000,
      source: "Website",
      projectType: "Commercial",
      assignee: "James Wu",
      followUp: "2026-05-28",
      priority: "high",
      location: "Sydney CBD, NSW",
      expectedStart: "2026-07-01",
      notes: "Client looking for open-plan office fit-out. Prefers sustainable materials.",
    },
    {
      id: "l2",
      clientName: "Priya Nair",
      company: "Nair Medical Centre",
      phone: "+61 423 456 789",
      email: "priya@nairmedical.com.au",
      budget: 85000,
      source: "Referral",
      projectType: "Interior",
      assignee: "Emma Walsh",
      followUp: "2026-05-29",
      priority: "medium",
      location: "Parramatta, NSW",
      expectedStart: "2026-08-15",
      notes: "Clinic renovation — requires medical-grade finishes and compliance.",
    },
  ],
  contacted: [
    {
      id: "l3",
      clientName: "Daniel Cho",
      company: "Cho Logistics",
      phone: "+61 434 567 890",
      email: "d.cho@chologistics.com.au",
      budget: 210000,
      source: "Google Ads",
      projectType: "Commercial",
      assignee: "Tom Bradley",
      followUp: "2026-05-27",
      priority: "high",
      location: "Mascot, NSW",
      expectedStart: "2026-06-20",
      notes: "Warehouse-to-office conversion. Site walk required.",
    },
    {
      id: "l9",
      clientName: "Anika Sharma",
      company: "Sharma Consulting",
      phone: "+61 445 678 901",
      email: "anika@sharmaconsult.com",
      budget: 65000,
      source: "Instagram",
      projectType: "Interior",
      assignee: "Lisa Park",
      followUp: "2026-05-30",
      priority: "low",
      location: "North Sydney, NSW",
      expectedStart: "2026-09-01",
      notes: "",
    },
  ],
  qualified: [
    {
      id: "l4",
      clientName: "Helen Frost",
      company: "Frost & Co Legal",
      phone: "+61 456 789 012",
      email: "helen@frostandco.com.au",
      budget: 165000,
      source: "Referral",
      projectType: "Commercial",
      assignee: "James Wu",
      followUp: "2026-05-31",
      priority: "medium",
      location: "Brisbane CBD, QLD",
      expectedStart: "2026-07-15",
      notes: "Law firm requiring executive suites and secure document rooms.",
    },
    {
      id: "l5",
      clientName: "Oliver Grant",
      company: "Grant Hospitality",
      phone: "+61 467 890 123",
      email: "oliver@granthospitality.com",
      budget: 320000,
      source: "Walk-in",
      projectType: "Renovation",
      assignee: "Emma Walsh",
      followUp: "2026-06-01",
      priority: "high",
      location: "Melbourne CBD, VIC",
      expectedStart: "2026-06-30",
      notes: "Full restaurant renovation — kitchen, dining room, bathrooms.",
    },
  ],
  siteVisit: [
    {
      id: "l6",
      clientName: "Yuki Tanaka",
      company: "Tanaka Foods",
      phone: "+61 478 901 234",
      email: "yuki.tanaka@tanakafoods.com.au",
      budget: 195000,
      source: "Google Ads",
      projectType: "Construction",
      assignee: "Tom Bradley",
      followUp: "2026-05-26",
      priority: "high",
      location: "Alexandria, NSW",
      expectedStart: "2026-07-01",
      notes: "New production facility build-out. Structural assessment required.",
    },
  ],
  proposalSent: [
    {
      id: "l10",
      clientName: "Ryan Fletcher",
      company: "Fletcher & Sons",
      phone: "+61 489 012 345",
      email: "ryan@fletcherandsons.com.au",
      budget: 240000,
      source: "Facebook Ads",
      projectType: "Residential",
      assignee: "James Wu",
      followUp: "2026-06-03",
      priority: "high",
      location: "Bondi, NSW",
      expectedStart: "2026-08-01",
      notes: "Luxury residential fit-out with custom joinery.",
    },
  ],
  won: [
    {
      id: "l7",
      clientName: "Claire Moss",
      company: "Moss Interiors",
      phone: "+61 490 123 456",
      email: "claire@mossinteriors.com.au",
      budget: 142000,
      source: "Referral",
      projectType: "Interior",
      assignee: "Lisa Park",
      followUp: "—",
      priority: "low",
      location: "Surry Hills, NSW",
      expectedStart: "2026-06-15",
      notes: "Boutique showroom fit-out. Client is flexible on timeline.",
    },
  ],
  lost: [
    {
      id: "l8",
      clientName: "Ben Carter",
      company: "Carter Auto",
      phone: "+61 401 234 567",
      email: "ben.carter@carterauto.com.au",
      budget: 95000,
      source: "Social Media",
      projectType: "Commercial",
      assignee: "James Wu",
      followUp: "—",
      priority: "low",
      location: "Penrith, NSW",
      expectedStart: "—",
      notes: "Lost — went with competitor. Budget constraints cited.",
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getLeadById(id) {
  for (const col of Object.keys(INITIAL_LEADS)) {
    const found = INITIAL_LEADS[col].find((l) => l.id === id);
    if (found) return { ...found, stage: col };
  }
  return null;
}

export function getAllLeads() {
  return Object.entries(INITIAL_LEADS).flatMap(([stage, leads]) =>
    leads.map((l) => ({ ...l, stage }))
  );
}

// ─── Lead detail extra data ──────────────────────────────────────────────────
export const LEAD_DETAIL_EXTRA = {
  l6: {
    timeline: [
      { type: "site_visit", title: "Site visit scheduled", time: "May 18, 2026", user: "Tom Bradley", description: "Walk-through confirmed for May 22, 9am." },
      { type: "status", title: "Moved to Site Visit", time: "May 16, 2026", user: "Tom Bradley", description: "" },
      { type: "status", title: "Qualified — budget confirmed", time: "May 12, 2026", user: "Tom Bradley", description: "Client confirmed $195k budget range." },
      { type: "call", title: "Discovery call — 35 min", time: "May 10, 2026", user: "Emma Walsh", description: "Discussed scope, site constraints, and timeline." },
      { type: "contact", title: "Initial contact made", time: "May 5, 2026", user: "Emma Walsh", description: "Responded to Google Ads form enquiry." },
    ],
    notes: [
      { id: "n1", author: "Tom Bradley", text: "Client prefers weekend site walkthrough. Has strict access hours — 8am–12pm only.", time: "2 days ago" },
      { id: "n2", author: "Emma Walsh", text: "Referred us to their sister company Tanaka Beverages — potential new lead.", time: "1 week ago" },
    ],
    followUps: [
      { id: "f1", date: "2026-05-22", outcome: "Scheduled site visit confirmed", user: "Tom Bradley" },
      { id: "f2", date: "2026-05-14", outcome: "Call — discussed proposal timeline", user: "Tom Bradley" },
    ],
    siteVisit: {
      date: "2026-05-22",
      location: "42 Industrial Ave, Alexandria NSW 2015",
      staff: "Tom Bradley",
      status: "scheduled",
      duration: "2 hrs",
    },
    attachments: [
      { id: "a1", name: "Site_Brief_Tanaka.pdf", size: "2.4 MB", type: "pdf", date: "May 15, 2026" },
      { id: "a2", name: "Floor_Plan_v1.dwg", size: "8.1 MB", type: "dwg", date: "May 17, 2026" },
    ],
    activities: [
      { action: "Email sent — proposal outline", time: "May 17" },
      { action: "Call — 25 min, site constraints discussed", time: "May 14" },
      { action: "Qualification form completed", time: "May 12" },
      { action: "Discovery call — 35 min", time: "May 10" },
      { action: "Lead created from Google Ads", time: "May 5" },
    ],
  },
  l5: {
    timeline: [
      { type: "status", title: "Moved to Qualified", time: "May 20, 2026", user: "Emma Walsh", description: "" },
      { type: "call", title: "Call — 20 min", time: "May 18, 2026", user: "Emma Walsh", description: "Client requested full proposal with 3D renders." },
      { type: "contact", title: "Walk-in enquiry", time: "May 15, 2026", user: "James Wu", description: "Client visited showroom unannounced." },
    ],
    notes: [
      { id: "n1", author: "Emma Walsh", text: "Client has very specific vision — wants exposed brick retained and pendant lighting throughout.", time: "3 days ago" },
    ],
    followUps: [
      { id: "f1", date: "2026-06-01", outcome: "Pending — awaiting client availability", user: "Emma Walsh" },
    ],
    siteVisit: null,
    attachments: [],
    activities: [
      { action: "Proposal requested", time: "May 18" },
      { action: "Walk-in converted to lead", time: "May 15" },
    ],
  },
};
