import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  MapPin,
  Mail,
  ClipboardCheck,
  GanttChart,
  ClipboardList,
  Stamp,
  HardHat,
  GitBranch,
  Timer,
  ChevronRight,
} from "lucide-react";
import { BRAND_NAME, PLATFORM_ICON_URL } from "@/components/brand/BrandMark";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/shared/context/auth-context";
import { usePmAwaitingApprovals } from "../hooks/PmAwaitingApprovalsContext";

const TEMPLATES_SUB_ITEMS = [
  { label: "Schedule templates", href: ROUTES.PROJECT_MANAGER.SCHEDULE_TEMPLATES, icon: GanttChart },
  { label: "Quality templates", href: ROUTES.PROJECT_MANAGER.QUALITY_TEMPLATES, icon: ClipboardList },
];

const INBOX_SUB_ITEMS = [
  { label: "Validation Inbox", href: ROUTES.PROJECT_MANAGER.VALIDATION_INBOX, icon: ClipboardCheck },
  { label: "Variations inbox", href: ROUTES.PROJECT_MANAGER.VARIATIONS_INBOX, icon: GitBranch },
];

const GROUPS = [
  {
    label: "Overview",
    items: [
      { type: "link", label: "Dashboard", href: ROUTES.PROJECT_MANAGER.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    label: "Awaiting approvals",
    items: [
      {
        type: "link",
        label: "My approvals",
        href: ROUTES.PROJECT_MANAGER.AWAITING_APPROVALS,
        icon: Stamp,
        countKey: "total",
      },
      {
        type: "link",
        label: "Variations & CRs",
        href: ROUTES.PROJECT_MANAGER.VARIATIONS_INBOX,
        icon: GitBranch,
        countKey: "variations",
      },
      {
        type: "link",
        label: "BOQs",
        href: ROUTES.PROJECT_MANAGER.BOQ_INBOX,
        icon: Inbox,
        countKey: "boqs",
      },
      {
        type: "link",
        label: "Billing milestones",
        href: ROUTES.PROJECT_MANAGER.BILLING_MILESTONE_INBOX,
        icon: ClipboardCheck,
        countKey: "billing",
      },
    ],
  },
  {
    label: "Site",
    items: [
      { type: "link", label: "Site Visits", href: ROUTES.PROJECT_MANAGER.SITE_VISITS, icon: MapPin },
    ],
  },
  {
    label: "Estimate",
    items: [
      { type: "link", label: "Credit notes", href: ROUTES.PROJECT_MANAGER.CREDIT_NOTES, icon: Stamp },
    ],
  },
  {
    label: "Delivery",
    items: [
      { type: "link", label: "Projects", href: ROUTES.PROJECT_MANAGER.PROJECTS, icon: Briefcase },
      { type: "submenu", label: "Inbox", icon: Inbox, children: INBOX_SUB_ITEMS },
      { type: "submenu", label: "Templates", icon: ClipboardList, children: TEMPLATES_SUB_ITEMS },
      { type: "link", label: "Approvals & Permits", href: ROUTES.PROJECT_MANAGER.APPROVALS_DASHBOARD, icon: Stamp },
      { type: "link", label: "Duration extensions", href: ROUTES.PROJECT_MANAGER.DURATION_EXTENSION_INBOX, icon: Timer },
      { type: "link", label: "Communications", href: ROUTES.PROJECT_MANAGER.COMMUNICATIONS, icon: Mail },
      { type: "link", label: "SC vendors", href: ROUTES.PROJECT_MANAGER.VENDORS, icon: HardHat },
    ],
  },
  {
    label: "Team",
    items: [
      { type: "link", label: "Terms & Conditions", href: ROUTES.PROJECT_MANAGER.TERMS, icon: ClipboardList },
    ],
  },
];

function isActivePath(pathname, href) {
  if (pathname === href) return true;
  if (href === ROUTES.PROJECT_MANAGER.DASHBOARD) return false;
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

function PmBrand() {
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
        <span className="truncate text-[11px] font-medium text-white/45">PM Panel</span>
      </div>
    </div>
  );
}

export default function PmSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { counts, total } = usePmAwaitingApprovals();
  const badgeCounts = { ...counts, total };

  return (
    <Sidebar collapsible="icon" className="sa-sidebar">
      <SidebarHeader className="sa-sidebar-header">
        <PmBrand />
      </SidebarHeader>

      <SidebarContent className="sa-sidebar-content gap-1">
        {GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="sa-nav-group py-1">
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
                  const active = isActivePath(location.pathname, item.href);
                  const count = item.countKey ? badgeCounts[item.countKey] : 0;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="sa-nav-item">
                        <NavLink to={item.href}>
                          <Icon className="sa-nav-icon h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                          <span className="truncate text-sm font-medium">{item.label}</span>
                          {count > 0 && (
                            <Badge
                              className="ml-auto h-5 min-w-5 justify-center border-none bg-[#C9A96E] px-1 text-[10px] text-[#0a1628]"
                            >
                              {count}
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
            {user?.name?.substring(0, 2).toUpperCase() || "PM"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{user?.name || "Project Manager"}</p>
            <p className="truncate text-[10px] font-medium text-white/45">Project Manager</p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
