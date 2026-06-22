import { NavLink, useLocation } from "react-router-dom";
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
import { SUPER_ADMIN_NAV_GROUPS } from "../../constants/navigation";

function SidebarNavItem({ item }) {
  const location = useLocation();
  const Icon = item.icon;
  const isActive = item.end
    ? location.pathname === item.href
    : location.pathname === item.href ||
      (item.href !== "/super-admin" && location.pathname.startsWith(item.href));

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
        <NavLink to={item.href} end={item.end}>
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <SidebarBrand portal="Super Admin" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {SUPER_ADMIN_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarNavItem key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <p className="px-2 py-2 text-[10px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          Platform v2.4 · Enterprise
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
