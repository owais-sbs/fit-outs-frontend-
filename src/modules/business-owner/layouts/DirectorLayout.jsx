import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DensityProvider } from "@/lib/density";
import DirectorSidebar from "../components/layout/DirectorSidebar";
import DirectorNavbar from "../components/layout/DirectorNavbar";
import "../director-theme.css";

const PORTAL_THEME_CLASS = "portal-director";
/** Match Admin / Super Admin / PM open rail width */
const DIRECTOR_SIDEBAR_WIDTH_PX = 232;

function DirectorSidebarSizing() {
  const { setWidthPx } = useSidebar();
  const applied = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (applied.current) return;
      applied.current = true;
      setWidthPx(DIRECTOR_SIDEBAR_WIDTH_PX);
    }, 0);
    return () => window.clearTimeout(t);
  }, [setWidthPx]);

  return null;
}

export default function DirectorLayout() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(PORTAL_THEME_CLASS);
    return () => root.classList.remove(PORTAL_THEME_CLASS);
  }, []);

  return (
    <DensityProvider>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider
          defaultOpen
          className="portal-director h-screen max-h-screen overflow-hidden"
          style={{ "--sidebar-width-icon": "3.75rem" }}
        >
          <DirectorSidebarSizing />
          <DirectorSidebar />
          <SidebarInset className="sa-main-canvas flex min-h-0 flex-1 flex-col overflow-hidden">
            <DirectorNavbar />
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="sa-main-inner mx-auto w-full max-w-[1600px] p-5 md:p-7 lg:p-8">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </DensityProvider>
  );
}
