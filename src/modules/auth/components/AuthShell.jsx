import React from "react";
import { PlatformBrandHeader } from "@/components/brand/BrandMark";

/**
 * Login-matched auth shell: dotted grid, crop-mark frame, brand header.
 * Used by forgot/reset pages only (login left unchanged).
 */
export function AuthShell({ children }) {
  return (
    <div className="relative flex h-dvh max-h-dvh w-full items-center justify-center overflow-hidden bg-background px-6 py-4 sm:py-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle, oklch(var(--foreground) / 0.28) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 w-full max-w-[468px] page-enter">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 -right-10 top-0 border-t border-dotted border-foreground/35" />
          <div className="absolute -left-10 -right-10 bottom-0 border-t border-dotted border-foreground/35" />
          <div className="absolute -top-10 -bottom-10 left-0 border-l border-dotted border-foreground/35" />
          <div className="absolute -top-10 -bottom-10 right-0 border-l border-dotted border-foreground/35" />
        </div>

        <div className="relative bg-background px-8 py-8 sm:px-10 sm:py-10">
          <PlatformBrandHeader
            className="mb-6 flex items-center justify-center"
            imgClassName="h-[clamp(5.5rem,18vh,8.5rem)] w-[clamp(5.5rem,18vh,8.5rem)]"
          />
          {children}
        </div>
      </div>
    </div>
  );
}
