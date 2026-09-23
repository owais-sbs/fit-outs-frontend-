import { useEffect, useState } from "react";
import { fetchProjectById } from "../api/projects.api";
import {
  isCommercialFrozen,
  isProjectArchived,
} from "../constants/project.constants";

/**
 * Loads project commercial lifecycle flags for module pages.
 * Prefer passing an already-loaded project via `fromProject` to avoid a second fetch.
 */
export function useProjectLifecycle(projectId, fromProject = null) {
  const [project, setProject] = useState(fromProject);
  const [loading, setLoading] = useState(!fromProject && !!projectId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fromProject) {
      setProject(fromProject);
      setLoading(false);
      setError(null);
      return;
    }
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchProjectById(projectId)
      .then((p) => {
        if (!cancelled) {
          setProject(p);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setProject(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, fromProject]);

  const stage = project?.commercialStage || null;
  return {
    project,
    loading,
    error,
    commercialStage: stage,
    archived: isProjectArchived(stage),
    commercialFrozen: isCommercialFrozen(stage),
  };
}
