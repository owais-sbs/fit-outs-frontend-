import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const fetchMySnags = () =>
  axiosInstance.get("/snags/mine").then((r) => {
    const data = unwrap(r);
    return Array.isArray(data) ? data : [];
  });

export const updateMySnagStatus = (projectId, uuid, status) =>
  axiosInstance.patch(`/projects/${projectId}/snags/${uuid}/status`, { status }).then(unwrap);
