import { useEffect, useState } from "react";
import { Check, Loader2, Plus, Sparkles, ShieldCheck, Upload, Users2, Database, X } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { PLAN_TYPES, ALL_MODULES } from "../data/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/axiosInstance";

const PLAN_ACCENTS = {
  basic: {
    ring: "border-primary/15 hover:border-primary/30",
    band: "from-slate-500/90 via-slate-500/40 to-transparent",
    icon: Database,
    badge: "Starter",
  },
  professional: {
    ring: "border-cyan-500/15 hover:border-cyan-500/30",
    band: "from-cyan-500/90 via-cyan-500/40 to-transparent",
    icon: Users2,
    badge: "Most chosen",
  },
  enterprise: {
    ring: "border-emerald-500/15 hover:border-emerald-500/30",
    band: "from-emerald-500/90 via-emerald-500/40 to-transparent",
    icon: ShieldCheck,
    badge: "Scale",
  },
};

const ACCENT_KEYS = ["basic", "professional", "enterprise"];

const defaultCreateForm = {
  planName: "",
  maxUsers: 10,
  modulesIncluded: [],
  priceMonthly: 0,
  priceAnnual: 0,
  active: true,
};

export default function PlansPage() {
  const [plans, setPlans] = useState(PLAN_TYPES);
  const [loading, setLoading] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [moduleToggles, setModuleToggles] = useState(() => {
    const map = {};
    ALL_MODULES.forEach((m) => {
      map[m.id] = { basic: true, professional: m.id !== "billing", enterprise: true };
    });
    return map;
  });

  const fetchPlans = () => {
    setLoading(true);
    axiosInstance
      .get("/subscription-plans")
      .then(({ data }) => {
        const list = Array.isArray(data?.data) ? data.data : [];
        if (list.length === 0) return;
        const mapped = list.map((item, index) => ({
          id: item.uuid,
          name: item.planName,
          displayName: item.planName,
          price: item.priceMonthly ?? 0,
          annualPrice: item.priceAnnual ?? 0,
          seats: item.maxUsers ?? 0,
          modules: Array.isArray(item.modulesIncluded) ? item.modulesIncluded : [],
          limits: { projects: "—", storage: "—", apiCalls: "—" },
          published: item.active ?? true,
          _accentKey: ACCENT_KEYS[index % ACCENT_KEYS.length],
        }));
        setPlans(mapped);
      })
      .catch((err) => {
        console.error("Failed to fetch subscription plans:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Fetch plans from API on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const toggleModule = (moduleId, planId) => {
    setModuleToggles((prev) => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [planId]: !prev[moduleId][planId] },
    }));
  };

  const handleCreateChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!createForm.planName.trim()) return;
    setCreating(true);
    try {
      await axiosInstance.post("/subscription-plans", {
        planName: createForm.planName.trim(),
        maxUsers: Number(createForm.maxUsers),
        modulesIncluded: createForm.modulesIncluded,
        priceMonthly: Number(createForm.priceMonthly),
        priceAnnual: Number(createForm.priceAnnual),
        active: true,
      });
      setCreateOpen(false);
      setCreateForm(defaultCreateForm);
      fetchPlans();
    } catch (err) {
      console.error("Failed to create plan:", err);
    } finally {
      setCreating(false);
    }
  };

  const moduleToggle = (moduleId) => {
    setCreateForm((prev) => {
      const has = prev.modulesIncluded.includes(moduleId);
      return {
        ...prev,
        modulesIncluded: has
          ? prev.modulesIncluded.filter((m) => m !== moduleId)
          : [...prev.modulesIncluded, moduleId],
      };
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Subscription plans"
        description="Configure pricing, modules, and renewal settings for fit-out tenant tiers."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />Create plan
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setPublishOpen(true)}>
              <Upload className="h-4 w-4" />Publish
            </Button>
          </>
        }
      />

      {/* ── Plan cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/60 shadow-sm">
                <CardHeader className="space-y-4 pb-4">
                  <Skeleton className="h-11 w-11 rounded-2xl" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                </CardContent>
              </Card>
            ))
          : plans.map((plan) => {
              const accentKey = plan._accentKey || plan.id;
              const accent = PLAN_ACCENTS[accentKey] || PLAN_ACCENTS.basic;
              const AccentIcon = accent.icon;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "group relative overflow-hidden border border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
                    accent.ring
                  )}
                >
                  <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", accent.band)} />
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <CardHeader className="relative space-y-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-muted/60 text-foreground shadow-sm transition-colors group-hover:bg-background">
                          <AccentIcon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-base tracking-tight">{plan.displayName}</CardTitle>
                            <Badge
                              variant={plan.published ? "success" : "secondary"}
                              className="h-5 px-2 text-[10px] uppercase tracking-wide"
                            >
                              {plan.published ? "Live" : "Draft"}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            {accent.badge} subscription tier
                          </CardDescription>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Monthly</p>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-3xl font-semibold tracking-tight">${plan.price}</span>
                            <span className="text-sm text-muted-foreground">AUD</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Annual</p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            ${plan.annualPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Users2 className="h-3 w-3" />
                          {plan.seats} seats
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          {plan.modules.length} modules
                        </Badge>
                        {plan.published && <Badge variant="success">Published</Badge>}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Monthly (AUD)
                        </Label>
                        <Input
                          type="number"
                          defaultValue={plan.price}
                          className="mt-1.5 h-10 bg-background/80"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Annual (AUD)
                        </Label>
                        <Input
                          type="number"
                          defaultValue={plan.annualPrice}
                          className="mt-1.5 h-10 bg-background/80"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Included limits
                      </p>
                      <div className="mt-3 grid gap-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Projects</span>
                          <span className="font-medium">{plan.limits.projects}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Storage</span>
                          <span className="font-medium">{plan.limits.storage}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">API calls</span>
                          <span className="font-medium">{plan.limits.apiCalls}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* ── Module toggles ── */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Module toggles</CardTitle>
          <CardDescription>Enable features per plan tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_MODULES.map((mod) => (
              <div key={mod.id} className="rounded-lg border border-border/60 p-4">
                <p className="font-medium">{mod.label}</p>
                <p className="mb-3 text-xs text-muted-foreground">{mod.features.join(" · ")}</p>
                {["basic", "professional", "enterprise"].map((pid) => (
                  <div key={pid} className="flex items-center justify-between py-1">
                    <span className="text-xs capitalize">{pid}</span>
                    <Switch
                      checked={moduleToggles[mod.id]?.[pid]}
                      onCheckedChange={() => toggleModule(mod.id, pid)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Feature comparison matrix ── */}
      <Accordion type="single" collapsible className="rounded-lg border border-border/60 px-4">
        <AccordionItem value="matrix">
          <AccordionTrigger>Feature comparison matrix</AccordionTrigger>
          <AccordionContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  {plans.map((p) => (
                    <TableHead key={p.id}>{p.displayName}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_MODULES.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.label}</TableCell>
                    {plans.map((p) => (
                      <TableCell key={p.id}>
                        {p.modules.includes(m.id) ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ── Create plan dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create subscription plan</DialogTitle>
            <DialogDescription>Add a new plan tier for fit-out companies.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planName">Plan name</Label>
              <Input
                id="planName"
                value={createForm.planName}
                onChange={handleCreateChange("planName")}
                placeholder="e.g. Basic, Professional, Enterprise"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  value={createForm.maxUsers}
                  onChange={handleCreateChange("maxUsers")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMonthly">Monthly price (AUD)</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.priceMonthly}
                  onChange={handleCreateChange("priceMonthly")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceAnnual">Annual price (AUD)</Label>
                <Input
                  id="priceAnnual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.priceAnnual}
                  onChange={handleCreateChange("priceAnnual")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Included modules</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_MODULES.map((mod) => {
                  const selected = createForm.modulesIncluded.includes(mod.id);
                  return (
                    <Badge
                      key={mod.id}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer gap-1 px-3 py-1.5"
                      onClick={() => moduleToggle(mod.id)}
                    >
                      {mod.label}
                      {selected ? <X className="ml-1 h-3 w-3" /> : <Plus className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Sticky footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[1600px] justify-end gap-2">
          <Button variant="outline" onClick={() => setCreateOpen(true)}>Create plan</Button>
          <Button onClick={() => setPublishOpen(true)}>Publish plans</Button>
        </div>
      </div>

      {/* ── Publish dialog ── */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish plan changes</DialogTitle>
            <DialogDescription>
              Updates will propagate to renewal workflows on the next billing cycle. Existing
              tenants retain current pricing until renewal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setPublishOpen(false)}>Publish now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
