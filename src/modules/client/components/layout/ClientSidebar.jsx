import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ChevronRight,
  Palette,
  Inbox,
  RotateCcw,
  Award,
  FileText,
  CreditCard,
  MessageSquare,
  Settings,
  AlertTriangle,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import { BRAND_NAME, PLATFORM_ICON_URL } from "@/components/brand/BrandMark";
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

const DESIGN_SUB_ITEMS = [
  { label: "My Designs", href: ROUTES.CLIENT.DESIGNS, icon: Palette },
  { label: "Pending Approval", href: ROUTES.CLIENT.DESIGNS_PENDING, icon: Inbox },
  { label: "Revision History", href: ROUTES.CLIENT.DESIGNS_REVISIONS, icon: RotateCcw },
  { label: "Approved Designs", href: ROUTES.CLIENT.DESIGNS_APPROVED, icon: Award },
];

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { type: "link", label: "Dashboard", href: ROUTES.CLIENT.DASHBOARD, icon: LayoutDashboard, end: true },
      { type: "link", label: "BOQ Approvals", href: ROUTES.CLIENT.BOQ_APPROVALS, icon: FileText },
      { type: "link", label: "Variations", href: ROUTES.CLIENT.VARIATIONS, icon: ClipboardList },
    ],
  },
  {
    label: "Design Center",
    items: [{ type: "submenu", label: "Design Center", icon: Palette, children: DESIGN_SUB_ITEMS }],
  },
  {
    label: "Projects",
    items: [
      { type: "link", label: "My Projects", href: ROUTES.CLIENT.PROJECTS_MY, icon: Briefcase },
      { type: "link", label: "New Project Request", href: ROUTES.CLIENT.PROJECTS_REQUEST, icon: ClipboardList },
    ],
  },
  {
    label: "Project Details",
    items: [
      { type: "link", label: "Documents", href: ROUTES.CLIENT.DOCUMENTS, icon: FileText },
      { type: "link", label: "Snags", href: ROUTES.CLIENT.SNAGS, icon: AlertTriangle },
      { type: "link", label: "Invoices", href: ROUTES.CLIENT.INVOICES, icon: CreditCard },
      { type: "link", label: "Communications", href: ROUTES.CLIENT.COMMUNICATIONS, icon: MessageSquare },
      { type: "link", label: "Settings", href: ROUTES.CLIENT.SETTINGS, icon: Settings },
      { type: "link", label: "Terms & Conditions", href: ROUTES.CLIENT.TERMS, icon: FileText },
    ],
  },
];

function isActivePath(pathname, href, end = false) {
  if (end || href === ROUTES.CLIENT.DASHBOARD) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
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

function ClientBrand() {
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
        <span className="truncate text-[11px] font-medium text-white/45">Client Portal</span>
      </div>
    </div>
  );
}

export default function ClientSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="sa-sidebar">
      <SidebarHeader className="sa-sidebar-header">
        <ClientBrand />
      </SidebarHeader>

      <SidebarContent className="sa-sidebar-content gap-1">
        {NAV_GROUPS.map((group) => (
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
                  const active = isActivePath(location.pathname, item.href, item.end);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="sa-nav-item">
                        <NavLink to={item.href} end={!!item.end}>
                          <Icon className="sa-nav-icon h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                          <span className="truncate text-sm font-medium">{item.label}</span>
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
            {user?.name?.substring(0, 2).toUpperCase() || "CL"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{user?.name || "Client"}</p>
            <p className="truncate text-[10px] font-medium text-white/45">Client Portal</p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
