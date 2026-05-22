import {
  Kanban,
  UserPlus,
  BarChart3,
  MapPin,
  CalendarPlus,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";

export const CRM_NAV_GROUPS = [
  {
    label: "CRM",
    items: [
      { label: "Pipeline", href: ROUTES.ADMIN.PIPELINE, icon: Kanban },
      { label: "New lead", href: ROUTES.ADMIN.LEADS_NEW, icon: UserPlus },
      { label: "Reports", href: ROUTES.ADMIN.REPORTS, icon: BarChart3 },
    ],
  },
  {
    label: "Site visits",
    items: [
      { label: "All visits", href: ROUTES.ADMIN.SITE_VISITS, icon: MapPin },
      { label: "Schedule visit", href: ROUTES.ADMIN.SITE_VISIT_SCHEDULE, icon: CalendarPlus },
    ],
  },
];
