import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  UserRound,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";

export const SUPER_ADMIN_NAV_GROUPS = [
  {
    label: "Platform",
    items: [
      { label: "Dashboard", href: ROUTES.SUPER_ADMIN.DASHBOARD, icon: LayoutDashboard, end: true },
      { label: "Companies", href: ROUTES.SUPER_ADMIN.COMPANIES, icon: Building2 },
      { label: "Users", href: ROUTES.SUPER_ADMIN.USERS, icon: Users },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Subscription Plans", href: ROUTES.SUPER_ADMIN.PLANS, icon: CreditCard },
      { label: "Payments", href: ROUTES.SUPER_ADMIN.PAYMENTS, icon: Wallet },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Reports", href: ROUTES.SUPER_ADMIN.REPORTS, icon: BarChart3 },
      { label: "My Profile", href: ROUTES.SUPER_ADMIN.PROFILE, icon: UserRound },
      { label: "Settings", href: ROUTES.SUPER_ADMIN.SETTINGS, icon: Settings },
    ],
  },
];

/** @deprecated Use SUPER_ADMIN_NAV_GROUPS */
export const SUPER_ADMIN_NAV = SUPER_ADMIN_NAV_GROUPS.flatMap((g) => g.items);
