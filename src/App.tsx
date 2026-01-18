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
import { DevPage } from './pages/section3-dev/DevPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { RequireRoles } from './security/RequireRoles';
import { getRequiredRoles } from './security/pageAccess';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SidebarProvider>
          <AppShell>
            <Routes>
              <Route
                path="/"
                element={
                  <RequireRoles requiredRoles={getRequiredRoles('/')}>
                    <HomePage />
                  </RequireRoles>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireRoles requiredRoles={getRequiredRoles('/dashboard')}>
                    <DashboardPage />
                  </RequireRoles>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RequireRoles requiredRoles={getRequiredRoles('/analytics')}>
                    <AnalyticsPage />
                  </RequireRoles>
                }
              />
              <Route
                path="/reports"
                element={
                  <RequireRoles requiredRoles={getRequiredRoles('/reports')}>
                    <ReportsPage />
                  </RequireRoles>
                }
              />
              <Route
                path="/inventory"
                element={
                  <RequireRoles requiredRoles={getRequiredRoles('/inventory')}>
                    <InventoryPage />
                  </RequireRoles>
                }
              />
              <Route
                path="/projects"
                element={
                  <RequireRoles requiredRoles={getRequiredRoles('/projects')}>
                    <ProjectPlannerPage />
                  </RequireRoles>
                }
              />
              <Route
                path="/team"
                element={
                  <RequireRoles requiredRoles={getRequiredRoles('/team')}>
                    <TeamManagementPage />
                  </RequireRoles>
                }
              />
              <Route
                path="/dev"
                element={
                  <RequireRoles requiredRoles={getRequiredRoles('/dev')}>
                    <DevPage />
                  </RequireRoles>
                }
              />
              <Route path="/forbidden" element={<ForbiddenPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
