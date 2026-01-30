/**
 * Página de Gestão de Orçamentos
 *
 * Layout de 3 colunas:
 * - Tab Navigation (esquerda)
 * - Content Area com Command Bar e Product List (centro)
 * - AI Chat + Credits (direita)
 */

import { useState } from 'react';
import { tokens } from '@fluentui/react-components';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { OrcamentoLayout } from '../../components/domain/orcamentos/OrcamentoLayout';
import { TabNavigation } from '../../components/domain/orcamentos/TabNavigation';
import { useOrcamentoTabs } from '../../hooks/orcamentos/useOrcamentoTabs';
import type { OrcamentoSecao } from '../../features/orcamentos/types';

// Dados de exemplo para demonstração
const DEMO_TABS: OrcamentoSecao[] = [
  { name: 'Sala de Estar', orderIndex: 10, itemCount: 8, valorTotal: 12500.0 },
  { name: 'Cozinha', orderIndex: 20, itemCount: 12, valorTotal: 8750.5 },
  { name: 'Quartos', orderIndex: 30, itemCount: 15, valorTotal: 18200.0 },
  { name: 'Banheiros', orderIndex: 40, itemCount: 6, valorTotal: 5400.0 },
  { name: 'Área Externa', orderIndex: 50, itemCount: 4, valorTotal: 3200.0 },
];

export function OrcamentosPage() {
  const [selectedOrcamento, setSelectedOrcamento] = useState<string | null>(null);

  const {
    tabs,
    selectedTab,
    setSelectedTab,
    addTab,
    removeTab,
    renameTab,
    reorderTabs,
    moveTabUp,
    moveTabDown,
    canRemoveTab,
    canMoveUp,
    canMoveDown,
  } = useOrcamentoTabs(DEMO_TABS);

  return (
    <PageContainer>
      <PageHeader
        title="Orçamentos"
        subtitle={
          selectedTab
            ? `Seção: ${selectedTab}`
            : 'Nenhuma seção selecionada'
        }
      />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <OrcamentoLayout
          leftPanel={
            <TabNavigation
              tabs={tabs}
              selectedTab={selectedTab}
              onSelectTab={setSelectedTab}
              onAddTab={addTab}
              onRemoveTab={removeTab}
              onRenameTab={renameTab}
              onReorderTabs={reorderTabs}
              onMoveTabUp={moveTabUp}
              onMoveTabDown={moveTabDown}
              canRemoveTab={canRemoveTab}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
            />
          }
          centerPanel={
            <div
              style={{
                padding: tokens.spacingVerticalM,
                backgroundColor: tokens.colorNeutralBackground1,
                borderRadius: tokens.borderRadiusMedium,
                border: `1px solid ${tokens.colorNeutralStroke1}`,
              }}
            >
              <h3 style={{ margin: 0, marginBottom: tokens.spacingVerticalS }}>
                Lista de Produtos
              </h3>
              <p style={{ color: tokens.colorNeutralForeground3, fontSize: '14px' }}>
                Command Bar e Product List serão implementados aqui
              </p>
              {selectedTab && (
                <p style={{ color: tokens.colorNeutralForeground2, fontSize: '14px', marginTop: tokens.spacingVerticalS }}>
                  Seção selecionada: <strong>{selectedTab}</strong>
                </p>
              )}
            </div>
          }
          rightPanel={
            <div
              style={{
                padding: tokens.spacingVerticalM,
                backgroundColor: tokens.colorNeutralBackground1,
                borderRadius: tokens.borderRadiusMedium,
                border: `1px solid ${tokens.colorNeutralStroke1}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacingVerticalM,
              }}
            >
              {/* Placeholder AI Chat */}
              <div>
                <h3 style={{ margin: 0, marginBottom: tokens.spacingVerticalS }}>
                  Assistente AI
                </h3>
                <div
                  style={{
                    padding: tokens.spacingVerticalL,
                    backgroundColor: tokens.colorNeutralBackground3,
                    borderRadius: tokens.borderRadiusMedium,
                    textAlign: 'center',
                    color: tokens.colorNeutralForeground3,
                  }}
                >
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    Em breve
                  </p>
                  <p style={{ margin: 0, marginTop: tokens.spacingVerticalXS, fontSize: '14px' }}>
                    Chat com AI será implementado em breve
                  </p>
                </div>
              </div>

              {/* Placeholder Créditos */}
              <div>
                <h3 style={{ margin: 0, marginBottom: tokens.spacingVerticalS }}>
                  Créditos
                </h3>
                <p style={{ color: tokens.colorNeutralForeground3, fontSize: '14px' }}>
                  Display de créditos será implementado aqui
                </p>
              </div>
            </div>
          }
        />
      </div>
    </PageContainer>
  );
}
