import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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

function NavLinkItem({ label, href, icon: Icon }) {
  const location = useLocation();
  const isActive =
    location.pathname === href ||
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-14 rounded-none pointer-events-none">
              <SidebarBrand
                portal={QS_ROLES.has(role) ? "QS Panel" : "Admin Panel"}
                companyName={user?.companyName}
                logoUrl={user?.companyLogo}
              />
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
