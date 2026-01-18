import { ReactNode } from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { useTheme } from '../../hooks/useTheme';
import { useSidebar } from '../../hooks/useSidebar';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Sidebar } from './Sidebar';
import { LAYOUT } from '../../config/theme';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { theme } = useTheme();
  const { isExpanded } = useSidebar();
  const isMobile = useIsMobile();

  const sidebarWidth = isMobile ? 0 : (isExpanded ? LAYOUT.sidebar.expandedWidth : LAYOUT.sidebar.collapsedWidth);

  return (
    <FluentProvider theme={theme} data-theme-transition>
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div
          className="flex flex-col flex-grow"
          style={{
            marginLeft: `${sidebarWidth}px`,
            transition: 'margin-left 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {children}
        </div>
      </div>
    </FluentProvider>
  );
}
