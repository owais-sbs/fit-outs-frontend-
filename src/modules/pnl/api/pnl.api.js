import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

/** PnL endpoints can run a full company recalc on refresh/export; allow longer than the global 15s. */
const PNL_TIMEOUT_MS = 60000;

export const fetchCompanyPnl = (yearMonth, options = {}) => {
  const { refresh = false, signal } = options;
  return axiosInstance
    .get("/pnl/company", {
      params: {
        ...(yearMonth ? { yearMonth } : {}),
        ...(refresh ? { refresh: true } : {}),
      },
      timeout: PNL_TIMEOUT_MS,
      signal,
    })
    .then(unwrap);
};

export const fetchProjectPnl = (projectId, options = {}) =>
  axiosInstance
    .get(`/projects/${projectId}/pnl`, {
      timeout: PNL_TIMEOUT_MS,
      signal: options.signal,
    })
    .then(unwrap);

export const fetchOverheadRule = (options = {}) =>
  axiosInstance
    .get("/pnl/overhead-rule", { timeout: PNL_TIMEOUT_MS, signal: options.signal })
    .then(unwrap);

export const upsertOverheadRule = (payload) =>
  axiosInstance
    .put("/pnl/overhead-rule", payload, { timeout: PNL_TIMEOUT_MS })
    .then(unwrap);

export const exportCompanyPnl = async (format = "csv", yearMonth) => {
  const res = await axiosInstance.get("/pnl/company/export", {
    params: { format, ...(yearMonth ? { yearMonth } : {}) },
    responseType: "blob",
    timeout: PNL_TIMEOUT_MS,
  });
  return res.data;
};

export const exportProjectPnl = async (projectId, format = "csv") => {
  const res = await axiosInstance.get(`/projects/${projectId}/pnl/export`, {
    params: { format },
    responseType: "blob",
    timeout: PNL_TIMEOUT_MS,
  });
  return res.data;
};

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
