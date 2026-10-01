import axiosInstance from "@/lib/axiosInstance";
import { createSnag, updateSnagStatus, SNAG_SEVERITIES, SNAG_STATUSES } from "@/modules/admin/api/snags.api";

const unwrap = (r) => r.data?.data ?? r.data;

export { createSnag, updateSnagStatus, SNAG_SEVERITIES, SNAG_STATUSES };

export const fetchMySnags = () =>
  axiosInstance.get("/snags/mine").then((r) => {
    const data = unwrap(r);
    return Array.isArray(data) ? data : [];
  });

export const updateMySnagStatus = (projectId, uuid, status) =>
  updateSnagStatus(projectId, uuid, status);
