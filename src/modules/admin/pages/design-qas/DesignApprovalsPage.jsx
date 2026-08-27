import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, XCircle, FileSignature, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAdminDesignApprovals } from "@/modules/admin/hooks/useAdminDesignTasks";
import { DesignQasPageShell, DesignQasStat } from "./DesignQasShell";

const STATUS_CLASS = {
  Approved: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Rejected: "text-red-700 bg-red-50 border-red-200",
  Pending: "text-amber-700 bg-amber-50 border-amber-200",
};

export default function DesignApprovalsPage() {
  const [search, setSearch] = useState("");
  const { items, loading, error } = useAdminDesignApprovals();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        a.project.toLowerCase().includes(q) ||
        a.client.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q)
    );
  }, [items, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((a) => a.status === "Pending").length,
      approved: items.filter((a) => a.status === "Approved").length,
      rejected: items.filter((a) => a.status === "Rejected").length,
    }),
    [items]
  );

  return (
    <DesignQasPageShell
      title="Design Approvals"
      description="Client review status for design tasks submitted from project rooms."
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by ID, project or client…"
      resultCount={loading ? undefined : filtered.length}
      stats={
        <>
          <DesignQasStat label="Sent to client" value={loading ? "—" : stats.total} />
          <DesignQasStat label="Pending" value={loading ? "—" : stats.pending} tone="amber" />
          <DesignQasStat label="Approved" value={loading ? "—" : stats.approved} tone="emerald" />
          <DesignQasStat label="Changes requested" value={loading ? "—" : stats.rejected} tone="default" />
        </>
      }
    >
      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Card className="overflow-hidden border-border/60 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-semibold uppercase">Task ID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Design task</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Project & client</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Sent to client</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                      {items.length === 0
                        ? "No items sent to clients yet. Submit a room task to track approvals here."
                        : "No approvals found matching your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((app) => (
                    <TableRow key={app.taskId} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs text-primary">{app.id}</TableCell>
                      <TableCell className="font-medium">{app.title}</TableCell>
                      <TableCell>
                        <div className="font-medium">{app.project}</div>
                        <div className="text-xs text-muted-foreground">{app.client}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {app.date}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_CLASS[app.status] || STATUS_CLASS.Pending}>
                          {app.status === "Approved" && <CheckCircle className="mr-1 h-3 w-3" />}
                          {app.status === "Rejected" && <XCircle className="mr-1 h-3 w-3" />}
                          {app.status === "Pending" && <Clock className="mr-1 h-3 w-3" />}
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8" asChild>
                          <Link to={app.detailRoute}>
                            <FileSignature className="mr-2 h-4 w-4 text-muted-foreground" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </DesignQasPageShell>
  );
}
