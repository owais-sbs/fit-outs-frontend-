import axiosInstance from "@/lib/axiosInstance";

export const DRAWING_CATEGORIES = [
  { value: "ARCHITECTURAL", label: "Architectural" },
  { value: "STRUCTURAL", label: "Structural" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "HVAC", label: "HVAC" },
  { value: "MUNICIPALITY", label: "Municipality Approved" },
  { value: "SHOP", label: "Shop Drawings" },
];

export const fetchProjectDrawings = (projectId, includeSuperseded = false) =>
  axiosInstance
    .get(`/projects/${projectId}/drawings`, {
      params: includeSuperseded ? { includeSuperseded: true } : {},
    })
    .then((r) => r.data?.data ?? r.data);

export const fetchDrawingRevisions = (projectId, drawingNumber) =>
  axiosInstance
    .get(`/projects/${projectId}/drawings/revisions`, {
      params: { drawingNumber },
    })
    .then((r) => r.data?.data ?? r.data);


export const uploadProjectDrawing = (projectId, categoryOrData, fileParam) => {
  const form = new FormData();
  if (typeof categoryOrData === "object" && categoryOrData !== null && !(categoryOrData instanceof File)) {
    const { category, file, drawingNumber, revisionCode, revisionDate } = categoryOrData;
    if (category) form.append("category", category);
    if (drawingNumber) form.append("drawingNumber", drawingNumber);
    if (revisionCode) form.append("revisionCode", revisionCode);
    if (revisionDate) form.append("revisionDate", revisionDate);
    if (file) form.append("file", file);
  } else {
    if (categoryOrData) form.append("category", categoryOrData);
    if (fileParam) form.append("file", fileParam);
  }
  return axiosInstance
    .post(`/projects/${projectId}/drawings`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    })
    .then((r) => r.data?.data ?? r.data);
};

export const deleteProjectDrawing = (projectId, drawingId) =>
  axiosInstance.delete(`/projects/${projectId}/drawings/${drawingId}`).then((r) => r.data?.data ?? r.data);

export const reconvertProjectDrawing = (projectId, drawingId) =>
  axiosInstance
    .post(`/projects/${projectId}/drawings/${drawingId}/reconvert`, null, { timeout: 180000 })
    .then((r) => r.data?.data ?? r.data);

export const getDrawingPreviewUrl = (projectId, drawingId) =>
  `${process.env.REACT_APP_API_BASE_URL || "/api"}/projects/${projectId}/drawings/${drawingId}/preview`;

export const fetchDrawingPreviewBlob = (projectId, drawingId) =>
  axiosInstance
    .get(`/projects/${projectId}/drawings/${drawingId}/preview`, { responseType: "blob" })
    .then((r) => ({
      blob: r.data,
      contentType: r.headers["content-type"] || r.data.type || "application/pdf",
    }));
