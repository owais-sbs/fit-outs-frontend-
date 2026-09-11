import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  createScWorker,
  deleteScWorker,
  fetchScWorkers,
  updateScWorker,
} from "@/modules/admin/api/subcontractor.api";

const emptyWorker = () => ({
  fullName: "",
  trade: "",
  passportNumber: "",
  visaExpiry: "",
  emiratesIdExpiry: "",
  insuranceExpiry: "",
  inductionDate: "",
  accessCardExpiry: "",
  active: true,
});

function WorkerForm({ form, onChange, onSave, onCancel, busy, title }) {
  const set = (patch) => onChange({ ...form, ...patch });
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Full name *</Label>
          <Input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Trade</Label>
          <Input value={form.trade} onChange={(e) => set({ trade: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Passport number</Label>
          <Input value={form.passportNumber} onChange={(e) => set({ passportNumber: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Visa expiry</Label>
          <Input type="date" value={form.visaExpiry} onChange={(e) => set({ visaExpiry: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Emirates ID expiry</Label>
          <Input type="date" value={form.emiratesIdExpiry} onChange={(e) => set({ emiratesIdExpiry: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Insurance expiry</Label>
          <Input type="date" value={form.insuranceExpiry} onChange={(e) => set({ insuranceExpiry: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Induction date</Label>
          <Input type="date" value={form.inductionDate} onChange={(e) => set({ inductionDate: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Access card expiry</Label>
          <Input type="date" value={form.accessCardExpiry} onChange={(e) => set({ accessCardExpiry: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled={busy || !form.fullName?.trim()} onClick={onSave}>Save worker</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function SubcontractorWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyWorker());

  const load = useCallback(() => {
    setLoading(true);
    fetchScWorkers()
      .then((list) => setWorkers(Array.isArray(list) ? list : []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      setEditing(null);
      setForm(emptyWorker());
      await load();
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (w) => {
    setEditing(w.uuid);
    setForm({
      fullName: w.fullName || "",
      trade: w.trade || "",
      passportNumber: w.passportNumber || "",
      visaExpiry: w.visaExpiry || "",
      emiratesIdExpiry: w.emiratesIdExpiry || "",
      insuranceExpiry: w.insuranceExpiry || "",
      inductionDate: w.inductionDate || "",
      accessCardExpiry: w.accessCardExpiry || "",
      active: w.active,
    });
  };

  if (loading) {
    return (
      <PageShell className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Worker roster"
          subtitle="Site workers for your company — not portal logins. Workers with expired documents are flagged as not site eligible."
        />
        {!editing && (
          <Button size="sm" onClick={() => { setEditing("new"); setForm(emptyWorker()); }}>
            <Plus className="h-4 w-4 mr-1" /> Add worker
          </Button>
        )}
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {editing === "new" && (
        <WorkerForm
          form={form}
          onChange={setForm}
          busy={busy}
          title="New worker"
          onCancel={() => { setEditing(null); setForm(emptyWorker()); }}
          onSave={() => run(() => createScWorker(form), "Worker added")}
        />
      )}

      {editing && editing !== "new" && (
        <WorkerForm
          form={form}
          onChange={setForm}
          busy={busy}
          title="Edit worker"
          onCancel={() => { setEditing(null); setForm(emptyWorker()); }}
          onSave={() => run(() => updateScWorker(editing, form), "Worker updated")}
        />
      )}

      <Surface>
        {workers.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">No workers yet. Add your site team to track visa, ID, and insurance expiry.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trade</TableHead>
                <TableHead>Visa</TableHead>
                <TableHead>EID</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Site eligible</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((w) => (
                <TableRow key={w.uuid}>
                  <TableCell className="font-medium">{w.fullName}</TableCell>
                  <TableCell>{w.trade || "—"}</TableCell>
                  <TableCell className="text-xs">{w.visaExpiry || "—"}</TableCell>
                  <TableCell className="text-xs">{w.emiratesIdExpiry || "—"}</TableCell>
                  <TableCell className="text-xs">{w.insuranceExpiry || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        w.siteEligible
                          ? "bg-emerald-500/15 text-emerald-700 border-none"
                          : "bg-destructive/15 text-destructive border-none"
                      }
                      title={w.siteEligibilityNote}
                    >
                      {w.siteEligible ? "Eligible" : "Not eligible"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(w)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        disabled={busy}
                        onClick={() => run(() => deleteScWorker(w.uuid), "Worker removed")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Surface>

      <p className="text-xs text-muted-foreground">
        There is no site access list yet — eligibility is enforced on this roster. Ineligible workers cannot be added to future site access lists.
      </p>
    </PageShell>
  );
}
