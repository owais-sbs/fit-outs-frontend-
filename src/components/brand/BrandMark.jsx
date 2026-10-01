import { useEffect, useState } from "react";
import fitoutsLogo from "@/assets/fitouts-logo.png";
import fitoutsIcon from "@/assets/fitouts-icon.png";

/** Full lockup for auth screens (icon + name + tagline). */
export const PLATFORM_LOGO_URL = fitoutsLogo;
/** Icon-only mark for sidebars and loading spinner. */
export const PLATFORM_ICON_URL = fitoutsIcon;
/** @deprecated Use PLATFORM_LOGO_URL */
export const JCT_LOGO_URL = PLATFORM_LOGO_URL;

export const BRAND_NAME = "Fit-Outs";

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
  imgClassName = "h-28 w-28 sm:h-32 sm:w-32",
}) {
  return (
    <div className={className}>
      <img
        src={PLATFORM_LOGO_URL}
        alt={BRAND_NAME}
        className={`${imgClassName} object-contain`}
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
}) {
  const [err, setErr] = useState(false);
  const trimmedName = companyName?.trim() || "";
  const hasCompanyName = Boolean(trimmedName);
  const preferInitials = !logoUrl && hasCompanyName;
  const isPlatform = !logoUrl && !preferInitials;
  const src = logoUrl || (isPlatform ? PLATFORM_ICON_URL : null);
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

/** Full sidebar brand block: tenant logo + company name + portal label. */
export function SidebarBrand({ portal, companyName, logoUrl, framed = true }) {
  const trimmedCompany = companyName?.trim() || "";
  const isPlatform = !trimmedCompany && !logoUrl;
  const name = trimmedCompany || BRAND_NAME;
  return (
    <>
      <JctLogoTile
        logoUrl={logoUrl}
        companyName={trimmedCompany || undefined}
        framed={framed}
        className={isPlatform ? "h-11 w-11 rounded-xl" : "h-9 w-9 rounded-xl"}
      />
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-semibold tracking-tight text-sidebar-foreground">{name}</span>
        <span className="truncate text-xs text-sidebar-foreground/70">{portal}</span>
      </div>
    </>
  );
}
