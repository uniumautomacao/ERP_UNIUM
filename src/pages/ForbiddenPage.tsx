import { Text } from '@fluentui/react-components';
import { useLocation } from 'react-router-dom';
import { CommandBar } from '../components/layout/CommandBar';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';

interface ForbiddenState {
  from?: string;
  reason?: string;
}

export function ForbiddenPage() {
  const location = useLocation();
  const state = (location.state || {}) as ForbiddenState;

  return (
    <>
      <CommandBar primaryActions={[]} />
      <PageHeader
        title="Acesso negado"
        subtitle="Você não tem permissão para visualizar esta página."
      />
      <PageContainer>
        <div className="flex flex-col gap-3">
          {state.reason && <Text>{state.reason}</Text>}
          {state.from && (
            <Text size={200} style={{ opacity: 0.7 }}>
              Origem: {state.from}
            </Text>
          )}
        </div>
      </PageContainer>
    </>
  );
}
