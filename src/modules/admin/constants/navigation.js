import {
  UserPlus,
  MapPin,
  CalendarPlus,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";

export const CRM_NAV_GROUPS = [
  {
    label: "Leads",
    items: [
      { label: "New lead", href: ROUTES.ADMIN.LEADS_NEW, icon: UserPlus },
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
