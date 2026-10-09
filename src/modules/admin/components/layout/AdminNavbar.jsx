import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import NotificationDropdown from "@/modules/client/components/design/NotificationDropdown";
import useNotifications from "@/shared/hooks/useNotifications";
import ThemeToggle from "@/shared/theme/ThemeToggle";
import DemoPortalSwitcher from "@/components/shared/DemoPortalSwitcher";
import { loadAdminProfile } from "../../lib/local-profile";

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, markRead, clearAll } = useNotifications();
  const [profile, setProfile] = useState(() => loadAdminProfile());

  useEffect(() => {
    const refresh = () => setProfile(loadAdminProfile());
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("fitouts-admin-profile-updated", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("fitouts-admin-profile-updated", refresh);
    };
  }, []);

  const displayName = profile.name || user?.name || "Admin";
  const email = profile.email || user?.email || "admin@onepath.com";

  return (
    <header
      data-boq-chrome
      className="sa-topbar sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 px-4 md:px-6"
    >
      <SidebarTrigger
        className="-ml-1 text-foreground hover:bg-accent hover:text-accent-foreground"
        aria-label="Toggle sidebar"
      />
      <Separator orientation="vertical" className="mr-1 hidden h-5 md:block" />
      <div className="flex-1" />

      <div className="ml-auto flex items-center gap-3 md:gap-4">
        <ThemeToggle />
        <DemoPortalSwitcher />
        <NotificationDropdown
          notifications={notifications}
          onMarkRead={markRead}
          onClearAll={clearAll}
        />

        <DropdownMenu
          onOpenChange={(open) => {
            if (open) setProfile(loadAdminProfile());
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8 border border-border">
                {profile.avatarDataUrl ? (
                  <AvatarImage src={profile.avatarDataUrl} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-4 w-4" strokeWidth={1.75} />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`${ROUTES.ADMIN.SETTINGS}?tab=profile`)}>
              <User className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate(ROUTES.AUTH.LOGIN);
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
