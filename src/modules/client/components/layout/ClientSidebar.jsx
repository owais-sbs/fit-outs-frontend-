import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sparkles, LayoutDashboard, ChevronRight,
  Palette, Inbox, RotateCcw, Award,
  FileText, CreditCard, MessageSquare, Settings,
  Briefcase, ClipboardList,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";

// ─── Design Center sub-items ──────────────────────────────────────────────────
const DESIGN_SUB_ITEMS = [
  { label: "My Designs",        href: ROUTES.CLIENT.DESIGNS,          icon: Palette },
  { label: "Pending Approval",  href: ROUTES.CLIENT.DESIGNS_PENDING,  icon: Inbox },
  { label: "Revision History",  href: ROUTES.CLIENT.DESIGNS_REVISIONS,icon: RotateCcw },
  { label: "Approved Designs",  href: ROUTES.CLIENT.DESIGNS_APPROVED, icon: Award },
];

// ─── Projects sub-items ───────────────────────────────────────────────────────
const PROJECT_SUB_ITEMS = [
  { label: "My Projects",          href: ROUTES.CLIENT.PROJECTS_MY,      icon: Briefcase },
  { label: "New Project Request",  href: ROUTES.CLIENT.PROJECTS_REQUEST, icon: ClipboardList },
];

// ─── Top-level nav ────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: ROUTES.CLIENT.DASHBOARD, icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "Design Center",
    items: [
      { label: "DESIGN_CENTER_PLACEHOLDER" },
    ],
  },
  {
    label: "Projects",
    items: [
      { label: "PROJECTS_PLACEHOLDER" },
    ],
  },
  {
    label: "Project Details",
    items: [
      { label: "Documents",     href: ROUTES.CLIENT.DOCUMENTS,      icon: FileText },
      { label: "Invoices",      href: ROUTES.CLIENT.INVOICES,        icon: CreditCard },
      { label: "Communications",href: ROUTES.CLIENT.COMMUNICATIONS,  icon: MessageSquare },
      { label: "Settings",      href: ROUTES.CLIENT.SETTINGS,        icon: Settings },
    ],
  },
];

function ClientNavItem({ item }) {
  const location = useLocation();
  const Icon = item.icon;
  const isActive = item.end
    ? location.pathname === item.href
    : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
        <NavLink to={item.href} end={!!item.end}>
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DesignCenterSubmenu() {
  const location = useLocation();
  const isAnyActive = DESIGN_SUB_ITEMS.some((i) =>
    location.pathname === i.href || location.pathname.startsWith(`${i.href}/`)
  );
  const [open, setOpen] = useState(isAnyActive);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => setOpen((o) => !o)} isActive={isAnyActive} tooltip="Design Center">
        <Palette className="h-4 w-4" />
        <span>Design Center</span>
        <ChevronRight
          className={`ml-auto h-3 w-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {DESIGN_SUB_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSubActive =
              location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
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

function ProjectsSubmenu() {
  const location = useLocation();
  const isAnyActive = PROJECT_SUB_ITEMS.some((i) =>
    location.pathname === i.href || location.pathname.startsWith(`${i.href}/`)
  );
  const [open, setOpen] = useState(isAnyActive);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => setOpen((o) => !o)} isActive={isAnyActive} tooltip="Projects">
        <Briefcase className="h-4 w-4" />
        <span>Projects</span>
        <ChevronRight
          className={`ml-auto h-3 w-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {PROJECT_SUB_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSubActive =
              location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
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

export default function ClientSidebar() {
  const { user } = useAuth();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Client Portal</span>
                <span className="truncate text-xs text-sidebar-foreground/70">Fitouts</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  if (item.label === "DESIGN_CENTER_PLACEHOLDER") {
                    return <DesignCenterSubmenu key="design-center" />;
                  }
                  if (item.label === "PROJECTS_PLACEHOLDER") {
                    return <ProjectsSubmenu key="projects-submenu" />;
                  }
                  return <ClientNavItem key={item.href} item={item} />;
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
              {user?.name?.substring(0, 2).toUpperCase() || "CL"}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-xs font-medium">{user?.name || "Client"}</span>
            <span className="truncate text-[10px] text-muted-foreground">Client Portal</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
