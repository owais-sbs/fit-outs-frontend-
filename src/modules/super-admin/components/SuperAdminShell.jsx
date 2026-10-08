import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "./layout/AppSidebar";
import SuperAdminNavbar from "./layout/SuperAdminNavbar";
import { TenantManagementProvider } from "../context/tenant-management-context";
import "../super-admin-theme.css";

const PORTAL_THEME_CLASS = "portal-super-admin";
/** Compact open rail — narrower than global 256px */
const SA_SIDEBAR_WIDTH_PX = 232;

function SuperAdminSidebarSizing() {
  const { setWidthPx } = useSidebar();
  const applied = useRef(false);

  useEffect(() => {
    // Always apply SA open width after provider hydrates (ignore wider localStorage)
    const t = window.setTimeout(() => {
      if (applied.current) return;
      applied.current = true;
      setWidthPx(SA_SIDEBAR_WIDTH_PX);
    }, 0);
    return () => window.clearTimeout(t);
  }, [setWidthPx]);

  return null;
}

export default function SuperAdminShell() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(PORTAL_THEME_CLASS);
    return () => root.classList.remove(PORTAL_THEME_CLASS);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <TenantManagementProvider>
        <SidebarProvider
          defaultOpen
          className="portal-super-admin h-screen max-h-screen overflow-hidden"
          style={{ "--sidebar-width-icon": "4.5rem" }}>
          <SuperAdminSidebarSizing />
          <AppSidebar />
          <SidebarInset className="sa-main-canvas flex min-h-0 flex-1 flex-col overflow-hidden">
            <SuperAdminNavbar />
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="sa-main-inner mx-auto w-full max-w-[1600px] p-5 md:p-7 lg:p-8">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TenantManagementProvider>
    </TooltipProvider>
  );
}
