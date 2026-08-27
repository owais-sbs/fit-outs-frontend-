import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminDesignApprovals,
  fetchAdminDesignOptions,
  fetchAdminDesignRequests,
} from "../lib/adminDesignTasks";

export function useAdminDesignRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchAdminDesignRequests());
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load design requests");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}

export function useAdminDesignOptions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchAdminDesignOptions());
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load design options");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}

export function useAdminDesignApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchAdminDesignApprovals());
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load approvals");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}
