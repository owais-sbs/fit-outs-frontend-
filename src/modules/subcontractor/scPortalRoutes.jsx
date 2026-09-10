import ScPortalGate from "./components/ScPortalGate";
import ScPlaceholderPage from "./pages/ScPlaceholderPage";
import SubcontractorDocumentsPage from "./pages/SubcontractorDocumentsPage";
import SubcontractorRfqInboxPage from "./pages/SubcontractorRfqInboxPage";
import SubcontractorRfqDetailPage from "./pages/SubcontractorRfqDetailPage";
import SubcontractorMyBidsPage from "./pages/SubcontractorMyBidsPage";
import SubcontractorAwardPacksPage from "./pages/SubcontractorAwardPacksPage";
import SubcontractorCertificatesPage from "./pages/SubcontractorCertificatesPage";
import SubcontractorRetentionPage from "./pages/SubcontractorRetentionPage";
import SubcontractorBackChargesPage from "./pages/SubcontractorBackChargesPage";
import SubcontractorScorecardPage from "./pages/SubcontractorScorecardPage";
import SubcontractorSubmittalsPage from "./pages/SubcontractorSubmittalsPage";
import SubcontractorSnagsPage from "./pages/SubcontractorSnagsPage";
import SubcontractorNotificationsPage from "./pages/SubcontractorNotificationsPage";
import { SC_ROLES } from "./utils/scPortalRoles";

const A = SC_ROLES.ADMIN;
const E = SC_ROLES.ESTIMATOR;
const S = SC_ROLES.SUPERVISOR;
const Q = SC_ROLES.QS;
const D = SC_ROLES.DOC_CONTROLLER;

/** Route → allowed portal roles (SC Admin always passes the gate). */
export const SC_ROUTE_ROLES = {
  projects: [A, S],
  locations: [A, S],
  packages: [A],
  tasks: [A, S],
  "progress-logs": [A, S],
  documents: [A, S],
  claims: [A, Q],
  payments: [A, Q],
  variations: [A, Q],
  boq: [A, E],
  company: [A],
  organization: [A],
  team: [A],
  workers: [A],
  rfq: [A, E],
  clarifications: [A, E],
  "my-bids": [A, E],
  "award-packs": [A, E],
  "material-requests": [A, S],
  snags: [A, S],
  inspections: [A, S],
  hse: [A, S],
  certificates: [A, Q],
  retention: [A, Q],
  "back-charges": [A, Q],
  scorecard: [A, Q],
  awards: [A],
  notifications: [A],
  submittals: [A, D],
  "review-status": [A, D],
  "as-builts": [A, D],
  "drawing-register": [A, D],
};

export function gate(roles, element) {
  return <ScPortalGate roles={roles}>{element}</ScPortalGate>;
}

export const SC_PLACEHOLDER_ROUTES = [
  {
    path: "clarifications",
    roles: [A, E],
    title: "Clarifications",
    subtitle: "Ask questions and view addenda broadcast to all bidders.",
    specRef: "SC Estimator §2",
  },
  {
    path: "inspections",
    roles: [A, S],
    title: "Inspection requests",
    subtitle: "Submit inspections with notice period and track results.",
    specRef: "SC Supervisor §3",
  },
  {
    path: "hse",
    roles: [A, S],
    title: "HSE",
    subtitle: "Toolbox talks, permits to work, incident reporting and induction status.",
    specRef: "SC Supervisor §3",
  },
  {
    path: "awards",
    roles: [A],
    title: "Awards & contracts",
    subtitle: "Digital subcontract agreements and e-signature status.",
    specRef: "SC Admin §1",
  },
  {
    path: "review-status",
    roles: [A, D],
    title: "Consultant review status",
    subtitle: "Review codes per submission and resubmission numbering.",
    specRef: "SC Document Controller §5",
  },
  {
    path: "as-builts",
    roles: [A, D],
    title: "As-builts",
    subtitle: "Upload and track as-built documentation packages.",
    specRef: "SC Document Controller §5",
  },
];

export function ScRfqInboxPage() {
  return gate([A, E], <SubcontractorRfqInboxPage />);
}

export function ScRfqDetailPage() {
  return gate([A, E], <SubcontractorRfqDetailPage />);
}

export function ScMyBidsPage() {
  return gate([A, E], <SubcontractorMyBidsPage />);
}

export function ScAwardPacksPage() {
  return gate([A, E], <SubcontractorAwardPacksPage />);
}

export function ScCertificatesPage() {
  return gate([A, Q], <SubcontractorCertificatesPage />);
}

export function ScRetentionPage() {
  return gate([A, Q], <SubcontractorRetentionPage />);
}

export function ScBackChargesPage() {
  return gate([A, Q], <SubcontractorBackChargesPage />);
}

export function ScScorecardPage() {
  return gate([A, Q], <SubcontractorScorecardPage />);
}

export function ScSnagsPage() {
  return gate([A, S], <SubcontractorSnagsPage />);
}

export function ScNotificationsPage() {
  return gate([A], <SubcontractorNotificationsPage />);
}

export function ScSubmittalsPage() {
  return gate([A, D], <SubcontractorSubmittalsPage />);
}

export function ScDrawingRegisterPage() {
  return gate([A, D], <SubcontractorDocumentsPage />);
}

export function placeholderElement({ path, title, subtitle, specRef, roles }) {
  return gate(
    roles,
    <ScPlaceholderPage title={title} subtitle={subtitle} specRef={specRef} />,
  );
}
