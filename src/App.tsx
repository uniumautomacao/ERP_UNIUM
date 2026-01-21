import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { AppShell } from './components/layout/AppShell';
import { RoutePersistence } from './routing/RoutePersistence';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { AccessControlProvider } from './security/AccessControlContext';
import { navigation } from './config/navigation';
import { generateRoutesFromNavigation } from './config/navigationUtils';

function App() {
  return (
    <HashRouter>
      <RoutePersistence />
      <ThemeProvider>
        <SidebarProvider>
          <AccessControlProvider>
            <AppShell>
              <Routes>
                {generateRoutesFromNavigation(navigation)}
                <Route path="/forbidden" element={<ForbiddenPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </AccessControlProvider>
        </SidebarProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
