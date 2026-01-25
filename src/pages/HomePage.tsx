import { useMemo } from 'react';
import { Card, Text, Button } from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { navigation } from '../config/navigation';
import { filterNavigationByAccess } from '../config/navigationUtils';
import { useAccessControl } from '../security/AccessControlContext';

export function HomePage() {
  const navigate = useNavigate();
  const { canAccessPath } = useAccessControl();
  const sections = useMemo(
    () =>
      filterNavigationByAccess(navigation, canAccessPath, {
        excludeSectionIds: ['home'],
        excludePaths: ['/'],
      }),
    [canAccessPath]
  );

  return (
    <>
      <PageHeader
        title="Bem-vindo ao Stoa"
        subtitle="Template UI - Estilo Model-Driven App"
      />
      <PageContainer>
        {sections.length === 0 ? (
          <Card style={{ padding: '24px' }}>
            <Text size={600} weight="semibold" block style={{ marginBottom: '8px' }}>
              Nenhuma página disponível
            </Text>
            <Text size={300} block>
              Seu perfil ainda não possui páginas habilitadas. Se necessário, solicite acesso ao administrador.
            </Text>
          </Card>
        ) : (
          <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
            {sections.map((section) => (
              <Card key={section.id} style={{ padding: '24px' }}>
                <Text size={600} weight="semibold" block style={{ marginBottom: '8px' }}>
                  {section.label}
                </Text>
                {section.description && (
                  <Text size={300} block style={{ marginBottom: '24px' }}>
                    {section.description}
                  </Text>
                )}
                <div className="flex flex-col gap-2">
                  {section.items.map((item) => (
                    <Button
                      key={item.path}
                      appearance="subtle"
                      icon={item.icon as any}
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
        )}
      </PageContainer>
    </>
  );
}
