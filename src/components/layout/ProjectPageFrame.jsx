import { cn } from "@/lib/utils";

/**
 * Shared content frame for project-scoped pages.
 * Matches Project Planning Hub: centered max-w-7xl with consistent vertical rhythm.
 * Outer page padding comes from AdminLayout (p-5 md:p-7 lg:p-8).
 */
export default function ProjectPageFrame({ children, className }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl space-y-6", className)}>
      {children}
    </div>
  );
}
