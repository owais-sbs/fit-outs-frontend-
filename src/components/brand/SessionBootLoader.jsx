import { useEffect, useState } from "react";
import { JctLogoTile } from "@/components/brand/BrandMark";

const STATUS_LINES = [
  "Loading session…",
  "Authenticating…",
  "Installing inverter…",
  "Painting dashboard…",
  "Leveling floor plans…",
  "Wiring access tokens…",
  "Hanging site boards…",
  "Torqueing permissions…",
  "Fitting out portal…",
  "Checking clearance…",
];

export function SessionBootLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg
          className="absolute inset-0 h-full w-full animate-[boot-ring_1.1s_linear_infinite]"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-border"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="70 210"
            className="text-[var(--color-accent-blue)]"
          />
        </svg>
        <JctLogoTile className="h-14 w-14 rounded-2xl" imgClassName="h-8 w-8" />
      </div>
      <p
        key={STATUS_LINES[index]}
        className="mt-6 animate-[boot-status_0.35s_ease-out] text-sm font-medium text-muted-foreground"
      >
        {STATUS_LINES[index]}
      </p>
    </div>
  );
}
