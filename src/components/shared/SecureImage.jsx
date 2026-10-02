import { useEffect, useRef, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

/**
 * SecureImage
 *
 * Renders images served from authenticated `/api/files/…` endpoints.
 * The browser's native <img> cannot attach Bearer / session tokens, so we
 * fetch the bytes via axios (which already has auth configured) and hand
 * the blob to the image element as an object-URL.
 *
 * Props mirror a subset of the native <img> props plus an optional fallback.
 */
export default function SecureImage({
  src,
  alt = "",
  className = "",
  fallback = null,
  ...rest
}) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [errored, setErrored] = useState(false);
  const prevSrc = useRef(null);

  useEffect(() => {
    if (!src) {
      setObjectUrl(null);
      setErrored(false);
      return;
    }

    // Avoid re-fetching if src hasn't changed
    if (prevSrc.current === src && objectUrl) return;
    prevSrc.current = src;

    let revoked = false;
    let localUrl = null;

    const load = async () => {
      try {
        // Strip leading /api so axiosInstance (baseURL=/api) can resolve it
        const path = src.startsWith("/api/") ? src.slice(4) : src;
        const response = await axiosInstance.get(path, {
          responseType: "blob",
        });
        if (revoked) return;
        localUrl = URL.createObjectURL(response.data);
        setObjectUrl(localUrl);
        setErrored(false);
      } catch {
        if (!revoked) setErrored(true);
      }
    };

    load();

    return () => {
      revoked = true;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (errored) {
    if (fallback) return fallback;
    return (
      <div
        className={`flex items-center justify-center bg-muted/60 text-muted-foreground text-[10px] p-1 text-center rounded border ${className}`}
        style={rest.style}
        title={alt || "Failed to load image"}
      >
        <span className="truncate max-w-full">{alt || "No image"}</span>
      </div>
    );
  }
  if (!objectUrl) {
    // Placeholder while loading
    return (
      <div
        className={`animate-pulse bg-muted/50 rounded ${className}`}
        style={rest.style}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      className={className}
      {...rest}
    />
  );
}
