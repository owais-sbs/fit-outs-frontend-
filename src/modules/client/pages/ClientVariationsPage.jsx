import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  clientApproveVariation, clientRejectVariation, createVariation,
  fetchProjectVariations, REASON_CODES,
} from "@/modules/admin/api/variations.api";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { formatCurrency } from "@/modules/admin/pages/boq/quantityCalcUtils";
import ProjectLifecycleBanner from "@/modules/admin/components/projects/ProjectLifecycleBanner";
import { useProjectLifecycle } from "@/modules/admin/hooks/useProjectLifecycle";

export default function ClientVariationsPage() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const { commercialStage, commercialFrozen } = useProjectLifecycle(projectId || null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({ title: "", description: "", reasonCode: "CLIENT_REQUEST" });

  const loadProjects = useCallback(() => {
    fetchAllProjects()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setProjects(arr);
        if (!projectId && arr[0]?.id) setProjectId(String(arr[0].id));
      })
      .catch(() => setProjects([]));
  }, [projectId]);

  const load = useCallback(() => {
    if (!projectId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProjectVariations(projectId)
      .then((list) => setItems(Array.isArray(list) ? list : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { loadProjects(); }, [loadProjects]);
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

  return (
    <PageShell>
      <PageTitle
        title="Variations"
        description="Raise a change request or approve issued variations"
        actions={(
          !commercialFrozen ? (
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" /> Raise request
          </Button>
          ) : null
        )}
      />

      <ProjectLifecycleBanner commercialStage={commercialStage} className="mb-4" />

      <div className="mb-4 max-w-sm">
        <Label>Project</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {message && <p className="text-sm text-muted-foreground mb-3">{message}</p>}

      {showForm && !commercialFrozen && (
        <Surface className="p-4 mb-4 space-y-3 max-w-xl">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Reason</Label>
            <Select value={form.reasonCode} onValueChange={(v) => setForm({ ...form, reasonCode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASON_CODES.map((c) => (
                  <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button disabled={busy || !projectId} onClick={() => run(async () => {
            if (!form.title.trim()) {
              setMessage("Title required");
              return;
            }
            await createVariation(projectId, {
              title: form.title.trim(),
              description: form.description,
              reasonCode: form.reasonCode,
            });
            setShowForm(false);
            setForm({ title: "", description: "", reasonCode: "CLIENT_REQUEST" });
          }, "Request sent to PM for triage")}>
            Submit to PM
          </Button>
        </Surface>
      )}

      <Surface>
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">No variations</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CR</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.uuid}>
                  <TableCell className="font-mono text-xs">{item.crNumber}</TableCell>
                  <TableCell>
                    <div>{item.title}</div>
                    <div className="text-xs text-muted-foreground whitespace-pre-wrap">{item.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.status?.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(item.sellDelta)}</TableCell>
                  <TableCell className="min-w-[200px] space-y-2">
                    {item.status === "ISSUED_TO_CLIENT" && !commercialFrozen && (
                      <>
                        <Textarea
                          placeholder="Reject comment"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" disabled={busy} onClick={() => run(
                            () => clientApproveVariation(projectId, item.uuid),
                            "Approved — variation locked",
                          )}>Approve</Button>
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(
                            () => clientRejectVariation(projectId, item.uuid, comment || "Rejected"),
                            "Returned for revision",
                          )}>Reject</Button>
                        </div>
                      </>
                    )}
                    {item.lockedAt && (
                      <div className="text-xs text-muted-foreground">
                        Locked · contract {formatCurrency(item.currentContractValue)}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Surface>
    </PageShell>
  );
}
