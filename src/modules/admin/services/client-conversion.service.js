import { READY_FOR_CONVERSION, RECENT_CONVERSIONS } from "../data/client-conversion";
import { projectStore } from "@/shared/store/projectStore";

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
  const pId = `PRJ-${String(Math.floor(Math.random() * 900) + 100)}`;
  const cId = `CLT-${String(Math.floor(Math.random() * 900) + 100)}`;
  
  projectStore.addProject({
    id: pId,
    projectName: data.projectName,
    clientName: data.clientName,
    clientId: cId,
    projectType: data.projectType,
    location: data.company || "Sydney, NSW",
    assignedManager: data.manager,
    progress: 0,
    status: "Planning",
    startDate: data.startDate,
    expectedCompletionDate: data.estimatedCompletion,
    budget: Number(data.budget),
    description: data.notes || "Lead converted project.",
  });

  return {
    success: true,
    projectId: pId,
    clientId: cId,
    ...data,
  };
}
