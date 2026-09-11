import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, Plus, Send } from "lucide-react";
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
  createScInvoice, fetchMyScInvoices, fetchMyScPackages, fetchPackageClaims,
  submitScInvoice,
} from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatMoney(amount, currency = "AED") {
  const n = Number(amount ?? 0);
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SubcontractorPaymentsPage() {
  const [packages, setPackages] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [approvedClaims, setApprovedClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    packageUuid: "", claimUuid: "", invoiceNumber: "", amount: "", taxAmount: "", notes: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchMyScPackages(), fetchMyScInvoices()])
      .then(([pkgList, invList]) => {
        setPackages(Array.isArray(pkgList) ? pkgList : []);
        setInvoices(Array.isArray(invList) ? invList : []);
      })
      .catch(() => {
        setPackages([]);
        setInvoices([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!form.packageUuid) {
      setApprovedClaims([]);
      return;
    }
    fetchPackageClaims(form.packageUuid)
      .then((list) => setApprovedClaims((Array.isArray(list) ? list : []).filter((c) => c.status === "APPROVED")))
      .catch(() => setApprovedClaims([]));
  }, [form.packageUuid]);

  const stats = useMemo(() => ({
    submitted: invoices.filter((i) => i.status === "SUBMITTED").length,
    approved: invoices.filter((i) => i.status === "APPROVED").length,
    paid: invoices.filter((i) => i.status === "PAID").length,
    paidTotal: invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + Number(i.totalAmount ?? i.amount ?? 0), 0),
  }), [invoices]);

  const create = async () => {
    if (!form.packageUuid || !form.amount) {
      setMessage("Package and amount are required");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await createScInvoice({
        packageUuid: form.packageUuid,
        claimUuid: form.claimUuid || null,
        invoiceNumber: form.invoiceNumber || null,
        amount: Number(form.amount),
        taxAmount: form.taxAmount !== "" ? Number(form.taxAmount) : 0,
        notes: form.notes || null,
      });
      setShowForm(false);
      setForm({ packageUuid: "", claimUuid: "", invoiceNumber: "", amount: "", taxAmount: "", notes: "" });
      setMessage("Invoice draft created");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to create invoice");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (uuid) => {
    setBusy(true);
    try {
      await submitScInvoice(uuid);
      setMessage("Invoice submitted for approval");
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
        title="Invoices & Payments"
        subtitle="Submit invoices against approved work. Track payment status from your PM."
        actions={
          <Button size="sm" onClick={() => setShowForm((v) => !v)} disabled={packages.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> New invoice
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Pending approval</p>
          <p className="text-2xl font-semibold">{stats.submitted}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Approved (awaiting pay)</p>
          <p className="text-2xl font-semibold">{stats.approved}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-2xl font-semibold">{stats.paid}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs text-muted-foreground">Total received</p>
          <p className="text-lg font-semibold">{formatMoney(stats.paidTotal)}</p>
        </Surface>
      </div>

      {message && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}

      {showForm && (
        <Surface className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Package</Label>
              <Select value={form.packageUuid} onValueChange={(v) => setForm((f) => ({ ...f, packageUuid: v, claimUuid: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.uuid} value={p.uuid}>{p.name} · {p.projectName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link to approved claim (optional)</Label>
              <Select value={form.claimUuid || "none"} onValueChange={(v) => setForm((f) => ({ ...f, claimUuid: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {approvedClaims.map((c) => (
                    <SelectItem key={c.uuid} value={c.uuid}>
                      Qty {c.claimedQty} · {c.submittedAt?.slice(0, 10) || "approved"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Invoice #</Label>
              <Input value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Amount (ex tax)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Tax</Label>
              <Input type="number" value={form.taxAmount} onChange={(e) => setForm((f) => ({ ...f, taxAmount: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <div className="flex gap-2">
            <Button onClick={create} disabled={busy}>Save draft</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Surface>
      )}

      {invoices.length === 0 ? (
        <Surface className="px-4 py-16 text-center text-sm text-muted-foreground">
          <CreditCard className="mx-auto mb-3 h-10 w-10 opacity-30" />
          No invoices yet. Create one after your claims are approved.
        </Surface>
      ) : (
        <Surface className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/40 text-xs uppercase text-muted-foreground">
                <th className="p-3">Invoice</th>
                <th className="p-3">Project / Package</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {invoices.map((inv) => (
                <tr key={inv.uuid}>
                  <td className="p-3 font-mono text-xs">{inv.invoiceNumber || inv.uuid.slice(0, 8)}</td>
                  <td className="p-3">
                    <p>{inv.projectName}</p>
                    <p className="text-xs text-muted-foreground">{inv.packageName}</p>
                  </td>
                  <td className="p-3 tabular-nums">{formatMoney(inv.totalAmount ?? inv.amount, inv.currency)}</td>
                  <td className="p-3">
                    <Badge className={SC_STATUS_BADGE[inv.status] || "bg-muted border-none"}>
                      {formatScStatus(inv.status)}
                    </Badge>
                    {inv.paymentReference && (
                      <p className="mt-1 text-[10px] text-muted-foreground">Ref: {inv.paymentReference}</p>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {(inv.status === "DRAFT" || inv.status === "REJECTED") && (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => submit(inv.uuid)}>
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      )}
    </PageShell>
  );
}
