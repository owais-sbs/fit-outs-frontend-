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

export function taskStatusToDesignStatus(status) {
  switch (status) {
    case "AWAITING_CLIENT":
      return "Pending Approval";
    case "CHANGES_REQUESTED":
      return "Revision Requested";
    case "APPROVED":
    case "CLOSED":
      return "Approved";
    default:
      return "Under Review";
  }
}

export function mapTaskToDesign(task, project) {
  const versions = task.versions || [];
  const latest = versions.length
    ? [...versions].sort((a, b) => (b.versionNo || 0) - (a.versionNo || 0))[0]
    : null;
  const projectId = project.id;
  const projectName = project.projectName || project.name || "Project";

  return {
    id: task.uuid,
    taskId: task.uuid,
    projectId,
    projectName,
    clientName: project.clientName || projectName,
    designType: task.typeLabel || TASK_TYPE_LABELS[task.taskType] || task.taskType || "Design",
    status: taskStatusToDesignStatus(task.status),
    version: latest ? `v${latest.versionNo}` : "—",
    uploadDate: task.firstSentToClientAt || task.updatedAt || task.createdAt,
    thumbnail: "",
    designer: "Design team",
    designerAvatar: "DT",
    description: [task.floorLabel, task.roomName].filter(Boolean).join(" · ") || task.title,
    tags: [task.floorLabel, task.roomName].filter(Boolean),
    detailRoute: ROUTES.CLIENT.PROJECT_ROOM_TASK.replace(":projectId", projectId).replace(
      ":taskId",
      task.uuid
    ),
    rawTask: task,
  };
}

/** Room tasks submitted to the client (firstSentToClientAt set). */
export async function fetchClientDesignTasks() {
  const projects = await fetchAllProjects();
  const lists = await Promise.all(
    (Array.isArray(projects) ? projects : []).map(async (project) => {
      try {
        const tasks = await fetchProjectRoomTasks(project.id);
        return tasks
          .filter((t) => t.firstSentToClientAt)
          .map((t) => mapTaskToDesign(t, project));
      } catch {
        return [];
      }
    })
  );
  return lists
    .flat()
    .sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0));
}

export function filterDesignsByStatus(designs, filter) {
  switch (filter) {
    case "pending":
      return designs.filter((d) => d.status === "Pending Approval");
    case "approved":
      return designs.filter((d) => d.status === "Approved");
    case "revisions":
      return designs.filter((d) => d.status === "Revision Requested");
    default:
      return designs;
  }
}
