import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function CrmNavbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="hidden h-5 md:block" />
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
        <Link to={ROUTES.SUPER_ADMIN.DASHBOARD}>← Platform</Link>
      </Button>
    </header>
  );
}
