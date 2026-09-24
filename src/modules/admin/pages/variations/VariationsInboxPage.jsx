import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchVariationTriageInbox, triageVariation } from "@/modules/admin/api/variations.api";
import {
  approveCommercialTask, exportCommercialApprovalsCsv, fetchCommercialApprovalInbox,
  rejectCommercialTask,
} from "@/modules/admin/api/commercial-approvals.api";
import { formatCurrency } from "@/modules/admin/pages/boq/quantityCalcUtils";
import { portalRoutesFromPath } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";
import { ROLES } from "@/shared/constants/roles";

export default function VariationsInboxPage() {
  const routes = portalRoutesFromPath(window.location.pathname);
  const { role } = useAuth();
  const canTriage = [ROLES.PROJECT_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);
  const [triage, setTriage] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      canTriage ? fetchVariationTriageInbox().catch(() => []) : Promise.resolve([]),
      fetchCommercialApprovalInbox().catch(() => []),
    ])
      .then(([t, m]) => {
        setTriage(Array.isArray(t) ? t : []);
        setMatrix(Array.isArray(m) ? m : []);
      })
      .finally(() => setLoading(false));
  }, [canTriage]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn, ok) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      setMessage(ok);
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    try {
      const blob = await exportCommercialApprovalsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "commercial-approvals.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setMessage(e?.response?.data?.message || "Export failed");
    }
  };

  const variationHref = (projectId, uuid) =>
    `${routes.PROJECTS}/${projectId}/variations/${uuid}`;

  return (
    <PageShell>
      <PageTitle
        title="Variations inbox"
        description="PM triage and commercial matrix approvals"
        actions={<Button variant="outline" onClick={exportCsv}>Export audit CSV</Button>}
      />
      {message && <p className="text-sm text-muted-foreground mb-3">{message}</p>}
      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <Tabs defaultValue={canTriage ? "triage" : "matrix"}>
          <TabsList>
            {canTriage && <TabsTrigger value="triage">Triage ({triage.length})</TabsTrigger>}
            <TabsTrigger value="matrix">Matrix approvals ({matrix.length})</TabsTrigger>
          </TabsList>
          {canTriage && <TabsContent value="triage">
            <Surface>
              {triage.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No client requests awaiting triage</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CR</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {triage.map((item) => (
                      <TableRow key={item.uuid}>
                        <TableCell className="font-mono text-xs">{item.crNumber}</TableCell>
                        <TableCell>{item.projectName || item.projectId}</TableCell>
                        <TableCell>{item.title}</TableCell>
                        <TableCell className="space-y-2 min-w-[220px]">
                          <Textarea
                            placeholder="Note"
                            value={notes[item.uuid] || ""}
                            onChange={(e) => setNotes({ ...notes, [item.uuid]: e.target.value })}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" disabled={busy} onClick={() => run(
                              () => triageVariation(item.projectId, item.uuid, {
                                accept: true, note: notes[item.uuid],
                              }),
                              "Accepted",
                            )}>Accept</Button>
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(
                              () => triageVariation(item.projectId, item.uuid, {
                                accept: false, note: notes[item.uuid] || "Rejected",
                              }),
                              "Rejected",
                            )}>Reject</Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link to={variationHref(item.projectId, item.uuid)}>Open</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Surface>
          </TabsContent>}
          <TabsContent value="matrix">
            <Surface>
              {matrix.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No pending matrix tasks</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrix.map((item) => (
                      <TableRow key={item.taskUuid}>
                        <TableCell>
                          <Badge variant="outline">{item.eventType}</Badge>
                          <div className="text-xs text-muted-foreground mt-1">{item.title}</div>
                        </TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{item.role}</TableCell>
                        <TableCell className="text-xs">
                          {item.dueAt ? new Date(item.dueAt).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="space-y-2 min-w-[220px]">
                          <Textarea
                            placeholder="Comment"
                            value={notes[item.taskUuid] || ""}
                            onChange={(e) => setNotes({ ...notes, [item.taskUuid]: e.target.value })}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" disabled={busy} onClick={() => run(
                              () => approveCommercialTask(item.taskUuid, notes[item.taskUuid]),
                              "Approved",
                            )}>Approve</Button>
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(
                              () => rejectCommercialTask(item.taskUuid, notes[item.taskUuid] || "Rejected"),
                              "Rejected",
                            )}>Reject</Button>
                            {item.eventType === "VARIATION" && item.projectId && (
                              <Button size="sm" variant="ghost" asChild>
                                <Link to={variationHref(item.projectId, item.entityUuid)}>Open</Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Surface>
          </TabsContent>
        </Tabs>
      )}
    </PageShell>
  );
}
