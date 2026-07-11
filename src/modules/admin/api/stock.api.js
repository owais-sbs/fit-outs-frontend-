import axiosInstance from "@/lib/axiosInstance";

export const fetchStockBalances = () =>
  axiosInstance.get("/stock").then((r) => r.data?.data ?? r.data);

export const fetchStockMovements = (page = 0, size = 50) =>
  axiosInstance
    .get(`/stock/movements?page=${page}&size=${size}`)
    .then((r) => r.data?.data ?? r.data);

export const recordStockReceipt = (data) =>
  axiosInstance.post("/stock/receipt", data).then((r) => r.data?.data ?? r.data);

export const recordStockIssue = (data) =>
  axiosInstance.post("/stock/issue", data).then((r) => r.data?.data ?? r.data);

export const adjustStock = (data) =>
  axiosInstance.post("/stock/adjust", data).then((r) => r.data?.data ?? r.data);
