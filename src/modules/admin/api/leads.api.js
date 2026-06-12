import axiosInstance from "@/lib/axiosInstance";

const STATUS_TO_LABEL = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  SITE_VISIT_SCHEDULED: "Site Visit Scheduled",
  LOST: "Lost",
  CLIENT: "Client",
};

const SOURCE_DISPLAY = {
  WALK_IN: "Walk-in",
  REFERRAL: "Referral",
  WEBSITE: "Website",
  SOCIAL: "Social",
  OTHER: "Other",
};

export function normalizeLead(item = {}) {
  const sourceVal = item.source?.name || item.source || "";
  const statusVal = item.status?.name || item.status || "NEW";
  return {
    ...item,
    id: String(item.id),
    clientName: item.clientName || "Unnamed lead",
    source: SOURCE_DISPLAY[sourceVal] || sourceVal || "—",
    sourceRaw: sourceVal,
    status: statusVal,
    statusLabel: STATUS_TO_LABEL[statusVal] || statusVal,
    projectType: item.projectType || "",
    notes: item.notes || "",
    otherSource: item.otherSource || "",
    assignedTo: item.assignedTo || null,
    referenceNo: item.referenceNo || "",
    createdAt: item.createdAt || "",
    isactive: item.isactive,
    isdeleted: item.isdeleted,
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
  const sourceMap = {
    "Walk-in": "WALK_IN",
    "Referral": "REFERRAL",
    "Website": "WEBSITE",
    "Social": "SOCIAL",
    "Other": "OTHER",
  };

  return axiosInstance.post("/leads", {
    clientName: form.clientName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    projectType: form.projectType,
    source: sourceMap[form.source] || "OTHER",
    otherSource: form.source === "Other" ? (form.otherSource?.trim() || null) : null,
    notes: form.notes?.trim() || "",
  }).then((r) => normalizeLead(r.data?.data));
};

export const fetchLeadById = (id) =>
  axiosInstance.get(`/leads/${id}`)
    .then((r) => normalizeLead(r.data?.data));

export const updateLeadStatus = (id, status, updatedBy, notes, lostReason) =>
  axiosInstance.put(`/leads/${id}/status`, null, {
    params: { status, updatedBy, notes, lostReason },
  }).then((r) => normalizeLead(r.data?.data));

export const deleteLead = (id) =>
  axiosInstance.delete(`/leads/${id}`).then((r) => r.data?.data);
