import axiosInstance from "@/lib/axiosInstance";
import {
  deriveCategoriesFromScopes,
  deriveRoomsFromScopes,
  normalizeRoomScopes,
} from "../data/renovationChecklist";

/** Let the browser set multipart boundary (axios default JSON Content-Type breaks uploads). */
export function multipartConfig(extra = {}) {
  return {
    ...extra,
    transformRequest: [
      (data, headers) => {
        if (data instanceof FormData) {
          delete headers["Content-Type"];
        }
        return data;
      },
      ...(Array.isArray(extra.transformRequest)
        ? extra.transformRequest
        : extra.transformRequest
          ? [extra.transformRequest]
          : []),
    ],
  };
}

export function resolveSiteVisitFileUrl(raw) {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/api/files/")) return raw;
  return `/api/files/${String(raw).replace(/^\/+/, "")}`;
}

export function isVideoMediaUrl(url) {
  return /\.(mp4|webm|mov|m4v|avi|mkv)(\?|$)/i.test(url || "");
}

function normalizeUploadedAttachment(item = {}) {
  const url = resolveSiteVisitFileUrl(item.url || item.audioUrl || "");
  return {
    url,
    contentType: item.contentType || "",
  };
}

const STATUS_TO_STAGE = {
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export function normalizeSiteVisit(item = {}) {
  const loc = item.locationDetails || {};
  const roomScopes = normalizeRoomScopes(item.roomScopes);
  return {
    uuid: item.uuid || null,
    leadId: item.leadId ?? null,
    assignedTo: item.assignedTo ?? null,
    employeeIds: item.employeeIds ?? (item.assignedTo ? [item.assignedTo] : []),
    employeeNames: item.employeeNames || [],
    scheduledDate: item.scheduledDate || null,
    scheduledTime: item.scheduledTime || null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    status: STATUS_TO_STAGE[item.status] || item.status || "SCHEDULED",
    notes: item.notes || "",
    createdBy: item.createdBy ?? null,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
    checklistTemplateUuid: item.checklistTemplateUuid || null,
    propertyType: item.propertyType || null,
    propertyTypeCustom: item.propertyTypeCustom || "",
    roomScopes,
    categories: Array.isArray(item.categories)
      ? item.categories
      : deriveCategoriesFromScopes(roomScopes),
    rooms: Array.isArray(item.rooms) ? item.rooms : deriveRoomsFromScopes(roomScopes),
    locationDetails: {
      uuid: loc.uuid || null,
      addressLine1: loc.addressLine1 || "",
      addressLine2: loc.addressLine2 || "",
      city: loc.city || "",
      state: loc.state || "",
      country: loc.country || "",
      pincode: loc.pincode || "",
      area: loc.area || "",
      buildingName: loc.buildingName || "",
      floor: loc.floor || "",
      unitNumber: loc.unitNumber || "",
      landmark: loc.landmark || "",
      accessNotes: loc.accessNotes || "",
      mapsShareUrl: loc.mapsShareUrl || "",
    },
  };
}

export function normalizeLocationDetails(item = {}) {
  return {
    uuid: item.uuid || null,
    addressLine1: item.addressLine1 || "",
    addressLine2: item.addressLine2 || "",
    city: item.city || "",
    state: item.state || "",
    country: item.country || "",
    pincode: item.pincode || "",
    area: item.area || "",
    buildingName: item.buildingName || "",
    floor: item.floor || "",
    unitNumber: item.unitNumber || "",
    landmark: item.landmark || "",
    accessNotes: item.accessNotes || "",
    mapsShareUrl: item.mapsShareUrl || "",
  };
}

export const fetchAllSiteVisits = () =>
  axiosInstance
    .get("/site-visits/GetAllSite-Visits")
    .then((r) => {
      const data = r.data?.data ?? r.data;
      return Array.isArray(data) ? data.map(normalizeSiteVisit) : [];
    });

export const fetchMySiteVisits = () =>
  axiosInstance
    .get("/site-visits/mine")
    .then((r) => {
      const data = r.data?.data ?? r.data;
      return Array.isArray(data) ? data.map(normalizeSiteVisit) : [];
    });

export const fetchIssuedEstimatesForClient = () =>
  axiosInstance
    .get("/site-visits/estimates/issued")
    .then((r) => r.data?.data ?? r.data ?? []);

export const fetchEmployeeSiteVisits = (employeeId) =>
  axiosInstance
    .get(`/site-visits/employee/${employeeId}`)
    .then((r) => {
      const data = r.data?.data ?? r.data;
      return Array.isArray(data) ? data.map(normalizeSiteVisit) : [];
    });

export const fetchSiteVisitByUuid = (uuid) =>
  axiosInstance
    .get(`/site-visits/GetSiteVisitByUuid/${uuid}`)
    .then((r) => normalizeSiteVisit(r.data?.data ?? r.data));

export const createSiteVisit = (form) => {
  const roomScopes = normalizeRoomScopes(form.roomScopes);
  const payload = {
    leadId: Number(form.leadId),
    employeeIds: Array.isArray(form.employeeIds) ? form.employeeIds.map(Number) : [],
    scheduledDate: form.scheduledDate,
    scheduledTime: form.scheduledTime,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    notes: form.notes || "",
    createdBy: form.createdBy ? Number(form.createdBy) : null,
    propertyType: form.propertyType || null,
    propertyTypeCustom: form.propertyTypeCustom || null,
    roomScopes,
    categories: Array.isArray(form.categories)
      ? form.categories
      : deriveCategoriesFromScopes(roomScopes),
    rooms: Array.isArray(form.rooms) ? form.rooms : deriveRoomsFromScopes(roomScopes),
  };
  if (form.checklistTemplateUuid) {
    payload.checklistTemplateUuid = form.checklistTemplateUuid;
  }
  return axiosInstance
    .post("/site-visits/CreateSite-Visits", payload)
    .then((r) => normalizeSiteVisit(r.data?.data ?? r.data));
};

export const updateSiteVisitChecklistScope = (uuid, form) => {
  const roomScopes = normalizeRoomScopes(form.roomScopes);
  return axiosInstance
    .patch(`/site-visits/${uuid}/checklist-scope`, {
      propertyType: form.propertyType || null,
      propertyTypeCustom: form.propertyTypeCustom || null,
      roomScopes,
    })
    .then((r) => normalizeSiteVisit(r.data?.data ?? r.data));
};

export const submitSiteVisitReport = (uuid, payload) =>
  axiosInstance
    .post(`/site-visits/EmployeeSiteVisitByUuid/${uuid}/report`, payload)
    .then((r) => r.data?.data ?? r.data);

export const fetchSiteVisitReport = (uuid) =>
  axiosInstance
    .get(`/site-visits/${uuid}/report`)
    .then((r) => r.data?.data ?? r.data);

export function normalizeRecording(item = {}) {
  return {
    uuid: item.uuid || null,
    siteVisitUuid: item.siteVisitUuid || null,
    audioUrl: item.audioUrl || "",
    durationSeconds: item.durationSeconds ?? null,
    transcript: item.transcript || "",
    aiSummary: item.aiSummary || "",
    processingStatus: item.processingStatus || "PENDING",
    createdAt: item.createdAt || null,
  };
}

export const fetchSiteVisitRecordings = (uuid) =>
  axiosInstance
    .get(`/site-visits/${uuid}/recordings`)
    .then((r) => {
      const data = r.data?.data ?? r.data;
      return Array.isArray(data) ? data.map(normalizeRecording) : [];
    });

export const uploadSiteVisitRecording = (uuid, blob, durationSeconds) => {
  const form = new FormData();
  form.append("file", blob, `recording-${Date.now()}.webm`);
  if (durationSeconds != null) form.append("durationSeconds", String(durationSeconds));
  return axiosInstance
    .post(`/site-visits/${uuid}/recordings`, form, multipartConfig({ timeout: 120000 }))
    .then((r) => normalizeRecording(r.data?.data ?? r.data));
};

export const uploadSiteVisitPhoto = (uuid, file) => {
  const form = new FormData();
  form.append("file", file);
  return axiosInstance
    .post(`/site-visits/${uuid}/photos`, form, multipartConfig({ timeout: 120000 }))
    .then((r) => normalizeUploadedAttachment(r.data?.data ?? r.data));
};

export const addLocationDetails = (siteVisitUuid, details) =>
  axiosInstance
    .post(`/site-visits/Site/${siteVisitUuid}/location-details`, {
      addressLine1: details.addressLine1,
      addressLine2: details.addressLine2 || "",
      city: details.city,
      state: details.state,
      country: details.country,
      pincode: details.pincode,
      area: details.area || "",
      buildingName: details.buildingName || "",
      floor: details.floor || "",
      unitNumber: details.unitNumber || "",
      landmark: details.landmark || "",
      accessNotes: details.accessNotes || "",
      mapsShareUrl: details.mapsShareUrl || "",
    })
    .then((r) => normalizeSiteVisit(r.data?.data ?? r.data));
