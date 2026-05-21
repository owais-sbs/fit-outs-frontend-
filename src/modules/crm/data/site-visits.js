export const CHECKLIST_TEMPLATES = [
  "Standard commercial fit-out",
  "Retail inspection",
  "Warehouse / industrial",
  "Hospitality pre-open",
];

export const SITE_VISITS = {
  upcoming: [
    { id: "v1", client: "Yuki Tanaka", company: "Tanaka Foods", date: "2026-05-22T10:00", location: "42 Industrial Ave, Alexandria", assignee: "Tom Bradley", leadId: "l6", countdownHours: 18 },
    { id: "v2", client: "Helen Frost", company: "Frost & Co Legal", date: "2026-05-24T14:30", location: "88 George St, Sydney", assignee: "James Wu", leadId: "l4", countdownHours: 68 },
    { id: "v3", client: "Marcus Reid", company: "Harbour Retail", date: "2026-05-26T09:00", location: "15 Pitt St, Sydney", assignee: "Emma Walsh", leadId: "l1", countdownHours: 116 },
  ],
  completed: [
    { id: "v4", client: "Claire Moss", company: "Moss Interiors", date: "2026-05-15T11:00", location: "200 Crown St, Surry Hills", assignee: "Lisa Park", reportId: "v4", status: "submitted" },
    { id: "v5", client: "Daniel Cho", company: "Cho Logistics", date: "2026-05-10T08:30", location: "Unit 4, Mascot NSW", assignee: "Tom Bradley", reportId: "v5", status: "submitted" },
  ],
};

export const REPORT_CHECKLIST = [
  { id: "c1", label: "Access and safety reviewed", required: true },
  { id: "c2", label: "Ceiling height measured", required: true },
  { id: "c3", label: "Existing services documented", required: true },
  { id: "c4", label: "Client requirements confirmed", required: true },
  { id: "c5", label: "Photos of key areas captured", required: false },
];
