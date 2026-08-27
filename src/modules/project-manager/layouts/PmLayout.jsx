import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import PmSidebar from "../components/PmSidebar";
import PmNavbar from "../components/PmNavbar";

export default function PmLayout() {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen className="h-screen max-h-screen overflow-hidden">
        <PmSidebar />
        <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <PmNavbar />
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-[1600px] p-5 md:p-7 lg:p-8">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
