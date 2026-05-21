import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./shared/context/auth-context";
import { ROLES } from "./shared/constants/roles";
import { ROUTES } from "./shared/constants/routes";

import ProtectedRoute from "./app/routes/protected-route";
import RoleRoute from "./app/routes/role-route";

import Login from "./modules/auth/pages/login";
import RolesManagement from "./modules/auth/pages/roles-management";

import SuperAdminDashboard from "./modules/super-admin/pages/dashboard";
import AdminDashboard from "./modules/admin/pages/dashboard";
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

            {/* Protected dashboard routes per role */}
            <Route
              path={ROUTES.SUPER_ADMIN.DASHBOARD}
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                    <SuperAdminDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ADMIN.DASHBOARD}
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
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
