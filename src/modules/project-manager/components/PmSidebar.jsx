import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  MapPin,
  Mail,
  ClipboardCheck,
  GanttChart,
} from "lucide-react";
import { SidebarBrand } from "@/components/brand/BrandMark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";

const GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: ROUTES.PROJECT_MANAGER.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    label: "Delivery",
    items: [
      { label: "Projects", href: ROUTES.PROJECT_MANAGER.PROJECTS, icon: Briefcase },
      { label: "Schedule", href: ROUTES.PROJECT_MANAGER.SCHEDULE_HUB, icon: GanttChart },
      { label: "Validation Inbox", href: ROUTES.PROJECT_MANAGER.VALIDATION_INBOX, icon: ClipboardCheck },
      { label: "Communications", href: ROUTES.PROJECT_MANAGER.COMMUNICATIONS, icon: Mail },
    ],
  },
  {
    label: "Commercial",
    items: [
      { label: "BOQ Inbox", href: ROUTES.PROJECT_MANAGER.BOQ_INBOX, icon: Inbox },
    ],
  },
  {
    label: "Field",
    items: [
      { label: "Site Visits", href: ROUTES.PROJECT_MANAGER.SITE_VISITS, icon: MapPin },
    ],
  },
];

function isActivePath(pathname, href) {
  if (pathname === href) return true;
  if (href === ROUTES.PROJECT_MANAGER.DASHBOARD) return false;
  if (href === ROUTES.PROJECT_MANAGER.SCHEDULE_HUB) {
    return pathname === href || /\/projects\/[^/]+\/schedule\/?$/.test(pathname);
  }
  return pathname.startsWith(`${href}/`);
}

export default function PmSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <SidebarBrand portal="PM Panel" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(location.pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <NavLink to={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-xl bg-secondary/70 p-2 ring-1 ring-border/50 group-data-[collapsible=icon]:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
            <span className="text-xs font-semibold">
              {user?.name?.substring(0, 2).toUpperCase() || "PM"}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-xs font-medium">{user?.name || "Project Manager"}</span>
            <span className="truncate text-[10px] text-muted-foreground">Project Manager</span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
