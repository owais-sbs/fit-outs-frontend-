import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/shared/context/auth-context";
import { ROLES, ROLE_LABELS, ROLE_PERMISSIONS } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShieldAlert, 
  Users2, 
  Building2, 
  ClipboardCheck, 
  Palette, 
  ShieldCheck, 
  Coins, 
  Hammer, 
  HeartHandshake, 
  TrendingUp, 
  ArrowLeft,
  Sparkles,
  Search,
  ExternalLink
} from "lucide-react";

// Map roles to corresponding premium icons
const ROLE_ICONS = {
  [ROLES.SUPER_ADMIN]: ShieldAlert,
  [ROLES.ADMIN]: Users2,
  [ROLES.BUSINESS_OWNER]: Building2,
  [ROLES.PROJECT_MANAGER]: ClipboardCheck,
  [ROLES.DESIGNER]: Palette,
  [ROLES.QAS]: ShieldCheck,
  [ROLES.FINANCE]: Coins,
  [ROLES.SUBCONTRACTOR]: Hammer,
  [ROLES.CLIENT]: HeartHandshake,
  [ROLES.SALES]: TrendingUp,
};

// Map roles to rich descriptions for training/demo mode
const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: "Root-level control across all sub-organizations, system audits, and global configuration values.",
  [ROLES.ADMIN]: "User management, access level control, global project monitoring, and platform reporting.",
  [ROLES.BUSINESS_OWNER]: "High-level financial insights, revenue tracking, general settings, and operational metrics.",
  [ROLES.PROJECT_MANAGER]: "Full fit-out execution control, team task delegation, site logs, and delivery schedule tracking.",
  [ROLES.DESIGNER]: "Floorplan and layout blue-printing, asset selection, 3D visualization, and design revisions.",
  [ROLES.QAS]: "Quality control oversight, compliance inspections, safety audit reporting, and sign-off validations.",
  [ROLES.FINANCE]: "Billing management, invoice creation, subcontractor accounts payable, and payment status updates.",
  [ROLES.SUBCONTRACTOR]: "On-site execution details, task completion updates, safety logs, and field material sheets.",
  [ROLES.CLIENT]: "Client workspace for tracking progress milestones, floorplan previews, invoicing approvals, and chat.",
  [ROLES.SALES]: "Client onboarding pipeline, proposal generation, client contract drafting, and lead estimations.",
};

export default function RolesManagement() {
  const navigate = useNavigate();
  const { selectRole } = useAuth();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectRole = (role) => {
    // Select the role in the shared auth context
    selectRole(role);
    
    // Determine target dashboard path based on selected role
    const roleRoutes = {
      [ROLES.SUPER_ADMIN]: ROUTES.SUPER_ADMIN.DASHBOARD,
      [ROLES.ADMIN]: ROUTES.ADMIN.DASHBOARD,
      [ROLES.BUSINESS_OWNER]: ROUTES.BUSINESS_OWNER.DASHBOARD,
      [ROLES.PROJECT_MANAGER]: ROUTES.PROJECT_MANAGER.DASHBOARD,
      [ROLES.DESIGNER]: ROUTES.DESIGNER.DASHBOARD,
      [ROLES.QAS]: ROUTES.QAS.DASHBOARD,
      [ROLES.FINANCE]: ROUTES.FINANCE.DASHBOARD,
      [ROLES.SUBCONTRACTOR]: ROUTES.SUBCONTRACTOR.DASHBOARD,
      [ROLES.CLIENT]: ROUTES.CLIENT.DASHBOARD,
      [ROLES.SALES]: ROUTES.SALES.DASHBOARD,
    };
    
    const targetPath = roleRoutes[role] || "/login";
    navigate(targetPath);
  };

  const rolesArray = Object.keys(ROLES).map((key) => {
    const value = ROLES[key];
    return {
      id: value,
      label: ROLE_LABELS[value] || value,
      icon: ROLE_ICONS[value] || ShieldAlert,
      description: ROLE_DESCRIPTIONS[value] || "No description provided.",
      permissions: ROLE_PERMISSIONS[value] || [],
    };
  });

  const filteredRoles = rolesArray.filter((role) =>
    role.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col pb-12">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Header Bar */}
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
              {isDemoMode && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Training Mode
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold">Portal Role Selector</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative max-w-xs hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-64 bg-background/50 border-border"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/login")}
            className="border-border hover:bg-accent text-sm"
          >
            Log Out
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">Active Application Roles</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Fitouts features granular role-based access. Select any operational profile below to immediately launch its dashboard workspace and simulate user flows.
            </p>
          </div>

          {/* Search bar for smaller viewports */}
          <div className="relative w-full sm:hidden">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {/* Grid Layout of Roles */}
          {filteredRoles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRoles.map((role) => {
                const IconComponent = role.icon;
                return (
                  <Card 
                    key={role.id} 
                    className="flex flex-col border border-border bg-card/40 hover:bg-card/75 hover:border-primary/30 transition-all duration-300 shadow-md group relative overflow-hidden"
                  >
                    {/* Top Accent Strip */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-secondary transition-all duration-300" />
                    
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 border border-border group-hover:border-primary/20 group-hover:bg-primary/10 text-primary transition-all duration-300">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-base font-bold group-hover:text-primary transition-colors duration-200">
                          {role.label}
                        </CardTitle>
                        <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-mono">
                          {role.id}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      <CardDescription className="text-xs leading-normal text-muted-foreground line-clamp-3">
                        {role.description}
                      </CardDescription>

                      {/* Permissions List */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Access Scope ({role.permissions[0] === "*" ? "Unlimited" : role.permissions.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {role.permissions[0] === "*" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border">
                              All Permissions
                            </span>
                          ) : (
                            role.permissions.slice(0, 3).map((perm) => (
                              <span 
                                key={perm} 
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors"
                              >
                                {perm}
                              </span>
                            ))
                          )}
                          {role.permissions.length > 3 && role.permissions[0] !== "*" && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                              +{role.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-2 pb-4">
                      <Button
                        onClick={() => handleSelectRole(role.id)}
                        className="w-full bg-primary/5 group-hover:bg-primary text-foreground group-hover:text-primary-foreground border border-border group-hover:border-primary transition-all duration-300 flex items-center justify-center gap-1.5 font-medium text-xs h-9"
                      >
                        Launch Portal
                        <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card/20">
              <p className="text-muted-foreground text-sm">No profiles match your search criteria.</p>
              <Button 
                variant="link" 
                onClick={() => setSearchQuery("")}
                className="text-primary mt-2"
              >
                Clear Search Query
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
