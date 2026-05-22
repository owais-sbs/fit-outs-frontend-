import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./shared/context/auth-context";
import { ROLES } from "./shared/constants/roles";
import { ROUTES } from "./shared/constants/routes";

import ProtectedRoute from "./app/routes/protected-route";
import RoleRoute from "./app/routes/role-route";

import Login from "./modules/auth/pages/login";
import RolesManagement from "./modules/auth/pages/roles-management";

import SuperAdminLayout from "./modules/super-admin/layouts/SuperAdminLayout";
import SuperAdminDashboard from "./modules/super-admin/pages/SuperAdminDashboard";
import TenantsPage from "./modules/super-admin/pages/TenantsPage";
import TenantDetailPage from "./modules/super-admin/pages/TenantDetailPage";
import PlansPage from "./modules/super-admin/pages/PlansPage";
import UsersPage from "./modules/super-admin/pages/UsersPage";
import PermissionsPage from "./modules/super-admin/pages/PermissionsPage";
import ReportsPage from "./modules/super-admin/pages/ReportsPage";
import SettingsPage from "./modules/super-admin/pages/SettingsPage";
import AdminLayout from "./modules/admin/layouts/AdminLayout";
import {
  PipelinePage,
  LeadIntakePage,
  LeadDetailPage,
  CrmReportsPage,
  SiteVisitsPage,
  SiteVisitSchedulePage,
  SiteVisitReportPage,
  LeadsListPage,
  FollowUpsPage,
  FollowUpDetailPage,
  LeadSourcesPage,
  ClientConversionPage,
  ClientDetailPage,
  ActivityLogsPage,
  NotificationsPage,
  ProposalManagementPage,
  NegotiationTrackingPage,
  PaymentCollectionPage,
  CRMAnalyticsDashboard,
  TeamPerformancePage,
  LostLeadsPage,
  WonProjectsPage,
  QualifiedLeadsPage,
  ProjectsPage,
} from "./modules/admin/pages";
import AdminDashboard from "./modules/admin/pages/dashboard";
import AdminSettingsPage from "./modules/admin/pages/SettingsPage";
import BusinessOwnerDashboard from "./modules/business-owner/pages/dashboard";
import ProjectManagerDashboard from "./modules/project-manager/pages/dashboard";
import DesignerDashboard from "./modules/designer/pages/dashboard";
import QASDashboard from "./modules/qas/pages/dashboard";
import FinanceDashboard from "./modules/finance/pages/dashboard";
import SubcontractorDashboard from "./modules/subcontractor/pages/dashboard";
import ClientDashboard from "./modules/client/pages/dashboard";
import SalesDashboard from "./modules/sales/pages/dashboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes */}
            <Route path={ROUTES.AUTH.LOGIN} element={<Login />} />
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

            {/* ADMIN — dashboard & CRM & site visits */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SALES]}>
                    <AdminLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }>
              <Route index element={<AdminDashboard />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="leads" element={<LeadsListPage />} />
              <Route path="leads/new" element={<LeadIntakePage />} />
              <Route path="leads/qualified" element={<QualifiedLeadsPage />} />
              <Route path="leads/:leadId" element={<LeadDetailPage />} />
              <Route path="follow-ups" element={<FollowUpsPage />} />
              <Route path="follow-ups/:followUpId" element={<FollowUpDetailPage />} />
              <Route path="lead-sources" element={<LeadSourcesPage />} />
              <Route path="client-conversion" element={<ClientConversionPage />} />
              <Route path="clients/:clientId" element={<ClientDetailPage />} />
              <Route path="activity-logs" element={<ActivityLogsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="proposals" element={<ProposalManagementPage />} />
              <Route path="negotiations" element={<NegotiationTrackingPage />} />
              <Route path="payments" element={<PaymentCollectionPage />} />
              <Route path="crm-analytics" element={<CRMAnalyticsDashboard />} />
              <Route path="team-performance" element={<TeamPerformancePage />} />
              <Route path="lost-leads" element={<LostLeadsPage />} />
              <Route path="won-projects" element={<WonProjectsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="reports" element={<CrmReportsPage />} />
              <Route path="site-visits" element={<SiteVisitsPage />} />
              <Route path="site-visits/schedule" element={<SiteVisitSchedulePage />} />
              <Route path="site-visits/:visitId/report" element={<SiteVisitReportPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
            <Route
              path={ROUTES.BUSINESS_OWNER.DASHBOARD}
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.BUSINESS_OWNER]}>
                    <BusinessOwnerDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PROJECT_MANAGER.DASHBOARD}
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.PROJECT_MANAGER]}>
                    <ProjectManagerDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
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
              path={ROUTES.SUBCONTRACTOR.DASHBOARD}
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.SUBCONTRACTOR]}>
                    <SubcontractorDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.CLIENT.DASHBOARD}
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.CLIENT]}>
                    <ClientDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
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
