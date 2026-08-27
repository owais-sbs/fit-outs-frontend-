import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, Send } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  fetchMyScPackages,
  fetchPackageClaims,
  createScClaim,
  submitScClaim,
} from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";

export default function SubcontractorClaimsPage() {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ claimedQty: "", plannedQty: "", notes: "" });

  const loadPackages = useCallback(() => {
    setLoading(true);
    fetchMyScPackages()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setPackages(arr);
        setSelectedPackage((prev) => prev || arr[0]?.uuid || "");
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  const loadClaims = useCallback(() => {
    if (!selectedPackage) {
      setClaims([]);
      return;
    }
    fetchPackageClaims(selectedPackage)
      .then((list) => setClaims(Array.isArray(list) ? list : []))
      .catch(() => setClaims([]));
  }, [selectedPackage]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await loadClaims();
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () =>
    run(async () => {
      await createScClaim(selectedPackage, {
        claimedQty: Number(form.claimedQty) || 0,
        plannedQty: Number(form.plannedQty) || 0,
        notes: form.notes.trim(),
      });
      setForm({ claimedQty: "", plannedQty: "", notes: "" });
    }, "Claim drafted");

  if (loading) {
    return (
      <PageShell className="mx-auto max-w-4xl">
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="mx-auto max-w-4xl">
      <PageTitle
        title="Progress Claims"
        subtitle="Draft and submit claims for your packages"
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.SUBCONTRACTOR.PACKAGES}>Packages</Link>
          </Button>
        }
      />

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Surface className="space-y-3 p-5">
        <h2 className="text-sm font-semibold">New claim</h2>
        <div className="space-y-1">
          <Label className="text-xs">Package</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
          >
            <option value="">Select package</option>
            {packages.map((p) => (
              <option key={p.uuid} value={p.uuid}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Claimed qty</Label>
            <Input
              type="number"
              value={form.claimedQty}
              onChange={(e) => setForm((f) => ({ ...f, claimedQty: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Planned qty</Label>
            <Input
              type="number"
              value={form.plannedQty}
              onChange={(e) => setForm((f) => ({ ...f, plannedQty: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
        <Button size="sm" onClick={handleCreate} disabled={busy || !selectedPackage}>
          <Plus className="mr-1 h-4 w-4" /> Draft claim
        </Button>
      </Surface>

      <Surface className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Claims ({claims.length})</h2>
        {claims.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No claims for this package</p>
        ) : (
          <div className="divide-y divide-border/30">
            {claims.map((c) => (
              <div key={c.uuid} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {c.claimedQty} / {c.plannedQty}
                    </p>
                    <Badge variant="secondary">{c.status || "DRAFT"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.notes || "—"}</p>
                </div>
                {c.status === "DRAFT" && (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => run(() => submitScClaim(c.uuid), "Claim submitted")}
                  >
                    <Send className="mr-1 h-4 w-4" /> Submit
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
