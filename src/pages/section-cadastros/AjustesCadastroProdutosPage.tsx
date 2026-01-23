import { useMemo, useState } from 'react';
import { Tab, TabList } from '@fluentui/react-components';
import { ArrowSync24Regular } from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { ModelosAjustesTab } from './ajustes/ModelosAjustesTab';
import { PrecosAjustesTab } from './ajustes/PrecosAjustesTab';
import { RegimesAjustesTab } from './ajustes/RegimesAjustesTab';

type TabValue = 'modelos' | 'precos' | 'regimes';

export function AjustesCadastroProdutosPage() {
  const [selectedTab, setSelectedTab] = useState<TabValue>('modelos');
  const [refreshToken, setRefreshToken] = useState(0);

  const primaryActions = useMemo(
    () => [
      {
        id: 'refresh',
        label: 'Atualizar',
        icon: <ArrowSync24Regular />,
        onClick: () => setRefreshToken((prev) => prev + 1),
      },
    ],
    []
  );

  return (
    <>
      <CommandBar primaryActions={primaryActions} />
      <PageHeader
        title="Ajustes de Cadastro de Produtos"
        subtitle="Edite, duplique e copie modelos, preços e regimes com flexibilidade."
      />
      <PageContainer>
        <div className="mb-6">
          <TabList selectedValue={selectedTab} onTabSelect={(_, data) => setSelectedTab(data.value as TabValue)}>
            <Tab value="modelos">Modelos de Produto</Tab>
            <Tab value="precos">Preços de Produto</Tab>
            <Tab value="regimes">Regimes de Cotação</Tab>
          </TabList>
        </div>

        {selectedTab === 'modelos' && <ModelosAjustesTab refreshToken={refreshToken} />}
        {selectedTab === 'precos' && <PrecosAjustesTab refreshToken={refreshToken} />}
        {selectedTab === 'regimes' && <RegimesAjustesTab refreshToken={refreshToken} />}
      </PageContainer>
    </>
  );
}
