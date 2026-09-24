import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  MapPin,
  Mail,
  ListChecks,
  ScrollText,
  ClipboardList,
  AlertTriangle,
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

const NAV = [
  { label: "Dashboard", href: ROUTES.SITE_ENGINEER.DASHBOARD, icon: LayoutDashboard },
  { label: "Site Visits", href: ROUTES.SITE_ENGINEER.SITE_VISITS, icon: MapPin },
  { label: "Tasks", href: ROUTES.SITE_ENGINEER.TASKS, icon: ClipboardList },
  { label: "Activities", href: ROUTES.SITE_ENGINEER.ACTIVITIES, icon: ListChecks },
  { label: "Snags", href: ROUTES.SITE_ENGINEER.SNAGS, icon: AlertTriangle },
  { label: "My Projects", href: ROUTES.SITE_ENGINEER.PROJECTS, icon: Briefcase },
  { label: "Client Communication", href: ROUTES.SITE_ENGINEER.COMMUNICATIONS, icon: Mail },
  { label: "Terms & Conditions", href: ROUTES.SITE_ENGINEER.TERMS, icon: ScrollText },
];

export default function SiteEngineerSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <SidebarBrand portal="Site Engineer" />
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
                  (item.href !== ROUTES.SITE_ENGINEER.DASHBOARD &&
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
              {user?.name?.substring(0, 2).toUpperCase() || "SE"}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-xs font-medium">{user?.name || "Site Engineer"}</span>
            <span className="truncate text-[10px] text-muted-foreground">Site Engineer</span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
