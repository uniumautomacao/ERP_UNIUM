import { Button, Tooltip, tokens } from '@fluentui/react-components';
import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  path: string;
  exact?: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

export function SidebarItem({ icon, label, path, exact, isCollapsed, onClick }: SidebarItemProps) {
  const buttonContent = (
    <NavLink to={path} end={exact} style={{ textDecoration: 'none', width: '100%' }} onClick={onClick}>
      {({ isActive }) => {
        const IconElement = icon as React.ReactElement | undefined;
        return (
          <Button
            appearance="subtle"
            className="text-left"
            icon={IconElement}
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              height: '36px',
              paddingLeft: '12px',
              paddingRight: '12px',
              borderRadius: '4px',
              backgroundColor: isActive ? tokens.colorBrandBackground2 : 'transparent',
              color: isActive ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground1,
              fontWeight: isActive ? 600 : 400,
              borderLeft: isActive ? `3px solid ${tokens.colorBrandForeground1}` : 'none',
            }}
          >
            {!isCollapsed && label}
          </Button>
        );
      }}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} relationship="label" positioning="after">
        {buttonContent}
      </Tooltip>
    );
  }

  return buttonContent;
}
