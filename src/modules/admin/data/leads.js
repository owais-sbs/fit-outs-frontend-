export const PIPELINE_COLUMNS = [
  { id: "NEW", title: "New" },
  { id: "CONTACTED", title: "Contacted" },
  { id: "QUALIFIED", title: "Qualified" },
  { id: "SITE_VISIT_SCHEDULED", title: "Site Visit Scheduled" },
  { id: "LOST", title: "Lost" },
  { id: "CLIENT", title: "Client" },
];

export const LEAD_SOURCES = [
  "Walk-in",
  "Referral",
  "Website",
  "Social",
  "Other",
];

export const PROJECT_TYPES = [
  "Residential",
  "Commercial",
  "Interior",
  "Renovation",
  "Construction",
];

export const INITIAL_LEADS = {
  NEW: [
    {
      id: "l1",
      clientName: "Marcus Reid",
      phone: "+61 412 345 678",
      email: "marcus.reid@harbourretail.com.au",
      source: "Website",
      projectType: "Commercial",
      assignee: "James Wu",
      notes: "Client looking for open-plan office fit-out. Prefers sustainable materials.",
    },
    {
      id: "l2",
      clientName: "Priya Nair",
      phone: "+61 423 456 789",
      email: "priya@nairmedical.com.au",
      source: "Referral",
      projectType: "Interior",
      assignee: "Emma Walsh",
      notes: "Clinic renovation — requires medical-grade finishes and compliance.",
    },
  ],
  CONTACTED: [
    {
      id: "l3",
      clientName: "Daniel Cho",
      phone: "+61 434 567 890",
      email: "d.cho@chologistics.com.au",
      source: "Other",
      otherSource: "Google Ads",
      projectType: "Commercial",
      assignee: "Tom Bradley",
      notes: "Warehouse-to-office conversion. Site walk required.",
    },
  ],
  QUALIFIED: [
    {
      id: "l4",
      clientName: "Helen Frost",
      phone: "+61 456 789 012",
      email: "helen@frostandco.com.au",
      source: "Referral",
      projectType: "Commercial",
      assignee: "James Wu",
      notes: "Law firm requiring executive suites and secure document rooms.",
    },
    {
      id: "l5",
      clientName: "Oliver Grant",
      phone: "+61 467 890 123",
      email: "oliver@granthospitality.com",
      source: "Walk-in",
      projectType: "Renovation",
      assignee: "Emma Walsh",
      notes: "Full restaurant renovation — kitchen, dining room, bathrooms.",
    },
  ],
  SITE_VISIT_SCHEDULED: [
    {
      id: "l6",
      clientName: "Yuki Tanaka",
      phone: "+61 478 901 234",
      email: "yuki.tanaka@tanakafoods.com.au",
      source: "Other",
      otherSource: "Google Ads",
      projectType: "Construction",
      assignee: "Tom Bradley",
      notes: "New production facility build-out. Structural assessment required.",
    },
  ],
  CLIENT: [
    {
      id: "l7",
      clientName: "Claire Moss",
      phone: "+61 490 123 456",
      email: "claire@mossinteriors.com.au",
      source: "Referral",
      projectType: "Interior",
      assignee: "Lisa Park",
      notes: "Boutique showroom fit-out. Client is flexible on timeline.",
    },
  ],
  LOST: [
    {
      id: "l8",
      clientName: "Ben Carter",
      phone: "+61 401 234 567",
      email: "ben.carter@carterauto.com.au",
      source: "Social",
      projectType: "Commercial",
      assignee: "James Wu",
      notes: "Lost — went with competitor. Budget constraints cited.",
    },
  ],
};

export function getLeadById(id) {
  for (const col of Object.keys(INITIAL_LEADS)) {
    const found = INITIAL_LEADS[col].find((l) => l.id === id);
    if (found) return { ...found, status: col };
  }
  return null;
}

export function getAllLeads() {
  return Object.entries(INITIAL_LEADS).flatMap(([status, leads]) =>
    leads.map((l) => ({ ...l, status }))
  );
}

export const LEAD_DETAIL_EXTRA = {
  l6: {
    timeline: [
      { type: "site_visit", title: "Site visit scheduled", time: "May 18, 2026", user: "Tom Bradley", description: "Walk-through confirmed for May 22, 9am." },
      { type: "status", title: "Moved to Site Visit", time: "May 16, 2026", user: "Tom Bradley", description: "" },
      { type: "status", title: "Qualified — budget confirmed", time: "May 12, 2026", user: "Tom Bradley", description: "Client confirmed budget range." },
      { type: "call", title: "Discovery call — 35 min", time: "May 10, 2026", user: "Emma Walsh", description: "Discussed scope, site constraints, and timeline." },
      { type: "contact", title: "Initial contact made", time: "May 5, 2026", user: "Emma Walsh", description: "Responded to form enquiry." },
    ],
    notes: [
      { id: "n1", author: "Tom Bradley", text: "Client prefers weekend site walkthrough. Has strict access hours — 8am–12pm only.", time: "2 days ago" },
      { id: "n2", author: "Emma Walsh", text: "Referred us to their sister company Tanaka Beverages — potential new lead.", time: "1 week ago" },
    ],
    siteVisit: {
      date: "2026-05-22",
      location: "42 Industrial Ave, Alexandria NSW 2015",
      staff: "Tom Bradley",
      status: "scheduled",
    },
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
    siteVisit: null,
  },
};
