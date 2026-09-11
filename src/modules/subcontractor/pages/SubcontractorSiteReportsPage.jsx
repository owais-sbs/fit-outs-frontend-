import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Package, Plus, Truck } from "lucide-react";
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
  createScSiteReport, fetchMyScPackages, fetchMyScSiteReports,
} from "@/modules/admin/api/subcontractor.api";
import { groupPackagesByProject, SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

const TABS = [
  { id: "DELAY", label: "Delays", icon: AlertTriangle },
  { id: "ISSUE", label: "Issues", icon: AlertTriangle },
  { id: "MATERIAL_DELIVERY", label: "Material delivery", icon: Truck },
];

const DELAY_CODES = [
  { value: "WEATHER", label: "Weather" },
  { value: "MATERIAL_DELAY", label: "Material delay" },
  { value: "DESIGN_CHANGE", label: "Design change" },
  { value: "CLIENT_HOLD", label: "Client hold" },
  { value: "LABOUR_SHORTAGE", label: "Labour shortage" },
  { value: "OTHER", label: "Other" },
];

export default function SubcontractorSiteReportsPage() {
  const [tab, setTab] = useState("DELAY");
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    projectId: "", packageUuid: "", title: "", description: "",
    delayReasonCode: "", expectedDate: "", deliveredDate: "",
    materialName: "", quantity: "", unit: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchMyScSiteReports(tab),
      fetchMyScPackages().then((list) => groupPackagesByProject(Array.isArray(list) ? list : [])),
    ])
      .then(([repList, projList]) => {
        setReports(Array.isArray(repList) ? repList : []);
        setProjects(projList);
      })
      .catch(() => {
        setReports([]);
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const packagesForProject = useMemo(() => {
    const p = projects.find((x) => String(x.projectId) === String(form.projectId));
    return p?.packages || [];
  }, [projects, form.projectId]);

  const submit = async () => {
    if (!form.projectId || !form.title.trim()) {
      setMessage("Project and title are required");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await createScSiteReport({
        projectId: Number(form.projectId),
        packageUuid: form.packageUuid || null,
        reportType: tab,
        title: form.title.trim(),
        description: form.description || null,
        delayReasonCode: tab === "DELAY" ? form.delayReasonCode || null : null,
        expectedDate: form.expectedDate || null,
        deliveredDate: form.deliveredDate || null,
        materialName: tab === "MATERIAL_DELIVERY" ? form.materialName || null : null,
        quantity: form.quantity !== "" ? Number(form.quantity) : null,
        unit: form.unit || null,
      });
      setShowForm(false);
      setMessage("Report submitted");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to submit report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <PageTitle
        title="Site Reports"
        subtitle="Report delays, site issues, and material deliveries to your PM"
        actions={
          <Button size="sm" onClick={() => setShowForm((v) => !v)} disabled={projects.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> New report
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
          >
            <Icon className="mr-2 h-3.5 w-3.5" /> {label}
          </Button>
        ))}
      </div>

      {message && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}

      {showForm && (
        <Surface className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm((f) => ({ ...f, projectId: v, packageUuid: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.projectId} value={String(p.projectId)}>{p.projectName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Package (optional)</Label>
              <Select value={form.packageUuid || "none"} onValueChange={(v) => setForm((f) => ({ ...f, packageUuid: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {packagesForProject.map((p) => (
                    <SelectItem key={p.uuid} value={p.uuid}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          {tab === "DELAY" && (
            <div className="space-y-2">
              <Label>Delay reason</Label>
              <Select value={form.delayReasonCode} onValueChange={(v) => setForm((f) => ({ ...f, delayReasonCode: v }))}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {DELAY_CODES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {tab === "MATERIAL_DELIVERY" && (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Material</Label>
                <Input value={form.materialName} onChange={(e) => setForm((f) => ({ ...f, materialName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Qty</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Expected date</Label>
                <Input type="date" value={form.expectedDate} onChange={(e) => setForm((f) => ({ ...f, expectedDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Delivered date</Label>
                <Input type="date" value={form.deliveredDate} onChange={(e) => setForm((f) => ({ ...f, deliveredDate: e.target.value }))} />
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={busy}>Submit report</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Surface>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : reports.length === 0 ? (
        <Surface className="px-4 py-16 text-center text-sm text-muted-foreground">
          <Package className="mx-auto mb-3 h-10 w-10 opacity-30" />
          No {TABS.find((t) => t.id === tab)?.label.toLowerCase()} reports yet.
        </Surface>
      ) : (
        <Surface className="divide-y divide-border/30">
          {reports.map((r) => (
            <div key={r.uuid} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.projectName}{r.packageName ? ` · ${r.packageName}` : ""}</p>
                </div>
                <Badge className={SC_STATUS_BADGE[r.status] || "bg-muted border-none"}>
                  {formatScStatus(r.status)}
                </Badge>
              </div>
              {r.description && <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>}
              {r.delayReasonCode && <p className="mt-1 text-xs text-amber-700">Reason: {r.delayReasonCode}</p>}
              {r.materialName && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.materialName} · {r.quantity ?? "—"} {r.unit || ""}
                  {r.expectedDate ? ` · expected ${r.expectedDate}` : ""}
                  {r.deliveredDate ? ` · delivered ${r.deliveredDate}` : ""}
                </p>
              )}
            </div>
          ))}
        </Surface>
      )}
    </PageShell>
  );
}
