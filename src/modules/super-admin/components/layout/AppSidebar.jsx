import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import {
  BRAND_NAME,
  PLATFORM_ICON_URL,
} from "@/components/brand/BrandMark";
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
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
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
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
        className="sa-nav-item">
        <NavLink to={item.href} end={item.end}>
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          <span className="truncate text-sm font-medium">{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarPlatformLogo() {
  return (
    <div className="sa-brand-row flex w-full items-center gap-3 px-0.5 group-data-[collapsible=icon]:justify-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.35)]">
        <img
          src={PLATFORM_ICON_URL}
          alt={BRAND_NAME}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate text-[15px] font-semibold tracking-tight text-white">
          {BRAND_NAME}
        </span>
        <span className="truncate text-[11px] font-medium text-white/45">Super Admin</span>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <Sidebar collapsible="icon" className="sa-sidebar">
      <SidebarHeader className="sa-sidebar-header">
        <SidebarPlatformLogo />
      </SidebarHeader>

      <SidebarContent className="sa-sidebar-content gap-1">
        {SUPER_ADMIN_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="sa-nav-group py-1">
            <SidebarGroupLabel className="sa-nav-group-label">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="sa-nav-menu gap-0.5">
                {group.items.map((item) => (
                  <SidebarNavItem key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="sa-sidebar-footer mt-auto border-t border-white/10 p-2 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={handleLogout}
              className="sa-logout-btn text-white/80 hover:bg-white/10 hover:text-white">
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              <span className="truncate text-sm font-medium">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
