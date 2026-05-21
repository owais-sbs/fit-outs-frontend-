import { useState } from "react";
import { Check, Save, Upload, Sparkles, ShieldCheck, Users2, Database } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { PLAN_TYPES, ALL_MODULES } from "../data/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function PlansPage() {
  const [plans] = useState(PLAN_TYPES);
  const [publishOpen, setPublishOpen] = useState(false);
  const [moduleToggles, setModuleToggles] = useState(() => {
    const map = {};
    ALL_MODULES.forEach((m) => {
      map[m.id] = { basic: true, professional: m.id !== "billing", enterprise: true };
    });
    return map;
  });

  const toggleModule = (moduleId, planId) => {
    setModuleToggles((prev) => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [planId]: !prev[moduleId][planId] },
    }));
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Subscription plans"
        description="Configure pricing, modules, and renewal settings for fit-out tenant tiers."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2"><Save className="h-4 w-4" />Save draft</Button>
            <Button size="sm" className="gap-2" onClick={() => setPublishOpen(true)}><Upload className="h-4 w-4" />Publish</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const accent = PLAN_ACCENTS[plan.id];
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
                        <Badge variant={plan.published ? "success" : "secondary"} className="h-5 px-2 text-[10px] uppercase tracking-wide">
                          {plan.published ? "Live" : "Draft"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {PLAN_ACCENTS[plan.id].badge} subscription tier
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
                      <p className="mt-1 text-sm font-medium text-foreground">${plan.annualPrice.toLocaleString()}</p>
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
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Monthly (AUD)</Label>
                    <Input type="number" defaultValue={plan.price} className="mt-1.5 h-10 bg-background/80" />
                  </div>
                  <div>
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Annual (AUD)</Label>
                    <Input type="number" defaultValue={plan.annualPrice} className="mt-1.5 h-10 bg-background/80" />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Included limits</p>
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

      <Accordion type="single" collapsible className="rounded-lg border border-border/60 px-4">
        <AccordionItem value="matrix">
          <AccordionTrigger>Feature comparison matrix</AccordionTrigger>
          <AccordionContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  {plans.map((p) => <TableHead key={p.id}>{p.displayName}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_MODULES.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.label}</TableCell>
                    {plans.map((p) => (
                      <TableCell key={p.id}>
                        {p.modules.includes(m.id) ? <Check className="h-4 w-4 text-primary" /> : "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[1600px] justify-end gap-2">
          <Button variant="outline">Save draft</Button>
          <Button onClick={() => setPublishOpen(true)}>Publish plans</Button>
        </div>
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish plan changes</DialogTitle>
            <DialogDescription>
              Updates will propagate to renewal workflows on the next billing cycle. Existing tenants retain current pricing until renewal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button onClick={() => setPublishOpen(false)}>Publish now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
