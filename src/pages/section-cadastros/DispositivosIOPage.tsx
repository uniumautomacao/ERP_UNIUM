import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { CommandBar } from '../../components/layout/CommandBar';

export function DispositivosIOPage() {
  return (
    <>
      <CommandBar primaryActions={[]} secondaryActions={[]} />
      <PageHeader 
        title="Dispositivos IO" 
        subtitle="Gerenciamento de dispositivos de entrada e saída" 
      />
      <PageContainer>
        <div style={{ padding: '20px' }}>
          <p>Página em branco para o cadastro de Dispositivos IO.</p>
        </div>
      </PageContainer>
    </>
  );
}
