import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminSidebar from "../components/layout/AdminSidebar";
import AdminNavbar from "../components/layout/AdminNavbar";

export default function AdminLayout() {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen className="h-screen max-h-screen overflow-hidden">
        <AdminSidebar />
        <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AdminNavbar />
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
