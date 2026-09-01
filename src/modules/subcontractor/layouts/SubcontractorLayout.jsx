import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import SubcontractorSidebar from "../components/SubcontractorSidebar";
import SubcontractorNavbar from "../components/SubcontractorNavbar";

export default function SubcontractorLayout() {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen className="h-screen max-h-screen overflow-hidden">
        <SubcontractorSidebar />
        <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SubcontractorNavbar />
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
