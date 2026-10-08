import { useEffect, useState } from "react";
import { BRAND_NAME, PLATFORM_ICON_URL } from "@/components/brand/BrandMark";

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

export function BrandLoadingMark({ size = "lg", label }) {
  const dim = size === "sm" ? "h-10 w-10" : size === "md" ? "h-14 w-14" : "h-[5.25rem] w-[5.25rem]";
  const wrap = size === "sm" ? "h-14 w-14" : size === "md" ? "h-20 w-20" : "h-[10.5rem] w-[10.5rem]";

  return (
    <div className="flex flex-col items-center">
      <div className={`relative flex items-center justify-center ${wrap}`}>
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
            className="text-[#0B1F3A]/15"
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
            className="text-[#C9A96E]"
          />
        </svg>
        <img
          src={PLATFORM_ICON_URL}
          alt={BRAND_NAME}
          className={`relative object-contain ${dim}`}
        />
      </div>
      {label ? (
        <p className="mt-4 text-sm font-medium text-[#0B1F3A]/65">{label}</p>
      ) : null}
    </div>
  );
}

export function SessionBootLoader({ message }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <BrandLoadingMark />
      <p
        key={message || STATUS_LINES[index]}
        className="mt-6 animate-[boot-status_0.35s_ease-out] text-sm font-medium text-[#0B1F3A]/55"
      >
        {message || STATUS_LINES[index]}
      </p>
    </div>
  );
}

/** Full-viewport glass overlay used while signing in / signing up. */
export function AuthLoadingOverlay({ label = "Signing in…" }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-white/55 backdrop-blur-md">
      <BrandLoadingMark size="md" label={label} />
    </div>
  );
}
