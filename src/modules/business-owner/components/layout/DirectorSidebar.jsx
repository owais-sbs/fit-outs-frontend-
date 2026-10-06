import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/shared/constants/routes";
import { filterBoqInboxForRole } from "@/shared/constants/roles";
import { useAuth } from "@/shared/context/auth-context";
import { SidebarBrand } from "@/components/brand/BrandMark";
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
  const isDashboard = item.href === ROUTES.BUSINESS_OWNER.DASHBOARD;
  const isActive = isDashboard
    ? location.pathname === item.href
    : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
        <NavLink to={item.href} end={isDashboard}>
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
    fetchBoqInbox(role)
      .then((list) => setPendingCount(filterBoqInboxForRole(list, role).length))
      .catch(() => setPendingCount(0));
  }, [role]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <SidebarBrand
                portal="Command Center"
                companyName={user?.companyName}
                logoUrl={user?.companyLogo}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
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
                    <NavItem
                      key={item.href}
                      item={item}
                      pendingCount={pendingCount}
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
