import { useState } from "react";
import { Clock } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { SEED_CLIENT_DESIGNS } from "@/shared/store/designWorkflowStore";
import DesignCard from "@/modules/client/components/design/DesignCard";
import ApprovalModal from "@/modules/client/components/design/ApprovalModal";
import RevisionModal from "@/modules/client/components/design/RevisionModal";

export default function PendingApprovalPage() {
  const [designs, setDesigns] = useState(
    SEED_CLIENT_DESIGNS.filter((d) => d.status === "Pending Approval")
  );
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [revisionTarget, setRevisionTarget] = useState(null);

  const handleApprove = () => {
    setDesigns((prev) => prev.filter((d) => d.id !== approvalTarget.id));
    setApprovalTarget(null);
  };

  const handleRevision = () => {
    setDesigns((prev) => prev.filter((d) => d.id !== revisionTarget.id));
    setRevisionTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approval"
        description="Designs awaiting your review and approval before the team proceeds to construction."
      />

      {designs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-24 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="font-medium">No designs pending approval</p>
          <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-amber-400/30 bg-amber-500/5 px-4 py-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>{designs.length} design{designs.length > 1 ? "s" : ""}</strong> require your approval to move forward.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                detailRoute={`/client/designs/${design.id}`}
                onAction={() => setApprovalTarget(design)}
                actionLabel="Approve"
              />
            ))}
          </div>
        </>
      )}

      <ApprovalModal
        open={!!approvalTarget}
        onClose={() => setApprovalTarget(null)}
        onConfirm={handleApprove}
        design={approvalTarget}
      />
      <RevisionModal
        open={!!revisionTarget}
        onClose={() => setRevisionTarget(null)}
        onSubmit={handleRevision}
        design={revisionTarget}
      />
    </div>
  );
}
