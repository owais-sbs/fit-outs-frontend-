import { useCallback, useEffect, useRef, useState } from "react";

const OFFLINE_DEBOUNCE_MS = 1500;
const PROBE_TIMEOUT_MS = 4000;

/**
 * Same-origin reachability probe. navigator.onLine only reports link state,
 * so a completed HTTP response (any status) is the real proof of connectivity.
 */
export async function probeConnection() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(`/favicon.ico?offline-probe=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [offlineSince, setOfflineSince] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const debounceRef = useRef(null);
  const downSinceRef = useRef(null);
  const checkingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const markOnline = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    downSinceRef.current = null;
    setOfflineSince(null);
    setIsOffline(false);
  }, []);

  const markDown = useCallback(() => {
    if (downSinceRef.current == null) downSinceRef.current = Date.now();
    if (debounceRef.current) return;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      if (!mountedRef.current || downSinceRef.current == null) return;
      setOfflineSince(downSinceRef.current);
      setIsOffline(true);
    }, OFFLINE_DEBOUNCE_MS);
  }, []);

  /** Runs the probe and reconciles state. Resolves to true when reachable. */
  const checkConnection = useCallback(async () => {
    if (checkingRef.current) return false;
    checkingRef.current = true;
    setIsChecking(true);
    const reachable = await probeConnection();
    if (mountedRef.current) {
      if (reachable) markOnline();
      else markDown();
      setIsChecking(false);
    }
    checkingRef.current = false;
    return reachable;
  }, [markDown, markOnline]);

  useEffect(() => {
    const handleOffline = () => markDown();
    const handleOnline = () => {
      // The browser can report online before the link actually carries traffic.
      checkConnection();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      markDown();
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [checkConnection, markDown]);

  return { isOffline, offlineSince, isChecking, checkConnection };
}

export default useNetworkStatus;
