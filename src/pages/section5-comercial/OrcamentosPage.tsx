/**
 * Página de Gestão de Orçamentos
 *
 * Layout de 3 colunas:
 * - Tab Navigation (esquerda)
 * - Content Area com Command Bar e Product List (centro)
 * - AI Chat + Credits (direita)
 */

import { useState, useMemo } from 'react';
import {
  tokens,
  Spinner,
  useId,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Button,
} from '@fluentui/react-components';
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
import { useOrcamentoData } from '../../hooks/orcamentos/useOrcamentoData';
import { ItemOrcamentoService } from '../../services/orcamentos/ItemOrcamentoService';
import { OpenOrcamentoDialog } from '../../components/domain/orcamentos/dialogs/OpenOrcamentoDialog';
import { NewOrcamentoDialog } from '../../components/domain/orcamentos/dialogs/NewOrcamentoDialog';
import { EditOrcamentoDialog } from '../../components/domain/orcamentos/dialogs/EditOrcamentoDialog';
import { NewItemDialog } from '../../components/domain/orcamentos/dialogs/NewItemDialog';
import type { ItemOrcamento } from '../../features/orcamentos/types';
import { formatarMoeda } from '../../features/orcamentos/utils';

export function OrcamentosPage() {
  // Estado do orçamento atual
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null);

  // Estados dos dialogs
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);

  // Hook de dados do Dataverse
  const {
    orcamento,
    sections: dataverseSections,
    items: dataverseItems,
    isLoading,
    isLoadingItems,
    error,
    refreshItems,
    totals: dataverseTotals,
    creditosDisponiveis,
    creditosUtilizados,
  } = useOrcamentoData(orcamentoId);

  // Hooks locais para gerenciamento de tabs e seleção
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
  } = useOrcamentoTabs(dataverseSections);

  const {
    items,
    selectedItems,
    totals,
    getItemsBySection,
    toggleItemSelection,
    clearSelection,
  } = useOrcamentoItems(dataverseItems);

  // Toast notifications
  const toasterId = useId('orcamentos-toast');
  const { dispatchToast } = useToastController(toasterId);

  const showSuccess = (message: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>Sucesso</ToastTitle>
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent: 'success' }
    );
  };

  const showError = (message: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>Erro</ToastTitle>
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent: 'error' }
    );
  };

  // Filtrar itens pela seção selecionada
  const filteredItems = useMemo(() => {
    return getItemsBySection(selectedTab);
  }, [getItemsBySection, selectedTab]);

  const handleSelectionChange = (selected: ItemOrcamento[]) => {
    clearSelection();
    selected.forEach((item) => toggleItemSelection(item.new_itemdeorcamentoid));
  };

  // Handlers do CommandBar
  const handleRefresh = async () => {
    try {
      await refreshItems();
      showSuccess('Dados atualizados com sucesso');
    } catch (err) {
      showError('Erro ao atualizar dados');
    }
  };

  const handleSelectOrcamento = (id: string) => {
    setOrcamentoId(id);
    showSuccess('Orçamento carregado com sucesso');
  };

  const handleCreateOrcamento = (id: string) => {
    setOrcamentoId(id);
    showSuccess('Orçamento criado com sucesso');
  };

  const handleNewItem = () => {
    if (!orcamentoId) {
      showError('Selecione um orçamento primeiro');
      return;
    }
    setNewItemDialogOpen(true);
  };

  const handleEditSelected = () => {
    console.log('Editar selecionados:', Array.from(selectedItems));
    // TODO: Implement EditItemDialog
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;

    try {
      const itemIds = Array.from(selectedItems);
      await ItemOrcamentoService.deleteItemsBatch(itemIds);
      clearSelection();
      await refreshItems();
      showSuccess(`${itemIds.length} ${itemIds.length === 1 ? 'item excluído' : 'itens excluídos'}`);
    } catch (err) {
      showError('Erro ao excluir itens');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Orçamentos" />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Spinner label="Carregando orçamento..." />
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Orçamentos" />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: tokens.colorPaletteRedForeground1,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: tokens.spacingVerticalM }}>
              Erro ao carregar orçamento
            </div>
            <div style={{ fontSize: '14px' }}>{error}</div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Empty state component when no orcamento
  const EmptyState = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: tokens.colorNeutralForeground3,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: tokens.spacingVerticalM }}>
          Nenhum orçamento selecionado
        </div>
        <div style={{ fontSize: '14px', marginBottom: tokens.spacingVerticalL }}>
          Use o menu "Orçamento" para abrir ou criar um novo orçamento
        </div>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalM, justifyContent: 'center' }}>
          <Button appearance="primary" onClick={() => setOpenDialogOpen(true)}>
            Abrir Orçamento
          </Button>
          <Button appearance="secondary" onClick={() => setNewDialogOpen(true)}>
            Novo Orçamento
          </Button>
        </div>
      </div>
    </div>
  );

  // Determine what to show
  const hasOrcamento = orcamentoId && orcamento;

  console.log('[OrcamentosPage] Estado de renderização:', {
    orcamentoId,
    hasOrcamento: !!orcamento,
    orcamentoName: orcamento?.new_name,
    isLoading,
    error,
    itemsCount: items.length,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Orçamentos"
        subtitle={
          hasOrcamento
            ? selectedTab
              ? `Seção: ${selectedTab} • ${filteredItems.length} ${
                  filteredItems.length === 1 ? 'item' : 'itens'
                }`
              : `${items.length} ${items.length === 1 ? 'item' : 'itens'} no total`
            : 'Gerencie seus orçamentos'
        }
      />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
        {/* Command Bar - sempre visível */}
        <OrcamentoCommandBar
          hasSelection={selectedItems.size > 0}
          onRefresh={handleRefresh}
          onNewItem={handleNewItem}
          onEditSelected={handleEditSelected}
          onDeleteSelected={handleDeleteSelected}
          onOpenOrcamento={() => setOpenDialogOpen(true)}
          onEditOrcamento={() => setEditDialogOpen(true)}
          disabled={isLoadingItems || !hasOrcamento}
        />

        {/* Conteúdo ou empty state */}
        {!hasOrcamento ? (
          <EmptyState />
        ) : (
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

                {/* Product List */}
                <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                  {isLoadingItems && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        zIndex: 1,
                      }}
                    >
                      <Spinner label="Carregando itens..." />
                    </div>
                  )}
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
                <CreditsDisplay
                  availableCredits={creditosDisponiveis}
                  usedCredits={creditosUtilizados}
                />

                {/* Totais gerais */}
                <div>
                  <h3 style={{ margin: 0, marginBottom: tokens.spacingVerticalS }}>
                    Resumo Geral
                  </h3>
                  <div style={{ fontSize: '14px', color: tokens.colorNeutralForeground2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacingVerticalXXS }}>
                      <span>Total de itens:</span>
                      <strong>{dataverseTotals.totalItems}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacingVerticalXXS }}>
                      <span>Produtos:</span>
                      <strong>{formatarMoeda(dataverseTotals.totalProducts)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacingVerticalXXS }}>
                      <span>Serviços:</span>
                      <strong>{formatarMoeda(dataverseTotals.totalServices)}</strong>
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
                      <span>{formatarMoeda(dataverseTotals.totalValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        )}
      </div>

      {/* Dialogs */}
      <OpenOrcamentoDialog
        open={openDialogOpen}
        onClose={() => setOpenDialogOpen(false)}
        onSelectOrcamento={handleSelectOrcamento}
      />

      <NewOrcamentoDialog
        open={newDialogOpen}
        onClose={() => setNewDialogOpen(false)}
        onCreated={handleCreateOrcamento}
      />

      <EditOrcamentoDialog
        open={editDialogOpen}
        orcamento={orcamento}
        onClose={() => setEditDialogOpen(false)}
        onSaved={() => {
          setEditDialogOpen(false);
          handleRefresh();
        }}
      />

      <NewItemDialog
        open={newItemDialogOpen}
        orcamentoId={orcamentoId || ''}
        sections={tabs}
        currentSection={selectedTab || undefined}
        onClose={() => setNewItemDialogOpen(false)}
        onCreated={() => {
          setNewItemDialogOpen(false);
          handleRefresh();
        }}
      />
    </PageContainer>
  );
}
