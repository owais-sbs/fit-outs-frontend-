/** Subcontractor portal role identifiers (match backend ScPortalRole). */
export const SC_ROLES = {
  ADMIN: "SC_ADMIN",
  ESTIMATOR: "SC_ESTIMATOR",
  SUPERVISOR: "SC_SUPERVISOR",
  QS: "SC_QS",
  DOC_CONTROLLER: "SC_DOC_CONTROLLER",
};

export const ALL_SC_ROLES = Object.values(SC_ROLES);

export function isScAdmin(portalRole) {
  return portalRole === SC_ROLES.ADMIN;
}

export function canSeeNavItem(item, portalRole) {
  if (!portalRole || !item?.roles?.length) return false;
  if (isScAdmin(portalRole)) return true;
  return item.roles.includes(portalRole);
}

export function roleLabel(portalRole) {
  switch (portalRole) {
    case SC_ROLES.ADMIN:
      return "SC Admin";
    case SC_ROLES.ESTIMATOR:
      return "SC Estimator";
    case SC_ROLES.SUPERVISOR:
      return "SC Supervisor";
    case SC_ROLES.QS:
      return "SC QS / Accounts";
    case SC_ROLES.DOC_CONTROLLER:
      return "SC Document Controller";
    default:
      return "Subcontractor";
  }
}
