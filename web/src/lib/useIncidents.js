import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { useDebounced } from "./motion.js";

export function useIncidents(filters) {
  const [incidents, setIncidents] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const query = useDebounced(filters.q || "", 200);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.severity) params.set("severity", filters.severity);
    if (query) params.set("q", query);

    try {
      const data = await api(`/api/incidents?${params.toString()}`);
      if (current === requestId.current) setIncidents(data.incidents);
    } catch (err) {
      if (current === requestId.current) setError(err.message);
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [filters.status, filters.severity, query]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    incidents,
    error,
    loading: loading && !incidents,
    refreshing: loading && Boolean(incidents),
    reload: load,
  };
}
