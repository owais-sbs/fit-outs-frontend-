import { Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/modules/client/components/design/StatusBadge";

function formatDate(d) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

/**
 * Reusable design card used in both client portal and admin overview.
 * @param {object} design
 * @param {string} detailRoute - route with :id replaced
 * @param {function} onAction - optional extra action button handler
 * @param {string} actionLabel - label for extra action button
 */
export default function DesignCard({ design, detailRoute, onAction, actionLabel }) {
  const navigate = useNavigate();

  return (
    <Card className="group overflow-hidden border-border/60 shadow-sm hover:border-primary/30 hover:shadow-lg transition-all duration-300">
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={design.thumbnail}
          alt={design.projectName}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={design.status} />
        </div>

        {/* Design type */}
        <div className="absolute top-3 left-3">
          <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {design.designType}
          </span>
        </div>

        {/* Bottom project name overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-1">{design.projectName}</h3>
          <p className="text-xs text-white/70 mt-0.5">{design.clientName}</p>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {design.tags?.map((tag) => (
            <span key={tag} className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary shrink-0">
              {design.designerAvatar}
            </div>
            <span>{design.designer}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(design.uploadDate)}
          </div>
          <span className="font-mono font-semibold">{design.version}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 gap-1.5 text-xs"
            onClick={() => navigate(detailRoute)}
          >
            <Eye className="h-3.5 w-3.5" />
            View Design
          </Button>
          {onAction && actionLabel && (
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
