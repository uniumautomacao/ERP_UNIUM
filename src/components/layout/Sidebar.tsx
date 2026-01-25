import { useMemo } from 'react';
import {
  Button,
  Avatar,
  Text,
  tokens,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
} from '@fluentui/react-components';
import { Settings24Regular, Dismiss24Regular } from '@fluentui/react-icons';
import { useSidebar } from '../../hooks/useSidebar';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useTheme } from '../../hooks/useTheme';
import { useAccessControl } from '../../security/AccessControlContext';
import { SidebarSection } from './SidebarSection';
import { ThemeToggle } from './ThemeToggle';
import { navigation } from '../../config/navigation';
import { filterNavigationByAccess } from '../../config/navigationUtils';
import { LAYOUT } from '../../config/theme';

export function Sidebar() {
  const { isExpanded, isMobileOpen, toggleExpanded, closeMobile } = useSidebar();
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const { canAccessPath } = useAccessControl();

  const filteredNavigation = useMemo(
    () => filterNavigationByAccess(navigation, canAccessPath),
    [canAccessPath]
  );

  const sidebarWidth = isExpanded ? LAYOUT.sidebar.expandedWidth : LAYOUT.sidebar.collapsedWidth;
  const symbolSrc = isDark
    ? new URL('../../../branding/stoa-simbolo-fundo-escuro.svg', import.meta.url).href
    : new URL('../../../branding/stoa-simbolo-fundo-claro.svg', import.meta.url).href;
  const nameSrc = isDark
    ? new URL('../../../branding/stoa-nome-fundo-escuro.svg', import.meta.url).href
    : new URL('../../../branding/stoa-nome-fundo-claro.svg', import.meta.url).href;

  const sidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: tokens.colorNeutralBackground2,
        borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3"
        style={{
          height: `${LAYOUT.header.height}px`,
          padding: isExpanded ? '0 16px' : '0 8px',
          borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        }}
      >
        <Button
          appearance="subtle"
          icon={
            <img
              src={symbolSrc}
              alt=""
              aria-hidden="true"
              style={{ width: 20, height: 20, objectFit: 'contain', display: 'block' }}
            />
          }
          onClick={toggleExpanded}
          aria-label="Toggle sidebar"
        />
        {isExpanded && (
          <img
            src={nameSrc}
            alt="Stoa"
            style={{ height: 20, width: 'auto', display: 'block' }}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex-grow overflow-y-auto" style={{ padding: isExpanded ? '16px 8px' : '16px 4px' }}>
        {filteredNavigation.map((section) => (
          <SidebarSection
            key={section.id}
            label={section.label}
            items={section.items}
            isCollapsed={!isExpanded}
            onItemClick={isMobile ? closeMobile : undefined}
          />
        ))}
      </div>

      {/* User Area */}
      <div style={{ borderTop: `1px solid ${tokens.colorNeutralStroke2}`, padding: '12px' }}>
        {isExpanded ? (
          <div className="flex items-center gap-3">
            <Avatar name="Bruno Santos" size={40} color="colorful" />
            <div className="flex-grow">
              <Text weight="semibold" size={300} block>
                Bruno Santos
              </Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                bruno@unium.com.br
              </Text>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Avatar name="Bruno Santos" size={32} color="colorful" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          gap: '8px',
        }}
      >
        {isExpanded ? (
          <>
            <ThemeToggle />
            <Button appearance="subtle" icon={<Settings24Regular />} aria-label="Settings" />
          </>
        ) : (
          <Button appearance="subtle" icon={<Settings24Regular />} aria-label="Settings" />
        )}
      </div>
    </div>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer
        open={isMobileOpen}
        onOpenChange={(_, { open }) => !open && closeMobile()}
        position="start"
        size="medium"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={closeMobile}
                aria-label="Close"
              />
            }
          >
            Menu
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>{sidebarContent}</DrawerBody>
      </Drawer>
    );
  }

  // Desktop/Tablet: Fixed sidebar
  return (
    <div
      className="sidebar-transition"
      style={{
        width: `${sidebarWidth}px`,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
      }}
    >
      {sidebarContent}
    </div>
  );
}
