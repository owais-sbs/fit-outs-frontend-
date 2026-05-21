import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  Shield,
  BarChart3,
  Settings,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";

export const SUPER_ADMIN_NAV_GROUPS = [
  {
    label: "Platform",
    items: [
      { label: "Dashboard", href: ROUTES.SUPER_ADMIN.DASHBOARD, icon: LayoutDashboard, end: true },
      { label: "Tenants", href: ROUTES.SUPER_ADMIN.TENANTS, icon: Building2 },
      { label: "Subscription Plans", href: ROUTES.SUPER_ADMIN.PLANS, icon: CreditCard },
    ],
  },
  {
    label: "Access",
    items: [
      { label: "Users", href: ROUTES.SUPER_ADMIN.USERS, icon: Users },
      { label: "Permissions", href: ROUTES.SUPER_ADMIN.PERMISSIONS, icon: Shield },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Reports", href: ROUTES.SUPER_ADMIN.REPORTS, icon: BarChart3 },
      { label: "Settings", href: ROUTES.SUPER_ADMIN.SETTINGS, icon: Settings },
    ],
  },
];

/** @deprecated Use SUPER_ADMIN_NAV_GROUPS */
export const SUPER_ADMIN_NAV = SUPER_ADMIN_NAV_GROUPS.flatMap((g) => g.items);
