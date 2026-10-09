import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  MapPin,
  Mail,
  ScrollText,
  ClipboardList,
  AlertTriangle,
  GanttChart,
} from "lucide-react";
import { BRAND_NAME, PLATFORM_ICON_URL } from "@/components/brand/BrandMark";
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
  { label: "Programme", href: ROUTES.SITE_ENGINEER.ACTIVITIES, icon: GanttChart },
  { label: "Snags", href: ROUTES.SITE_ENGINEER.SNAGS, icon: AlertTriangle },
  { label: "My Projects", href: ROUTES.SITE_ENGINEER.PROJECTS, icon: Briefcase },
  { label: "Client Communication", href: ROUTES.SITE_ENGINEER.COMMUNICATIONS, icon: Mail },
  { label: "Terms & Conditions", href: ROUTES.SITE_ENGINEER.TERMS, icon: ScrollText },
];

function SeBrand() {
  return (
    <div className="sa-brand-row flex w-full items-center gap-3 px-0.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <div className="sa-brand-mark flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.35)] group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
        <img src={PLATFORM_ICON_URL} alt={BRAND_NAME} className="h-full w-full object-contain" />
      </div>
      <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate text-[15px] font-semibold tracking-tight text-white">
          {BRAND_NAME}
        </span>
        <span className="truncate text-[11px] font-medium text-white/45">Site Engineer</span>
      </div>
    </div>
  );
}

export default function SiteEngineerSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="sa-sidebar">
      <SidebarHeader className="sa-sidebar-header">
        <SeBrand />
      </SidebarHeader>

      <SidebarContent className="sa-sidebar-content gap-1">
        <SidebarGroup className="sa-nav-group py-1">
          <SidebarGroupLabel className="sa-nav-group-label">My Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="sa-nav-menu gap-0.5">
              {NAV.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== ROUTES.SITE_ENGINEER.DASHBOARD &&
                    location.pathname.startsWith(`${item.href}/`));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label} className="sa-nav-item">
                      <NavLink to={item.href}>
                        <Icon className="sa-nav-icon h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                        <span className="truncate text-sm font-medium">{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="sa-sidebar-footer mt-auto border-t border-white/10 p-2 group-data-[collapsible=icon]:p-2">
        <div className="admin-user-chip group-data-[collapsible=icon]:hidden">
          <div className="admin-user-chip-avatar">
            {user?.name?.substring(0, 2).toUpperCase() || "SE"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{user?.name || "Site Engineer"}</p>
            <p className="truncate text-[10px] font-medium text-white/45">Site Engineer</p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
