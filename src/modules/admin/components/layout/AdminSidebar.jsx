import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sparkles, LayoutDashboard, Users, MapPin,
  List, CalendarDays, Link, CheckCircle, XCircle, ChevronRight,
  UserSquare2, CalendarRange, Briefcase, ClipboardList
} from "lucide-react";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";

// ─── Nav data ────────────────────────────────────────────────────────────────

const ADMIN_NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
      { label: "LEADS_PLACEHOLDER" },
      { label: "Site Visits", href: ROUTES.ADMIN.SITE_VISITS, icon: MapPin },
      { label: "Employees",   href: ROUTES.ADMIN.EMPLOYEES,   icon: UserSquare2 },
      { label: "Calendar",    href: ROUTES.ADMIN.CALENDAR,    icon: CalendarRange },
      { label: "Projects",    href: ROUTES.ADMIN.PROJECTS,    icon: Briefcase },
    ],
  },
];

const LEADS_SUB_ITEMS = [
  { label: "All Leads", href: ROUTES.ADMIN.LEADS_LIST, icon: List },
  { label: "New Leads", href: ROUTES.ADMIN.LEADS_NEW, icon: Users },
  { label: "Qualified Leads", href: ROUTES.ADMIN.LEADS_QUALIFIED, icon: CheckCircle },
  { label: "Follow-ups", href: ROUTES.ADMIN.FOLLOW_UPS, icon: CalendarDays },
  { label: "Lost Leads", href: ROUTES.ADMIN.LOST_LEADS, icon: XCircle },
  { label: "Sources", href: ROUTES.ADMIN.LEAD_SOURCES, icon: Link },
  { label: "Project Requests", href: ROUTES.ADMIN.PROJECT_REQUESTS, icon: ClipboardList },
];

// ─── Components ──────────────────────────────────────────────────────────────

function AdminNavItem({ item }) {
  const location = useLocation();
  const Icon = item.icon;
  const isActive =
    location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
        <NavLink to={item.href}>
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function LeadsSubmenu() {
  const location = useLocation();
  const [open, setOpen] = useState(
    LEADS_SUB_ITEMS.some((item) =>
      location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
    )
  );
  const isAnyActive = LEADS_SUB_ITEMS.some((item) =>
    location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
  );

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => setOpen(!open)} isActive={isAnyActive} tooltip="Leads">
        <Users className="h-4 w-4" />
        <span>Leads</span>
        <ChevronRight
          className={`ml-auto h-3 w-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {LEADS_SUB_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSubActive =
              location.pathname === item.href ||
              location.pathname.startsWith(`${item.href}/`);
            return (
              <SidebarMenuSubItem key={item.href}>
                <SidebarMenuSubButton asChild isActive={isSubActive}>
                  <NavLink to={item.href}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const { user, role } = useAuth();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Admin</span>
                <span className="truncate text-xs text-sidebar-foreground/70">Fitouts</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {ADMIN_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) =>
                  item.label === "LEADS_PLACEHOLDER" ? (
                    <LeadsSubmenu key="leads" />
                  ) : (
                    <AdminNavItem key={item.href} item={item} />
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-2 group-data-[collapsible=icon]:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background shadow-sm">
            <span className="text-xs font-semibold">
              {user?.name?.substring(0, 2).toUpperCase() || "US"}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-xs font-medium">{user?.name || "User"}</span>
            <span className="truncate text-[10px] text-muted-foreground capitalize">{role || "Admin"}</span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
