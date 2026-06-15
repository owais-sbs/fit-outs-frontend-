import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { ROLES, ROLE_PERMISSIONS } from "@/shared/constants/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, Users2, HeartHandshake, UserSquare2,
  ArrowLeft, ExternalLink, Loader2,
} from "lucide-react";

const PORTAL_CONFIG = {
  [ROLES.SUPER_ADMIN]: {
    id: "super-admin",
    label: "Super Admin",
    icon: ShieldAlert,
    description: "Root-level control across all sub-organisations, system audits, and global configuration values.",
    route: ROUTES.SUPER_ADMIN.DASHBOARD,
  },
  [ROLES.ADMIN]: {
    id: "admin",
    label: "Admin",
    icon: Users2,
    description: "User management, access level control, global project monitoring, and platform reporting.",
    route: ROUTES.ADMIN.DASHBOARD,
  },
  [ROLES.CLIENT]: {
    id: "client",
    label: "Client",
    icon: HeartHandshake,
    description: "Client workspace for tracking project milestones, floorplan previews, invoicing approvals, and communications.",
    route: ROUTES.CLIENT.DASHBOARD,
  },
  [ROLES.EMPLOYEE]: {
    id: "employee",
    label: "Employee Portal",
    icon: UserSquare2,
    description: "View assigned projects, site visit schedules, and personal work calendar in one clean workspace.",
    route: ROUTES.EMPLOYEE.DASHBOARD,
  },
};

export default function RolesManagement() {
  const navigate = useNavigate();
  const { user, roles, selectRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="mt-4 text-sm text-muted-foreground animate-pulse font-medium">Loading portals...</span>
      </div>
    );
  }

  if (!user || !roles || roles.length === 0) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleLaunch = (portal) => {
    selectRole(portal.roleKey);
    navigate(portal.route);
  };

  const availablePortals = roles
    .filter((r) => PORTAL_CONFIG[r])
    .map((r) => ({
      roleKey: r,
      ...PORTAL_CONFIG[r],
      permissions: ROLE_PERMISSIONS[r] || [],
    }));

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col pb-12">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <header className="relative border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/login")}
            className="hover:bg-accent text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-wide uppercase text-primary">Workspace</span>
            </div>
            <h1 className="text-xl font-bold">Portal Selector</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
          <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="text-sm">
            Log Out
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 pt-10">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Select Portal</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your account has access to multiple portals. Choose one to continue.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {availablePortals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Card
                  key={portal.roleKey}
                  className="flex flex-col border border-border bg-card/40 hover:bg-card/75 hover:border-primary/30 transition-all duration-300 shadow-md group relative overflow-hidden cursor-pointer"
                  onClick={() => handleLaunch(portal)}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-secondary transition-all duration-300" />

                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 border border-border group-hover:border-primary/20 group-hover:bg-primary/10 text-primary transition-all duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5">
                      <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                        {portal.label}
                      </CardTitle>
                      <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-mono">
                        {portal.id}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    <CardDescription className="text-xs leading-normal text-muted-foreground">
                      {portal.description}
                    </CardDescription>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Access Scope
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {portal.permissions.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 pb-4">
                    <Button
                      className="w-full bg-primary/5 group-hover:bg-primary text-foreground group-hover:text-primary-foreground border border-border group-hover:border-primary transition-all duration-300 flex items-center justify-center gap-1.5 font-medium text-xs h-9"
                      onClick={(e) => { e.stopPropagation(); handleLaunch(portal); }}
                    >
                      Launch Portal
                      <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
