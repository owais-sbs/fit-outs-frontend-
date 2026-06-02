import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Palette, Clock, CheckCircle2, RotateCcw, ArrowRight, Calendar } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEED_CLIENT_DESIGNS } from "@/shared/store/designWorkflowStore";
import { ROUTES } from "@/shared/constants/routes";
import StatusBadge from "@/modules/client/components/design/StatusBadge";
import DesignCard from "@/modules/client/components/design/DesignCard";

function formatDate(d) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

const STAT_CARDS = [
  {
    label: "My Designs",
    key: "all",
    icon: Palette,
    color: "text-primary",
    bg: "bg-primary/10",
    href: ROUTES.CLIENT.DESIGNS,
  },
  {
    label: "Pending Approval",
    key: "Pending Approval",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    href: ROUTES.CLIENT.DESIGNS_PENDING,
  },
  {
    label: "Revision Requests",
    key: "Revision Requested",
    icon: RotateCcw,
    color: "text-destructive",
    bg: "bg-destructive/10",
    href: ROUTES.CLIENT.DESIGNS_REVISIONS,
  },
  {
    label: "Approved",
    key: "Approved",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    href: ROUTES.CLIENT.DESIGNS_APPROVED,
  },
];

export default function ClientDashboard() {
  const navigate = useNavigate();
  const designs = SEED_CLIENT_DESIGNS;
  const recent = [...designs].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)).slice(0, 3);

  const count = (key) => key === "all" ? designs.length : designs.filter((d) => d.status === key).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome back"
        description="Track your fit-out design projects — review, approve, and request changes from one place."
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => navigate(s.href)}
              className="text-left"
            >
              <Card className="border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className={`mt-1 text-3xl font-bold ${s.color}`}>{count(s.key)}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                      <Icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Pending approvals highlight */}
      {designs.filter((d) => d.status === "Pending Approval").length > 0 && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                {designs.filter((d) => d.status === "Pending Approval").length} design{designs.filter((d) => d.status === "Pending Approval").length > 1 ? "s" : ""} awaiting your approval
              </p>
              <p className="text-sm text-amber-600/80 dark:text-amber-500/80">
                Review and approve to keep your project on track.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-2 bg-amber-600 hover:bg-amber-700"
            onClick={() => navigate(ROUTES.CLIENT.DESIGNS_PENDING)}
          >
            Review Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Recent designs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Recent Designs</h2>
            <p className="text-sm text-muted-foreground">Latest uploads from your design team</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate(ROUTES.CLIENT.DESIGNS)}>
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recent.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              detailRoute={`/client/designs/${design.id}`}
            />
          ))}
        </div>
      </section>

      {/* Activity timeline */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            {designs.slice(0, 5).map((d, idx) => (
              <div
                key={d.id}
                className={`flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer ${idx < 4 ? "border-b border-border/40" : ""}`}
                onClick={() => navigate(`/client/designs/${d.id}`)}
              >
                <img
                  src={d.thumbnail}
                  alt=""
                  className="h-10 w-14 rounded-md object-cover shrink-0"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.projectName}</p>
                  <p className="text-xs text-muted-foreground">{d.designType} · {d.version}</p>
                </div>
                <StatusBadge status={d.status} />
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Calendar className="h-3 w-3" />
                  {formatDate(d.uploadDate)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
