import axiosInstance from "@/lib/axiosInstance";

/** GET /leads — returns all leads flat */
export const fetchAllLeads = () =>
  axiosInstance.get("/leads").then((r) => r.data);
