import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import CraneIllustration from "./CraneIllustration";

const RETRY_COOLDOWN_MS = 2000;
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function OfflineGate() {
  const { isOffline, offlineSince, isChecking, checkConnection } = useNetworkStatus();
  const [forced, setForced] = useState(false);
  const [appearance, setAppearance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [stillOffline, setStillOffline] = useState(false);
  const [cooling, setCooling] = useState(false);

  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const wasOfflineRef = useRef(false);
  const forcedSinceRef = useRef(null);

  const visible = isOffline || forced;
  const startedAt = offlineSince ?? forcedSinceRef.current;

  // Dev-only preview helper; stripped from production builds.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return undefined;
    window.__previewOffline = (next = true) => {
      forcedSinceRef.current = next ? Date.now() : null;
      setForced(Boolean(next));
    };
    return () => {
      delete window.__previewOffline;
    };
  }, []);

  useEffect(() => {
    if (wasOfflineRef.current && !isOffline) {
      notify.success("Back online", { description: "Connection restored." });
    }
    wasOfflineRef.current = isOffline;
  }, [isOffline]);

  useEffect(() => {
    if (!visible) return undefined;
    setAppearance((count) => count + 1);
    setStillOffline(false);
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const focusTimer = setTimeout(() => dialogRef.current?.focus(), 0);
    return () => {
      clearTimeout(focusTimer);
      root.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || !startedAt) return undefined;
    const tick = () => setElapsed(Date.now() - startedAt);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [visible, startedAt]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.key !== "Tab") return;
    const container = dialogRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll(FOCUSABLE));
    if (items.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === container)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  const handleRetry = useCallback(async () => {
    if (isChecking || cooling) return;
    setStillOffline(false);
    const reachable = await checkConnection();
    if (!reachable || forced) setStillOffline(true);
    setCooling(true);
    setTimeout(() => setCooling(false), RETRY_COOLDOWN_MS);
  }, [checkConnection, cooling, forced, isChecking]);

  if (!visible) return null;

  const busy = isChecking || cooling;

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="offline-gate-title"
        aria-describedby="offline-gate-description"
        tabIndex={-1}
        className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-elevation-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <div className="border-b border-border/70 bg-muted/40 px-4 pt-4 sm:px-6 sm:pt-6">
          <CraneIllustration key={appearance} />
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="space-y-1.5">
            <h2 id="offline-gate-title" className="text-lg font-semibold tracking-tight text-foreground">
              No internet connection
            </h2>
            <p id="offline-gate-description" className="text-sm text-muted-foreground">
              The connection to the server was lost. Check your Wi-Fi or mobile data. We&apos;ll
              reconnect automatically.
            </p>
          </div>

          <p
            aria-live="polite"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
          >
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
            </span>
            <span>Waiting for connection...</span>
            {/* Not announced: a per-second live update would spam screen readers. */}
            <span className="text-muted-foreground/80" aria-hidden="true">
              Offline for {formatElapsed(elapsed)}
            </span>
          </p>

          <div className="flex flex-col gap-2">
            <Button type="button" onClick={handleRetry} disabled={busy} className="w-full sm:w-auto">
              {isChecking ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {isChecking ? "Checking..." : "Try again"}
            </Button>
            {stillOffline && !isChecking ? (
              <p className="text-sm text-destructive">
                Still offline. Check your Wi-Fi or mobile data.
              </p>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            Your unsaved work on this page is safe.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
