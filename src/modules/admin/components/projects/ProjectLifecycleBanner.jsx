import { Lock } from "lucide-react";
import {
  COMMERCIAL_LIFECYCLE,
  isCommercialFrozen,
  isProjectArchived,
} from "../../constants/project.constants";
import { cn } from "@/lib/utils";

/**
 * Project-level notice for Module 27 commercial close / archive.
 * Pass commercialStage from the enriched project (or checklist).
 */
export default function ProjectLifecycleBanner({ commercialStage, className }) {
  if (!commercialStage || !isCommercialFrozen(commercialStage)) {
    return null;
  }

  const archived = isProjectArchived(commercialStage);

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        archived
          ? "border-zinc-500/25 bg-zinc-500/10 text-zinc-800 dark:text-zinc-200"
          : "border-sky-500/25 bg-sky-500/10 text-sky-900 dark:text-sky-100",
        className
      )}
    >
      <Lock className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <div>
        {archived ? (
          <p className="font-medium">This project is archived and read-only.</p>
        ) : (
          <>
            <p className="font-medium">
              {commercialStage === COMMERCIAL_LIFECYCLE.ARCHIVE_ELIGIBLE
                ? "This project is archive-eligible. Commercial data is frozen."
                : "This project is in defects liability. Commercial data is frozen."}
            </p>
            <p className="mt-0.5 text-xs opacity-80">
              Billing, variations, BOQ, and close-out cannot be edited. Warranty and snag activity remains available until archive.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
