import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { ArrowDownUp, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function toDayKey(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

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

  const filteredRows = useMemo(() => {
    let list = [...rows];
    if (dateFrom) {
      list = list.filter((row) => {
        const key = toDayKey(row.decidedAt);
        return key && key >= dateFrom;
      });
    }
    if (dateTo) {
      list = list.filter((row) => {
        const key = toDayKey(row.decidedAt);
        return key && key <= dateTo;
      });
    }
    list.sort((a, b) => {
      const ta = a.decidedAt ? new Date(a.decidedAt).getTime() : 0;
      const tb = b.decidedAt ? new Date(b.decidedAt).getTime() : 0;
      return sortOrder === "oldest" ? ta - tb : tb - ta;
    });
    return list;
  }, [rows, dateFrom, dateTo, sortOrder]);

  if (loading) {
    return <PlanningHubSkeleton variant="table" />;
  }

  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm">
      <CardHeader className="space-y-4 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4" />
            Planning audit
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Key planning decisions from any portal — who changed what, and when.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="audit-from" className="text-xs text-muted-foreground">
              From date
            </Label>
            <Input
              id="audit-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-full sm:w-[11rem]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-to" className="text-xs text-muted-foreground">
              To date
            </Label>
            <Input
              id="audit-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-full sm:w-[11rem]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sort</Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="h-9 w-full sm:w-[11rem]">
                <ArrowDownUp className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(dateFrom || dateTo || sortOrder !== "newest") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setSortOrder("newest");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
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
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    {rows.length === 0
                      ? "No planning decisions recorded yet."
                      : "No decisions match the selected date filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.uuid || `${row.decisionType}-${row.decidedAt}`}>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
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
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
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
