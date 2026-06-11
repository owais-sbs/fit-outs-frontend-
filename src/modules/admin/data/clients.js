// ─── Client statuses ─────────────────────────────────────────────────────────
export const CLIENT_STATUSES = ["Active", "Inactive", "Prospect", "VIP"];

// ─── Clients derived from won leads + extra data ──────────────────────────────
export const INITIAL_CLIENTS = [
  {
    id: "cl-001",
    name: "Claire Moss",
    company: "Moss Interiors",
    email: "claire@mossinteriors.com.au",
    phone: "+61 490 123 456",
    location: "Surry Hills, NSW",
    status: "Active",
    joinedDate: "2026-06-15",
    projectCount: 1,
    totalSpend: 142000,
    assignee: "Lisa Park",
    notes: "Boutique showroom fit-out. Repeat business expected.",
    lastContact: "2026-06-10",
  },
  {
    id: "cl-002",
    name: "Marcus Reid",
    company: "Harbour Retail Group",
    email: "marcus.reid@harbourretail.com.au",
    phone: "+61 412 345 678",
    location: "Sydney CBD, NSW",
    status: "VIP",
    joinedDate: "2026-05-20",
    projectCount: 2,
    totalSpend: 320000,
    assignee: "James Wu",
    notes: "Open-plan office fit-out. Prefers sustainable materials.",
    lastContact: "2026-06-08",
  },
  {
    id: "cl-003",
    name: "Priya Nair",
    company: "Nair Medical Centre",
    email: "priya@nairmedical.com.au",
    phone: "+61 423 456 789",
    location: "Parramatta, NSW",
    status: "Active",
    joinedDate: "2026-04-10",
    projectCount: 1,
    totalSpend: 85000,
    assignee: "Emma Walsh",
    notes: "Clinic renovation complete. May need Phase 2.",
    lastContact: "2026-05-30",
  },
  {
    id: "cl-004",
    name: "Oliver Grant",
    company: "Grant Hospitality",
    email: "oliver@granthospitality.com",
    phone: "+61 467 890 123",
    location: "Melbourne CBD, VIC",
    status: "Active",
    joinedDate: "2026-03-15",
    projectCount: 3,
    totalSpend: 520000,
    assignee: "Emma Walsh",
    notes: "Full restaurant renovation. Looking at expansion.",
    lastContact: "2026-06-12",
  },
  {
    id: "cl-005",
    name: "Helen Frost",
    company: "Frost & Co Legal",
    email: "helen@frostandco.com.au",
    phone: "+61 456 789 012",
    location: "Brisbane CBD, QLD",
    status: "Prospect",
    joinedDate: "2026-06-01",
    projectCount: 0,
    totalSpend: 0,
    assignee: "James Wu",
    notes: "Law firm. Executive suites quote sent.",
    lastContact: "2026-06-05",
  },
  {
    id: "cl-006",
    name: "Ryan Fletcher",
    company: "Fletcher & Sons",
    email: "ryan@fletcherandsons.com.au",
    phone: "+61 489 012 345",
    location: "Bondi, NSW",
    status: "Active",
    joinedDate: "2026-02-28",
    projectCount: 1,
    totalSpend: 240000,
    assignee: "James Wu",
    notes: "Luxury residential. Extremely high end.",
    lastContact: "2026-06-01",
  },
];

// ─── Call log ─────────────────────────────────────────────────────────────────
export const INITIAL_CALLS = [
  { id: "call-001", clientId: "cl-001", clientName: "Claire Moss",    company: "Moss Interiors",      date: "2026-06-10", time: "10:30 AM", duration: "12 min", direction: "outbound", outcome: "Discussed Phase 2 timeline",    assignee: "Lisa Park" },
  { id: "call-002", clientId: "cl-002", clientName: "Marcus Reid",    company: "Harbour Retail Group", date: "2026-06-08", time: "02:15 PM", duration: "25 min", direction: "inbound",  outcome: "Requested new site walk",      assignee: "James Wu" },
  { id: "call-003", clientId: "cl-004", clientName: "Oliver Grant",   company: "Grant Hospitality",    date: "2026-06-12", time: "09:00 AM", duration: "18 min", direction: "outbound", outcome: "Expansion discussion",          assignee: "Emma Walsh" },
  { id: "call-004", clientId: "cl-003", clientName: "Priya Nair",     company: "Nair Medical Centre",  date: "2026-05-30", time: "11:45 AM", duration: "8 min",  direction: "inbound",  outcome: "Billing query — resolved",     assignee: "Emma Walsh" },
  { id: "call-005", clientId: "cl-005", clientName: "Helen Frost",    company: "Frost & Co Legal",     date: "2026-06-05", time: "03:00 PM", duration: "30 min", direction: "outbound", outcome: "Proposal follow-up",           assignee: "James Wu" },
  { id: "call-006", clientId: "cl-006", clientName: "Ryan Fletcher",  company: "Fletcher & Sons",      date: "2026-06-01", time: "04:00 PM", duration: "15 min", direction: "inbound",  outcome: "Change order approved",        assignee: "James Wu" },
];

// ─── Email threads ────────────────────────────────────────────────────────────
export const INITIAL_EMAIL_THREADS = [
  {
    id: "em-001",
    clientId: "cl-002",
    clientName: "Marcus Reid",
    clientEmail: "marcus.reid@harbourretail.com.au",
    subject: "RE: Site Walk Confirmation — Harbour Retail",
    preview: "Hi James, thanks for arranging. We're confirmed for Monday 9am...",
    date: "2026-06-08",
    time: "2:30 PM",
    read: true,
    starred: true,
    label: "client",
    messages: [
      { id: "m1", from: "marcus.reid@harbourretail.com.au", fromName: "Marcus Reid", to: "james.wu@fitouts.com.au", date: "2026-06-08", time: "2:30 PM", body: "Hi James,\n\nThanks for arranging the site walk. We're confirmed for Monday at 9am. Please bring the updated floor plan and the contractor breakdown.\n\nAlso, can you confirm whether the structural engineer will be present?\n\nLooking forward to it.\n\nMarcus\nCEO, Harbour Retail Group" },
      { id: "m2", from: "james.wu@fitouts.com.au", fromName: "James Wu", to: "marcus.reid@harbourretail.com.au", date: "2026-06-06", time: "10:00 AM", body: "Hi Marcus,\n\nJust following up on the site walk — we have Monday 9am locked in. I'll have the updated floor plan and cost breakdown ready.\n\nOur structural engineer Tom Bradley will also be present.\n\nLet me know if you need anything else before then.\n\nBest,\nJames Wu\nFitouts" },
    ],
  },
  {
    id: "em-002",
    clientId: "cl-001",
    clientName: "Claire Moss",
    clientEmail: "claire@mossinteriors.com.au",
    subject: "Phase 2 Proposal — Moss Interiors Showroom",
    preview: "Hi Lisa, following our call last week, please find the Phase 2 proposal...",
    date: "2026-06-10",
    time: "11:00 AM",
    read: false,
    starred: false,
    label: "proposal",
    messages: [
      { id: "m3", from: "lisa.park@fitouts.com.au", fromName: "Lisa Park", to: "claire@mossinteriors.com.au", date: "2026-06-10", time: "11:00 AM", body: "Hi Claire,\n\nFollowing our call last week, please find the Phase 2 proposal attached.\n\nThe scope includes:\n- Extension of the main showroom floor\n- New lighting installation\n- Custom display cabinetry\n\nTotal estimated cost: $68,000 + GST.\n\nHappy to discuss any adjustments.\n\nKind regards,\nLisa Park\nProject Manager, Fitouts" },
    ],
  },
  {
    id: "em-003",
    clientId: "cl-004",
    clientName: "Oliver Grant",
    clientEmail: "oliver@granthospitality.com",
    subject: "Expansion Brief — Grant Hospitality",
    preview: "Emma, we've been thinking about the rooftop concept you mentioned...",
    date: "2026-06-12",
    time: "9:45 AM",
    read: false,
    starred: true,
    label: "client",
    messages: [
      { id: "m4", from: "oliver@granthospitality.com", fromName: "Oliver Grant", to: "emma.walsh@fitouts.com.au", date: "2026-06-12", time: "9:45 AM", body: "Emma,\n\nWe've been thinking about the rooftop concept you mentioned during our last call. The board has approved initial budget of $180k for the expansion.\n\nCan you put together a concept brief by end of month?\n\nThanks,\nOliver" },
      { id: "m5", from: "emma.walsh@fitouts.com.au", fromName: "Emma Walsh", to: "oliver@granthospitality.com", date: "2026-06-11", time: "2:00 PM", body: "Hi Oliver,\n\nGreat speaking with you today. The rooftop bar concept would be a fantastic addition to the existing space.\n\nI'll start pulling together mood boards and a preliminary scope this week.\n\nBest,\nEmma Walsh\nInterior Designer, Fitouts" },
    ],
  },
  {
    id: "em-004",
    clientId: "cl-005",
    clientName: "Helen Frost",
    clientEmail: "helen@frostandco.com.au",
    subject: "Proposal Follow-up — Frost & Co Legal",
    preview: "Helen, just checking in on the proposal we sent across last week...",
    date: "2026-06-05",
    time: "3:15 PM",
    read: true,
    starred: false,
    label: "follow-up",
    messages: [
      { id: "m6", from: "james.wu@fitouts.com.au", fromName: "James Wu", to: "helen@frostandco.com.au", date: "2026-06-05", time: "3:15 PM", body: "Hi Helen,\n\nJust checking in on the executive suites proposal we sent across last week. Any questions or feedback from your team?\n\nWe're flexible on timeline and happy to adjust the scope if needed.\n\nBest,\nJames Wu\nFitouts" },
    ],
  },
];

export function getClientById(id) {
  return INITIAL_CLIENTS.find((c) => c.id === id) || null;
}

export function getAllClients() {
  return [...INITIAL_CLIENTS];
}
