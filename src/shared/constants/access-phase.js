export const ACCESS_PHASE = {
  SUBSCRIBE: "SUBSCRIBE",
  ONBOARDING: "ONBOARDING",
  PORTAL: "PORTAL",
};

export function routeForAccessPhase(accessPhase, portalRoute) {
  if (accessPhase === ACCESS_PHASE.SUBSCRIBE) return "/subscribe";
  if (accessPhase === ACCESS_PHASE.ONBOARDING) return "/onboarding";
  return portalRoute || "/admin";
}
