import { useState } from "react";
import { Download, Eye, Archive, Calendar, Search } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { COMPLETED_DESIGNS } from "../../data/design-workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";

function formatDate(d) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

function DesignCard({ design, onView }) {
  return (
    <Card className="group overflow-hidden border-border/60 shadow-sm hover:border-primary/30 hover:shadow-xl transition-all duration-300">
      {/* Interior design thumbnail */}
      <div className="relative h-56 overflow-hidden bg-muted">
        <img
          src={design.thumbnail}
          alt={design.projectName}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { e.target.style.display = "none"; }}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/45 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 gap-1.5 shadow-lg"
            onClick={() => onView(design)}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            size="sm"
            className="opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75 gap-1.5 shadow-lg"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>

        {/* Approved badge */}
        <div className="absolute top-3 right-3">
          <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
            ✓ Approved
          </span>
        </div>

        {/* Design type pill */}
        <div className="absolute top-3 left-3">
          <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {design.designType}
          </span>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-semibold leading-snug">{design.projectName}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{design.clientName}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {design.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary shrink-0">
              {design.designerAvatar}
            </div>
            <span>{design.designer}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(design.approvalDate)}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/40 pt-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary">{design.finalVersion}</span>
            <span className="text-xs text-muted-foreground">· {design.filesSize}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(design)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <Archive className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CompletedDesignsPage() {
  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState(null);

  const filtered = search.trim()
    ? COMPLETED_DESIGNS.filter((d) =>
        d.projectName.toLowerCase().includes(search.toLowerCase()) ||
        d.clientName.toLowerCase().includes(search.toLowerCase()) ||
        d.designType.toLowerCase().includes(search.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : COMPLETED_DESIGNS;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Completed Designs"
        description="Portfolio of all client-approved interior design and fit-out projects."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Completed", value: COMPLETED_DESIGNS.length },
          { label: "This Month", value: COMPLETED_DESIGNS.filter(d => new Date(d.approvalDate) > new Date("2026-05-01")).length },
          { label: "Designers", value: [...new Set(COMPLETED_DESIGNS.map(d => d.designer))].length },
          { label: "Design Types", value: [...new Set(COMPLETED_DESIGNS.map(d => d.designType))].length },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects, clients, design type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Portfolio grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-24">
          <p className="font-medium text-muted-foreground">No completed designs found</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((design) => (
            <DesignCard key={design.id} design={design} onView={setViewItem} />
          ))}
        </div>
      )}

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          {viewItem && (
            <>
              <div className="relative h-72 bg-muted">
                <img
                  src={viewItem.thumbnail}
                  alt={viewItem.projectName}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-6 right-6">
                  <p className="text-xs font-medium text-white/70 mb-1">{viewItem.designType}</p>
                  <h2 className="text-xl font-bold text-white leading-tight">{viewItem.projectName}</h2>
                  <p className="text-white/80 text-sm">{viewItem.clientName}</p>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow">
                    Client Approved
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Lead Designer</p>
                    <p className="font-medium">{viewItem.designer}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Final Version</p>
                    <p className="font-mono font-bold text-primary">{viewItem.finalVersion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Approval Date</p>
                    <p className="font-medium">{formatDate(viewItem.approvalDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Package Size</p>
                    <p className="font-medium">{viewItem.filesSize}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {viewItem.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    Download Full Package
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Archive className="h-4 w-4" />
                    Archive
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
