import { READY_FOR_CONVERSION, RECENT_CONVERSIONS } from "../data/client-conversion";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchReadyLeads() {
  await delay(300);
  return [...READY_FOR_CONVERSION];
}

export async function fetchRecentConversions() {
  await delay(200);
  return [...RECENT_CONVERSIONS];
}

export async function convertClient(data) {
  await delay(500);
  return {
    success: true,
    projectId: `PRJ-${String(Math.floor(Math.random() * 900) + 100)}`,
    clientId: `CLT-${String(Math.floor(Math.random() * 900) + 100)}`,
    ...data,
  };
}
