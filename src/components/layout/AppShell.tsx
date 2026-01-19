import { ReactNode } from 'react';
import { FluentProvider, Text, tokens } from '@fluentui/react-components';
import { useTheme } from '../../hooks/useTheme';
import { useSidebar } from '../../hooks/useSidebar';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Sidebar } from './Sidebar';
import { LAYOUT } from '../../config/theme';
import { APP_VERSION } from '../../version';

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
          className="flex flex-col flex-grow relative min-w-0"
          style={{
            marginLeft: `${sidebarWidth}px`,
            width: `calc(100vw - ${sidebarWidth}px)`,
            transition: 'margin-left 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* App Version - Global */}
          <div 
            style={{ 
              position: 'absolute', 
              top: '8px', 
              right: '16px', 
              zIndex: 1000, 
              pointerEvents: 'none',
              opacity: 0.6
            }}
          >
            <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>
              v{APP_VERSION}
            </Text>
          </div>
          {children}
        </div>
      </div>
    </FluentProvider>
  );
}
