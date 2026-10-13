import { NavLink, useLocation } from "react-router-dom";
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
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { SC_NAV_GROUPS, filterScNavGroups } from "../utils/subcontractor.utils";
import { useSubcontractorPortal } from "../context/SubcontractorPortalContext";
import { roleLabel } from "../utils/scPortalRoles";

function isNavActive(pathname, href) {
  if (href === ROUTES.SUBCONTRACTOR.DASHBOARD) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ScBrand({ portalLabel }) {
  return (
    <div className="sa-brand-row flex w-full items-center gap-3 px-0.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <div className="sa-brand-mark flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.35)] group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
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
        <span className="truncate text-[11px] font-medium text-white/45">{portalLabel}</span>
      </div>
    </div>
  );
}

export default function SubcontractorSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const portal = useSubcontractorPortal();
  const navGroups = filterScNavGroups(SC_NAV_GROUPS, portal);
  const portalLabel = roleLabel(portal.portalRole) || "Subcontractor Portal";

  return (
    <Sidebar collapsible="icon" className="sa-sidebar">
      <SidebarHeader className="sa-sidebar-header">
        <ScBrand portalLabel={portalLabel} />
      </SidebarHeader>

      <SidebarContent className="sa-sidebar-content gap-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="sa-nav-group py-1">
            <SidebarGroupLabel className="sa-nav-group-label">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="sa-nav-menu gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(location.pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className="sa-nav-item"
                      >
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
        ))}
      </SidebarContent>

      <SidebarFooter className="sa-sidebar-footer mt-auto border-t border-white/10 p-2 group-data-[collapsible=icon]:p-2">
        <div className="admin-user-chip group-data-[collapsible=icon]:hidden">
          <div className="admin-user-chip-avatar">
            {(user?.fullName || user?.name || "SC").substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {user?.fullName || user?.name || "Subcontractor"}
            </p>
            <p className="truncate text-[10px] font-medium text-white/45">
              {portalLabel}
            </p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
