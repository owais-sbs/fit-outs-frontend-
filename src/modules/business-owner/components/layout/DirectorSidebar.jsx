import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Inbox, Briefcase, FileText, Warehouse,
  Users, BarChart3, ChevronRight, MapPin, UserSquare2,
  CalendarRange, Package, ClipboardList, PenTool, Settings,
  Grid, Wrench, ArrowDownToLine, ArrowUpFromLine, History,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";
import { SidebarBrand } from "@/components/brand/BrandMark";
import { fetchBoqInbox } from "@/modules/admin/api/boq.api";

const COMMAND_CENTER = [
  { label: "Dashboard", href: ROUTES.BUSINESS_OWNER.DASHBOARD, icon: LayoutDashboard },
  { label: "BOQ Inbox", href: ROUTES.BUSINESS_OWNER.BOQ_INBOX, icon: Inbox, badge: true },
];

const PORTFOLIO = [
  { label: "Projects", href: ROUTES.BUSINESS_OWNER.PROJECTS, icon: Briefcase },
  { label: "Commercial (BOQ)", href: ROUTES.BUSINESS_OWNER.COMMERCIAL, icon: FileText },
  { label: "Procurement", href: ROUTES.BUSINESS_OWNER.PROCUREMENT, icon: Warehouse },
];

const INSIGHTS = [
  { label: "CRM & Pipeline", href: ROUTES.BUSINESS_OWNER.CRM, icon: Users },
  { label: "Reports", href: ROUTES.BUSINESS_OWNER.DASHBOARD, icon: BarChart3 },
];

const OPERATIONS = [
  { label: "Projects", href: ROUTES.ADMIN.PROJECTS, icon: Briefcase },
  { label: "QAS / BOQ", href: ROUTES.ADMIN.QAS, icon: ClipboardList },
  { label: "Materials", href: ROUTES.ADMIN.MATERIAL_CONFIG, icon: Package },
  { label: "Stock", href: ROUTES.ADMIN.PROCUREMENT_STOCK, icon: Warehouse },
  { label: "Leads", href: ROUTES.ADMIN.LEADS_LIST, icon: Users },
  { label: "Clients", href: ROUTES.ADMIN.CLIENTS, icon: Users },
  { label: "Employees", href: ROUTES.ADMIN.EMPLOYEES, icon: UserSquare2 },
  { label: "Calendar", href: ROUTES.ADMIN.CALENDAR, icon: CalendarRange },
  { label: "Site Visits", href: ROUTES.ADMIN.SITE_VISITS, icon: MapPin },
];

const PROCUREMENT_OPS = [
  { label: "Stock Dashboard", href: ROUTES.ADMIN.PROCUREMENT_STOCK, icon: Warehouse },
  { label: "Goods Receipt", href: ROUTES.ADMIN.PROCUREMENT_RECEIPT, icon: ArrowDownToLine },
  { label: "Stock Issue", href: ROUTES.ADMIN.PROCUREMENT_ISSUE, icon: ArrowUpFromLine },
  { label: "Movement History", href: ROUTES.ADMIN.PROCUREMENT_MOVEMENTS, icon: History },
];

const PROJECT_CONFIG_OPS = [
  { label: "Room Configuration", href: ROUTES.ADMIN.ROOM_CONFIG, icon: Grid },
  { label: "Work Item Config", href: ROUTES.ADMIN.WORK_ITEM_CONFIG, icon: Wrench },
  { label: "Materials Master", href: ROUTES.ADMIN.MATERIAL_CONFIG, icon: Package },
];

function Submenu({ label, icon: Icon, items }) {
  const location = useLocation();
  const isAnyActive = items.some(
    (i) => location.pathname === i.href || location.pathname.startsWith(`${i.href}/`)
  );
  const [open, setOpen] = useState(isAnyActive);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => setOpen((o) => !o)} isActive={isAnyActive} tooltip={label}>
        <Icon className="h-4 w-4" />
        <span>{label}</span>
        <ChevronRight className={`ml-auto h-3 w-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {items.map((item) => {
            const ItemIcon = item.icon;
            const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
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

function NavItem({ item, pendingCount }) {
  const location = useLocation();
  const Icon = item.icon;
  const isActive =
    location.pathname === item.href ||
    (item.href !== ROUTES.BUSINESS_OWNER.DASHBOARD && location.pathname.startsWith(`${item.href}/`)) ||
    (item.href === ROUTES.BUSINESS_OWNER.DASHBOARD && location.pathname === item.href);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
        <NavLink to={item.href}>
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
          {item.badge && pendingCount > 0 && (
            <Badge className="ml-auto h-5 min-w-5 justify-center px-1 text-[10px]" variant="destructive">
              {pendingCount}
            </Badge>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function DirectorSidebar() {
  const { user, role } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchBoqInbox()
      .then((list) => setPendingCount(Array.isArray(list) ? list.length : 0))
      .catch(() => setPendingCount(0));
  }, []);

  const renderGroup = (label, items) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <NavItem key={item.href} item={item} pendingCount={pendingCount} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <SidebarBrand portal="Command Center" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Command Center", COMMAND_CENTER)}
        {renderGroup("Portfolio", PORTFOLIO)}
        {renderGroup("Insights", INSIGHTS)}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {OPERATIONS.map((item) => (
                <NavItem key={item.href} item={item} pendingCount={0} />
              ))}
              <Submenu label="Procurement" icon={Warehouse} items={PROCUREMENT_OPS} />
              <Submenu label="Project Configuration" icon={Settings} items={PROJECT_CONFIG_OPS} />
              <Submenu label="Design Overview" icon={PenTool} items={[
                { label: "Design Requests", href: "/admin/design-qas/requests", icon: FileText },
                { label: "Design Options", href: "/admin/design-qas/options", icon: Grid },
                { label: "Approvals", href: "/admin/design-qas/approvals", icon: ClipboardList },
              ]} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-2 group-data-[collapsible=icon]:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background shadow-sm">
            <span className="text-xs font-semibold">
              {user?.name?.substring(0, 2).toUpperCase() || "DR"}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-xs font-medium">{user?.name || "Director"}</span>
            <span className="truncate text-[10px] text-muted-foreground capitalize">
              {role?.replace(/-/g, " ") || "Director"}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
