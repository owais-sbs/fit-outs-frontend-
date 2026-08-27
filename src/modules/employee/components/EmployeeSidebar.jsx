import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, CalendarRange, MapPin, Mail, ListChecks } from "lucide-react";
import { SidebarBrand } from "@/components/brand/BrandMark";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";
import { ROLES } from "@/shared/constants/roles";

const NAV = [
  { label: "Dashboard", href: ROUTES.EMPLOYEE.DASHBOARD, icon: LayoutDashboard },
  { label: "My Site Visits", href: ROUTES.EMPLOYEE.SITE_VISITS, icon: MapPin },
  { label: "My Projects", href: ROUTES.EMPLOYEE.PROJECTS, icon: Briefcase },
  { label: "My Activities", href: ROUTES.EMPLOYEE.ACTIVITIES, icon: ListChecks },
  { label: "My Calendar", href: ROUTES.EMPLOYEE.CALENDAR, icon: CalendarRange },
  { label: "Communications", href: ROUTES.EMPLOYEE.COMMUNICATIONS, icon: Mail },
];

export default function EmployeeSidebar() {
  const location = useLocation();
  const { user, role } = useAuth();
  const portalLabel = role === ROLES.SITE_ENGINEER ? "Site Engineer" : "Employee Portal";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <SidebarBrand portal={portalLabel} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            My Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== ROUTES.EMPLOYEE.DASHBOARD &&
                    location.pathname.startsWith(`${item.href}/`));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-xl bg-secondary/70 p-2 ring-1 ring-border/50 group-data-[collapsible=icon]:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
            <span className="text-xs font-semibold">
              {user?.name?.substring(0, 2).toUpperCase() || "EM"}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-xs font-medium">{user?.name || "Employee"}</span>
            <span className="truncate text-[10px] text-muted-foreground">{portalLabel}</span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
