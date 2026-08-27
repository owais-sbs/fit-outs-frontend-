import { useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import DesignCard from "@/modules/client/components/design/DesignCard";
import ApprovalModal from "@/modules/client/components/design/ApprovalModal";
import RevisionModal from "@/modules/client/components/design/RevisionModal";
import { useClientDesignTasks } from "@/modules/client/hooks/useClientDesignTasks";
import { approveRoomTask, requestTaskChanges } from "@/modules/admin/api/room-collab.api";

export default function PendingApprovalPage() {
  const { designs, loading, error, reload } = useClientDesignTasks("pending");
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [revisionTarget, setRevisionTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleApprove = async () => {
    if (!approvalTarget) return;
    setBusy(true);
    try {
      await approveRoomTask(approvalTarget.projectId, approvalTarget.taskId);
      setApprovalTarget(null);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const handleRevision = async ({ feedback }) => {
    if (!revisionTarget || !feedback?.trim()) return;
    setBusy(true);
    try {
      await requestTaskChanges(revisionTarget.projectId, revisionTarget.taskId, feedback.trim());
      setRevisionTarget(null);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <PageTitle
        title="Pending Approval"
        subtitle="Designs awaiting your review and approval before the team proceeds to construction."
      />

      {error && (
        <p className="mb-4 text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : designs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/40 py-24 text-center">
          <Clock className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium">No designs pending approval</p>
          <p className="mt-1 text-sm text-muted-foreground">You're all caught up!</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-amber-500/5 px-4 py-3 ring-1 ring-amber-400/20">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>{designs.length} design{designs.length > 1 ? "s" : ""}</strong> require your approval to move forward.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                detailRoute={design.detailRoute}
                onAction={() => setApprovalTarget(design)}
                actionLabel="Approve"
              />
            ))}
          </div>
        </>
      )}

      <ApprovalModal
        open={!!approvalTarget}
        onClose={() => !busy && setApprovalTarget(null)}
        onConfirm={handleApprove}
        design={approvalTarget}
      />
      <RevisionModal
        open={!!revisionTarget}
        onClose={() => !busy && setRevisionTarget(null)}
        onSubmit={handleRevision}
        design={revisionTarget}
      />
    </PageShell>
  );
}
