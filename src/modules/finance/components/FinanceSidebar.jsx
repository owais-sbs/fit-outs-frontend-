import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, Inbox, Stamp } from "lucide-react";
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
      { label: "Dashboard", href: ROUTES.FINANCE.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    label: "Billing",
    items: [
      { label: "Projects", href: ROUTES.FINANCE.PROJECTS, icon: Briefcase },
      { label: "Billing milestone approval", href: ROUTES.FINANCE.BILLING_MILESTONE_INBOX, icon: Stamp },
    ],
  },
  {
    label: "Commercial",
    items: [
      { label: "BOQ Inbox", href: ROUTES.FINANCE.BOQ_INBOX, icon: Inbox },
    ],
  },
];

function isActivePath(pathname, href) {
  if (pathname === href) return true;
  if (href === ROUTES.FINANCE.DASHBOARD) return false;
  if (href === ROUTES.FINANCE.PROJECTS) {
    return pathname.startsWith(`${href}/`) || pathname === href;
  }
  return pathname.startsWith(`${href}/`);
}

export default function FinanceSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <SidebarBrand portal="Finance Panel" />
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            {(user?.name || "F").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{user?.name || "Finance User"}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user?.email || ""}</p>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
