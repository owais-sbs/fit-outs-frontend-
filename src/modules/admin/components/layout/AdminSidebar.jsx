import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, MapPin, ChevronRight,
  UserSquare2, CalendarRange, Briefcase,
  UserCheck, Mail, Grid, Wrench, Settings, PenTool,
  CheckCircle, PieChart, CheckSquare, FileText, ClipboardList,
  Package, Warehouse, ArrowDownToLine, ArrowUpFromLine, History, ImagePlus, Inbox,
  GanttChart, Stamp,
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
import { ROLES } from "@/shared/constants/roles";
import { useAuth } from "@/shared/context/auth-context";
import { SidebarBrand } from "@/components/brand/BrandMark";

const FULL_ACCESS = new Set([ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES]);
const QS_ROLES = new Set([ROLES.QS, ROLES.SENIOR_QS]);

function canSee(role, allowed) {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(role);
}


const DESIGN_OVERVIEW_SUB_ITEMS = [
  { label: "Design Requests", href: "/admin/design-qas/requests", icon: FileText },
  { label: "Design Options", href: "/admin/design-qas/options", icon: Grid },
  { label: "Approvals", href: "/admin/design-qas/approvals", icon: CheckCircle },
];

const PROJECT_CONFIG_SUB_ITEMS = [
  { label: "Room Configuration", href: ROUTES.ADMIN.ROOM_CONFIG, icon: Grid },
  { label: "Work Item Config", href: ROUTES.ADMIN.WORK_ITEM_CONFIG, icon: Wrench },
  { label: "Materials Master", href: ROUTES.ADMIN.MATERIAL_CONFIG, icon: Package },
  { label: "Appendices", href: ROUTES.ADMIN.APPENDIX_CONFIG, icon: ImagePlus },
  { label: "Cover letter", href: ROUTES.ADMIN.COVER_LETTER_CONFIG, icon: Stamp },
];

const PROCUREMENT_SUB_ITEMS = [
  { label: "Stock Dashboard", href: ROUTES.ADMIN.PROCUREMENT_STOCK, icon: Warehouse },
  { label: "Goods Receipt", href: ROUTES.ADMIN.PROCUREMENT_RECEIPT, icon: ArrowDownToLine },
  { label: "Stock Issue", href: ROUTES.ADMIN.PROCUREMENT_ISSUE, icon: ArrowUpFromLine },
  { label: "Movement History", href: ROUTES.ADMIN.PROCUREMENT_MOVEMENTS, icon: History },
];

/** Nav groups — lifecycle IA */
const NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    roles: [...FULL_ACCESS, ...QS_ROLES],
    items: [
      { type: "link", label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    roles: [...FULL_ACCESS],
    items: [
      { type: "link", label: "Leads", href: ROUTES.ADMIN.LEADS_LIST, icon: Users },
      { type: "link", label: "Sources", href: ROUTES.ADMIN.LEAD_SOURCES, icon: PieChart },
      { type: "link", label: "Clients", href: ROUTES.ADMIN.CLIENTS, icon: UserCheck },
    ],
  },
  {
    id: "site",
    label: "Site",
    roles: [...FULL_ACCESS, ...QS_ROLES],
    items: [
      { type: "link", label: "Site Visits", href: ROUTES.ADMIN.SITE_VISITS, icon: MapPin, roles: [...FULL_ACCESS, ...QS_ROLES] },
      { type: "link", label: "Calendar", href: ROUTES.ADMIN.CALENDAR, icon: CalendarRange },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    roles: [...FULL_ACCESS, ...QS_ROLES],
    items: [
      { type: "link", label: "Projects", href: ROUTES.ADMIN.PROJECTS, icon: Briefcase },
      { type: "link", label: "Schedule", href: ROUTES.ADMIN.SCHEDULE_HUB, icon: GanttChart },
      {
        type: "link",
        label: "Validation Inbox",
        href: ROUTES.ADMIN.VALIDATION_INBOX,
        icon: CheckSquare,
      },
      { type: "link", label: "Communications", href: ROUTES.ADMIN.COMMUNICATIONS, icon: Mail },
    ],
  },
  {
    id: "estimate",
    label: "Estimate",
    roles: [...FULL_ACCESS, ...QS_ROLES],
    items: [
      { type: "submenu", label: "Design Overview", icon: PenTool, children: DESIGN_OVERVIEW_SUB_ITEMS, roles: [...FULL_ACCESS] },
      { type: "link", label: "QAS", href: ROUTES.ADMIN.QAS, icon: ClipboardList },
      {
        type: "link",
        label: "BOQ Inbox",
        href: ROUTES.ADMIN.BOQ_INBOX,
        icon: Inbox,
        roles: [ROLES.SENIOR_QS, ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
    ],
  },
  {
    id: "supply",
    label: "Supply",
    roles: [...FULL_ACCESS],
    items: [
      { type: "submenu", label: "Procurement", icon: Warehouse, children: PROCUREMENT_SUB_ITEMS },
      { type: "submenu", label: "Project Configuration", icon: Settings, children: PROJECT_CONFIG_SUB_ITEMS },
    ],
  },
  {
    id: "team",
    label: "Team",
    roles: [...FULL_ACCESS],
    items: [
      { type: "link", label: "Employees", href: ROUTES.ADMIN.EMPLOYEES, icon: UserSquare2 },
      { type: "link", label: "Settings", href: ROUTES.ADMIN.SETTINGS, icon: Settings },
    ],
  },
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
        <ChevronRight
          className={`ml-auto h-3 w-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {items.map((item) => {
            const ItemIcon = item.icon;
            const active =
              location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
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

function isSchedulePath(pathname, hubHref) {
  if (pathname === hubHref) return true;
  // Project schedule workspace: /…/projects/:id/schedule
  return /\/projects\/[^/]+\/schedule\/?$/.test(pathname);
}

function NavLinkItem({ label, href, icon: Icon }) {
  const location = useLocation();
  const isActive =
    href === ROUTES.ADMIN.SCHEDULE_HUB
      ? isSchedulePath(location.pathname, href)
      : location.pathname === href ||
        (href !== ROUTES.ADMIN.DASHBOARD && location.pathname.startsWith(`${href}/`));
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <NavLink to={href}>
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function AdminSidebar() {
  const { user, role } = useAuth();

  const groups = useMemo(
    () =>
      NAV_GROUPS.filter((g) => canSee(role, g.roles)).map((g) => ({
        ...g,
        items: g.items.filter((item) => canSee(role, item.roles)),
      })).filter((g) => g.items.length > 0),
    [role]
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <SidebarBrand portal={QS_ROLES.has(role) ? "QS Panel" : "Admin Panel"} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  if (item.type === "submenu") {
                    return (
                      <Submenu
                        key={item.label}
                        label={item.label}
                        icon={item.icon}
                        items={item.children}
                      />
                    );
                  }
                  return (
                    <NavLinkItem
                      key={item.href}
                      label={item.label}
                      href={item.href}
                      icon={item.icon}
                    />
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
