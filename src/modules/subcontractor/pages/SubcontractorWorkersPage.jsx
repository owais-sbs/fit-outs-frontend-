import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
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
  uploadScWorkerDocument,
} from "@/modules/admin/api/subcontractor.api";
import { resolveFileUrl } from "@/modules/admin/api/documents.api";
import { FillDemoDataButton } from "@/components/shared/FillDemoDataButton";
import { DEMO, demoWorkerDocuments } from "@/shared/demo/formDemoData";

const WORKER_DOC_FIELDS = [
  { key: "PASSPORT", label: "Passport copy", urlKey: "passportFileUrl" },
  { key: "VISA", label: "Visa / residency", urlKey: "visaFileUrl" },
  { key: "EMIRATES_ID", label: "Emirates ID", urlKey: "emiratesIdFileUrl" },
  { key: "INSURANCE", label: "Insurance certificate", urlKey: "insuranceFileUrl" },
  { key: "INDUCTION", label: "Induction certificate", urlKey: "inductionFileUrl" },
  { key: "ACCESS_CARD", label: "Access card copy", urlKey: "accessCardFileUrl" },
  { key: "TRADE_CERT", label: "Trade certificate", urlKey: "tradeCertFileUrl" },
];

const emptyWorker = () => ({
  fullName: "",
  trade: "",
  passportNumber: "",
  visaExpiry: "",
  emiratesIdExpiry: "",
  insuranceExpiry: "",
  inductionDate: "",
  accessCardExpiry: "",
  accessCardNumber: "",
  tradeCertExpiry: "",
  inductionCompleted: true,
  active: true,
  pendingDocs: {},
  existingDocUrls: {},
});

function workerPayload(form) {
  return {
    fullName: form.fullName,
    trade: form.trade,
    passportNumber: form.passportNumber,
    visaExpiry: form.visaExpiry,
    emiratesIdExpiry: form.emiratesIdExpiry,
    insuranceExpiry: form.insuranceExpiry,
    inductionDate: form.inductionDate,
    accessCardExpiry: form.accessCardExpiry,
    accessCardNumber: form.accessCardNumber,
    tradeCertExpiry: form.tradeCertExpiry,
    inductionCompleted: form.inductionCompleted,
    active: form.active,
  };
}

async function uploadPendingDocs(workerUuid, pendingDocs = {}) {
  const entries = Object.entries(pendingDocs).filter(([, file]) => file instanceof File);
  for (const [docType, file] of entries) {
    await uploadScWorkerDocument(workerUuid, docType, file);
  }
}

function WorkerForm({ form, onChange, onSave, onCancel, busy, title }) {
  const set = (patch) => onChange({ ...form, ...patch });
  const setDoc = (key, file) => {
    set({
      pendingDocs: {
        ...(form.pendingDocs || {}),
        [key]: file || undefined,
      },
    });
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <div className="flex items-center gap-1">
          <FillDemoDataButton
            onClick={() => {
              const next = { ...form, ...DEMO.scWorker };
              onChange({
                ...next,
                pendingDocs: demoWorkerDocuments(next.fullName || DEMO.scWorker.fullName),
              });
            }}
          />
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
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

      <div className="space-y-2 pt-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Documents</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {WORKER_DOC_FIELDS.map((doc) => {
            const pending = form.pendingDocs?.[doc.key];
            const existingUrl = form.existingDocUrls?.[doc.key]
              ? resolveFileUrl(form.existingDocUrls[doc.key])
              : null;
            return (
              <div key={doc.key} className="space-y-1 rounded-md border border-border/40 bg-background/60 p-2.5">
                <Label className="text-xs">{doc.label}</Label>
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  className="text-xs"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setDoc(doc.key, file || undefined);
                    e.target.value = "";
                  }}
                />
                {pending instanceof File ? (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <FileText className="h-3 w-3 shrink-0" />
                    Ready to upload: {pending.name}
                  </p>
                ) : existingUrl ? (
                  <a
                    href={existingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary underline-offset-2 hover:underline inline-flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" /> View uploaded file
                  </a>
                ) : (
                  <p className="text-[11px] text-muted-foreground">No file yet</p>
                )}
              </div>
            );
          })}
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

  const saveNew = () =>
    run(async () => {
      const created = await createScWorker(workerPayload(form));
      await uploadPendingDocs(created.uuid, form.pendingDocs);
    }, "Worker added with documents");

  const saveEdit = () =>
    run(async () => {
      await updateScWorker(editing, workerPayload(form));
      await uploadPendingDocs(editing, form.pendingDocs);
    }, "Worker updated");

  const startEdit = (w) => {
    setEditing(w.uuid);
    const existingDocUrls = {};
    WORKER_DOC_FIELDS.forEach((doc) => {
      if (w[doc.urlKey]) existingDocUrls[doc.key] = w[doc.urlKey];
    });
    setForm({
      fullName: w.fullName || "",
      trade: w.trade || "",
      passportNumber: w.passportNumber || "",
      visaExpiry: w.visaExpiry || "",
      emiratesIdExpiry: w.emiratesIdExpiry || "",
      insuranceExpiry: w.insuranceExpiry || "",
      inductionDate: w.inductionDate || "",
      accessCardExpiry: w.accessCardExpiry || "",
      accessCardNumber: w.accessCardNumber || "",
      tradeCertExpiry: w.tradeCertExpiry || "",
      inductionCompleted: w.inductionCompleted ?? true,
      active: w.active,
      pendingDocs: {},
      existingDocUrls,
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
          onSave={saveNew}
        />
      )}

      {editing && editing !== "new" && (
        <WorkerForm
          form={form}
          onChange={setForm}
          busy={busy}
          title="Edit worker"
          onCancel={() => { setEditing(null); setForm(emptyWorker()); }}
          onSave={saveEdit}
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
                <TableHead>Docs</TableHead>
                <TableHead>Site eligible</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((w) => {
                const docCount = WORKER_DOC_FIELDS.filter((d) => w[d.urlKey]).length;
                return (
                  <TableRow key={w.uuid}>
                    <TableCell className="font-medium">{w.fullName}</TableCell>
                    <TableCell>{w.trade || "—"}</TableCell>
                    <TableCell className="text-xs">{w.visaExpiry || "—"}</TableCell>
                    <TableCell className="text-xs">{w.emiratesIdExpiry || "—"}</TableCell>
                    <TableCell className="text-xs">{w.insuranceExpiry || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {docCount}/{WORKER_DOC_FIELDS.length}
                    </TableCell>
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
                );
              })}
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
