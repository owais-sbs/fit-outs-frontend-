import { MOCK_PROJECTS, getProjectById } from "../data/projects";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchProjects() {
  await delay(300);
  return [...MOCK_PROJECTS];
}

export async function fetchProjectById(id) {
  await delay(200);
  const project = getProjectById(id);
  if (!project) throw new Error(`Project ${id} not found`);
  return { ...project };
}

export async function updateProjectStatus(id, status) {
  await delay(200);
  const project = getProjectById(id);
  if (!project) throw new Error(`Project ${id} not found`);
  project.status = status;
  return { ...project };
}

export async function updatePaymentStatus(id, paymentStatus) {
  await delay(200);
  const project = getProjectById(id);
  if (!project) throw new Error(`Project ${id} not found`);
  project.paymentStatus = paymentStatus;
  return { ...project };
}
