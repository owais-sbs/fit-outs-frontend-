export const PIPELINE_COLUMNS = [
  { id: "new", title: "New" },
  { id: "contacted", title: "Contacted" },
  { id: "qualified", title: "Qualified" },
  { id: "siteVisit", title: "Site Visit" },
  { id: "won", title: "Won" },
  { id: "lost", title: "Lost" },
];

export const LEAD_SOURCES = [
  "Website inquiry",
  "Referral",
  "Trade show",
  "LinkedIn",
  "Existing client",
  "Cold outreach",
];

export const REQUIREMENT_TYPES = [
  "Office fit-out",
  "Retail refurbishment",
  "Warehouse conversion",
  "Restaurant / hospitality",
  "Medical / clinic",
];

export const SALES_REPS = [
  "James Wu",
  "Emma Walsh",
  "Tom Bradley",
  "Lisa Park",
];

export const INITIAL_LEADS = {
  new: [
    { id: "l1", clientName: "Marcus Reid", company: "Harbour Retail Group", budget: 120000, assignee: "James Wu", followUp: "2026-05-22", source: "Website inquiry", priority: "high" },
    { id: "l2", clientName: "Priya Nair", company: "Nair Medical", budget: 85000, assignee: "Emma Walsh", followUp: "2026-05-23", source: "Referral", priority: "medium" },
  ],
  contacted: [
    { id: "l3", clientName: "Daniel Cho", company: "Cho Logistics", budget: 210000, assignee: "Tom Bradley", followUp: "2026-05-21", source: "Trade show", priority: "high" },
  ],
  qualified: [
    { id: "l4", clientName: "Helen Frost", company: "Frost & Co Legal", budget: 165000, assignee: "James Wu", followUp: "2026-05-24", source: "LinkedIn", priority: "medium" },
    { id: "l5", clientName: "Oliver Grant", company: "Grant Hospitality", budget: 320000, assignee: "Emma Walsh", followUp: "2026-05-25", source: "Existing client", priority: "high" },
  ],
  siteVisit: [
    { id: "l6", clientName: "Yuki Tanaka", company: "Tanaka Foods", budget: 195000, assignee: "Tom Bradley", followUp: "2026-05-20", source: "Website inquiry", priority: "high" },
  ],
  won: [
    { id: "l7", clientName: "Claire Moss", company: "Moss Interiors", budget: 142000, assignee: "Lisa Park", followUp: "—", source: "Referral", priority: "low" },
  ],
  lost: [
    { id: "l8", clientName: "Ben Carter", company: "Carter Auto", budget: 95000, assignee: "James Wu", followUp: "—", source: "Cold outreach", priority: "low" },
  ],
};

export function getLeadById(id) {
  for (const col of Object.keys(INITIAL_LEADS)) {
    const found = INITIAL_LEADS[col].find((l) => l.id === id);
    if (found) return { ...found, stage: col };
  }
  return null;
}

export const LEAD_DETAIL_EXTRA = {
  l6: {
    timeline: [
      { title: "Site visit scheduled", time: "May 18, 2026", user: "Tom Bradley" },
      { title: "Qualified — budget confirmed", time: "May 12, 2026", user: "Tom Bradley" },
      { title: "Initial contact", time: "May 5, 2026", user: "Emma Walsh" },
    ],
    notes: [
      { author: "Tom Bradley", text: "Client prefers weekend site walkthrough.", time: "2 days ago" },
    ],
    siteVisit: { date: "2026-05-22", location: "42 Industrial Ave, Alexandria NSW", staff: "Tom Bradley", status: "scheduled" },
    activities: [
      { action: "Email sent — proposal outline", time: "May 17" },
      { action: "Call — 25 min", time: "May 14" },
    ],
  },
};
