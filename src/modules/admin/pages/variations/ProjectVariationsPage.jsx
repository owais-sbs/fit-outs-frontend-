import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GitBranch, Loader2, Plus } from "lucide-react";
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
  createVariation, fetchProjectCommercial, fetchProjectVariations, REASON_CODES,
} from "@/modules/admin/api/variations.api";
import { portalRoutesFromPath, projectDetailPath } from "@/shared/constants/routes";
import { formatCurrency } from "@/modules/admin/pages/boq/quantityCalcUtils";
import ProjectLifecycleBanner from "@/modules/admin/components/projects/ProjectLifecycleBanner";
import { useProjectLifecycle } from "@/modules/admin/hooks/useProjectLifecycle";

const STATUS_VARIANT = {
  AWAITING_TRIAGE: "secondary",
  DRAFT: "outline",
  INTERNAL_REVIEW: "default",
  ISSUED_TO_CLIENT: "default",
  APPROVED: "default",
  REJECTED: "destructive",
  REVISED: "secondary",
};

export default function ProjectVariationsPage() {
  const { projectId } = useParams();
  const routes = portalRoutesFromPath(window.location.pathname);
  const { commercialStage, commercialFrozen } = useProjectLifecycle(projectId);
  const [items, setItems] = useState([]);
  const [commercial, setCommercial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    reasonCode: "SCOPE_CHANGE",
    proposedDelayDays: "",
    sellAmount: "",
    costAmount: "",
    applyScheduleOnApproval: false,
  });

  const detailPath = (uuid) =>
    `${routes.PROJECTS}/${projectId}/variations/${uuid}`.replace("/projects/projects", "/projects");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchProjectVariations(projectId),
      fetchProjectCommercial(projectId).catch(() => null),
    ])
      .then(([list, comm]) => {
        setItems(Array.isArray(list) ? list : []);
        setCommercial(comm);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.title.trim()) {
      setMessage("Title is required");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const sell = form.sellAmount !== "" ? Number(form.sellAmount) : 0;
      const cost = form.costAmount !== "" ? Number(form.costAmount) : 0;
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        reasonCode: form.reasonCode,
        proposedDelayDays: form.proposedDelayDays !== "" ? Number(form.proposedDelayDays) : null,
        applyScheduleOnApproval: form.applyScheduleOnApproval,
        costMode: "LUMP_SUM",
        lines: sell || cost
          ? [{
              lineType: "LUMP_SUM",
              description: form.title.trim(),
              quantity: 1,
              sellRate: sell,
              costRate: cost,
            }]
          : [],
      };
      await createVariation(projectId, payload);
      setShowForm(false);
      setForm({
        title: "", description: "", reasonCode: "SCOPE_CHANGE",
        proposedDelayDays: "", sellAmount: "", costAmount: "", applyScheduleOnApproval: false,
      });
      setMessage("Variation draft created");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to create");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <PageTitle
        title="Variations"
        description="Client contract change requests for this project"
        actions={(
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={projectDetailPath(window.location.pathname, projectId)}>Back to project</Link>
            </Button>
            {!commercialFrozen && (
              <Button onClick={() => setShowForm((v) => !v)}>
                <Plus className="h-4 w-4 mr-1" /> New variation
              </Button>
            )}
          </div>
        )}
      />

      <ProjectLifecycleBanner commercialStage={commercialStage} className="mb-4" />

      {commercial && (
        <Surface className="mb-4 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Original contract</div>
            <div className="font-semibold">{formatCurrency(commercial.originalContractValue)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Current contract</div>
            <div className="font-semibold">{formatCurrency(commercial.currentContractValue)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Current cost</div>
            <div className="font-semibold">{formatCurrency(commercial.currentCost || 0)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Running margin</div>
            <div className="font-semibold">{formatCurrency(commercial.currentMargin || 0)}</div>
          </div>
        </Surface>
      )}

      {message && <p className="text-sm text-muted-foreground mb-3">{message}</p>}

      {showForm && !commercialFrozen && (
        <Surface className="mb-4 p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
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
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Sell amount (AED)</Label>
              <Input type="number" value={form.sellAmount} onChange={(e) => setForm({ ...form, sellAmount: e.target.value })} />
            </div>
            <div>
              <Label>Cost amount (AED)</Label>
              <Input type="number" value={form.costAmount} onChange={(e) => setForm({ ...form, costAmount: e.target.value })} />
            </div>
            <div>
              <Label>Proposed delay days</Label>
              <Input type="number" value={form.proposedDelayDays} onChange={(e) => setForm({ ...form, proposedDelayDays: e.target.value })} />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.applyScheduleOnApproval}
                  onChange={(e) => setForm({ ...form, applyScheduleOnApproval: e.target.checked })}
                />
                Apply schedule on approval (Wave B)
              </label>
            </div>
          </div>
          <Button disabled={busy} onClick={create}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create draft"}
          </Button>
        </Surface>
      )}

      <Surface>
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No variations yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CR #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sell delta</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.uuid}>
                  <TableCell className="font-mono text-xs">{item.crNumber}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.origin}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[item.status] || "outline"}>
                      {item.status?.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.sellDelta)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`${window.location.pathname.replace(/\/$/, "")}/${item.uuid}`}>Open</Link>
                    </Button>
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
