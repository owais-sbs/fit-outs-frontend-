import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { ROLE_LABELS } from "@/shared/constants/roles";
import NotificationDropdown from "@/modules/client/components/design/NotificationDropdown";
import { SEED_NOTIFICATIONS } from "@/shared/store/designWorkflowStore";

export default function DirectorNavbar() {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS.admin);

  const displayName = user?.name || "Director";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const markRead = (id) => setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const clearAll = () => setNotifications((p) => p.map((n) => ({ ...n, read: true })));

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/40 bg-background/75 px-4 backdrop-blur-xl md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 hidden h-5 md:block" />

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search projects, BOQs, stock..."
          className="h-10 rounded-xl pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="hidden sm:inline-flex border-[var(--color-accent-copper)]/35 bg-accent text-accent-foreground">
          {ROLE_LABELS[role] || "Director"}
        </Badge>

        <NotificationDropdown
          notifications={notifications}
          onMarkRead={markRead}
          onClearAll={clearAll}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email || "director@fitouts.demo"}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(ROUTES.BUSINESS_OWNER.DASHBOARD)}>
              Command Center home
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate(ROUTES.AUTH.LOGIN);
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
