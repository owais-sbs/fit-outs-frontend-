import { useEffect, useState } from "react";
import fitoutsLogo from "@/assets/Fit-Outs Logo.png";
import fitoutsLogoJpg from "@/assets/Fit-Outs Logo.jpg";
import fitoutsLogoIcon from "@/assets/Fit-Outs Logo icon.png";

/** Full lockup for auth screens / expanded brand (PNG preferred). */
export const PLATFORM_LOGO_URL = fitoutsLogo;
/** JPG fallback of the same lockup. */
export const PLATFORM_LOGO_JPG_URL = fitoutsLogoJpg;
/** Clean mark for sidebars, loading spinner, and collapsed rails. */
export const PLATFORM_ICON_URL = fitoutsLogoIcon;
/** @deprecated Use PLATFORM_LOGO_URL */
export const JCT_LOGO_URL = PLATFORM_LOGO_URL;

export const BRAND_NAME = "Fit-Outs";
export const BRAND_TAGLINE = "Premium Fit-Out & Interior Solutions";
export const BRAND_SUBLINE = "ERP/CRM FOR INTERIOR & CONSTRUCTION";

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
 * Full platform lockup for auth screens (logo already includes name + tagline).
 */
export function PlatformBrandHeader({
  className = "mb-12 flex items-center justify-center",
  imgClassName = "h-28 w-auto max-w-[280px] sm:h-32",
}) {
  const [src, setSrc] = useState(PLATFORM_LOGO_URL);

  return (
    <div className={className}>
      <img
        src={src}
        alt={BRAND_NAME}
        className={`${imgClassName} object-contain`}
        onError={() => {
          if (src !== PLATFORM_LOGO_JPG_URL) setSrc(PLATFORM_LOGO_JPG_URL);
        }}
      />
    </div>
  );
}

/**
 * Logo tile used in sidebars / login.
 * Prefers tenant `logoUrl`; if missing and `companyName` is set → initials;
 * otherwise platform Fitouts logo.
 */
export function JctLogoTile({
  className = "h-9 w-9 rounded-xl",
  imgClassName = "h-5 w-5",
  logoUrl,
  companyName,
  framed = true,
  /** Use full lockup instead of icon (expanded sidebar / light panels). */
  lockup = false,
}) {
  const [err, setErr] = useState(false);
  const trimmedName = companyName?.trim() || "";
  const hasCompanyName = Boolean(trimmedName);
  const preferInitials = !logoUrl && hasCompanyName;
  const isPlatform = !logoUrl && !preferInitials;
  const src =
    logoUrl ||
    (isPlatform ? (lockup ? PLATFORM_LOGO_URL : PLATFORM_ICON_URL) : null);
  const alt = trimmedName || BRAND_NAME;

  useEffect(() => {
    setErr(false);
  }, [src]);

  const showInitials = preferInitials || err || !src;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden text-foreground ${
        framed
          ? "bg-white ring-1 ring-border/60 dark:bg-white dark:ring-white/40"
          : "bg-transparent"
      } ${className}`}
    >
      {showInitials ? (
        <span className="text-[11px] font-bold tracking-tight">
          {initialsFromName(trimmedName || BRAND_NAME)}
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          className={
            isPlatform
              ? framed
                ? "h-[88%] w-[88%] object-contain"
                : "h-full w-full object-contain"
              : `${imgClassName} object-contain`
          }
          onError={() => setErr(true)}
        />
      )}
    </div>
  );
}

/** Full sidebar brand block: icon + company name + portal label. */
export function SidebarBrand({ portal, companyName, logoUrl, framed = true }) {
  const trimmedCompany = companyName?.trim() || "";
  const isPlatform = !trimmedCompany && !logoUrl;
  const name = trimmedCompany || BRAND_NAME;

  if (isPlatform) {
    return (
      <>
        <JctLogoTile
          framed
          lockup={false}
          className="h-10 w-10 rounded-xl bg-white ring-1 ring-white/70"
        />
        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate font-semibold tracking-tight text-sidebar-foreground">
            {name}
          </span>
          <span className="truncate text-xs text-sidebar-foreground/70">{portal}</span>
        </div>
      </>
    );
  }

  return (
    <>
      <JctLogoTile
        logoUrl={logoUrl}
        companyName={trimmedCompany || undefined}
        framed={framed}
        lockup={false}
        className="h-9 w-9 rounded-xl"
      />
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-semibold tracking-tight text-sidebar-foreground">
          {name}
        </span>
        <span className="truncate text-xs text-sidebar-foreground/70">{portal}</span>
      </div>
    </>
  );
}
