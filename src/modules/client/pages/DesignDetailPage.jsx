import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft, ChevronRight, ZoomIn,
  CheckCircle2, RotateCcw,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEED_CLIENT_DESIGNS } from "@/shared/store/designWorkflowStore";
import { ROUTES } from "@/shared/constants/routes";
import StatusBadge from "@/modules/client/components/design/StatusBadge";
import ApprovalModal from "@/modules/client/components/design/ApprovalModal";
import RevisionModal from "@/modules/client/components/design/RevisionModal";

function formatDate(d) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
}

export default function DesignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [designs, setDesigns] = useState(SEED_CLIENT_DESIGNS);
  const design = designs.find((d) => d.id === id);

  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!design) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-24">
        <p className="font-medium text-muted-foreground">Design not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(ROUTES.CLIENT.DESIGNS)}>
          Back to My Designs
        </Button>
      </div>
    );
  }

  const gallery = design.gallery || [design.thumbnail];

  const handleApprove = () => {
    setDesigns((prev) => prev.map((d) => d.id === id ? { ...d, status: "Approved" } : d));
    setApprovalOpen(false);
    setSuccessMsg("Design approved successfully. Your design team has been notified.");
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleRevision = ({ feedback, priority, refImages }) => {
    setDesigns((prev) => prev.map((d) => d.id === id ? { ...d, status: "Revision Requested" } : d));
    setRevisionOpen(false);
    setSuccessMsg("Revision request submitted. The design team will address your feedback.");
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const currentDesign = designs.find((d) => d.id === id);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button
        onClick={() => navigate(ROUTES.CLIENT.DESIGNS)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Designs
      </button>

      <PageHeader
        title={design.projectName}
        description={`${design.designType} · ${design.clientName}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={currentDesign.status} />
            <span className="font-mono text-sm font-semibold text-primary">{design.version}</span>
          </div>
        }
      />

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/5 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{successMsg}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — image gallery */}
        <div className="lg:col-span-2 space-y-3">
          {/* Main image */}
          <div
            className="group relative overflow-hidden rounded-xl bg-muted cursor-zoom-in"
            style={{ height: "420px" }}
            onClick={() => setLightbox(true)}
          >
            <img
              src={gallery[activeImg]}
              alt={design.projectName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
            </div>
            {/* Image nav arrows */}
            {gallery.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImg((i) => Math.max(0, i - 1)); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImg((i) => Math.min(gallery.length - 1, i + 1)); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            {/* Image counter */}
            {gallery.length > 1 && (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
                {activeImg + 1} / {gallery.length}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(idx)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    activeImg === idx ? "border-primary shadow-sm" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-2">Designer Notes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{design.description}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right — details + actions */}
        <div className="space-y-4">
          {/* Project details card */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold">Project Details</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Project", value: design.projectName },
                  { label: "Client", value: design.clientName },
                  { label: "Design Type", value: design.designType },
                  { label: "Designer", value: design.designer },
                  { label: "Version", value: design.version, mono: true },
                  { label: "Uploaded", value: formatDate(design.uploadDate) },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">{row.label}</span>
                    <span className={`font-medium text-right ${row.mono ? "font-mono text-primary" : ""}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {design.tags.map((tag) => (
                  <span key={tag} className="rounded-lg bg-muted px-3 py-1 text-sm font-medium">{tag}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          {currentDesign.status === "Pending Approval" && (
            <div className="space-y-2">
              <Button
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setApprovalOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve Design
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setRevisionOpen(true)}
              >
                <RotateCcw className="h-4 w-4" />
                Request Changes
              </Button>
            </div>
          )}

          {currentDesign.status === "Approved" && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Design Approved</p>
            </div>
          )}

          {currentDesign.status === "Revision Requested" && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/5 p-4">
                <RotateCcw className="h-5 w-5 text-amber-500" />
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Revision Requested</p>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setRevisionOpen(true)}
              >
                <RotateCcw className="h-4 w-4" />
                Update Request
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={gallery[activeImg]}
              alt=""
              className="max-h-[88vh] max-w-[88vw] rounded-xl object-contain shadow-2xl"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <button
              onClick={() => setLightbox(false)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              ✕
            </button>
            {gallery.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg((i) => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setActiveImg((i) => Math.min(gallery.length - 1, i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <ApprovalModal
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        onConfirm={handleApprove}
        design={design}
      />
      <RevisionModal
        open={revisionOpen}
        onClose={() => setRevisionOpen(false)}
        onSubmit={handleRevision}
        design={design}
      />
    </div>
  );
}
