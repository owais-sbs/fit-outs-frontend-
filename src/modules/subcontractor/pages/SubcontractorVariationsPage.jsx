import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, Send } from "lucide-react";
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
  createScVariation, fetchMyScPackages, fetchMyScVariations, submitScVariation,
} from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";
import { ROUTES } from "@/shared/constants/routes";

export default function SubcontractorVariationsPage() {
  const [packages, setPackages] = useState([]);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    packageUuid: "", title: "", description: "", qtyDelta: "", unit: "", estimatedCost: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchMyScPackages(), fetchMyScVariations()])
      .then(([pkgList, varList]) => {
        const pkgs = Array.isArray(pkgList) ? pkgList : [];
        setPackages(pkgs.filter((p) => p.status !== "APPOINTED" && p.status !== "OPEN"));
        setVariations(Array.isArray(varList) ? varList : []);
      })
      .catch(() => {
        setPackages([]);
        setVariations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const activePackages = useMemo(
    () => packages.filter((p) => p.status === "IN_PROGRESS" || p.status === "COMPLETE"),
    [packages]
  );

  const create = async () => {
    if (!form.packageUuid || !form.title.trim()) {
      setMessage("Select a package and enter a title");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await createScVariation(form.packageUuid, {
        title: form.title.trim(),
        description: form.description || null,
        qtyDelta: form.qtyDelta !== "" ? Number(form.qtyDelta) : null,
        unit: form.unit || null,
        estimatedCost: form.estimatedCost !== "" ? Number(form.estimatedCost) : null,
      });
      setShowForm(false);
      setForm({ packageUuid: "", title: "", description: "", qtyDelta: "", unit: "", estimatedCost: "" });
      setMessage("Variation draft created");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to create variation");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (uuid) => {
    setBusy(true);
    try {
      await submitScVariation(uuid);
      setMessage("Variation submitted for PM approval");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title="Variations & Change Requests"
        subtitle="Request extra work or scope changes beyond your original BOQ package"
        actions={
          <Button size="sm" onClick={() => setShowForm((v) => !v)} disabled={activePackages.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> New variation
          </Button>
        }
      />

      <Surface className="border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Purpose:</strong> use variations when site work differs from the contracted BOQ —
          extra quantity, additional item, design change, or unforeseen scope. The PM must approve before you claim or invoice the extra work.
        </p>
        <p className="mt-2">
          For normal BOQ progress use <Link className="text-primary underline" to={ROUTES.SUBCONTRACTOR.CLAIMS}>Claims</Link>.
          For programme % use <Link className="text-primary underline" to={ROUTES.SUBCONTRACTOR.PROGRESS_LOGS}>Progress logs</Link>.
        </p>
      </Surface>

      {message && (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>
      )}

      {showForm && (
        <Surface className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Package</Label>
              <Select value={form.packageUuid} onValueChange={(v) => setForm((f) => ({ ...f, packageUuid: v }))}>
                <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                <SelectContent>
                  {activePackages.map((p) => (
                    <SelectItem key={p.uuid} value={p.uuid}>{p.name} · {p.projectName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Qty change (+/-)</Label>
              <Input type="number" value={form.qtyDelta} onChange={(e) => setForm((f) => ({ ...f, qtyDelta: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Est. cost</Label>
              <Input type="number" value={form.estimatedCost} onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={create} disabled={busy}>Save draft</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Surface>
      )}

      {variations.length === 0 ? (
        <Surface className="px-4 py-16 text-center text-sm text-muted-foreground">
          No variation requests yet.
        </Surface>
      ) : (
        <Surface className="divide-y divide-border/30">
          {variations.map((v) => (
            <div key={v.uuid} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.projectName} · {v.packageName}</p>
                {v.description && <p className="mt-2 text-sm text-muted-foreground">{v.description}</p>}
                {v.reason && <p className="mt-1 text-xs text-destructive">Rejected: {v.reason}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={SC_STATUS_BADGE[v.status] || "bg-muted border-none"}>
                  {formatScStatus(v.status)}
                </Badge>
                {(v.status === "DRAFT" || v.status === "REJECTED") && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => submit(v.uuid)}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Surface>
      )}
    </PageShell>
  );
}
