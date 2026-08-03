import axiosInstance from "@/lib/axiosInstance";

export function normalizeChecklistItem(item = {}) {
  return {
    uuid: item.uuid || null,
    sectionName: item.sectionName || "",
    roomName: item.roomName || "General",
    question: item.question || "",
    type: item.type || "CHECKBOX",
    isRequired: Boolean(item.isRequired),
    displayOrder: item.displayOrder ?? 0,
  };
}

export function normalizeChecklistTemplate(item = {}) {
  const items = Array.isArray(item.items) ? item.items.map(normalizeChecklistItem) : [];
  const categories = [...new Set(items.map((i) => i.sectionName).filter(Boolean))];
  return {
    uuid: item.uuid || null,
    name: item.name || "",
    description: item.description || "",
    createdBy: item.createdBy ?? null,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
    items,
    itemCount: items.length,
    categories,
    category: categories[0] || "General",
  };
}

export const fetchAllChecklists = () =>
  axiosInstance.get("/checklist-templates/GetAllCheckList").then((r) => {
    const data = r.data?.data ?? r.data;
    return (Array.isArray(data) ? data : []).map(normalizeChecklistTemplate);
  });

export const fetchChecklistByUuid = (uuid) =>
  axiosInstance
    .get(`/checklist-templates/GetCheckListByUuid/${uuid}`)
    .then((r) => normalizeChecklistTemplate(r.data?.data ?? r.data));
