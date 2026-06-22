import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { JctLogoTile } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SUPER_ADMIN_NAV } from "../constants/navigation";

function NavItem({ item, collapsed }) {
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.href}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        )
      }>
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export default function SuperAdminSidebar({ collapsed, onToggle }) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-[4.5rem]" : "w-64"
        )}>
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            collapsed ? "justify-center px-2" : "justify-between"
          )}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <JctLogoTile className="h-9 w-9 rounded-lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">JCT Contracting</p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  Super Admin
                </p>
              </div>
            </div>
          )}
          {collapsed && <JctLogoTile className="h-9 w-9 rounded-lg" />}
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {SUPER_ADMIN_NAV.map((item) => (
              <NavItem key={item.href} item={item} collapsed={collapsed} />
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={onToggle}
            className={cn(
              "w-full text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              !collapsed && "justify-start gap-2"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export function SuperAdminMobileNav({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 p-4">
      {SUPER_ADMIN_NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
              )
            }>
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
