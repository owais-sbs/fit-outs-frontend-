import { useLocation } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";

/** Resolve site-visit list/report base routes for admin, PM, or employee shells. */
export function useSiteVisitPortalRoutes() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/project-manager")) {
    return {
      list: ROUTES.PROJECT_MANAGER.SITE_VISITS,
      report: ROUTES.PROJECT_MANAGER.SITE_VISIT_REPORT,
      schedule: ROUTES.ADMIN.SITE_VISIT_SCHEDULE,
      canSchedule: false,
    };
  }
  if (pathname.startsWith("/employee")) {
    return {
      list: ROUTES.EMPLOYEE.SITE_VISITS,
      report: ROUTES.EMPLOYEE.SITE_VISIT_REPORT,
      schedule: null,
      canSchedule: false,
    };
  }
  return {
    list: ROUTES.ADMIN.SITE_VISITS,
    report: ROUTES.ADMIN.SITE_VISIT_REPORT,
    schedule: ROUTES.ADMIN.SITE_VISIT_SCHEDULE,
    canSchedule: true,
  };
}
