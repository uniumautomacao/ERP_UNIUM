import { Card, Text, Button } from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import {
  DataBarVertical24Regular,
  ChartMultiple24Regular,
  DocumentBulletList24Regular,
  Box24Regular,
  CalendarLtr24Regular,
  People24Regular,
} from '@fluentui/react-icons';

export function HomePage() {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Analytics',
      description: 'Visualize dados e métricas do seu negócio',
      items: [
        { icon: <DataBarVertical24Regular />, label: 'Dashboard', path: '/dashboard' },
        { icon: <ChartMultiple24Regular />, label: 'Analytics', path: '/analytics' },
        { icon: <DocumentBulletList24Regular />, label: 'Reports', path: '/reports' },
      ],
    },
    {
      title: 'Operations',
      description: 'Gerencie operações e recursos',
      items: [
        { icon: <Box24Regular />, label: 'Inventory', path: '/inventory' },
        { icon: <CalendarLtr24Regular />, label: 'Project Planner', path: '/projects' },
        { icon: <People24Regular />, label: 'Team Management', path: '/team' },
      ],
    },
  ];

  return (
    <>
      <PageHeader
        title="Bem-vindo ao ERP UNIUM"
        subtitle="Template UI - Estilo Model-Driven App"
      />
      <PageContainer>
        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
          {sections.map((section) => (
            <Card key={section.title} style={{ padding: '24px' }}>
              <Text size={600} weight="semibold" block style={{ marginBottom: '8px' }}>
                {section.title}
              </Text>
              <Text size={300} block style={{ marginBottom: '24px' }}>
                {section.description}
              </Text>
              <div className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <Button
                    key={item.path}
                    appearance="subtle"
                    icon={item.icon}
                    onClick={() => navigate(item.path)}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
