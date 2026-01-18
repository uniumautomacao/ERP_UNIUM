import { Card, Text, Button, tokens } from '@fluentui/react-components';
import {
  ArrowSync24Regular,
  ArrowExport24Regular,
  Settings24Regular,
  Add24Regular,
  DataBarVertical24Regular,
  Calendar24Regular,
  Mail24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { KPICard } from '../../components/shared/KPICard';
import { Timeline } from '../../components/shared/Timeline';
import { AreaChart } from '../../components/charts/AreaChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { BarChart } from '../../components/charts/BarChart';
import { kpis, revenueData, salesByRegion, topProducts, recentActivities } from '../../data/mockData';

export function DashboardPage() {
  const commandBarActions = [
    {
      id: 'refresh',
      label: 'Refresh',
      icon: <ArrowSync24Regular />,
      onClick: () => console.log('Refresh'),
    },
    {
      id: 'export',
      label: 'Export',
      icon: <ArrowExport24Regular />,
      onClick: () => console.log('Export'),
    },
    {
      id: 'customize',
      label: 'Customize',
      icon: <Settings24Regular />,
      onClick: () => console.log('Customize'),
    },
  ];

  return (
    <>
      <CommandBar primaryActions={commandBarActions} />
      <PageHeader
        title="Dashboard Executivo"
        subtitle="Last updated: 5 minutes ago"
      />
      <PageContainer>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi, index) => (
            <KPICard
              key={index}
              label={kpi.label}
              value={kpi.value}
              trend={kpi.trend}
              trendLabel={kpi.trendLabel}
            />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 desktop:grid-cols-3 gap-4 mb-6">
          {/* Revenue Chart */}
          <Card style={{ padding: '16px', gridColumn: 'span 2' }}>
            <div className="flex items-center justify-between mb-3">
              <Text size={500} weight="semibold">
                Revenue Over Time
              </Text>
              <select
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  backgroundColor: tokens.colorNeutralBackground1,
                }}
              >
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Last Year</option>
              </select>
            </div>
            <AreaChart data={revenueData} dataKey="value" height={250} />
          </Card>

          {/* Donut Chart */}
          <Card style={{ padding: '16px' }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: '12px' }}>
              Sales by Region
            </Text>
            <DonutChart data={salesByRegion} height={250} />
          </Card>
        </div>

        {/* Top Products */}
        <div className="mb-6">
          <Card style={{ padding: '16px' }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: '12px' }}>
              Top 5 Products Performance
            </Text>
            <BarChart
              data={topProducts.map(p => ({ date: p.name, value: p.value }))}
              dataKey="value"
              xAxisKey="date"
              height={250}
              horizontal
            />
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
          {/* Timeline */}
          <Timeline
            activities={recentActivities.slice(0, 5)}
            title="Recent Activities"
            onAddClick={() => console.log('Add note')}
          />

          {/* Quick Actions */}
          <Card style={{ padding: '16px' }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: '16px' }}>
              Quick Actions
            </Text>
            <div className="flex flex-col gap-2">
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                Create New Sale
              </Button>
              <Button
                appearance="secondary"
                icon={<DataBarVertical24Regular />}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                Generate Report
              </Button>
              <Button
                appearance="secondary"
                icon={<Mail24Regular />}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                Send Weekly Summary
              </Button>
              <Button
                appearance="secondary"
                icon={<Calendar24Regular />}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                Schedule Meeting
              </Button>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
