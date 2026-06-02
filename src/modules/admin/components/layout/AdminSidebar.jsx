import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sparkles, LayoutDashboard, Target, Users, MapPin, BarChart3, Settings,
  List, CalendarDays, Link, CheckCircle, XCircle, Activity,
  Briefcase, DollarSign, FileText, MessageSquare, Bell, ChevronRight,
  Palette, Inbox, Layers, Eye, Upload, UserCheck, RotateCcw, Award,
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
    label: "Admin",
    items: [
      { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
      { label: "Pipeline", href: ROUTES.ADMIN.PIPELINE, icon: Target },
      { label: "LEADS_PLACEHOLDER" },
      { label: "Site Visits", href: ROUTES.ADMIN.SITE_VISITS, icon: MapPin },
      { label: "Reports", href: ROUTES.ADMIN.REPORTS, icon: BarChart3 },
      { label: "Projects", href: ROUTES.ADMIN.PROJECTS, icon: Briefcase },
      { label: "Activity Logs", href: ROUTES.ADMIN.ACTIVITY_LOGS, icon: Activity },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Client Conversion", href: ROUTES.ADMIN.CLIENT_CONVERSION, icon: Briefcase },
      { label: "Payments", href: ROUTES.ADMIN.PAYMENTS, icon: DollarSign },
      { label: "Proposals", href: ROUTES.ADMIN.PROPOSALS, icon: FileText },
      { label: "Negotiations", href: ROUTES.ADMIN.NEGOTIATIONS, icon: MessageSquare },
      { label: "DESIGN_WORKFLOW_PLACEHOLDER" },
      { label: "Notifications", href: ROUTES.ADMIN.NOTIFICATIONS, icon: Bell },
      { label: "Settings", href: ROUTES.ADMIN.SETTINGS, icon: Settings },
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
];

const DESIGN_WORKFLOW_SUB_ITEMS = [
  { label: "Design Requests", href: ROUTES.ADMIN.DESIGN_REQUESTS, icon: Inbox },
  { label: "In Progress", href: ROUTES.ADMIN.DESIGN_IN_PROGRESS, icon: Layers },
  { label: "Internal Review", href: ROUTES.ADMIN.DESIGN_INTERNAL_REVIEW, icon: Eye },
  { label: "Upload Design", href: ROUTES.ADMIN.DESIGN_UPLOAD, icon: Upload },
  { label: "Client Approval", href: ROUTES.ADMIN.DESIGN_CLIENT_APPROVAL, icon: UserCheck },
  { label: "Revision Requests", href: ROUTES.ADMIN.DESIGN_REVISIONS, icon: RotateCcw },
  { label: "Completed Designs", href: ROUTES.ADMIN.DESIGN_COMPLETED, icon: Award },
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

function DesignWorkflowSubmenu() {
  const location = useLocation();
  const [open, setOpen] = useState(
    DESIGN_WORKFLOW_SUB_ITEMS.some((item) =>
      location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
    )
  );
  const isAnyActive = DESIGN_WORKFLOW_SUB_ITEMS.some((item) =>
    location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
  );

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setOpen(!open)}
        isActive={isAnyActive}
        tooltip="Design Workflow"
      >
        <Palette className="h-4 w-4" />
        <span>Design Workflow</span>
        <ChevronRight
          className={`ml-auto h-3 w-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {DESIGN_WORKFLOW_SUB_ITEMS.map((item) => {
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
                <span className="truncate text-xs text-sidebar-foreground/70">OnePath Fitouts</span>
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
                  ) : item.label === "DESIGN_WORKFLOW_PLACEHOLDER" ? (
                    <DesignWorkflowSubmenu key="design-workflow" />
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
