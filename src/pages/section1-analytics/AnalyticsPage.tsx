import { useState } from 'react';
import { Card, Text, TabList, Tab, tokens } from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  ArrowExport24Regular,
  ArrowSync24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { FilterBar } from '../../components/shared/FilterBar';
import { LineChart } from '../../components/charts/LineChart';
import { revenueData } from '../../data/mockData';

export function AnalyticsPage() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState([
    { id: 'electronics', label: 'Electronics' },
    { id: 'north', label: 'North Region' },
  ]);

  const commandBarActions = [
    {
      id: 'import',
      label: 'Import Data',
      icon: <ArrowDownload24Regular />,
      onClick: () => console.log('Import'),
    },
    {
      id: 'export',
      label: 'Export',
      icon: <ArrowExport24Regular />,
      onClick: () => console.log('Export'),
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: <ArrowSync24Regular />,
      onClick: () => console.log('Refresh'),
    },
  ];

  const filterOptions = [
    {
      id: 'category',
      label: 'Category',
      options: [
        { key: 'all', text: 'All Categories' },
        { key: 'electronics', text: 'Electronics' },
        { key: 'parts', text: 'Parts' },
        { key: 'accessories', text: 'Accessories' },
      ],
      selectedKey: 'electronics',
      onChange: (key: string) => console.log('Category changed:', key),
    },
    {
      id: 'region',
      label: 'Region',
      options: [
        { key: 'all', text: 'All Regions' },
        { key: 'north', text: 'North' },
        { key: 'south', text: 'South' },
        { key: 'east', text: 'East' },
        { key: 'west', text: 'West' },
      ],
      selectedKey: 'north',
      onChange: (key: string) => console.log('Region changed:', key),
    },
  ];

  const chartData = revenueData.map((item) => ({
    ...item,
    revenue: item.value,
    orders: Math.floor(item.value / 100),
    customers: Math.floor(item.value / 500),
  }));

  return (
    <>
      <CommandBar primaryActions={commandBarActions} />
      <PageHeader title="Analytics" subtitle="Deep dive into your data" />
      <PageContainer>
        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filters={filterOptions}
            activeFilters={activeFilters}
            onClearFilter={(id) => setActiveFilters(activeFilters.filter((f) => f.id !== id))}
            onClearAll={() => setActiveFilters([])}
          />
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <TabList selectedValue={selectedTab} onTabSelect={(_, data) => setSelectedTab(data.value as string)}>
            <Tab value="overview">Overview</Tab>
            <Tab value="trends">Trends</Tab>
            <Tab value="comparison">Comparison</Tab>
            <Tab value="forecast">Forecast</Tab>
          </TabList>
        </div>

        {/* Main Chart */}
        <Card style={{ padding: '16px', marginBottom: '24px' }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: '12px' }}>
            {selectedTab === 'overview' && 'Multi-Metric Overview'}
            {selectedTab === 'trends' && 'Trend Analysis'}
            {selectedTab === 'comparison' && 'Period Comparison'}
            {selectedTab === 'forecast' && 'Revenue Forecast'}
          </Text>
          {selectedTab === 'overview' && (
            <LineChart
              data={chartData}
              lines={[
                { dataKey: 'revenue', name: 'Revenue', color: tokens.colorBrandBackground },
                { dataKey: 'orders', name: 'Orders', color: tokens.colorPaletteBlueForeground2 },
                { dataKey: 'customers', name: 'Customers', color: tokens.colorPalettePurpleForeground2 },
              ]}
              height={400}
            />
          )}
          {selectedTab !== 'overview' && (
            <div
              style={{
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.colorNeutralForeground3,
              }}
            >
              Chart for {selectedTab} tab would be displayed here
            </div>
          )}
        </Card>

        {/* Insights and Anomalies */}
        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
          {/* AI Insights */}
          <Card style={{ padding: '16px' }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: '16px' }}>
              💡 AI Insights
            </Text>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '12px' }}>
                <Text size={300}>
                  Revenue up 15% vs last month driven by Electronics category performance
                </Text>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Text size={300}>
                  Top performing region: North contributing 35% of total sales
                </Text>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Text size={300}>
                  Customer acquisition cost decreased by 8% indicating improved marketing efficiency
                </Text>
              </li>
            </ul>
          </Card>

          {/* Anomalies */}
          <Card style={{ padding: '16px' }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: '16px' }}>
              ⚠️ Anomalies Detected
            </Text>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '12px' }}>
                <Text size={300} style={{ color: tokens.colorPaletteRedForeground1 }}>
                  Unusual spike in returns on Jan 15 (+340%)
                </Text>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Text size={300} style={{ color: tokens.colorPaletteYellowForeground1 }}>
                  Low inventory alert: 5 SKUs below reorder point
                </Text>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Text size={300} style={{ color: tokens.colorPaletteYellowForeground1 }}>
                  Payment processing delays detected on Jan 12
                </Text>
              </li>
            </ul>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
