import axiosInstance from "@/lib/axiosInstance";
import { multipartConfig } from "./site-visits.api";

export function normalizeCoverLetterBranding(item = {}) {
  return {
    stampUrl: item.stampUrl || "",
    signatureUrl: item.signatureUrl || "",
  };
}

export const fetchCoverLetterBranding = () =>
  axiosInstance
    .get("/cover-letter-branding")
    .then((r) => normalizeCoverLetterBranding(r.data?.data ?? r.data));

export const uploadCoverLetterStamp = (file) => {
  const body = new FormData();
  body.append("file", file);
  return axiosInstance
    .post("/cover-letter-branding/stamp", body, multipartConfig())
    .then((r) => normalizeCoverLetterBranding(r.data?.data ?? r.data));
};

export const uploadCoverLetterSignature = (file) => {
  const body = new FormData();
  body.append("file", file);
  return axiosInstance
    .post("/cover-letter-branding/signature", body, multipartConfig())
    .then((r) => normalizeCoverLetterBranding(r.data?.data ?? r.data));
};

export const deleteCoverLetterStamp = () =>
  axiosInstance
    .delete("/cover-letter-branding/stamp")
    .then((r) => normalizeCoverLetterBranding(r.data?.data ?? r.data));

export const deleteCoverLetterSignature = () =>
  axiosInstance
    .delete("/cover-letter-branding/signature")
    .then((r) => normalizeCoverLetterBranding(r.data?.data ?? r.data));
