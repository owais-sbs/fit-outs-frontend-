import { useEffect, useState } from "react";
import { Check, Loader2, Pencil, Plus, Sparkles, ShieldCheck, Trash2, Users2, Database, X } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { PLAN_TYPES, ALL_MODULES } from "../data/plans";
import { formatAed } from "@/shared/utils/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
    ring: "border-[#0B1F3A]/15 hover:border-[#C9A96E]/35",
    band: "from-[#0B1F3A] via-[#0B1F3A]/50 to-transparent",
    icon: Database,
    badge: "Starter",
  },
  professional: {
    ring: "border-[#C9A96E]/30 hover:border-[#C9A96E]/55",
    band: "from-[#C9A96E] via-[#B89051]/55 to-transparent",
    icon: Users2,
    badge: "Most chosen",
  },
  enterprise: {
    ring: "border-[#0B1F3A]/25 hover:border-[#C9A96E]/40",
    band: "from-[#0B1F3A] via-[#C9A96E]/60 to-transparent",
    icon: ShieldCheck,
    badge: "Scale",
  },
};

const ACCENT_KEYS = ["basic", "professional", "enterprise"];

const defaultCreateForm = {
  planName: "",
  maxUsers: 10,
  modulesIncluded: [],
  featuresText: "",
  priceMonthly: 0,
  priceAnnual: 0,
  active: true,
};

export default function PlansPage() {
  const [plans, setPlans] = useState(PLAN_TYPES);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(defaultCreateForm);
  const [editUuid, setEditUuid] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
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
          features: Array.isArray(item.features) ? item.features : [],
          limits: { projects: "N/A", storage: "N/A", apiCalls: "N/A" },
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

  const handleEditChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const openEdit = (plan) => {
    setEditUuid(plan.id);
    setEditForm({
      planName: plan.displayName || plan.name || "",
      maxUsers: plan.seats ?? 10,
      modulesIncluded: Array.isArray(plan.modules) ? [...plan.modules] : [],
      featuresText: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      priceMonthly: plan.price ?? 0,
      priceAnnual: plan.annualPrice ?? 0,
      active: plan.published !== false,
    });
    setEditOpen(true);
  };

  const editModuleToggle = (moduleId) => {
    setEditForm((prev) => {
      const has = prev.modulesIncluded.includes(moduleId);
      return {
        ...prev,
        modulesIncluded: has
          ? prev.modulesIncluded.filter((m) => m !== moduleId)
          : [...prev.modulesIncluded, moduleId],
      };
    });
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editUuid || !editForm.planName.trim()) return;
    setEditing(true);
    try {
      const features = editForm.featuresText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      await axiosInstance.put(`/subscription-plans/${editUuid}`, {
        planName: editForm.planName.trim(),
        maxUsers: Number(editForm.maxUsers),
        modulesIncluded: editForm.modulesIncluded,
        features,
        priceMonthly: Number(editForm.priceMonthly),
        priceAnnual: Number(editForm.priceAnnual),
        active: editForm.active,
      });
      setEditOpen(false);
      setEditUuid(null);
      fetchPlans();
    } catch (err) {
      console.error("Failed to update plan:", err);
    } finally {
      setEditing(false);
    }
  };

  const handleDeactivate = async (plan) => {
    if (!plan?.id) return;
    if (!window.confirm(`Deactivate plan "${plan.displayName || plan.name}"?`)) return;
    setDeletingId(plan.id);
    try {
      await axiosInstance.delete(`/subscription-plans/${plan.id}`);
      fetchPlans();
    } catch (err) {
      console.error("Failed to deactivate plan:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!createForm.planName.trim()) return;
    setCreating(true);
    try {
      const features = createForm.featuresText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      await axiosInstance.post("/subscription-plans", {
        planName: createForm.planName.trim(),
        maxUsers: Number(createForm.maxUsers),
        modulesIncluded: createForm.modulesIncluded,
        features,
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
    <PageShell>
      <PageHeader
        title="Subscription plans"
        description="Configure pricing, modules, and renewal settings for fit-out tenant tiers."
        actions={
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />Create plan
          </Button>
        }
      />

      {/* ── Plan cards ── */}
      <div className="grid gap-5 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border border-border/60">
                <CardHeader className="space-y-4 pb-4">
                  <Skeleton className="h-11 w-11 rounded-lg" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full rounded-lg" />
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
                    "group relative overflow-hidden border bg-card shadow-sm transition-all duration-200 hover:shadow-md",
                    accent.ring
                  )}
                >
                  <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", accent.band)} />

                  <CardHeader className="relative space-y-4 pb-3 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A]/[0.06] text-[#0B1F3A] ring-1 ring-[#0B1F3A]/10">
                          <AccentIcon className="h-[18px] w-[18px]" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-base font-semibold tracking-tight">
                              {plan.displayName}
                            </CardTitle>
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

                    <div className="grid gap-3 rounded-lg border border-border/50 bg-muted/25 p-3.5">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Monthly</p>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-2xl font-semibold tracking-tight tabular-nums">
                              {formatAed(plan.price)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Annual</p>
                          <p className="mt-1 text-sm font-medium text-foreground tabular-nums">
                            {formatAed(plan.annualPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="gap-1 font-normal">
                          <Users2 className="h-3 w-3" />
                          {plan.seats} seats
                        </Badge>
                        <Badge variant="outline" className="gap-1 font-normal">
                          <Sparkles className="h-3 w-3" />
                          {plan.modules.length} modules
                        </Badge>
                        {plan.published && <Badge variant="success">Published</Badge>}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative space-y-4">
                    <div className="rounded-lg border border-border/40 bg-background/60 p-3.5">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Marketing features
                      </p>
                      <ul className="mt-2.5 space-y-2 text-sm">
                        {(plan.features || []).length === 0 ? (
                          <li className="text-muted-foreground">No feature bullets yet</li>
                        ) : (
                          plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9A96E]" />
                              <span>{feature}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => openEdit(plan)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                        disabled={deletingId === plan.id || !plan.published}
                        onClick={() => handleDeactivate(plan)}
                      >
                        {deletingId === plan.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Deactivate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* ── Module toggles ── */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">
            Module toggles
          </CardTitle>
          <CardDescription>Enable features per plan tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_MODULES.map((mod) => (
              <div
                key={mod.id}
                className="rounded-lg border border-border/50 bg-muted/15 p-3.5 transition-colors hover:bg-muted/25"
              >
                <p className="text-sm font-semibold text-foreground">{mod.label}</p>
                <p className="mb-3 mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {mod.features.join(" · ")}
                </p>
                <div className="space-y-1.5 border-t border-border/40 pt-2.5">
                  {["basic", "professional", "enterprise"].map((pid) => (
                    <div key={pid} className="flex items-center justify-between gap-3 py-1">
                      <span className="text-xs font-medium capitalize text-muted-foreground">
                        {pid}
                      </span>
                      <Switch
                        checked={moduleToggles[mod.id]?.[pid]}
                        onCheckedChange={() => toggleModule(mod.id, pid)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Feature comparison matrix (always open) ── */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">
            Feature comparison matrix
          </CardTitle>
          <CardDescription>Module availability across subscription tiers</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
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
                        <Check className="h-4 w-4 text-[#C9A96E]" />
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Create plan dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border border-border/60 sm:rounded-lg">
          <DialogHeader className="space-y-1.5 border-b border-border/50 pb-4 text-left">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Create subscription plan
            </DialogTitle>
            <DialogDescription>Add a new plan tier for fit-out companies.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-5 pt-1">
            <div className="space-y-2">
              <Label htmlFor="planName">Plan name</Label>
              <Input
                id="planName"
                value={createForm.planName}
                onChange={handleCreateChange("planName")}
                placeholder="e.g. Basic, Professional, Enterprise"
                required
                className="h-10"
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
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMonthly">Monthly price (AED)</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.priceMonthly}
                  onChange={handleCreateChange("priceMonthly")}
                  className="h-10"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="priceAnnual">Annual price (AED)</Label>
                <Input
                  id="priceAnnual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.priceAnnual}
                  onChange={handleCreateChange("priceAnnual")}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Included modules</Label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-border/50 bg-muted/15 p-3">
                {ALL_MODULES.map((mod) => {
                  const selected = createForm.modulesIncluded.includes(mod.id);
                  return (
                    <Badge
                      key={mod.id}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer gap-1 px-3 py-1.5 font-normal"
                      onClick={() => moduleToggle(mod.id)}
                    >
                      {mod.label}
                      {selected ? <X className="ml-1 h-3 w-3" /> : <Plus className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="featuresText">Feature bullets (one per line)</Label>
              <textarea
                id="featuresText"
                className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                value={createForm.featuresText}
                onChange={handleCreateChange("featuresText")}
                placeholder={"Unlimited projects\nPriority support\nCustom branding"}
              />
            </div>
            <DialogFooter className="gap-2 border-t border-border/50 pt-4 sm:gap-2">
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

      {/* ── Edit plan dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit subscription plan</DialogTitle>
            <DialogDescription>Update pricing, modules, and marketing features.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editPlanName">Plan name</Label>
              <Input
                id="editPlanName"
                value={editForm.planName}
                onChange={handleEditChange("planName")}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editMaxUsers">Max users</Label>
                <Input
                  id="editMaxUsers"
                  type="number"
                  min="1"
                  value={editForm.maxUsers}
                  onChange={handleEditChange("maxUsers")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPriceMonthly">Monthly price (AED)</Label>
                <Input
                  id="editPriceMonthly"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.priceMonthly}
                  onChange={handleEditChange("priceMonthly")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPriceAnnual">Annual price (AED)</Label>
                <Input
                  id="editPriceAnnual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.priceAnnual}
                  onChange={handleEditChange("priceAnnual")}
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch
                  checked={editForm.active}
                  onCheckedChange={(checked) =>
                    setEditForm((prev) => ({ ...prev, active: checked }))
                  }
                />
                <Label>Active</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Included modules</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_MODULES.map((mod) => {
                  const selected = editForm.modulesIncluded.includes(mod.id);
                  return (
                    <Badge
                      key={mod.id}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer gap-1 px-3 py-1.5"
                      onClick={() => editModuleToggle(mod.id)}
                    >
                      {mod.label}
                      {selected ? <X className="ml-1 h-3 w-3" /> : <Plus className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFeaturesText">Feature bullets (one per line)</Label>
              <textarea
                id="editFeaturesText"
                className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editForm.featuresText}
                onChange={handleEditChange("featuresText")}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editing}>
                {editing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
