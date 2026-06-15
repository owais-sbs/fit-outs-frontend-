import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sparkles, LayoutDashboard, Users, MapPin,
  List, XCircle, ChevronRight,
  UserSquare2, CalendarRange, Briefcase,
  UserCheck, Mail, Grid, Wrench, Settings, PenTool, ClipboardList,
  PlusCircle, CheckCircle, Clock, PieChart, CheckSquare, FileText, Calculator, BarChart3
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

// ─── Nav groups ───────────────────────────────────────────────────────────────
const ADMIN_NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
      { label: "LEADS_PLACEHOLDER" },
      { label: "CLIENTS_PLACEHOLDER" },
      { label: "SITE_VISITS_PLACEHOLDER" },
      { label: "DESIGN_OVERVIEW_PLACEHOLDER" },
      { label: "Employees", href: ROUTES.ADMIN.EMPLOYEES, icon: UserSquare2 },
      { label: "Calendar", href: ROUTES.ADMIN.CALENDAR, icon: CalendarRange },
      { label: "Projects", href: ROUTES.ADMIN.PROJECTS, icon: Briefcase },
      { label: "PROJECT_CONFIG_PLACEHOLDER" },
      { label: "BOQ & Survey", href: "/admin/boq", icon: ClipboardList },
    ],
  },
];

const DESIGN_OVERVIEW_SUB_ITEMS = [
  { label: "Design Requests", href: "/admin/design-qas/requests", icon: FileText },
  { label: "Design Options", href: "/admin/design-qas/options", icon: Grid },
  { label: "Approvals", href: "/admin/design-qas/approvals", icon: CheckCircle },
];

const SITE_VISITS_SUB_ITEMS = [
  { label: "Schedule Visit", href: ROUTES.ADMIN.SITE_VISIT_SCHEDULE, icon: CalendarRange },
  { label: "Upcoming Visits", href: "/admin/site-visits/upcoming", icon: Clock },
  { label: "Completed Visits", href: "/admin/site-visits/completed", icon: CheckCircle },
  { label: "Visit Reports", href: "/admin/site-visits/reports", icon: FileText },
  { label: "Checklists", href: "/admin/site-visits/checklists", icon: CheckSquare },
];

const LEADS_SUB_ITEMS = [
  { label: "All Leads", href: ROUTES.ADMIN.LEADS_LIST, icon: List },
  { label: "New Leads", href: "/admin/leads/recent", icon: Sparkles },
  { label: "Qualified Leads", href: ROUTES.ADMIN.LEADS_QUALIFIED, icon: CheckCircle },
  { label: "Follow-ups", href: ROUTES.ADMIN.FOLLOW_UPS, icon: Clock },
  { label: "Lost Leads", href: ROUTES.ADMIN.LOST_LEADS, icon: XCircle },
  { label: "Sources", href: ROUTES.ADMIN.LEAD_SOURCES, icon: PieChart },
];

const CLIENTS_SUB_ITEMS = [
  { label: "All Clients", href: ROUTES.ADMIN.CLIENTS, icon: UserCheck },
  { label: "Email", href: ROUTES.ADMIN.CLIENT_EMAIL, icon: Mail },
];

const PROJECT_CONFIG_SUB_ITEMS = [
  { label: "Room Configuration", href: ROUTES.ADMIN.ROOM_CONFIG, icon: Grid },
  { label: "Work Item Config", href: ROUTES.ADMIN.WORK_ITEM_CONFIG, icon: Wrench },
];

// ─── Reusable collapsible submenu ─────────────────────────────────────────────
function Submenu({ label, icon: Icon, items }) {
  const location = useLocation();
  const isAnyActive = items.some(
    (i) => location.pathname === i.href || location.pathname.startsWith(`${i.href}/`)
  );
  const [open, setOpen] = useState(isAnyActive);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setOpen((o) => !o)}
        isActive={isAnyActive}
        tooltip={label}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
        <ChevronRight
          className={`ml-auto h-3 w-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {items.map((item) => {
            const ItemIcon = item.icon;
            const active =
              location.pathname === item.href ||
              location.pathname.startsWith(`${item.href}/`);
            return (
              <SidebarMenuSubItem key={item.href}>
                <SidebarMenuSubButton asChild isActive={active}>
                  <NavLink to={item.href}>
                    <ItemIcon className="h-4 w-4" />
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

// ─── Simple nav item ──────────────────────────────────────────────────────────
function AdminNavItem({ item }) {
  const location = useLocation();
  const Icon = item.icon;
  const isActive =
    location.pathname === item.href ||
    location.pathname.startsWith(`${item.href}/`);
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────
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
                {group.items.map((item) => {
                  if (item.label === "LEADS_PLACEHOLDER")
                    return <Submenu key="leads" label="Leads" icon={Users} items={LEADS_SUB_ITEMS} />;
                  if (item.label === "SITE_VISITS_PLACEHOLDER")
                    return <Submenu key="site-visits" label="Site Visits" icon={MapPin} items={SITE_VISITS_SUB_ITEMS} />;
                  if (item.label === "DESIGN_OVERVIEW_PLACEHOLDER")
                    return <Submenu key="design-overview" label="Design Overview" icon={PenTool} items={DESIGN_OVERVIEW_SUB_ITEMS} />;
                  if (item.label === "CLIENTS_PLACEHOLDER")
                    return <Submenu key="clients" label="Clients" icon={UserCheck} items={CLIENTS_SUB_ITEMS} />;
                  if (item.label === "PROJECT_CONFIG_PLACEHOLDER")
                    return <Submenu key="project-config" label="Project Configuration" icon={Settings} items={PROJECT_CONFIG_SUB_ITEMS} />;
                  return <AdminNavItem key={item.href} item={item} />;
                })}
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
            <span className="truncate text-[10px] text-muted-foreground capitalize">
              {role || "Admin"}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
