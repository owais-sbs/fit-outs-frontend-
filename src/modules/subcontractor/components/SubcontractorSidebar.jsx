import { NavLink, useLocation } from "react-router-dom";
import { SidebarBrand } from "@/components/brand/BrandMark";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { SC_NAV_GROUPS } from "../utils/subcontractor.utils";

function isNavActive(pathname, href) {
  if (href === ROUTES.SUBCONTRACTOR.DASHBOARD) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SubcontractorSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <SidebarBrand portal="Subcontractor Portal" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {SC_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(location.pathname, item.href);
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
              {(user?.fullName || user?.name || "SC").substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-xs font-medium">
              {user?.fullName || user?.name || "Subcontractor"}
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              {user?.companyName || user?.email || "Subcontractor Portal"}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
