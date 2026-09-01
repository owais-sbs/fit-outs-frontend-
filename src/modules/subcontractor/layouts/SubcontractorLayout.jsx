import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, FileText, LogOut } from "lucide-react";
import { JctLogoTile, BRAND_NAME } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";

const NAV = [
  { label: "Dashboard", href: ROUTES.SUBCONTRACTOR.DASHBOARD, icon: LayoutDashboard, end: true },
  { label: "Packages", href: ROUTES.SUBCONTRACTOR.PACKAGES, icon: Package },
  { label: "Claims", href: ROUTES.SUBCONTRACTOR.CLAIMS, icon: FileText },
];

export default function SubcontractorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.fullName || user?.name || user?.email || "Subcontractor";

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-5 py-3 md:px-7 lg:px-8">
          <div className="flex items-center gap-2.5">
            <JctLogoTile className="h-8 w-8 rounded-lg" imgClassName="h-4 w-4" />
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">{BRAND_NAME}</p>
              <p className="text-[11px] text-muted-foreground">Subcontractor Portal</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-secondary text-foreground font-medium ring-1 ring-border/50"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{displayName}</p>
              {user?.email && (
                <p className="text-[11px] text-muted-foreground">{user.email}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] p-5 md:p-7 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
