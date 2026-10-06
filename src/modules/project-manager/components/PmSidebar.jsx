import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
import { SidebarBrand } from "@/components/brand/BrandMark";
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
  const isAnyActive = items.some((i) => isActivePath(location.pathname, i.href));
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
            const active = isActivePath(location.pathname, item.href);
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

export default function PmSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { counts, total } = usePmAwaitingApprovals();
  const badgeCounts = { ...counts, total };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <SidebarBrand
                portal="PM Panel"
                companyName={user?.companyName}
                logoUrl={user?.companyLogo}
              />
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
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <NavLink to={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {count > 0 && (
                            <Badge
                              className="ml-auto h-5 min-w-5 justify-center px-1 text-[10px]"
                              variant="destructive"
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

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-xl bg-secondary/70 p-2 ring-1 ring-border/50 group-data-[collapsible=icon]:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
            <span className="text-xs font-semibold">
              {user?.name?.substring(0, 2).toUpperCase() || "PM"}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-xs font-medium">{user?.name || "Project Manager"}</span>
            <span className="truncate text-[10px] text-muted-foreground">Project Manager</span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
