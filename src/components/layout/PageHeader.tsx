import { ReactNode } from 'react';
import { Avatar, Text, TabList, Tab, Divider, tokens } from '@fluentui/react-components';

interface KPI {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  avatar?: string;
  kpis?: KPI[];
  tabs?: {
    value: string;
    label: string;
  }[];
  selectedTab?: string;
  onTabSelect?: (value: string) => void;
}

export function PageHeader({
  title,
  subtitle,
  avatar,
  kpis,
  tabs,
  selectedTab,
  onTabSelect,
}: PageHeaderProps) {
  return (
    <div
      style={{
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: tokens.colorNeutralBackground1,
      }}
    >
      {/* Header Content */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '8px 24px',
          minHeight: avatar ? '60px' : 'auto',
        }}
      >
        {/* Left side - Title */}
        <div className="flex items-center gap-3">
          {avatar && <Avatar name={title} size={32} style={{ borderRadius: '4px' }} />}
          <div>
            <Text size={400} weight="semibold" block>
              {title}
            </Text>
            {subtitle && (
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {subtitle}
              </Text>
            )}
          </div>
        </div>

        {/* Right side - KPIs */}
        {kpis && kpis.length > 0 && (
          <div className="flex items-center gap-0">
            {kpis.map((kpi, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <Divider
                    vertical
                    style={{ height: '32px', margin: '0 16px' }}
                  />
                )}
                <div className="text-center">
                  <Text
                    size={200}
                    weight="medium"
                    block
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: tokens.colorNeutralForeground3,
                    }}
                  >
                    {kpi.label}
                  </Text>
                  <div className="flex items-center gap-1 justify-center" style={{ minHeight: '32px' }}>
                    {kpi.icon && (
                      <span className="flex items-center" style={{ color: kpi.color || tokens.colorNeutralForeground2 }}>
                        {kpi.icon}
                      </span>
                    )}
                    <Text size={400} weight="semibold" style={{ color: kpi.color || tokens.colorNeutralForeground1 }}>
                      {kpi.value}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div style={{ paddingLeft: '24px' }}>
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => onTabSelect?.(data.value as string)}
          >
            {tabs.map((tab) => (
              <Tab key={tab.value} value={tab.value}>
                {tab.label}
              </Tab>
            ))}
          </TabList>
        </div>
      )}
    </div>
  );
}
