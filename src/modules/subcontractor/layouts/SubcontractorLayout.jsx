import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Package, FileText } from "lucide-react";
import { JctLogoTile, BRAND_NAME } from "@/components/brand/BrandMark";
import { ROUTES } from "@/shared/constants/routes";

const NAV = [
  { label: "Dashboard", href: ROUTES.SUBCONTRACTOR.DASHBOARD, icon: LayoutDashboard, end: true },
  { label: "Packages", href: ROUTES.SUBCONTRACTOR.PACKAGES, icon: Package },
  { label: "Claims", href: ROUTES.SUBCONTRACTOR.CLAIMS, icon: FileText },
];

export default function SubcontractorLayout() {
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
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] p-5 md:p-7 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
