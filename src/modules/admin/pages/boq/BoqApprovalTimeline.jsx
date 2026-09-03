import { CheckCircle2, Clock, XCircle, GitBranch, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { boqStatusLabel } from "@/shared/constants/roles";

const ACTION_ICONS = {
  SUBMITTED: Send,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  REVISION_CREATED: GitBranch,
};

const ACTION_COLORS = {
  SUBMITTED: "text-blue-600",
  APPROVED: "text-emerald-600",
  REJECTED: "text-red-600",
  REVISION_CREATED: "text-amber-600",
};

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function BoqStatusBadge({ status, className = "" }) {
  const label = boqStatusLabel(status);
  const s = String(status || "").toUpperCase();
  const variant = s === "APPROVED" || s === "FINAL"
    ? "default"
    : s.startsWith("PENDING")
      ? "secondary"
      : "outline";
  return (
    <Badge
      variant={variant}
      className={`capitalize ${s === "OBSOLETE" ? "text-muted-foreground" : ""} ${className}`}
    >
      {label}
    </Badge>
  );
}

export default function BoqApprovalTimeline({ history, loading }) {
  if (loading) {
    return <p className="text-sm text-muted-foreground py-4">Loading approval history…</p>;
  }

  const log = history?.log || [];
  const versions = history?.versions || [];

  if (log.length === 0 && versions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No approval actions yet. Submit the BOQ to start the workflow.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {versions.length > 1 && (
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Version history</p>
          <div className="flex flex-wrap gap-2">
            {versions.map((v) => (
              <Badge key={v.id} variant="outline" className="font-mono text-[10px]">
                v{v.version}
                {v.revisionLabel ? ` · ${v.revisionLabel}` : ""}
                {" · "}
                {boqStatusLabel(v.status)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {log.map((entry) => {
          const Icon = ACTION_ICONS[entry.action] || Clock;
          const color = ACTION_COLORS[entry.action] || "text-muted-foreground";
          return (
            <div key={entry.id} className="flex gap-3 text-sm">
              <div className={`mt-0.5 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{entry.action?.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">· {entry.step?.replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {entry.actorName || "System"}
                  {entry.actorRole ? ` (${entry.actorRole.replace(/_/g, " ")})` : ""}
                  {" · "}
                  {formatDateTime(entry.createdAt)}
                </p>
                {entry.comments && (
                  <p className="text-xs mt-1 text-foreground/80 italic">&ldquo;{entry.comments}&rdquo;</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
