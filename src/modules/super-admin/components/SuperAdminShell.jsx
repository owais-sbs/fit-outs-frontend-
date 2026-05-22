import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "./layout/AppSidebar";
import SuperAdminNavbar from "./layout/SuperAdminNavbar";
import {
  TenantManagementPanels,
} from "./tenant-management";
import { TenantManagementProvider } from "../context/tenant-management-context";

export default function SuperAdminShell() {
  return (
    <TooltipProvider delayDuration={0}>
      <TenantManagementProvider>
        <SidebarProvider defaultOpen className="h-screen max-h-screen overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <SuperAdminNavbar />
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
        <TenantManagementPanels />
      </TenantManagementProvider>
    </TooltipProvider>
  );
}
