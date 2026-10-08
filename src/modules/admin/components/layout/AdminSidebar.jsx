import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, MapPin, ChevronRight,
  UserSquare2, CalendarRange, Briefcase,
  UserCheck, Mail, Grid, Wrench, Settings, PenTool,
  CheckCircle, PieChart, CheckSquare, FileText, ClipboardList, ShieldCheck,
  Package, Warehouse, ArrowDownToLine, ArrowUpFromLine, History, ImagePlus, Inbox,
  GanttChart, Stamp, HardHat, GitBranch,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/shared/constants/routes";
import { ROLES } from "@/shared/constants/roles";
import { useAuth } from "@/shared/context/auth-context";
import {
  BRAND_NAME,
  PLATFORM_ICON_URL,
} from "@/components/brand/BrandMark";

const FULL_ACCESS = new Set([ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES]);
const QS_ROLES = new Set([ROLES.QS, ROLES.SENIOR_QS]);

function canSee(role, allowed) {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(role);
}


const DESIGN_OVERVIEW_SUB_ITEMS = [
  { label: "Design Requests", href: "/admin/design-qas/requests", icon: FileText, feature: "DESIGN" },
  { label: "Design Options", href: "/admin/design-qas/options", icon: Grid, feature: "DESIGN" },
  { label: "Approvals", href: "/admin/design-qas/approvals", icon: CheckCircle, feature: "DESIGN" },
];

const PROJECT_CONFIG_SUB_ITEMS = [
  { label: "Room Configuration", href: ROUTES.ADMIN.ROOM_CONFIG, icon: Grid, feature: "PROJECT_CONFIG" },
  { label: "Work Item Config", href: ROUTES.ADMIN.WORK_ITEM_CONFIG, icon: Wrench, feature: "PROJECT_CONFIG" },
  { label: "Materials Master", href: ROUTES.ADMIN.MATERIAL_CONFIG, icon: Package, feature: "PROJECT_CONFIG" },
  { label: "Appendices", href: ROUTES.ADMIN.APPENDIX_CONFIG, icon: ImagePlus, feature: "PROJECT_CONFIG" },
  { label: "Cover letter", href: ROUTES.ADMIN.COVER_LETTER_CONFIG, icon: Stamp, feature: "PROJECT_CONFIG" },
  { label: "Approvals Config", href: ROUTES.ADMIN.APPROVALS_CONFIG, icon: ShieldCheck, feature: "PROJECT_CONFIG" },
  { label: "Commercial matrices", href: ROUTES.ADMIN.COMMERCIAL_MATRICES, icon: Stamp, feature: "PROJECT_CONFIG" },
  { label: "Credit notes", href: ROUTES.ADMIN.CREDIT_NOTES, icon: FileText, feature: "PROJECT_CONFIG" },
];

const PROCUREMENT_SUB_ITEMS = [
  { label: "Stock Dashboard", href: ROUTES.ADMIN.PROCUREMENT_STOCK, icon: Warehouse, feature: "PROCUREMENT" },
  { label: "Goods Receipt", href: ROUTES.ADMIN.PROCUREMENT_RECEIPT, icon: ArrowDownToLine, feature: "PROCUREMENT" },
  { label: "Stock Issue", href: ROUTES.ADMIN.PROCUREMENT_ISSUE, icon: ArrowUpFromLine, feature: "PROCUREMENT" },
  { label: "Movement History", href: ROUTES.ADMIN.PROCUREMENT_MOVEMENTS, icon: History, feature: "PROCUREMENT" },
];

const TEMPLATES_SUB_ITEMS = [
  { label: "Schedule templates", href: ROUTES.ADMIN.SCHEDULE_TEMPLATES, icon: GanttChart, feature: "SCHEDULE_TEMPLATES" },
  { label: "Quality templates", href: ROUTES.ADMIN.QUALITY_TEMPLATES, icon: ClipboardList, feature: "CHECKLISTS" },
];

const INBOX_SUB_ITEMS = [
  { label: "Validation Inbox", href: ROUTES.ADMIN.VALIDATION_INBOX, icon: CheckSquare, feature: "VALIDATION" },
  { label: "Variations inbox", href: ROUTES.ADMIN.VARIATIONS_INBOX, icon: GitBranch, feature: "VARIATIONS" },
];

/** Nav groups — lifecycle IA */
const NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    roles: [...FULL_ACCESS, ...QS_ROLES],
    items: [
      { type: "link", label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard, feature: "DASHBOARD" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    roles: [...FULL_ACCESS],
    items: [
      { type: "link", label: "Leads", href: ROUTES.ADMIN.LEADS_LIST, icon: Users, feature: "LEADS" },
      { type: "link", label: "Sources", href: ROUTES.ADMIN.LEAD_SOURCES, icon: PieChart, feature: "SOURCES" },
      { type: "link", label: "Clients", href: ROUTES.ADMIN.CLIENTS, icon: UserCheck, feature: "CLIENTS" },
    ],
  },
  {
    id: "site",
    label: "Site",
    roles: [...FULL_ACCESS, ...QS_ROLES],
    items: [
      { type: "link", label: "Site Visits", href: ROUTES.ADMIN.SITE_VISITS, icon: MapPin, roles: [...FULL_ACCESS, ...QS_ROLES], feature: "SITE_VISITS" },
      { type: "link", label: "Calendar", href: ROUTES.ADMIN.CALENDAR, icon: CalendarRange, feature: "CALENDAR" },
    ],
  },
  {
    id: "estimate",
    label: "Estimate",
    roles: [...FULL_ACCESS, ...QS_ROLES],
    items: [
      { type: "submenu", label: "Design Overview", icon: PenTool, children: DESIGN_OVERVIEW_SUB_ITEMS, roles: [...FULL_ACCESS], feature: "DESIGN" },
      { type: "link", label: "QAS", href: ROUTES.ADMIN.QAS, icon: ClipboardList, feature: "QAS" },
      {
        type: "link",
        label: "BOQ Inbox",
        href: ROUTES.ADMIN.BOQ_INBOX,
        icon: Inbox,
        roles: [ROLES.SENIOR_QS, ROLES.ADMIN, ROLES.SUPER_ADMIN],
        feature: "BOQ",
      },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    roles: [...FULL_ACCESS, ...QS_ROLES],
    items: [
      { type: "link", label: "Projects", href: ROUTES.ADMIN.PROJECTS, icon: Briefcase, feature: "PROJECTS" },
      { type: "submenu", label: "Inbox", icon: Inbox, children: INBOX_SUB_ITEMS },
      { type: "submenu", label: "Templates", icon: ClipboardList, children: TEMPLATES_SUB_ITEMS },
      { type: "link", label: "Approvals & Permits", href: ROUTES.ADMIN.APPROVALS_DASHBOARD, icon: Stamp, feature: "APPROVALS" },
      { type: "link", label: "Communications", href: ROUTES.ADMIN.COMMUNICATIONS, icon: Mail, feature: "COMMUNICATIONS" },
      {
        type: "link",
        label: "SC vendors",
        href: ROUTES.ADMIN.VENDORS,
        icon: HardHat,
        roles: [...FULL_ACCESS, ...QS_ROLES, ROLES.PROJECT_MANAGER],
        feature: "VENDORS",
      },
    ],
  },
  {
    id: "supply",
    label: "Supply",
    roles: [...FULL_ACCESS],
    items: [
      { type: "submenu", label: "Procurement", icon: Warehouse, children: PROCUREMENT_SUB_ITEMS, feature: "PROCUREMENT" },
      { type: "submenu", label: "Project Configuration", icon: Settings, children: PROJECT_CONFIG_SUB_ITEMS, feature: "PROJECT_CONFIG" },
    ],
  },
  {
    id: "team",
    label: "Team",
    roles: [...FULL_ACCESS],
    items: [
      { type: "link", label: "Employees", href: ROUTES.ADMIN.EMPLOYEES, icon: UserSquare2, feature: "EMPLOYEES" },
      { type: "link", label: "Settings", href: ROUTES.ADMIN.SETTINGS, icon: Settings, feature: "SETTINGS" },
      { type: "link", label: "Terms & Conditions", href: ROUTES.ADMIN.TERMS, icon: FileText, feature: "TERMS" },
    ],
  },
];

function canSeeFeature(enabledFeatures, feature) {
  // Legacy tenants with no company feature grants keep role-only navigation.
  if (!enabledFeatures || enabledFeatures.length === 0) return true;
  if (!feature) return true;
  return enabledFeatures.includes(feature);
}

function Submenu({ label, icon: Icon, items }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isAnyActive = items.some(
    (i) => location.pathname === i.href || location.pathname.startsWith(`${i.href}/`)
  );
  const [open, setOpen] = useState(isAnyActive);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => {
          if (collapsed) {
            const target = items.find((i) => location.pathname.startsWith(i.href)) || items[0];
            if (target?.href) navigate(target.href);
            return;
          }
          setOpen((o) => !o);
        }}
        isActive={isAnyActive}
        tooltip={label}
        className="sa-nav-item"
      >
        <Icon className="sa-nav-icon h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
        <span className="truncate text-sm font-medium">{label}</span>
        {!collapsed && (
          <ChevronRight
            className={`sa-nav-chevron ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            strokeWidth={1.75}
          />
        )}
      </SidebarMenuButton>
      {!collapsed && open && (
        <SidebarMenuSub>
          {items.map((item) => {
            const ItemIcon = item.icon;
            const active =
              location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
            return (
              <SidebarMenuSubItem key={item.href}>
                <SidebarMenuSubButton asChild isActive={active}>
                  <NavLink to={item.href}>
                    <ItemIcon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.75} />
                    <span className="truncate text-[13px] font-medium">{item.label}</span>
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

function NavLinkItem({ label, href, icon: Icon }) {
  const location = useLocation();
  const isActive =
    location.pathname === href ||
    (href !== ROUTES.ADMIN.DASHBOARD && location.pathname.startsWith(`${href}/`));
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label} className="sa-nav-item">
        <NavLink to={href}>
          <Icon className="sa-nav-icon h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          <span className="truncate text-sm font-medium">{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AdminBrand({ portalLabel }) {
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

export default function AdminSidebar() {
  const { user, role } = useAuth();
  const enabledFeatures = user?.enabledFeatures || [];

  const groups = useMemo(
    () =>
      NAV_GROUPS.filter((g) => canSee(role, g.roles)).map((g) => ({
        ...g,
        items: g.items
          .filter((item) => canSee(role, item.roles) && canSeeFeature(enabledFeatures, item.feature))
          .map((item) => {
            if (item.type !== "submenu" || !item.children) return item;
            return {
              ...item,
              children: item.children.filter((child) =>
                canSeeFeature(enabledFeatures, child.feature || item.feature)
              ),
            };
          })
          .filter((item) => item.type !== "submenu" || (item.children && item.children.length > 0)),
      })).filter((g) => g.items.length > 0),
    [role, enabledFeatures]
  );

  const portalLabel = QS_ROLES.has(role) ? "QS Panel" : "Admin Panel";

  return (
    <Sidebar collapsible="icon" className="sa-sidebar">
      <SidebarHeader className="sa-sidebar-header">
        <AdminBrand portalLabel={portalLabel} />
      </SidebarHeader>

      <SidebarContent className="sa-sidebar-content gap-1">
        {groups.map((group) => (
          <SidebarGroup key={group.id} className="sa-nav-group py-1">
            <SidebarGroupLabel className="sa-nav-group-label">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="sa-nav-menu gap-0.5">
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

      <SidebarFooter className="sa-sidebar-footer mt-auto border-t border-white/10 p-2 group-data-[collapsible=icon]:p-2">
        <div className="admin-user-chip group-data-[collapsible=icon]:hidden">
          <div className="admin-user-chip-avatar">
            {user?.name?.substring(0, 2).toUpperCase() || "AD"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{user?.name || "Admin"}</p>
            <p className="truncate text-[10px] font-medium capitalize text-white/45">
              {role || "Admin"}
            </p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
