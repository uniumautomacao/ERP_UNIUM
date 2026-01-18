import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/section1-analytics/DashboardPage';
import { AnalyticsPage } from './pages/section1-analytics/AnalyticsPage';
import { ReportsPage } from './pages/section1-analytics/ReportsPage';
import { InventoryPage } from './pages/section2-operations/InventoryPage';
import { ProjectPlannerPage } from './pages/section2-operations/ProjectPlannerPage';
import { TeamManagementPage } from './pages/section2-operations/TeamManagementPage';
import { SuperAdminPageAccessPage } from './pages/section3-super-admin/SuperAdminPageAccessPage';
import { SuperAdminUserRolesPage } from './pages/section3-super-admin/SuperAdminUserRolesPage';
import { DevPage } from './pages/section3-dev/DevPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { AccessControlProvider } from './security/AccessControlContext';
import { RequirePageAccess } from './security/RequirePageAccess';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SidebarProvider>
          <AccessControlProvider>
            <AppShell>
              <Routes>
                <Route
                  path="/"
                  element={
                    <RequirePageAccess>
                      <HomePage />
                    </RequirePageAccess>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <RequirePageAccess>
                      <DashboardPage />
                    </RequirePageAccess>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <RequirePageAccess>
                      <AnalyticsPage />
                    </RequirePageAccess>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <RequirePageAccess>
                      <ReportsPage />
                    </RequirePageAccess>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <RequirePageAccess>
                      <InventoryPage />
                    </RequirePageAccess>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <RequirePageAccess>
                      <ProjectPlannerPage />
                    </RequirePageAccess>
                  }
                />
                <Route
                  path="/team"
                  element={
                    <RequirePageAccess>
                      <TeamManagementPage />
                    </RequirePageAccess>
                  }
                />
                <Route
                  path="/super-admin/page-access"
                  element={
                    <RequirePageAccess>
                      <SuperAdminPageAccessPage />
                    </RequirePageAccess>
                  }
                />
                <Route
                  path="/super-admin/user-roles"
                  element={
                    <RequirePageAccess>
                      <SuperAdminUserRolesPage />
                    </RequirePageAccess>
                  }
                />
                <Route
                  path="/dev"
                  element={
                    <RequirePageAccess>
                      <DevPage />
                    </RequirePageAccess>
                  }
                />
                <Route path="/forbidden" element={<ForbiddenPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </AccessControlProvider>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
