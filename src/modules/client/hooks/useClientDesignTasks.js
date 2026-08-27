import { useCallback, useEffect, useState } from "react";
import { fetchClientDesignTasks, filterDesignsByStatus } from "../lib/clientDesignTasks";

export function useClientDesignTasks(statusFilter = null) {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const all = await fetchClientDesignTasks();
      setDesigns(statusFilter ? filterDesignsByStatus(all, statusFilter) : all);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load designs");
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return { designs, loading, error, reload: load };
}
