import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Shared bordered field styling for inputs, selects, and textareas. */
export const fieldControlClasses =
  "border border-border bg-background shadow-sm transition-colors hover:border-muted-foreground/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";