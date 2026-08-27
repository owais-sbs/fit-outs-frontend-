import { useState } from "react";

/** JCT Contracting brand logo (remote SVG). */
export const JCT_LOGO_URL =
  "https://jctcontracting.com/storage/app/media/branding/headerLogo.svg";

export const BRAND_NAME = "JCT Contracting";

/**
 * Logo tile used in sidebars / login. Falls back to "JCT" text if the
 * remote logo cannot be loaded. Light-rail friendly (no forced invert).
 */
export function JctLogoTile({
  className = "h-9 w-9 rounded-xl",
  imgClassName = "h-5 w-5",
}) {
  const [err, setErr] = useState(false);
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-secondary text-foreground ring-1 ring-border/60 ${className}`}
    >
      {err ? (
        <span className="text-[11px] font-bold tracking-tight">JCT</span>
      ) : (
        <img
          src={JCT_LOGO_URL}
          alt={BRAND_NAME}
          className={`${imgClassName} object-contain`}
          onError={() => setErr(true)}
        />
      )}
    </div>
  );
}

/** Full sidebar brand block: logo tile + "JCT Contracting" + portal label. */
export function SidebarBrand({ portal }) {
  return (
    <>
      <JctLogoTile />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold tracking-tight">{BRAND_NAME}</span>
        <span className="truncate text-xs text-muted-foreground">{portal}</span>
      </div>
    </>
  );
}
