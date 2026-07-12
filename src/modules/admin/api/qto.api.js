import axiosInstance from "@/lib/axiosInstance";

export const QTO_LINE_TYPES = [
  { value: "WALL_AREA", label: "Wall Area", unit: "SQM" },
  { value: "FLOOR_AREA", label: "Floor Area", unit: "SQM" },
  { value: "CEILING_AREA", label: "Ceiling Area", unit: "SQM" },
  { value: "TILE_QTY", label: "Tile Quantity", unit: "SQM" },
  { value: "PAINT_AREA", label: "Paint Area", unit: "SQM" },
  { value: "DOOR_COUNT", label: "Door Count", unit: "PCS" },
  { value: "WINDOW_COUNT", label: "Window Count", unit: "PCS" },
  { value: "PLUMBING_FIXTURE", label: "Plumbing Fixtures", unit: "PCS" },
  { value: "LIGHTING_FIXTURE", label: "Lighting Fixtures", unit: "PCS" },
  { value: "SKIRTING_LENGTH", label: "Skirting Length", unit: "RMT" },
  { value: "MARBLE", label: "Marble", unit: "SQM" },
  { value: "GRANITE", label: "Granite", unit: "SQM" },
  { value: "FALSE_CEILING", label: "False Ceiling", unit: "SQM" },
  { value: "CUSTOM", label: "Custom", unit: "SQM" },
];

export const createQtoSession = (data) =>
  axiosInstance.post("/qto/sessions", data).then((r) => r.data?.data ?? r.data);

export const fetchQtoSession = (id) =>
  axiosInstance.get(`/qto/sessions/${id}`).then((r) => r.data?.data ?? r.data);

export const fetchQtoSessionsByProject = (projectId) =>
  axiosInstance.get(`/qto/sessions/project/${projectId}`).then((r) => r.data?.data ?? r.data);

export const updateQtoScale = (id, data) =>
  axiosInstance.patch(`/qto/sessions/${id}/scale`, data).then((r) => r.data?.data ?? r.data);

export const updateQtoLines = (id, lines) =>
  axiosInstance.put(`/qto/sessions/${id}/lines`, { lines }).then((r) => r.data?.data ?? r.data);

export const approveQtoSession = (id) =>
  axiosInstance.post(`/qto/sessions/${id}/approve`).then((r) => r.data?.data ?? r.data);
