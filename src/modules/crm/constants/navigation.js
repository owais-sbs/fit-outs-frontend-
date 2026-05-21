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
      { label: "Pipeline", href: ROUTES.CRM.PIPELINE, icon: Kanban },
      { label: "New lead", href: ROUTES.CRM.LEADS_NEW, icon: UserPlus },
      { label: "Reports", href: ROUTES.CRM.REPORTS, icon: BarChart3 },
    ],
  },
  {
    label: "Site visits",
    items: [
      { label: "All visits", href: ROUTES.CRM.SITE_VISITS, icon: MapPin },
      { label: "Schedule visit", href: ROUTES.CRM.SITE_VISIT_SCHEDULE, icon: CalendarPlus },
    ],
  },
];
