import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchProjectPermitCases,
  updatePermitCase,
  updatePermitDocument,
} from "../api/approvals-config.api";

const CASE_STATUSES = ["Not started", "In progress", "Submitted", "Approved", "Rejected", "Not required"];
const DOC_STATUSES = ["Pending", "Received", "Not required"];

const CASE_BADGE = {
  "Not started": "secondary",
  "In progress": "outline",
  Submitted: "outline",
  Approved: "default",
  Rejected: "destructive",
  "Not required": "secondary",
};

export default function ProjectApprovalsSection({ projectId }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());

  const load = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    fetchProjectPermitCases(projectId)
      .then((list) => setCases(Array.isArray(list) ? list : []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onCaseStatus = async (id, status) => {
    try {
      const updated = await updatePermitCase(id, { status });
      setCases((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch {
      /* keep previous */
    }
  };

  const onDocStatus = async (docId, status) => {
    try {
      await updatePermitDocument(docId, { status });
      setCases((prev) =>
        prev.map((item) => ({
          ...item,
          documents: (item.documents || []).map((doc) =>
            doc.id === docId ? { ...doc, status } : doc
          ),
        }))
      );
    } catch {
      /* keep previous */
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Authority approvals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading permit cases…</p>
        ) : cases.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No permit cases on this project. New projects pick a community/zone to generate the pack.
          </p>
        ) : (
          <div className="space-y-2">
            {cases.map((item) => {
              const open = expanded.has(item.id);
              const pendingDocs = (item.documents || []).filter((d) => d.status === "Pending").length;
              return (
                <div key={item.id} className="rounded-lg border">
                  <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                    <button type="button" className="flex flex-1 items-start gap-2 text-left" onClick={() => toggle(item.id)}>
                      {open ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] text-muted-foreground">{item.permitCode}</span>
                          <span className="text-sm font-medium">{item.permitName}</span>
                          <Badge variant={CASE_BADGE[item.status] || "outline"}>{item.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.issuingAuthorityName || "Issuer not set"}
                          {item.slaWorkingDays ? ` · SLA ${item.slaWorkingDays} wd` : ""}
                          {item.blocksActivities ? ` · Blocks: ${item.blocksActivities}` : ""}
                          {pendingDocs ? ` · ${pendingDocs} docs pending` : ""}
                        </p>
                      </div>
                    </button>
                    <Select value={item.status} onValueChange={(value) => onCaseStatus(item.id, value)}>
                      <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CASE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {open && (
                    <div className="border-t px-3 py-2 space-y-2">
                      {(item.documents || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No checklist documents for this case.</p>
                      ) : (
                        (item.documents || []).map((doc) => (
                          <div key={doc.id} className="flex flex-col gap-1 rounded-md bg-muted/40 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-medium">{doc.docCode} · {doc.documentName}</p>
                              <p className="text-[11px] text-muted-foreground">{doc.category} · {doc.sourceOwner}</p>
                            </div>
                            <Select value={doc.status} onValueChange={(value) => onDocStatus(doc.id, value)}>
                              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {DOC_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
