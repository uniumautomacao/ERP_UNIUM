import { Text } from '@fluentui/react-components';
import { DeveloperBoard24Regular } from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';

export function DevPage() {
  return (
    <>
      <CommandBar primaryActions={[]} />
      <PageHeader
        title="Área do Desenvolvedor"
        subtitle="Página em branco para novas implementações"
      />
      <PageContainer>
        <div 
          className="flex flex-col items-center justify-center" 
          style={{ height: '300px', opacity: 0.5 }}
        >
          <DeveloperBoard24Regular style={{ fontSize: '48px', marginBottom: '16px' }} />
          <Text size={500} weight="semibold">
            Página de Desenvolvimento
          </Text>
          <Text size={300}>
            Comece a construir suas novas funcionalidades aqui.
          </Text>
        </div>
      </PageContainer>
    </>
  );
}
