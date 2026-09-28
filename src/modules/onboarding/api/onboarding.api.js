import axiosInstance from "@/lib/axiosInstance";

export async function fetchPaymentInstructions() {
  const { data } = await axiosInstance.get("/onboarding/payment-instructions");
  return data?.data ?? null;
}

export async function submitSubscriptionPayment(payload) {
  const { data } = await axiosInstance.post("/onboarding/submit-payment", payload);
  return data?.data ?? null;
}

export async function completeCompanyProfile({ companyName, logo, stamp, signature }) {
  const formData = new FormData();
  formData.append("companyName", companyName);
  if (logo) formData.append("logo", logo);
  if (stamp) formData.append("stamp", stamp);
  if (signature) formData.append("signature", signature);
  const { data } = await axiosInstance.post("/onboarding/company-profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data ?? null;
}
