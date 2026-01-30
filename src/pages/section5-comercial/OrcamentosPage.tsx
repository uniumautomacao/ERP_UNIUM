/**
 * Página de Gestão de Orçamentos
 *
 * Layout de 3 colunas:
 * - Tab Navigation (esquerda)
 * - Content Area com Command Bar e Product List (centro)
 * - AI Chat + Credits (direita)
 */

import { useState, useMemo, useCallback } from 'react';
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
import { EditItemSidebar } from '../../components/domain/orcamentos/EditItemSidebar';
import { useOrcamentoTabs } from '../../hooks/orcamentos/useOrcamentoTabs';
import { useOrcamentoItems } from '../../hooks/orcamentos/useOrcamentoItems';
import { useOrcamentoData } from '../../hooks/orcamentos/useOrcamentoData';
import { useOrcamentoServicos } from '../../hooks/orcamentos/useOrcamentoServicos';
import { ItemOrcamentoService } from '../../services/orcamentos/ItemOrcamentoService';
import { OpenOrcamentoDialog } from '../../components/domain/orcamentos/dialogs/OpenOrcamentoDialog';
import { NewOrcamentoDialog } from '../../components/domain/orcamentos/dialogs/NewOrcamentoDialog';
import { EditOrcamentoDialog } from '../../components/domain/orcamentos/dialogs/EditOrcamentoDialog';
import { NewItemDialog } from '../../components/domain/orcamentos/dialogs/NewItemDialog';
import type { ItemOrcamento } from '../../features/orcamentos/types';
import { formatarMoeda, somarValorTotalItens, somarServicosCalculados } from '../../features/orcamentos/utils';

export function OrcamentosPage() {
  // Estado do orçamento atual
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null);

  // Estados dos dialogs
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);

  // Estado da sidebar de edição de item
  const [editItemSidebarOpen, setEditItemSidebarOpen] = useState(false);
  const [itemBeingEdited, setItemBeingEdited] = useState<ItemOrcamento | null>(null);

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

  const {
    items,
    selectedItems,
    getItemsBySection,
    toggleItemSelection,
    clearSelection,
  } = useOrcamentoItems(dataverseItems);

  // Hook de serviços (precisa estar antes de useOrcamentoTabs para calcular seções corrigidas)
  const { servicos, getServicosBySection } = useOrcamentoServicos(items, orcamentoId);

  // Seções corrigidas com valores de serviços calculados incluídos
  const sectionsComServicos = useMemo(() => {
    return dataverseSections.map(secao => {
      const servicosSecao = servicos.filter(s => s.section === secao.name);
      const valorServicosSecao = somarServicosCalculados(servicosSecao);
      return {
        ...secao,
        valorTotal: secao.valorTotal + valorServicosSecao,
      };
    });
  }, [dataverseSections, servicos]);

  // Callback para persistir renomeação de seção
  const handleRenameTabPersist = useCallback(async (oldName: string, newName: string) => {
    if (!orcamentoId) {
      throw new Error('Nenhum orçamento selecionado');
    }
    await ItemOrcamentoService.renameSection(orcamentoId, oldName, newName);
    await refreshItems();
  }, [orcamentoId, refreshItems]);

  // Hooks locais para gerenciamento de tabs e seleção
  const {
    tabs,
    selectedTab,
    setSelectedTab,
    addTab,
    removeTab,
    renameTab,
    reorderTabs,
    canRemoveTab,
  } = useOrcamentoTabs(sectionsComServicos, {
    onRenameTabPersist: handleRenameTabPersist,
  });

  const handleMergeTabPersist = useCallback(async (sourceName: string, targetName: string) => {
    if (!orcamentoId) {
      throw new Error('Nenhum orçamento selecionado');
    }

    const targetSection = sectionsComServicos.find(secao => secao.name === targetName);
    await ItemOrcamentoService.mergeSections(
      orcamentoId,
      sourceName,
      targetName,
      targetSection?.orderIndex
    );
    await refreshItems();
  }, [orcamentoId, sectionsComServicos, refreshItems]);

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

  // Filtrar serviços pela seção selecionada
  const filteredServicos = useMemo(() => {
    return getServicosBySection(selectedTab);
  }, [getServicosBySection, selectedTab]);

  // Subtotal da seção (itens + serviços calculados da seção)
  const subtotalSecao = useMemo(() => {
    const totalItens = somarValorTotalItens(filteredItems);
    const totalServicosSecao = somarServicosCalculados(filteredServicos);
    return totalItens + totalServicosSecao;
  }, [filteredItems, filteredServicos]);

  // Calcular totais corretos incluindo serviços calculados
  const totals = useMemo(() => {
    const servicosCalculadosTotal = somarServicosCalculados(servicos);
    return {
      totalItems: dataverseTotals.totalItems,
      totalProducts: dataverseTotals.totalProducts,
      totalServices: dataverseTotals.totalServices + servicosCalculadosTotal,
      totalValue: dataverseTotals.totalValue + servicosCalculadosTotal,
    };
  }, [dataverseTotals, servicos]);

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
    // Editar o primeiro item selecionado
    if (selectedItems.size === 0) return;
    const firstItemId = Array.from(selectedItems)[0];
    const item = items.find((i) => i.new_itemdeorcamentoid === firstItemId);
    if (item) {
      handleItemDoubleClick(item);
    }
  };

  const handleItemDoubleClick = (item: ItemOrcamento) => {
    setItemBeingEdited(item);
    setEditItemSidebarOpen(true);
  };

  const handleSaveItem = async (itemId: string, updates: Partial<ItemOrcamento>) => {
    try {
      await ItemOrcamentoService.updateItem(itemId, updates);
      await refreshItems();
      showSuccess('Item atualizado com sucesso');
    } catch (err) {
      showError('Erro ao atualizar item');
      throw err;
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await ItemOrcamentoService.updateItem(itemId, {
        new_removido: true,
      });
      await refreshItems();
      showSuccess('Item removido com sucesso');
    } catch (err) {
      showError('Erro ao remover item');
      throw err;
    }
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

  return (
    <PageContainer>
      <div style={{ position: 'relative' }}>
        <PageHeader
          title={hasOrcamento ? (orcamento.new_name || 'Orçamento sem nome') : 'Orçamentos'}
          subtitle={
            hasOrcamento
              ? `${orcamento.new_nomecliente || 'Cliente não definido'} • ${orcamento.new_nomeprojeto || 'Sem projeto'}`
              : 'Gerencie seus orçamentos'
          }
        />
        {hasOrcamento && orcamento.new_numerodaproposta && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '24px',
              fontSize: '14px',
              fontWeight: 600,
              color: tokens.colorBrandForeground1,
            }}
          >
            Proposta #{orcamento.new_numerodaproposta}
          </div>
        )}
      </div>

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
                onMergeTab={handleMergeTabPersist}
                onReorderTabs={reorderTabs}
                canRemoveTab={canRemoveTab}
                onRenameError={showError}
                onMergeError={showError}
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
                    servicos={filteredServicos}
                    selectedItems={selectedItems}
                    onSelectionChange={handleSelectionChange}
                    onItemDoubleClick={handleItemDoubleClick}
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
                      {formatarMoeda(subtotalSecao)}
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

      <EditItemSidebar
        open={editItemSidebarOpen}
        item={itemBeingEdited}
        sections={tabs}
        onClose={() => {
          setEditItemSidebarOpen(false);
          setItemBeingEdited(null);
        }}
        onSave={handleSaveItem}
        onRemove={handleRemoveItem}
      />
    </PageContainer>
  );
}
