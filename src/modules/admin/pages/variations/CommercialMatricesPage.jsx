import { useCallback, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  fetchCommercialMatrices, upsertCommercialMatrix,
} from "@/modules/admin/api/commercial-approvals.api";

const EVENT_TYPES = ["VARIATION", "SC_CERTIFICATE", "CREDIT_NOTE"];
const ROLES = ["SENIOR_QS", "PROJECT_MANAGER", "BUSINESS_OWNER", "QS", "FINANCE", "ADMIN"];

const emptyBand = () => ({
  minAmount: "0",
  maxAmount: "",
  steps: [{ stepOrder: 1, mode: "SEQUENTIAL", slaHours: 48, escalateToRole: "BUSINESS_OWNER", roles: ["PROJECT_MANAGER"] }],
});

export default function CommercialMatricesPage() {
  const [matrices, setMatrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [eventType, setEventType] = useState("VARIATION");
  const [name, setName] = useState("Variation approvals");
  const [bands, setBands] = useState([emptyBand()]);

  const applyMatrix = useCallback((match, type) => {
    if (!match) {
      setName(`${type} approvals`);
      setBands([emptyBand()]);
      return;
    }
    setName(match.name || `${type} approvals`);
    const nextBands = (match.bands || []).map((b) => ({
      minAmount: String(b.minAmount ?? 0),
      maxAmount: b.maxAmount != null ? String(b.maxAmount) : "",
      steps: (b.steps || []).map((s) => ({
        stepOrder: s.stepOrder,
        mode: s.mode || "SEQUENTIAL",
        slaHours: s.slaHours ?? 48,
        escalateToRole: s.escalateToRole || "BUSINESS_OWNER",
        roles: s.roles?.length ? s.roles : ["PROJECT_MANAGER"],
      })),
    }));
    setBands(nextBands.length ? nextBands : [emptyBand()]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCommercialMatrices()
      .then((list) => {
        if (!cancelled) setMatrices(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setMatrices([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    applyMatrix(matrices.find((m) => m.eventType === eventType), eventType);
  }, [applyMatrix, eventType, loading, matrices]);

  const save = async () => {
    setBusy(true);
    setMessage("");
    try {
      const saved = await upsertCommercialMatrix({
        eventType,
        name,
        active: true,
        bands: bands.map((b, i) => ({
          minAmount: Number(b.minAmount || 0),
          maxAmount: b.maxAmount !== "" ? Number(b.maxAmount) : null,
          sortOrder: i,
          steps: (b.steps || []).map((s, j) => ({
            stepOrder: s.stepOrder || j + 1,
            mode: s.mode || "SEQUENTIAL",
            slaHours: Number(s.slaHours || 48),
            escalateToRole: s.escalateToRole || null,
            roles: s.roles,
          })),
        })),
      });
      setMatrices((list) => {
        const rest = list.filter((m) => m.eventType !== eventType);
        return saved ? [...rest, saved] : rest;
      });
      setMessage("Matrix saved");
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title="Commercial approval matrices"
        description="Tenant rules for variation / SC certificate / credit-note value bands"
        actions={(
          <Button disabled={busy} onClick={save}>
            <Save className="h-4 w-4 mr-1" /> Save matrix
          </Button>
        )}
      />
      {message && <p className="text-sm text-muted-foreground mb-3">{message}</p>}
      {!matrices.some((m) => m.eventType === eventType) && (
        <p className="text-sm text-muted-foreground mb-3">
          No saved matrix for {eventType} yet. Save one to turn this approval chain on.
        </p>
      )}

      <Surface className="p-4 space-y-4 mb-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Event type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>

        {bands.map((band, bi) => (
          <div key={bi} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Band {bi + 1}</Badge>
              <Button size="sm" variant="ghost" onClick={() => setBands(bands.filter((_, i) => i !== bi))}>
                Remove band
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min amount</Label>
                <Input value={band.minAmount} onChange={(e) => {
                  const next = [...bands];
                  next[bi] = { ...band, minAmount: e.target.value };
                  setBands(next);
                }} />
              </div>
              <div>
                <Label>Max amount (blank = open)</Label>
                <Input value={band.maxAmount} onChange={(e) => {
                  const next = [...bands];
                  next[bi] = { ...band, maxAmount: e.target.value };
                  setBands(next);
                }} />
              </div>
            </div>
            {(band.steps || []).map((step, si) => (
              <div key={si} className="bg-muted/40 rounded-md p-3 space-y-2">
                <div className="text-xs font-medium">Step {si + 1}</div>
                <div className="grid md:grid-cols-3 gap-2">
                  <div>
                    <Label>Mode</Label>
                    <Select value={step.mode} onValueChange={(v) => {
                      const next = [...bands];
                      const steps = [...band.steps];
                      steps[si] = { ...step, mode: v };
                      next[bi] = { ...band, steps };
                      setBands(next);
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEQUENTIAL">SEQUENTIAL</SelectItem>
                        <SelectItem value="PARALLEL">PARALLEL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>SLA hours</Label>
                    <Input type="number" value={step.slaHours} onChange={(e) => {
                      const next = [...bands];
                      const steps = [...band.steps];
                      steps[si] = { ...step, slaHours: e.target.value };
                      next[bi] = { ...band, steps };
                      setBands(next);
                    }} />
                  </div>
                  <div>
                    <Label>Escalate to</Label>
                    <Select value={step.escalateToRole || "BUSINESS_OWNER"} onValueChange={(v) => {
                      const next = [...bands];
                      const steps = [...band.steps];
                      steps[si] = { ...step, escalateToRole: v };
                      next[bi] = { ...band, steps };
                      setBands(next);
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Roles (comma-separated)</Label>
                  <Input
                    value={(step.roles || []).join(",")}
                    onChange={(e) => {
                      const next = [...bands];
                      const steps = [...band.steps];
                      steps[si] = {
                        ...step,
                        roles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      };
                      next[bi] = { ...band, steps };
                      setBands(next);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{ROLES.join(", ")}</p>
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => {
              const next = [...bands];
              next[bi] = {
                ...band,
                steps: [...(band.steps || []), {
                  stepOrder: (band.steps?.length || 0) + 1,
                  mode: "SEQUENTIAL",
                  slaHours: 48,
                  escalateToRole: "BUSINESS_OWNER",
                  roles: ["PROJECT_MANAGER"],
                }],
              };
              setBands(next);
            }}>Add step</Button>
          </div>
        ))}

        <Button variant="outline" onClick={() => setBands([...bands, emptyBand()])}>Add band</Button>
      </Surface>
    </PageShell>
  );
}
