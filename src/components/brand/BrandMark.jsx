import { useEffect, useState } from "react";

/** Platform fallback brand (used when no tenant company is on the session). */
export const JCT_LOGO_URL =
  "https://jctcontracting.com/storage/app/media/branding/headerLogo.svg";

export const BRAND_NAME = "JCT Contracting";

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "CO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

/**
 * Logo tile used in sidebars / login.
 * Prefers tenant `logoUrl` (S3/CloudFront or /api/files); falls back to platform logo, then initials.
 */
export function JctLogoTile({
  className = "h-9 w-9 rounded-xl",
  imgClassName = "h-5 w-5",
  logoUrl,
  companyName,
}) {
  const [err, setErr] = useState(false);
  const src = logoUrl || JCT_LOGO_URL;
  const alt = companyName || BRAND_NAME;

  useEffect(() => {
    setErr(false);
  }, [src]);

  const showFallback = err || !src;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-white text-foreground ring-1 ring-border/60 dark:bg-white dark:ring-white/40 ${className}`}
    >
      {showFallback ? (
        <span className="text-[11px] font-bold tracking-tight">
          {initialsFromName(companyName || BRAND_NAME)}
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${imgClassName} object-contain`}
          onError={() => setErr(true)}
        />
      )}
    </div>
  );
}

/** Full sidebar brand block: tenant logo + company name + portal label. */
export function SidebarBrand({ portal, companyName, logoUrl }) {
  const name = companyName?.trim() || BRAND_NAME;
  return (
    <>
      <JctLogoTile logoUrl={logoUrl} companyName={name} />
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-semibold tracking-tight text-sidebar-foreground">{name}</span>
        <span className="truncate text-xs text-sidebar-foreground/70">{portal}</span>
      </div>
    </>
  );
}
