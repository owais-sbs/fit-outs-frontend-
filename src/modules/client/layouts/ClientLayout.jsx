import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import ClientSidebar from "../components/layout/ClientSidebar";
import ClientNavbar from "../components/layout/ClientNavbar";

export default function ClientLayout() {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen className="h-screen max-h-screen overflow-hidden">
        <ClientSidebar />
        <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ClientNavbar />
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
