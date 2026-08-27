import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export function resolveLocationQuery(query) {
  return axiosInstance
    .get("/geocode/resolve", { params: { q: query } })
    .then(unwrap);
}

export function googleMapsShareUrl(latitude, longitude, label) {
  if (label) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
  }
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function isMapsShareUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim())
    && /(maps\.google|google\.[^/]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/i.test(value);
}
