import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, Send } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  fetchMyScPackages,
  fetchPackageClaims,
  createScClaim,
  submitScClaim,
} from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

export default function SubcontractorClaimsPage() {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ claimedQty: "", notes: "" });

  const selectedPkg = useMemo(
    () => packages.find((p) => String(p.uuid) === String(selectedPackage)),
    [packages, selectedPackage]
  );

  const plannedQty = Number(selectedPkg?.boqPlannedQty ?? selectedPkg?.plannedQty ?? 0);
  const remainingQty = Number(
    selectedPkg?.remainingQty ?? Math.max(0, plannedQty - Number(selectedPkg?.approvedClaimedQty ?? 0))
  );

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
      await loadPackages();
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
        notes: form.notes.trim(),
      });
      setForm({ claimedQty: "", notes: "" });
    }, "Claim drafted");

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title="Progress Claims"
        subtitle="Draft and submit claims for PM validation"
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.SUBCONTRACTOR.PACKAGES}>View packages</Link>
          </Button>
        }
      />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="border-border/50 bg-card/60 shadow-none">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-sm font-semibold">New claim</h2>
            <div className="space-y-1.5">
              <Label className="text-xs">Package</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.length === 0 ? (
                    <SelectItem value="__none" disabled>No packages assigned</SelectItem>
                  ) : (
                    packages.map((p) => (
                      <SelectItem key={p.uuid} value={p.uuid}>
                        {p.name}
                        {p.projectName ? ` · ${p.projectName}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedPkg && (
              <>
                <div className="rounded-xl bg-secondary/40 p-3 text-xs">
                  <p className="font-medium">{selectedPkg.projectName || `Project #${selectedPkg.projectId}`}</p>
                  <p className="text-muted-foreground">{selectedPkg.projectLocation || "No location"}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-secondary/60 px-3 py-2 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Planned</p>
                    <p className="font-semibold tabular-nums">{plannedQty}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/60 px-3 py-2 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Approved</p>
                    <p className="font-semibold tabular-nums">{Number(selectedPkg.approvedClaimedQty ?? 0)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/60 px-3 py-2 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Remaining</p>
                    <p className="font-semibold tabular-nums">{remainingQty}</p>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Claimed quantity</Label>
              <Input
                type="number"
                value={form.claimedQty}
                onChange={(e) => setForm((f) => ({ ...f, claimedQty: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes for the PM..."
              />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={busy || !selectedPackage}>
              <Plus className="mr-1 h-4 w-4" /> Draft claim
            </Button>
          </CardContent>
        </Card>

        <Surface className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Claims history ({claims.length})</h2>
          {claims.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No claims for this package yet
            </p>
          ) : (
            <div className="space-y-3">
              {claims.map((c) => (
                <div
                  key={c.uuid}
                  className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold tabular-nums">
                        {c.claimedQty} / {c.plannedQty}
                      </p>
                      <Badge className={`${SC_STATUS_BADGE[c.status] || "bg-muted border-none"} text-[10px]`}>
                        {formatScStatus(c.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.notes || "No notes"}</p>
                    {c.status === "REJECTED" && c.reason && (
                      <p className="mt-1 text-xs text-destructive">Rejected: {c.reason}</p>
                    )}
                  </div>
                  {(c.status === "DRAFT" || c.status === "REJECTED") && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => submitScClaim(c.uuid),
                          c.status === "REJECTED" ? "Claim resubmitted" : "Claim submitted"
                        )
                      }
                    >
                      <Send className="mr-1 h-4 w-4" />
                      {c.status === "REJECTED" ? "Resubmit" : "Submit"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>
    </PageShell>
  );
}
