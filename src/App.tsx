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

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SidebarProvider>
          <AppShell>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/projects" element={<ProjectPlannerPage />} />
              <Route path="/team" element={<TeamManagementPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
