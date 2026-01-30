/**
 * Página de Gestão de Orçamentos
 *
 * Layout de 3 colunas:
 * - Tab Navigation (esquerda)
 * - Content Area com Command Bar e Product List (centro)
 * - AI Chat + Credits (direita)
 */

import { useState, useMemo } from 'react';
import { tokens } from '@fluentui/react-components';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { OrcamentoLayout } from '../../components/domain/orcamentos/OrcamentoLayout';
import { TabNavigation } from '../../components/domain/orcamentos/TabNavigation';
import { ProductList } from '../../components/domain/orcamentos/ProductList';
import { OrcamentoCommandBar } from '../../components/domain/orcamentos/OrcamentoCommandBar';
import { AIChatPlaceholder } from '../../components/domain/orcamentos/AIChatPlaceholder';
import { CreditsDisplay } from '../../components/domain/orcamentos/CreditsDisplay';
import { useOrcamentoTabs } from '../../hooks/orcamentos/useOrcamentoTabs';
import { useOrcamentoItems } from '../../hooks/orcamentos/useOrcamentoItems';
import type { OrcamentoSecao, ItemOrcamento } from '../../features/orcamentos/types';
import { formatarMoeda } from '../../features/orcamentos/utils';

// Dados de exemplo para demonstração
const DEMO_TABS: OrcamentoSecao[] = [
  { name: 'Sala de Estar', orderIndex: 10, itemCount: 8, valorTotal: 12500.0 },
  { name: 'Cozinha', orderIndex: 20, itemCount: 12, valorTotal: 8750.5 },
  { name: 'Quartos', orderIndex: 30, itemCount: 15, valorTotal: 18200.0 },
  { name: 'Banheiros', orderIndex: 40, itemCount: 6, valorTotal: 5400.0 },
  { name: 'Área Externa', orderIndex: 50, itemCount: 4, valorTotal: 3200.0 },
];

const DEMO_ITEMS: ItemOrcamento[] = [
  {
    new_itemdeorcamentoid: '1',
    new_name: 'Item 1',
    new_section: 'Sala de Estar',
    new_ambiente: 'Sala',
    new_ref: 'LED-001',
    new_descricao: 'Luminária LED Embutida 12W',
    new_quantidade: 8,
    new_valordeproduto: 150.0,
    new_valortotal: 1200.0,
    new_kit: false,
    statecode: 0,
  },
  {
    new_itemdeorcamentoid: '2',
    new_name: 'Item 2',
    new_section: 'Sala de Estar',
    new_ambiente: 'Sala',
    new_ref: 'SW-005',
    new_descricao: 'Interruptor Touch 3 Teclas',
    new_quantidade: 2,
    new_valordeproduto: 280.0,
    new_valortotal: 560.0,
    new_kit: false,
    statecode: 0,
  },
  {
    new_itemdeorcamentoid: '3',
    new_name: 'Item 3',
    new_section: 'Cozinha',
    new_ambiente: 'Cozinha',
    new_ref: 'KIT-COZY',
    new_descricao: 'Kit Iluminação Cozinha Completo',
    new_quantidade: 1,
    new_valordeproduto: 1850.0,
    new_valortotal: 1850.0,
    new_kit: true,
    statecode: 0,
  },
  {
    new_itemdeorcamentoid: '4',
    new_name: 'Item 4',
    new_section: 'Quartos',
    new_ambiente: 'Quarto Master',
    new_ref: 'DIM-002',
    new_descricao: 'Dimmer Inteligente WiFi',
    new_quantidade: 3,
    new_valordeproduto: 320.0,
    new_valortotal: 960.0,
    new_kit: false,
    statecode: 0,
  },
  {
    new_itemdeorcamentoid: '5',
    new_name: 'Item 5',
    new_section: 'Banheiros',
    new_ambiente: 'Banheiro Social',
    new_ref: 'LED-SPOT',
    new_descricao: 'Spot LED Direcionável 7W',
    new_quantidade: 4,
    new_valordeproduto: 95.0,
    new_valortotal: 380.0,
    new_kit: false,
    statecode: 0,
  },
  {
    new_itemdeorcamentoid: '6',
    new_name: 'Item 6',
    new_section: 'Cozinha',
    new_ambiente: 'Cozinha',
    new_ref: 'SEN-MOV',
    new_descricao: 'Sensor de Movimento Infravermelho',
    new_quantidade: 2,
    new_valordeproduto: 145.0,
    new_valortotal: 290.0,
    new_kit: false,
    statecode: 0,
  },
];

export function OrcamentosPage() {
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

  const {
    items,
    selectedItems,
    totals,
    getItemsBySection,
    toggleItemSelection,
    selectAll,
    clearSelection,
  } = useOrcamentoItems(DEMO_ITEMS);

  // Filtrar itens pela seção selecionada
  const filteredItems = useMemo(() => {
    return getItemsBySection(selectedTab);
  }, [getItemsBySection, selectedTab]);

  const handleSelectionChange = (selected: ItemOrcamento[]) => {
    // Limpar seleção atual
    clearSelection();
    // Selecionar os novos itens
    selected.forEach((item) => toggleItemSelection(item.new_itemdeorcamentoid));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Orçamentos"
        subtitle={
          selectedTab
            ? `Seção: ${selectedTab} • ${filteredItems.length} ${
                filteredItems.length === 1 ? 'item' : 'itens'
              }`
            : `${items.length} ${items.length === 1 ? 'item' : 'itens'} no total`
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
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacingVerticalM,
                height: '100%',
              }}
            >
              {/* Command Bar */}
              <OrcamentoCommandBar
                hasSelection={selectedItems.size > 0}
                onRefresh={() => console.log('Refresh')}
                onNewItem={() => console.log('New Item')}
                onEditSelected={() => console.log('Edit Selected')}
                onDeleteSelected={() => console.log('Delete Selected')}
              />

              {/* Product List */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ProductList
                  items={filteredItems}
                  selectedItems={selectedItems}
                  onSelectionChange={handleSelectionChange}
                />
              </div>

              {/* Footer com totais */}
              <div
                style={{
                  padding: tokens.spacingVerticalM,
                  backgroundColor: tokens.colorNeutralBackground1,
                  borderRadius: tokens.borderRadiusMedium,
                  border: `1px solid ${tokens.colorNeutralStroke1}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '14px', color: tokens.colorNeutralForeground2 }}>
                    {selectedItems.size > 0 && `${selectedItems.size} selecionados • `}
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                    Subtotal da seção
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>
                    {formatarMoeda(
                      filteredItems.reduce((sum, item) => sum + (item.new_valortotal || 0), 0)
                    )}
                  </div>
                </div>
              </div>
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
              {/* AI Chat Placeholder */}
              <AIChatPlaceholder />

              {/* Créditos */}
              <CreditsDisplay availableCredits={5000} usedCredits={1200} />

              {/* Totais gerais */}
              <div>
                <h3 style={{ margin: 0, marginBottom: tokens.spacingVerticalS }}>
                  Resumo Geral
                </h3>
                <div style={{ fontSize: '14px', color: tokens.colorNeutralForeground2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacingVerticalXXS }}>
                    <span>Total de itens:</span>
                    <strong>{totals.totalItems}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacingVerticalXXS }}>
                    <span>Produtos:</span>
                    <strong>{formatarMoeda(totals.totalProducts)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacingVerticalXXS }}>
                    <span>Serviços:</span>
                    <strong>{formatarMoeda(totals.totalServices)}</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: tokens.spacingVerticalS,
                      paddingTop: tokens.spacingVerticalS,
                      borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
                      fontSize: '16px',
                      fontWeight: 600,
                    }}
                  >
                    <span>Total:</span>
                    <span>{formatarMoeda(totals.totalValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </div>
    </PageContainer>
  );
}
