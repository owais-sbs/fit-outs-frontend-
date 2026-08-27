import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchProjectRoomTasks } from "@/modules/admin/api/room-collab.api";
import { ROUTES } from "@/shared/constants/routes";

const TASK_TYPE_LABELS = {
  DESIGN: "Design",
  BOQ: "BOQ",
  DRAWING: "Drawing",
  SPEC: "Specification",
  CHANGE_ORDER: "Change order",
  CUSTOM: "Custom",
  OTHER: "Other",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function shortTaskId(uuid) {
  if (!uuid) return "TASK";
  return `TASK-${String(uuid).slice(0, 8).toUpperCase()}`;
}

function priorityFromDeadline(clientDeadline) {
  if (!clientDeadline) return "Medium";
  const days = (new Date(clientDeadline) - new Date()) / (1000 * 60 * 60 * 24);
  if (days < 0) return "High";
  if (days <= 3) return "High";
  if (days <= 7) return "Medium";
  return "Low";
}

export function taskStatusToRequestStatus(status) {
  switch (status) {
    case "OPEN":
      return "Pending";
    case "AWAITING_CLIENT":
    case "CHANGES_REQUESTED":
      return "In Progress";
    case "APPROVED":
    case "CLOSED":
      return "Completed";
    default:
      return "Pending";
  }
}

export function taskStatusToOptionStatus(status) {
  switch (status) {
    case "OPEN":
      return "Draft";
    case "CHANGES_REQUESTED":
      return "Reviewing";
    case "AWAITING_CLIENT":
      return "Submitted";
    case "APPROVED":
    case "CLOSED":
      return "Submitted";
    default:
      return "Draft";
  }
}

export function taskStatusToApprovalStatus(status) {
  switch (status) {
    case "AWAITING_CLIENT":
      return "Pending";
    case "CHANGES_REQUESTED":
      return "Rejected";
    case "APPROVED":
    case "CLOSED":
      return "Approved";
    default:
      return "Pending";
  }
}

export function adminTaskDetailRoute(projectId, taskId) {
  return ROUTES.ADMIN.PROJECT_ROOM_TASK.replace(":projectId", projectId).replace(
    ":taskId",
    taskId
  );
}

export function mapTaskToRequest(task, project) {
  const projectId = project.id;
  const projectName = project.projectName || project.name || "Project";
  return {
    id: shortTaskId(task.uuid),
    taskId: task.uuid,
    projectId,
    project: projectName,
    client: project.clientName || "—",
    roomLabel: [task.floorLabel, task.roomName].filter(Boolean).join(" · "),
    title: task.title,
    designType: task.typeLabel || TASK_TYPE_LABELS[task.taskType] || task.taskType || "Design",
    date: formatDate(task.createdAt),
    dateIso: task.createdAt,
    deadline: formatDate(task.clientDeadline),
    status: taskStatusToRequestStatus(task.status),
    priority: priorityFromDeadline(task.clientDeadline),
    detailRoute: adminTaskDetailRoute(projectId, task.uuid),
    rawTask: task,
  };
}

export function mapTaskToOption(task, project) {
  const projectId = project.id;
  const projectName = project.projectName || project.name || "Project";
  const versions = task.versions || [];
  const latest = versions.length
    ? [...versions].sort((a, b) => (b.versionNo || 0) - (a.versionNo || 0))[0]
    : null;
  return {
    id: shortTaskId(task.uuid),
    request: shortTaskId(task.uuid),
    taskId: task.uuid,
    projectId,
    project: projectName,
    variant: task.title,
    roomLabel: [task.floorLabel, task.roomName].filter(Boolean).join(" · "),
    designType: task.typeLabel || TASK_TYPE_LABELS[task.taskType] || task.taskType || "Design",
    date: formatDate(latest?.createdAt || task.updatedAt || task.createdAt),
    status: taskStatusToOptionStatus(task.status),
    versionLabel: latest ? `v${latest.versionNo}` : null,
    fileName: latest?.originalName || null,
    detailRoute: adminTaskDetailRoute(projectId, task.uuid),
    rawTask: task,
  };
}

export function mapTaskToApproval(task, project) {
  const projectId = project.id;
  const projectName = project.projectName || project.name || "Project";
  return {
    id: shortTaskId(task.uuid),
    option: shortTaskId(task.uuid),
    taskId: task.uuid,
    projectId,
    project: projectName,
    client: project.clientName || "—",
    title: task.title,
    date: formatDate(task.firstSentToClientAt || task.updatedAt),
    status: taskStatusToApprovalStatus(task.status),
    detailRoute: adminTaskDetailRoute(projectId, task.uuid),
    rawTask: task,
  };
}

/** All room tasks across company projects (admin design workflow). */
export async function fetchAdminDesignTasks() {
  const projects = await fetchAllProjects();
  const lists = await Promise.all(
    (Array.isArray(projects) ? projects : []).map(async (project) => {
      try {
        const tasks = await fetchProjectRoomTasks(project.id);
        return tasks.map((t) => ({ task: t, project }));
      } catch {
        return [];
      }
    })
  );
  return lists.flat();
}

export async function fetchAdminDesignRequests() {
  const rows = await fetchAdminDesignTasks();
  return rows
    .map(({ task, project }) => mapTaskToRequest(task, project))
    .sort((a, b) => new Date(b.dateIso || 0) - new Date(a.dateIso || 0));
}

export async function fetchAdminDesignOptions() {
  const rows = await fetchAdminDesignTasks();
  return rows
    .map(({ task, project }) => mapTaskToOption(task, project))
    .sort((a, b) => new Date(b.rawTask?.updatedAt || 0) - new Date(a.rawTask?.updatedAt || 0));
}

export async function fetchAdminDesignApprovals() {
  const rows = await fetchAdminDesignTasks();
  return rows
    .filter(({ task }) => task.firstSentToClientAt)
    .map(({ task, project }) => mapTaskToApproval(task, project))
    .sort(
      (a, b) =>
        new Date(b.rawTask?.firstSentToClientAt || 0) -
        new Date(a.rawTask?.firstSentToClientAt || 0)
    );
}
