import axiosInstance from "@/lib/axiosInstance";
import { LEAD_SOURCES, SALES_REPS } from "../data/leads";

const STATUS_TO_STAGE = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  SITE_VISIT_SCHEDULED: "siteVisit",
  LOST: "lost",
  CLIENT: "won",
};

export function normalizeLead(item = {}) {
  const sourceId = Number(item.sourceId);
  const assignedTo = Number(item.assignedTo);

  return {
    ...item,
    id: String(item.id),
    clientName: item.clientName || "Unnamed lead",
    company: item.company || "",
    stage: STATUS_TO_STAGE[item.status] || String(item.status || "new").toLowerCase(),
    source: LEAD_SOURCES[sourceId - 1] || item.source || (sourceId ? `Source #${sourceId}` : "—"),
    assignee: SALES_REPS[assignedTo - 1] || item.assignee || (assignedTo ? `User #${assignedTo}` : "—"),
    priority: String(item.priority || "medium").toLowerCase(),
    budget: Number(item.budget || 0),
    expectedStart: item.expectedStartDate || item.expectedStart || "",
  };
}

function unwrapLeadPage(responseData) {
  const payload = responseData?.data ?? responseData;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload)) return payload;
  return [];
}

export const fetchAllLeads = () =>
  axiosInstance
    .post("/leads/filter?page=0&size=1000", {})
    .then((r) => unwrapLeadPage(r.data).map(normalizeLead));

export const createLead = (form) => {
  const sourceId = Math.max(1, LEAD_SOURCES.indexOf(form.source) + 1);
  const assignedTo = Math.max(1, SALES_REPS.indexOf(form.assignee) + 1);

  return axiosInstance.post("/leads", {
    clientName: form.clientName.trim(),
    company: form.company?.trim() || "",
    phone: form.phone.trim(),
    email: form.email.trim(),
    projectType: form.projectType,
    sourceId,
    assignedTo,
    notes: form.notes?.trim() || "",
    budget: Number(form.budget),
    priority: form.priority,
    location: form.location?.trim() || "",
    expectedStartDate: form.expectedStartDate || null,
  }).then((r) => normalizeLead(r.data?.data));
};
