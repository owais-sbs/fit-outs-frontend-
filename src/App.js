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
  LeadIntakePage,
  LeadDetailPage,
  SiteVisitsPage,
  SiteVisitSchedulePage,
  SiteVisitReportPage,
  LeadsListPage,
  FollowUpsPage,
  FollowUpDetailPage,
  LeadSourcesPage,
  LostLeadsPage,
  QualifiedLeadsPage,
  EmployeesPage,
  AddEmployeePage,
  EmployeeDetailPage,
  CalendarPage,
  ProjectsPage,
  CreateProjectPage,
  ProjectDetailPage,
  ProjectRequestsPage,
} from "./modules/admin/pages";
import AdminDashboard from "./modules/admin/pages/dashboard";
import BusinessOwnerDashboard from "./modules/business-owner/pages/dashboard";
import ProjectManagerDashboard from "./modules/project-manager/pages/dashboard";
import DesignerDashboard from "./modules/designer/pages/dashboard";
import QASDashboard from "./modules/qas/pages/dashboard";
import FinanceDashboard from "./modules/finance/pages/dashboard";
import SubcontractorDashboard from "./modules/subcontractor/pages/dashboard";
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
  ClientCommsPage,
  ClientSettingsPage,
  MyProjectsPage,
  NewProjectRequestPage,
  ClientProjectDetailPage,
} from "./modules/client";
import SalesDashboard from "./modules/sales/pages/dashboard";
import EmployeeLayout from "./modules/employee/layouts/EmployeeLayout";
import EmployeeDashboard from "./modules/employee/pages/EmployeeDashboard";
import EmployeeProjectsPage from "./modules/employee/pages/EmployeeProjectsPage";
import EmployeeCalendarPage from "./modules/employee/pages/EmployeeCalendarPage";

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
              <Route path="tenants/new" element={<TenantsPage />} />
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
                  <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SALES]}>
                    <AdminLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }>
              <Route index element={<AdminDashboard />} />
              <Route path="leads" element={<LeadsListPage />} />
              <Route path="leads/new" element={<LeadIntakePage />} />
              <Route path="leads/qualified" element={<QualifiedLeadsPage />} />
              <Route path="leads/:leadId" element={<LeadDetailPage />} />
              <Route path="follow-ups" element={<FollowUpsPage />} />
              <Route path="follow-ups/:followUpId" element={<FollowUpDetailPage />} />
              <Route path="lead-sources" element={<LeadSourcesPage />} />
              <Route path="lost-leads" element={<LostLeadsPage />} />
              <Route path="site-visits" element={<SiteVisitsPage />} />
              <Route path="site-visits/schedule" element={<SiteVisitSchedulePage />} />
              <Route path="site-visits/:visitId/report" element={<SiteVisitReportPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="employees/new" element={<AddEmployeePage />} />
              <Route path="employees/:employeeId" element={<EmployeeDetailPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/new" element={<CreateProjectPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="leads/project-requests" element={<ProjectRequestsPage />} />
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
                    <ClientLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<ClientDashboard />} />
              <Route path="designs"            element={<MyDesignsPage />} />
              <Route path="designs/pending"    element={<PendingApprovalPage />} />
              <Route path="designs/revisions"  element={<RevisionHistoryPage />} />
              <Route path="designs/approved"   element={<ApprovedDesignsPage />} />
              <Route path="designs/:id"        element={<DesignDetailPage />} />
              <Route path="documents"          element={<ClientDocumentsPage />} />
              <Route path="invoices"           element={<ClientInvoicesPage />} />
              <Route path="communications"     element={<ClientCommsPage />} />
              <Route path="settings"           element={<ClientSettingsPage />} />
              <Route path="projects/my"        element={<MyProjectsPage />} />
              <Route path="projects/request"   element={<NewProjectRequestPage />} />
              <Route path="projects/:projectId" element={<ClientProjectDetailPage />} />
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

            {/* Fallback routes */}
            <Route path="/" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
            <Route path="*" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />

            {/* Employee Portal */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute>
                  <EmployeeLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<EmployeeDashboard />} />
              <Route path="projects" element={<EmployeeProjectsPage />} />
              <Route path="calendar" element={<EmployeeCalendarPage />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
