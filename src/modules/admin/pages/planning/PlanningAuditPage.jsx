import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchPlanningAudit } from "../../api/planning.api";
import { fetchAllEmployees } from "../../api/employees.api";
import PlanningHubSkeleton from "./PlanningHubSkeleton";

function formatDecisionType(type) {
  if (!type) return "Update";
  return String(type)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function actorLabel(decidedBy, employeeByAccountId) {
  if (decidedBy == null || decidedBy === "") return "—";
  const key = String(decidedBy);
  const emp = employeeByAccountId.get(key);
  if (emp) {
    const name =
      emp.employeeName ||
      emp.fullName ||
      emp.name ||
      [emp.firstName, emp.lastName].filter(Boolean).join(" ").trim() ||
      emp.email;
    if (name) return name;
  }
  return `Account #${decidedBy}`;
}

/**
 * Planning decision audit for the Project Planning Hub.
 */
export default function PlanningAuditPage() {
  useOutletContext();
  const { projectId } = useParams();
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchPlanningAudit(projectId).catch(() => []),
      fetchAllEmployees().catch(() => []),
    ])
      .then(([audit, emps]) => {
        setRows(Array.isArray(audit) ? audit : audit?.items || []);
        setEmployees(Array.isArray(emps) ? emps : []);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const employeeByAccountId = useMemo(() => {
    const map = new Map();
    for (const e of employees) {
      if (e?.accountId != null) map.set(String(e.accountId), e);
      if (e?.id != null) map.set(String(e.id), e);
    }
    return map;
  }, [employees]);

  if (loading) {
    return <PlanningHubSkeleton variant="table" />;
  }

  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardList className="h-4 w-4" />
          Planning audit
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Key planning decisions from any portal — who changed what, and when.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">When</TableHead>
                <TableHead className="text-xs">Decision</TableHead>
                <TableHead className="text-xs">From</TableHead>
                <TableHead className="text-xs">To</TableHead>
                <TableHead className="text-xs">Who</TableHead>
                <TableHead className="text-xs">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    No planning decisions recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.uuid || `${row.decisionType}-${row.decidedAt}`}>
                    <TableCell className="text-sm tabular-nums text-muted-foreground whitespace-nowrap">
                      {row.decidedAt ? new Date(row.decidedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatDecisionType(row.decisionType)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.fromValue ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{row.toValue ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {actorLabel(row.decidedBy, employeeByAccountId)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {row.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
