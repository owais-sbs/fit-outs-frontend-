import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./shared/context/auth-context";
import { ROLES } from "./shared/constants/roles";
import { ROUTES } from "./shared/constants/routes";

import ProtectedRoute from "./app/routes/protected-route";
import RoleRoute from "./app/routes/role-route";

import Login from "./modules/auth/pages/login";
import ForgotPasswordPage from "./modules/auth/pages/forgot-password";
import SetPasswordPage from "./modules/auth/pages/set-password";
import RolesManagement from "./modules/auth/pages/roles-management";

import SuperAdminLayout from "./modules/super-admin/layouts/SuperAdminLayout";
import SuperAdminDashboard from "./modules/super-admin/pages/SuperAdminDashboard";
import TenantsPage from "./modules/super-admin/pages/TenantsPage";
import CreateCompanyPage from "./modules/super-admin/pages/CreateCompanyPage";
import TenantDetailPage from "./modules/super-admin/pages/TenantDetailPage";
import PlansPage from "./modules/super-admin/pages/PlansPage";
import UsersPage from "./modules/super-admin/pages/UsersPage";
import PermissionsPage from "./modules/super-admin/pages/PermissionsPage";
import ReportsPage from "./modules/super-admin/pages/ReportsPage";
import SettingsPage from "./modules/super-admin/pages/SettingsPage";
import AdminPortalLayout from "./modules/admin/layouts/AdminPortalLayout";
import {
  LeadIntakePage,
  LeadDetailPage,
  SiteVisitsPage,
  SiteVisitSchedulePage,
  SiteVisitReportPage,
  LeadsListPage,
  FollowUpDetailPage,
  LeadSourcesPage,
  EmployeesPage,
  AddEmployeePage,
  EmployeeDetailPage,
  CalendarPage,
  ProjectsPage,
  CreateProjectPage,
  ProjectDetailPage,
  ProjectRequestsPage,
  RoomTaskDetailPage,
  RoomChatPage,
  ClientsPage,
  AddClientPage,
  ClientDetailPage,
  CommunicationsPage,
  RoomConfigurationPage,
  WorkItemConfigurationPage,
  MaterialConfigurationPage,
  AppendixMastersPage,
  StockDashboardPage,
  GoodsReceiptPage,
  StockIssuePage,
  MovementHistoryPage,
} from "./modules/admin/pages";

import {
  DesignRequestsPage,
  DesignOptionsPage,
  DesignApprovalsPage,
} from "./modules/admin/pages/design-qas";

import { BoqFlowPage } from "./modules/admin/pages/boq";
import BoqApprovalInboxPage from "./modules/admin/pages/boq/BoqApprovalInboxPage";

import AdminDashboard from "./modules/admin/pages/dashboard";
import DirectorLayout from "./modules/business-owner/layouts/DirectorLayout";
import DirectorDashboard from "./modules/business-owner/pages/DirectorDashboard";
import DirectorProcurementPage from "./modules/business-owner/pages/DirectorProcurementPage";
import DirectorProjectsPage from "./modules/business-owner/pages/DirectorProjectsPage";
import DirectorCommercialPage from "./modules/business-owner/pages/DirectorCommercialPage";
import DirectorCrmPage from "./modules/business-owner/pages/DirectorCrmPage";
import ProjectManagerDashboard from "./modules/project-manager/pages/dashboard";
import PmLayout from "./modules/project-manager/layouts/PmLayout";
import DesignerDashboard from "./modules/designer/pages/dashboard";
import QASDashboard from "./modules/qas/pages/dashboard";
import FinanceDashboard from "./modules/finance/pages/dashboard";
import SubcontractorDashboard from "./modules/subcontractor/pages/dashboard";
import SubcontractorLayout from "./modules/subcontractor/layouts/SubcontractorLayout";
import SubcontractorPackagesPage from "./modules/subcontractor/pages/SubcontractorPackagesPage";
import SubcontractorClaimsPage from "./modules/subcontractor/pages/SubcontractorClaimsPage";
import SubcontractorProjectsPage from "./modules/subcontractor/pages/SubcontractorProjectsPage";
import SubcontractorProjectDetailPage from "./modules/subcontractor/pages/SubcontractorProjectDetailPage";
import SubcontractorLocationsPage from "./modules/subcontractor/pages/SubcontractorLocationsPage";
import {
  ClientLayout,
  ClientDashboard,
  MyDesignsPage,
  DesignDetailPage,
  PendingApprovalPage,
  RevisionHistoryPage,
  ApprovedDesignsPage,
  ClientDocumentsPage,
  ClientInvoicesPage,
  ClientSettingsPage,
  MyProjectsPage,
  NewProjectRequestPage,
  ClientProjectDetailPage,
  ClientBoqApprovalsPage,
} from "./modules/client";
import ClientRoomTaskPage from "./modules/client/pages/ClientRoomTaskPage";
import SalesDashboard from "./modules/sales/pages/dashboard";
import EmployeeLayout from "./modules/employee/layouts/EmployeeLayout";
import EmployeeDashboard from "./modules/employee/pages/EmployeeDashboard";
import EmployeeProjectsPage from "./modules/employee/pages/EmployeeProjectsPage";
import EmployeeCalendarPage from "./modules/employee/pages/EmployeeCalendarPage";
import EmployeeSiteVisitsPage from "./modules/employee/pages/EmployeeSiteVisitsPage";
import EmployeeMyActivitiesPage from "./modules/employee/pages/EmployeeMyActivitiesPage";
import ProjectSchedulePage from "./modules/admin/pages/schedule/ProjectSchedulePage";
import ScheduleHubPage from "./modules/admin/pages/schedule/ScheduleHubPage";
import MaterialPlanPage from "./modules/admin/pages/planning/MaterialPlanPage";
import ResourcePlanPage from "./modules/admin/pages/planning/ResourcePlanPage";
import ValidationInboxPage from "./modules/admin/pages/validation/ValidationInboxPage";
import QualityTemplatesPage from "./modules/admin/pages/validation/QualityTemplatesPage";
import ProjectSnagsPage from "./modules/admin/pages/snags/ProjectSnagsPage";
import ProjectDocumentsPage from "./modules/admin/pages/documents/ProjectDocumentsPage";
import ProjectReportingPage from "./modules/admin/pages/reporting/ProjectReportingPage";
import ProjectBillingPage from "./modules/admin/pages/billing/ProjectBillingPage";
import ProjectSubcontractorPage from "./modules/admin/pages/subcontractor/ProjectSubcontractorPage";
import AdminSettingsPage from "./modules/admin/pages/SettingsPage";
import ClientSnagsPage from "./modules/client/pages/ClientSnagsPage";

const ProjectDrawingsPage = lazy(() => import("./modules/admin/pages/drawings/ProjectDrawingsPage"));
const QtoWorkspacePage = lazy(() => import("./modules/admin/pages/drawings/QtoWorkspacePage"));

function LazyDrawingPage({ children }) {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
      {children}
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes */}
            <Route path={ROUTES.AUTH.LOGIN} element={<Login />} />
            <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.AUTH.SET_PASSWORD} element={<SetPasswordPage />} />
            <Route path="/roles" element={<RolesManagement />} />

            {/* Super Admin — nested layout + pages */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                    <SuperAdminLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="tenants/new" element={<CreateCompanyPage />} />
              <Route path="tenants/:tenantId" element={<TenantDetailPage />} />
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="permissions" element={<PermissionsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="site-visits" element={<SiteVisitsPage />} />
              <Route path="site-visits/schedule" element={<SiteVisitSchedulePage />} />
              <Route path="site-visits/:visitId/report" element={<SiteVisitReportPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* ADMIN — leads & site visits only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SALES, ROLES.QS, ROLES.SENIOR_QS, ROLES.BUSINESS_OWNER]}>
                    <AdminPortalLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }>
              <Route index element={<AdminDashboard />} />
              <Route path="leads" element={<LeadsListPage />} />
              <Route path="leads/recent" element={<Navigate to="/admin/leads?view=new" replace />} />
              <Route path="leads/new" element={<LeadIntakePage />} />
              <Route path="leads/qualified" element={<Navigate to="/admin/leads?view=qualified" replace />} />
              <Route path="leads/:leadId" element={<LeadDetailPage />} />
              <Route path="follow-ups" element={<Navigate to="/admin/leads?view=follow-ups" replace />} />
              <Route path="follow-ups/:followUpId" element={<FollowUpDetailPage />} />
              <Route path="lead-sources" element={<LeadSourcesPage />} />
              <Route path="lost-leads" element={<Navigate to="/admin/leads?view=lost" replace />} />
              <Route path="site-visits" element={<SiteVisitsPage />} />
              <Route path="site-visits/schedule" element={<SiteVisitSchedulePage />} />
              <Route path="site-visits/upcoming" element={<Navigate to="/admin/site-visits?tab=upcoming" replace />} />
              <Route path="site-visits/completed" element={<Navigate to="/admin/site-visits?tab=completed" replace />} />
              <Route path="site-visits/reports" element={<Navigate to="/admin/site-visits?tab=reports" replace />} />
              <Route path="site-visits/checklists" element={<Navigate to="/admin/site-visits?tab=checklists" replace />} />
              <Route path="site-visits/:visitId/report" element={<SiteVisitReportPage />} />
              <Route path="design-qas/requests" element={<DesignRequestsPage />} />
              <Route path="design-qas/options" element={<DesignOptionsPage />} />
              <Route path="design-qas/approvals" element={<DesignApprovalsPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="employees/new" element={<AddEmployeePage />} />
              <Route path="employees/:employeeId" element={<EmployeeDetailPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/new" element={<CreateProjectPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="projects/:projectId/schedule" element={<ProjectSchedulePage />} />
              <Route path="projects/:projectId/material-plan" element={<MaterialPlanPage />} />
              <Route path="projects/:projectId/resource-plan" element={<ResourcePlanPage />} />
              <Route path="projects/:projectId/validation" element={<ValidationInboxPage />} />
              <Route path="projects/:projectId/snags" element={<ProjectSnagsPage />} />
              <Route path="projects/:projectId/documents" element={<ProjectDocumentsPage />} />
              <Route path="projects/:projectId/reporting" element={<ProjectReportingPage />} />
              <Route path="projects/:projectId/billing" element={<ProjectBillingPage />} />
              <Route path="projects/:projectId/subcontractors" element={<ProjectSubcontractorPage />} />
              <Route path="validation/inbox" element={<ValidationInboxPage />} />
              <Route path="quality-templates" element={<QualityTemplatesPage />} />
              <Route path="schedule" element={<ScheduleHubPage />} />
              <Route path="projects/:projectId/drawings" element={<LazyDrawingPage><ProjectDrawingsPage /></LazyDrawingPage>} />
              <Route path="projects/:projectId/drawings/:drawingId/qto" element={<LazyDrawingPage><QtoWorkspacePage /></LazyDrawingPage>} />
              <Route path="projects/:projectId/room-tasks/:taskId" element={<RoomTaskDetailPage />} />
              <Route path="projects/:projectId/rooms/:roomId/chat" element={<RoomChatPage />} />
              <Route path="leads/project-requests" element={<ProjectRequestsPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/new" element={<AddClientPage />} />
              <Route path="clients/email" element={<Navigate to={ROUTES.ADMIN.COMMUNICATIONS} replace />} />
              <Route path="communications" element={<CommunicationsPage />} />
              <Route path="clients/:clientId" element={<ClientDetailPage />} />
              <Route path="project-configuration/room" element={<RoomConfigurationPage />} />
              <Route path="project-configuration/work-item" element={<WorkItemConfigurationPage />} />
              <Route path="project-configuration/materials" element={<MaterialConfigurationPage />} />
              <Route path="project-configuration/appendices" element={<AppendixMastersPage />} />
              <Route path="procurement/stock" element={<StockDashboardPage />} />
              <Route path="procurement/receipt" element={<GoodsReceiptPage />} />
              <Route path="procurement/issue" element={<StockIssuePage />} />
              <Route path="procurement/movements" element={<MovementHistoryPage />} />
              <Route path="qas" element={<BoqFlowPage />} />
              <Route path="boq" element={<BoqFlowPage />} />
              <Route path="boq/inbox" element={<BoqApprovalInboxPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />

            </Route>

            {/* Director Command Center */}
            <Route
              path="/business-owner"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.BUSINESS_OWNER]}>
                    <DirectorLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }>
              <Route index element={<DirectorDashboard />} />
              <Route path="boq/inbox" element={<BoqApprovalInboxPage />} />
              <Route path="procurement" element={<DirectorProcurementPage />} />
              <Route path="projects" element={<DirectorProjectsPage />} />
              <Route path="commercial" element={<DirectorCommercialPage />} />
              <Route path="crm" element={<DirectorCrmPage />} />
            </Route>

            <Route
              path="/project-manager"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.PROJECT_MANAGER]}>
                    <PmLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<ProjectManagerDashboard />} />
              <Route path="boq/inbox" element={<BoqApprovalInboxPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/new" element={<CreateProjectPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="projects/:projectId/schedule" element={<ProjectSchedulePage />} />
              <Route path="projects/:projectId/material-plan" element={<MaterialPlanPage />} />
              <Route path="projects/:projectId/resource-plan" element={<ResourcePlanPage />} />
              <Route path="projects/:projectId/validation" element={<ValidationInboxPage />} />
              <Route path="projects/:projectId/snags" element={<ProjectSnagsPage />} />
              <Route path="projects/:projectId/documents" element={<ProjectDocumentsPage />} />
              <Route path="projects/:projectId/reporting" element={<ProjectReportingPage />} />
              <Route path="projects/:projectId/billing" element={<ProjectBillingPage />} />
              <Route path="projects/:projectId/subcontractors" element={<ProjectSubcontractorPage />} />
              <Route path="validation/inbox" element={<ValidationInboxPage />} />
              <Route path="quality-templates" element={<QualityTemplatesPage />} />
              <Route path="schedule" element={<ScheduleHubPage />} />
              <Route path="site-visits" element={<SiteVisitsPage />} />
              <Route path="site-visits/:visitId/report" element={<SiteVisitReportPage />} />
              <Route path="communications" element={<CommunicationsPage />} />
            </Route>
            <Route
              path={ROUTES.DESIGNER.DASHBOARD}
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.DESIGNER]}>
                    <DesignerDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.QAS.DASHBOARD}
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.QAS]}>
                    <QASDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.FINANCE.DASHBOARD}
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.FINANCE]}>
                    <FinanceDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subcontractor"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.SUBCONTRACTOR]}>
                    <SubcontractorLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<SubcontractorDashboard />} />
              <Route path="projects" element={<SubcontractorProjectsPage />} />
              <Route path="projects/:projectId" element={<SubcontractorProjectDetailPage />} />
              <Route path="locations" element={<SubcontractorLocationsPage />} />
              <Route path="packages" element={<SubcontractorPackagesPage />} />
              <Route path="claims" element={<SubcontractorClaimsPage />} />
            </Route>
            <Route
              path={ROUTES.CLIENT.DASHBOARD}
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.CLIENT]}>
                    <ClientLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<ClientDashboard />} />
              <Route path="designs" element={<MyDesignsPage />} />
              <Route path="designs/pending" element={<PendingApprovalPage />} />
              <Route path="designs/revisions" element={<RevisionHistoryPage />} />
              <Route path="designs/approved" element={<ApprovedDesignsPage />} />
              <Route path="boq-approvals" element={<ClientBoqApprovalsPage />} />
              <Route path="designs/:id" element={<DesignDetailPage />} />
              <Route path="documents" element={<ClientDocumentsPage />} />
              <Route path="snags" element={<ClientSnagsPage />} />
              <Route path="invoices" element={<ClientInvoicesPage />} />
              <Route path="communications" element={<CommunicationsPage clientMode />} />
              <Route path="settings" element={<ClientSettingsPage />} />
              <Route path="projects/my" element={<MyProjectsPage />} />
              <Route path="projects/request" element={<NewProjectRequestPage />} />
              <Route path="projects/:projectId" element={<ClientProjectDetailPage />} />
              <Route path="projects/:projectId/room-tasks/:taskId" element={<ClientRoomTaskPage />} />
              <Route path="projects/:projectId/rooms/:roomId/chat" element={<RoomChatPage clientMode />} />
            </Route>
            <Route
              path={ROUTES.SALES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.SALES]}>
                    <SalesDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* Employee / Site Engineer Portal */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.EMPLOYEE, ROLES.SITE_ENGINEER]}>
                    <EmployeeLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<EmployeeDashboard />} />
              <Route path="projects" element={<EmployeeProjectsPage />} />
              <Route path="activities" element={<EmployeeMyActivitiesPage />} />
              <Route path="calendar" element={<EmployeeCalendarPage />} />
              <Route path="site-visits" element={<EmployeeSiteVisitsPage />} />
              <Route path="site-visits/:visitId/report" element={<SiteVisitReportPage />} />
              <Route path="communications" element={<CommunicationsPage />} />
            </Route>

            {/* Fallback routes */}
            <Route path="/" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
            <Route path="*" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
