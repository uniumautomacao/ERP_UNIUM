import { Text, tokens } from '@fluentui/react-components';
import { NavItem } from '../../types';
import { SidebarItem } from './SidebarItem';

interface SidebarSectionProps {
  label: string;
  items: NavItem[];
  isCollapsed: boolean;
  onItemClick?: () => void;
}

export function SidebarSection({ label, items, isCollapsed, onItemClick }: SidebarSectionProps) {
  return (
    <div className="mb-4">
      {!isCollapsed && label && (
        <Text
          size={200}
          weight="semibold"
          style={{
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: tokens.colorNeutralForeground3,
            paddingLeft: '12px',
            paddingBottom: '8px',
            fontSize: '10px',
          }}
        >
          {label}
        </Text>
      )}
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            path={item.path}
            exact={item.exact}
            isCollapsed={isCollapsed}
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}
