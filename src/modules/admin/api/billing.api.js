import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const fetchBillingMilestones = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/billing-milestones`).then(unwrap);

export const createBillingMilestone = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/billing-milestones`, payload).then(unwrap);

export const updateBillingMilestone = (projectId, uuid, payload) =>
  axiosInstance.put(`/projects/${projectId}/billing-milestones/${uuid}`, payload).then(unwrap);

export const deleteBillingMilestone = (projectId, uuid) =>
  axiosInstance.delete(`/projects/${projectId}/billing-milestones/${uuid}`).then(unwrap);

export const requestMilestonePayment = (projectId, uuid, payload) =>
  axiosInstance
    .post(`/projects/${projectId}/billing-milestones/${uuid}/request-payment`, payload || {})
    .then(unwrap);

export const submitPaymentRequest = (uuid) =>
  axiosInstance.post(`/billing/payment-requests/${uuid}/submit`).then(unwrap);

export const approvePaymentRequest = (uuid) =>
  axiosInstance.post(`/billing/payment-requests/${uuid}/approve`).then(unwrap);

export const rejectPaymentRequest = (uuid, reason) =>
  axiosInstance.post(`/billing/payment-requests/${uuid}/reject`, reason ? { reason } : {}).then(unwrap);

export const markPaymentRequestPaid = (uuid) =>
  axiosInstance.post(`/billing/payment-requests/${uuid}/mark-paid`).then(unwrap);

export const fetchClientInvoices = (projectId) =>
  axiosInstance.get(`/client/projects/${projectId}/invoices`).then(unwrap);
