import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TYPE_CONFIG = {
  upload: { icon: Upload, color: "text-primary", bg: "bg-primary/10" },
  approved: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  revision: { icon: RotateCcw, color: "text-amber-600", bg: "bg-amber-500/10" },
  revision_done: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-500/10" },
};

function timeAgo(isoStr) {
  if (!isoStr) return "";
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationDropdown({ notifications, onMarkRead, onClearAll }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  const handleClick = (n) => {
    onMarkRead?.(n.id);
    if (n.linkPath) {
      setOpen(false);
      navigate(n.linkPath);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <p className="text-xs text-muted-foreground">{unread} unread</p>
            )}
          </div>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.upload;
              const Icon = cfg.icon;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`flex w-full items-start gap-3 border-b border-border/30 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/40 ${!n.read ? "bg-primary/3" : ""}`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${!n.read ? "font-medium" : "text-muted-foreground"}`}>
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.time)}</p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
