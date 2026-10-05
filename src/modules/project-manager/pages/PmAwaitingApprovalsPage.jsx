import { Link } from "react-router-dom";
import { CheckCircle2, GitBranch, Inbox, RefreshCw, Stamp } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import LoadingPanel from "@/components/shared/LoadingPanel";
import { loadingMessages } from "@/components/shared/loadingMessages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/shared/constants/routes";
import { formatAed } from "@/shared/utils/currency";
import { usePmAwaitingApprovals } from "../hooks/PmAwaitingApprovalsContext";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function formatAmount(value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return formatAed(n);
}

function Section({ title, description, icon: Icon, inboxHref, items }) {
  return (
    <Surface className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/80 text-accent-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
              {title}
              {items.length > 0 ? (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                  {items.length}
                </Badge>
              ) : null}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to={inboxHref}>Open inbox</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          Nothing waiting on you here.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.key}>
                  <TableCell className="font-medium">
                    {item.detailHref ? (
                      <Link to={item.detailHref} className="hover:underline">
                        {item.reference || "—"}
                      </Link>
                    ) : (
                      item.reference || "—"
                    )}
                    {item.title ? (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {item.title}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.projectName || (item.projectId != null ? `Project ${item.projectId}` : "—")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.kindLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAmount(item.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(item.dueAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={item.href}>Review</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Surface>
  );
}

export default function PmAwaitingApprovalsPage() {
  const { loading, error, reload, variations, boqs, billing, total } =
    usePmAwaitingApprovals();

  const subtitle = loading
    ? "Checking your approval queues."
    : total === 0
      ? "You are all caught up — nothing is waiting on your approval."
      : `${total} item${total === 1 ? "" : "s"} waiting on your approval.`;

  return (
    <PageShell>
      <PageTitle
        title="Awaiting your approval"
        subtitle={subtitle}
        actions={
          <Button size="sm" variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <Surface className="p-4 text-sm text-destructive">{error}</Surface>
      ) : null}

      {loading ? (
        <LoadingPanel messages={loadingMessages.generic} size="page" />
      ) : (
        <div className="space-y-4">
          <Section
            title="Variations & change requests"
            description="Client requests to triage and matrix steps assigned to you."
            icon={GitBranch}
            inboxHref={ROUTES.PROJECT_MANAGER.VARIATIONS_INBOX}
            items={variations}
          />
          <Section
            title="BOQs"
            description="Bills of quantities at your approval step."
            icon={Inbox}
            inboxHref={ROUTES.PROJECT_MANAGER.BOQ_INBOX}
            items={boqs}
          />
          <Section
            title="Billing milestones"
            description="Payment requests submitted by Finance."
            icon={Stamp}
            inboxHref={ROUTES.PROJECT_MANAGER.BILLING_MILESTONE_INBOX}
            items={billing}
          />
        </div>
      )}
    </PageShell>
  );
}
