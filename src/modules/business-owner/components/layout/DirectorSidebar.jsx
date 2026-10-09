import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Inbox, Briefcase, FileText, Warehouse,
  Users, ChevronRight, MapPin, UserSquare2, UserCheck,
  CalendarRange, Package, ClipboardList, PenTool, Settings,
  Grid, Wrench, ArrowDownToLine, ArrowUpFromLine, History, CircleDollarSign,
  PieChart, Mail, CheckSquare, CheckCircle, GitBranch, GanttChart,
  ImagePlus, Stamp, ShieldCheck, HardHat,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { BRAND_NAME, PLATFORM_ICON_URL } from "@/components/brand/BrandMark";
import { ROUTES } from "@/shared/constants/routes";
import { filterBoqInboxForRole } from "@/shared/constants/roles";
import { useAuth } from "@/shared/context/auth-context";
import { fetchBoqInbox } from "@/modules/admin/api/boq.api";

const DESIGN_OVERVIEW_SUB_ITEMS = [
  { label: "Design Requests", href: "/admin/design-qas/requests", icon: FileText },
  { label: "Design Options", href: "/admin/design-qas/options", icon: Grid },
  { label: "Approvals", href: "/admin/design-qas/approvals", icon: CheckCircle },
];

const INBOX_SUB_ITEMS = [
  { label: "Validation Inbox", href: ROUTES.ADMIN.VALIDATION_INBOX, icon: CheckSquare },
  { label: "Variations inbox", href: ROUTES.BUSINESS_OWNER.VARIATIONS_INBOX, icon: GitBranch },
  { label: "Billing milestone approval", href: ROUTES.BUSINESS_OWNER.BILLING_MILESTONE_INBOX, icon: FileText },
];

const TEMPLATES_SUB_ITEMS = [
  { label: "Schedule templates", href: ROUTES.ADMIN.SCHEDULE_TEMPLATES, icon: GanttChart },
  { label: "Quality templates", href: ROUTES.ADMIN.QUALITY_TEMPLATES, icon: ClipboardList },
];

const PROCUREMENT_SUB_ITEMS = [
  { label: "Stock Dashboard", href: ROUTES.ADMIN.PROCUREMENT_STOCK, icon: Warehouse },
  { label: "Goods Receipt", href: ROUTES.ADMIN.PROCUREMENT_RECEIPT, icon: ArrowDownToLine },
  { label: "Stock Issue", href: ROUTES.ADMIN.PROCUREMENT_ISSUE, icon: ArrowUpFromLine },
  { label: "Movement History", href: ROUTES.ADMIN.PROCUREMENT_MOVEMENTS, icon: History },
];

const PROJECT_CONFIG_SUB_ITEMS = [
  { label: "Room Configuration", href: ROUTES.ADMIN.ROOM_CONFIG, icon: Grid },
  { label: "Work Item Config", href: ROUTES.ADMIN.WORK_ITEM_CONFIG, icon: Wrench },
  { label: "Materials Master", href: ROUTES.ADMIN.MATERIAL_CONFIG, icon: Package },
  { label: "Appendices", href: ROUTES.ADMIN.APPENDIX_CONFIG, icon: ImagePlus },
  { label: "Cover letter", href: ROUTES.ADMIN.COVER_LETTER_CONFIG, icon: Stamp },
  { label: "Approvals Config", href: ROUTES.ADMIN.APPROVALS_CONFIG, icon: ShieldCheck },
  { label: "Commercial matrices", href: ROUTES.ADMIN.COMMERCIAL_MATRICES, icon: Stamp },
  { label: "Credit notes", href: ROUTES.ADMIN.CREDIT_NOTES, icon: FileText },
];

const NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { type: "link", label: "Dashboard", href: ROUTES.BUSINESS_OWNER.DASHBOARD, icon: LayoutDashboard },
      { type: "link", label: "Finance / P&L", href: ROUTES.BUSINESS_OWNER.FINANCE, icon: CircleDollarSign },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { type: "link", label: "CRM & Pipeline", href: ROUTES.BUSINESS_OWNER.CRM, icon: Users },
      { type: "link", label: "Leads", href: ROUTES.ADMIN.LEADS_LIST, icon: Users },
      { type: "link", label: "Sources", href: ROUTES.ADMIN.LEAD_SOURCES, icon: PieChart },
      { type: "link", label: "Clients", href: ROUTES.ADMIN.CLIENTS, icon: UserCheck },
    ],
  },
  {
    id: "site",
    label: "Site",
    items: [
      { type: "link", label: "Site Visits", href: ROUTES.ADMIN.SITE_VISITS, icon: MapPin },
      { type: "link", label: "Calendar", href: ROUTES.ADMIN.CALENDAR, icon: CalendarRange },
    ],
  },
  {
    id: "estimate",
    label: "Estimate",
    items: [
      { type: "submenu", label: "Design Overview", icon: PenTool, children: DESIGN_OVERVIEW_SUB_ITEMS },
      { type: "link", label: "QAS", href: ROUTES.ADMIN.QAS, icon: ClipboardList },
      { type: "link", label: "BOQ Inbox", href: ROUTES.BUSINESS_OWNER.BOQ_INBOX, icon: Inbox, badge: true },
      { type: "link", label: "Commercial (BOQ)", href: ROUTES.BUSINESS_OWNER.COMMERCIAL, icon: FileText },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    items: [
      { type: "link", label: "Projects", href: ROUTES.ADMIN.PROJECTS, icon: Briefcase },
      { type: "submenu", label: "Inbox", icon: Inbox, children: INBOX_SUB_ITEMS },
      { type: "submenu", label: "Templates", icon: ClipboardList, children: TEMPLATES_SUB_ITEMS },
      { type: "link", label: "Approvals & Permits", href: ROUTES.ADMIN.APPROVALS_DASHBOARD, icon: Stamp },
      { type: "link", label: "Communications", href: ROUTES.ADMIN.COMMUNICATIONS, icon: Mail },
      { type: "link", label: "SC vendors", href: ROUTES.ADMIN.VENDORS, icon: HardHat },
    ],
  },
  {
    id: "supply",
    label: "Supply",
    items: [
      { type: "submenu", label: "Procurement", icon: Warehouse, children: PROCUREMENT_SUB_ITEMS },
      { type: "submenu", label: "Project Configuration", icon: Settings, children: PROJECT_CONFIG_SUB_ITEMS },
    ],
  },
  {
    id: "team",
    label: "Team",
    items: [
      { type: "link", label: "Employees", href: ROUTES.ADMIN.EMPLOYEES, icon: UserSquare2 },
      { type: "link", label: "Settings", href: ROUTES.ADMIN.SETTINGS, icon: Settings },
      { type: "link", label: "Terms & Conditions", href: ROUTES.BUSINESS_OWNER.TERMS, icon: FileText },
    ],
  },
];

function isActivePath(pathname, href) {
  if (pathname === href) return true;
  if (href === ROUTES.BUSINESS_OWNER.DASHBOARD) return false;
  return pathname.startsWith(`${href}/`);
}

function Submenu({ label, icon: Icon, items }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isAnyActive = items.some((i) => isActivePath(location.pathname, i.href));
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
            const active = isActivePath(location.pathname, item.href);
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

function DirectorBrand() {
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
        <span className="truncate text-[11px] font-medium text-white/45">Command Center</span>
      </div>
    </div>
  );
}

export default function DirectorSidebar() {
  const location = useLocation();
  const { user, role } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchBoqInbox(role)
      .then((list) => setPendingCount(filterBoqInboxForRole(list, role).length))
      .catch(() => setPendingCount(0));
  }, [role]);

  return (
    <Sidebar collapsible="icon" className="sa-sidebar">
      <SidebarHeader className="sa-sidebar-header">
        <DirectorBrand />
      </SidebarHeader>

      <SidebarContent className="sa-sidebar-content gap-1">
        {NAV_GROUPS.map((group) => (
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
                  const Icon = item.icon;
                  const isDashboard = item.href === ROUTES.BUSINESS_OWNER.DASHBOARD;
                  const active = isDashboard
                    ? location.pathname === item.href
                    : isActivePath(location.pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="sa-nav-item">
                        <NavLink to={item.href} end={isDashboard}>
                          <Icon className="sa-nav-icon h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                          <span className="truncate text-sm font-medium">{item.label}</span>
                          {item.badge && pendingCount > 0 && (
                            <Badge className="ml-auto h-5 min-w-5 justify-center border-none bg-[#C9A96E] px-1 text-[10px] text-[#0a1628]">
                              {pendingCount}
                            </Badge>
                          )}
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
            {user?.name?.substring(0, 2).toUpperCase() || "DR"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{user?.name || "Director"}</p>
            <p className="truncate text-[10px] font-medium text-white/45">Project Director</p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
