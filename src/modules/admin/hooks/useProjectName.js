import { useEffect, useState } from "react";
import { fetchProjectById } from "../api/projects.api";

/** Module-level cache so project chrome does not refetch on every nested navigation. */
const nameCache = new Map();

function resolveName(project) {
  if (!project) return "";
  return String(project.projectName || project.name || "").trim();
}

/**
 * Resolves a display name for a project. Never returns `Project #id`.
 * Uses a module cache + optional `initialName` to avoid duplicate fetches.
 */
export function useProjectName(projectId, initialName = "") {
  const cached = projectId != null ? nameCache.get(String(projectId)) : "";
  const seed = String(initialName || cached || "").trim();
  const [name, setName] = useState(seed);
  const [loading, setLoading] = useState(!seed && !!projectId);

  useEffect(() => {
    const primed = String(initialName || "").trim();
    if (primed && projectId != null) {
      nameCache.set(String(projectId), primed);
      setName(primed);
      setLoading(false);
      return;
    }

    if (!projectId) {
      setName("");
      setLoading(false);
      return;
    }

    const id = String(projectId);
    const fromCache = nameCache.get(id);
    if (fromCache) {
      setName(fromCache);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchProjectById(id)
      .then((project) => {
        if (cancelled) return;
        const resolved = resolveName(project) || "Project";
        nameCache.set(id, resolved);
        setName(resolved);
      })
      .catch(() => {
        if (cancelled) return;
        setName("Project");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, initialName]);

  return { name: name || "Project", loading };
}

/** Seed the cache when a page already loaded the project (avoids a second fetch). */
export function rememberProjectName(projectId, name) {
  const label = String(name || "").trim();
  if (projectId == null || !label) return;
  nameCache.set(String(projectId), label);
}
