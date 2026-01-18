import { useState } from 'react';
import { Card, Text, Button, SearchBox, Dropdown, Option, Checkbox, tokens } from '@fluentui/react-components';
import {
  Add24Regular,
  FolderOpen24Regular,
  Settings24Regular,
  ArrowDownload24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { reportTemplates, recentExports } from '../../data/mockData';

export function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportPeriod, setExportPeriod] = useState('last-month');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);

  const primaryActions = [
    {
      id: 'new',
      label: 'New Report',
      icon: <Add24Regular />,
      onClick: () => console.log('New report'),
      appearance: 'primary' as const,
    },
  ];

  const secondaryActions = [
    {
      id: 'import',
      label: 'Import Template',
      icon: <FolderOpen24Regular />,
      onClick: () => console.log('Import'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings24Regular />,
      onClick: () => console.log('Settings'),
    },
  ];

  return (
    <>
      <CommandBar primaryActions={primaryActions} secondaryActions={secondaryActions} />
      <PageHeader title="Reports & Exports" subtitle="Generate and download custom reports" />
      <PageContainer>
        <div className="grid grid-cols-1 desktop:grid-cols-3 gap-4">
          {/* Report Templates */}
          <Card style={{ padding: '16px', gridColumn: 'span 2' }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: '16px' }}>
              Report Templates
            </Text>

            <SearchBox
              placeholder="Search templates..."
              style={{ marginBottom: '16px' }}
            />

            <div className="grid gap-2">
              {reportTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  style={{
                    border: `1px solid ${
                      selectedTemplate === template.id
                        ? tokens.colorBrandStroke1
                        : tokens.colorNeutralStroke2
                    }`,
                    borderRadius: '4px',
                    backgroundColor:
                      selectedTemplate === template.id
                        ? tokens.colorBrandBackground2
                        : 'transparent',
                  }}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div style={{ fontSize: '24px' }}>{template.icon}</div>
                  <div className="flex-grow">
                    <Text weight="semibold" block>
                      {template.name}
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Last generated: {template.lastGenerated}
                    </Text>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', borderTop: `1px solid ${tokens.colorNeutralStroke2}`, paddingTop: '16px' }}>
              <Text size={500} weight="semibold" block style={{ marginBottom: '12px' }}>
                Recent Exports
              </Text>
              <div className="grid gap-2">
                {recentExports.slice(0, 5).map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-2"
                    style={{
                      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Text size={300}>{exp.filename}</Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {exp.size}
                      </Text>
                    </div>
                    <Button
                      appearance="subtle"
                      icon={<ArrowDownload24Regular />}
                      size="small"
                      aria-label="Download"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Preview & Export Options */}
          <Card style={{ padding: '16px' }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: '16px' }}>
              Preview
            </Text>

            <div
              style={{
                height: '200px',
                backgroundColor: tokens.colorNeutralBackground3,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <Text style={{ color: tokens.colorNeutralForeground3 }}>
                {selectedTemplate ? 'Report Preview' : 'Select a template to preview'}
              </Text>
            </div>

            <Text size={500} weight="semibold" block style={{ marginBottom: '12px' }}>
              Export Options
            </Text>

            <div className="flex flex-col gap-3">
              <div>
                <Text size={300} block style={{ marginBottom: '4px' }}>
                  Format:
                </Text>
                <Dropdown
                  value={exportFormat}
                  onOptionSelect={(_, data) => setExportFormat(data.optionValue as string)}
                  style={{ width: '100%' }}
                >
                  <Option value="pdf">PDF</Option>
                  <Option value="xlsx">Excel (XLSX)</Option>
                  <Option value="csv">CSV</Option>
                </Dropdown>
              </div>

              <div>
                <Text size={300} block style={{ marginBottom: '4px' }}>
                  Period:
                </Text>
                <Dropdown
                  value={exportPeriod}
                  onOptionSelect={(_, data) => setExportPeriod(data.optionValue as string)}
                  style={{ width: '100%' }}
                >
                  <Option value="last-week">Last Week</Option>
                  <Option value="last-month">Last Month</Option>
                  <Option value="last-quarter">Last Quarter</Option>
                  <Option value="last-year">Last Year</Option>
                  <Option value="custom">Custom Range</Option>
                </Dropdown>
              </div>

              <div>
                <Text size={300} block style={{ marginBottom: '8px' }}>
                  Include:
                </Text>
                <div className="flex flex-col gap-2">
                  <Checkbox
                    checked={includeCharts}
                    onChange={(_, data) => setIncludeCharts(data.checked === true)}
                    label="Charts"
                  />
                  <Checkbox
                    checked={includeTables}
                    onChange={(_, data) => setIncludeTables(data.checked === true)}
                    label="Tables"
                  />
                  <Checkbox
                    checked={includeSummary}
                    onChange={(_, data) => setIncludeSummary(data.checked === true)}
                    label="Summary"
                  />
                  <Checkbox
                    checked={includeRawData}
                    onChange={(_, data) => setIncludeRawData(data.checked === true)}
                    label="Raw Data"
                  />
                </div>
              </div>

              <Button
                appearance="primary"
                icon={<ArrowDownload24Regular />}
                style={{ width: '100%', marginTop: '8px' }}
                disabled={!selectedTemplate}
              >
                Generate & Download
              </Button>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
