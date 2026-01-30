/**
 * Hook para gerenciar as seções/abas do orçamento
 */

import { useState, useCallback, useEffect } from 'react';
import type { OrcamentoSecao } from '../../features/orcamentos/types';
import { ordenarSecoes, recalcularOrderIndex } from '../../features/orcamentos/utils';
import { DEFAULTS, SECAO_ESPECIAL } from '../../features/orcamentos/constants';

export function useOrcamentoTabs(initialTabs: OrcamentoSecao[] = []) {
  const [tabs, setTabs] = useState<OrcamentoSecao[]>(ordenarSecoes(initialTabs));
  const [selectedTab, setSelectedTab] = useState<string | null>(
    initialTabs.length > 0 ? initialTabs[0].name : null
  );

  // Sync internal state with external data changes
  useEffect(() => {
    const sortedTabs = ordenarSecoes(initialTabs);
    setTabs(sortedTabs);

    // Update selected tab if needed
    setSelectedTab((currentTab) => {
      // If no tabs, clear selection
      if (sortedTabs.length === 0) {
        return null;
      }

      // If no tab selected, or current selection doesn't exist in new tabs, select first
      if (!currentTab || !sortedTabs.some((tab) => tab.name === currentTab)) {
        return sortedTabs[0].name;
      }

      // Keep current selection
      return currentTab;
    });
  }, [initialTabs]);

  /**
   * Adiciona uma nova aba
   */
  const addTab = useCallback((name: string) => {
    setTabs((prevTabs) => {
      // Verificar se já existe
      if (prevTabs.some((tab) => tab.name === name)) {
        return prevTabs;
      }

      // Calcular orderIndex
      const maxIndex = prevTabs.reduce(
        (max, tab) => Math.max(max, tab.orderIndex),
        0
      );

      const newTab: OrcamentoSecao = {
        name,
        orderIndex: maxIndex + DEFAULTS.SECTION_ORDER_INCREMENT,
        itemCount: 0,
        valorTotal: 0,
      };

      const updatedTabs = ordenarSecoes([...prevTabs, newTab]);

      // Selecionar a nova aba
      setSelectedTab(name);

      return updatedTabs;
    });
  }, []);

  /**
   * Remove uma aba
   */
  const removeTab = useCallback((name: string) => {
    setTabs((prevTabs) => {
      const filtered = prevTabs.filter((tab) => tab.name !== name);

      // Se removeu a aba selecionada, selecionar outra
      if (selectedTab === name && filtered.length > 0) {
        setSelectedTab(filtered[0].name);
      }

      return filtered;
    });
  }, [selectedTab]);

  /**
   * Renomeia uma aba
   */
  const renameTab = useCallback((oldName: string, newName: string) => {
    setTabs((prevTabs) => {
      // Verificar se o novo nome já existe
      if (prevTabs.some((tab) => tab.name === newName && tab.name !== oldName)) {
        return prevTabs;
      }

      const updated = prevTabs.map((tab) =>
        tab.name === oldName ? { ...tab, name: newName } : tab
      );

      // Atualizar seleção se necessário
      if (selectedTab === oldName) {
        setSelectedTab(newName);
      }

      return ordenarSecoes(updated);
    });
  }, [selectedTab]);

  /**
   * Reordena abas após drag-and-drop
   */
  const reorderTabs = useCallback((startIndex: number, endIndex: number) => {
    setTabs((prevTabs) => {
      const reordered = recalcularOrderIndex(prevTabs, startIndex, endIndex);
      return ordenarSecoes(reordered);
    });
  }, []);

  /**
   * Move aba para cima
   */
  const moveTabUp = useCallback((name: string) => {
    setTabs((prevTabs) => {
      const index = prevTabs.findIndex((tab) => tab.name === name);
      if (index <= 0) return prevTabs; // Já está no topo

      const reordered = recalcularOrderIndex(prevTabs, index, index - 1);
      return ordenarSecoes(reordered);
    });
  }, []);

  /**
   * Move aba para baixo
   */
  const moveTabDown = useCallback((name: string) => {
    setTabs((prevTabs) => {
      const index = prevTabs.findIndex((tab) => tab.name === name);
      if (index < 0 || index >= prevTabs.length - 1) return prevTabs; // Já está no fim

      const reordered = recalcularOrderIndex(prevTabs, index, index + 1);
      return ordenarSecoes(reordered);
    });
  }, []);

  /**
   * Verifica se a aba pode ser removida
   */
  const canRemoveTab = useCallback((name: string) => {
    // Não pode remover se for a última aba
    if (tabs.length <= 1) return false;

    // DEVOLUÇÃO é especial, mas pode ser removida se necessário
    return true;
  }, [tabs.length]);

  /**
   * Verifica se a aba pode ser renomeada
   */
  const canRenameTab = useCallback((name: string) => {
    // Todas as abas podem ser renomeadas
    return true;
  }, []);

  /**
   * Verifica se a aba pode ser movida para cima
   */
  const canMoveUp = useCallback((name: string) => {
    const index = tabs.findIndex((tab) => tab.name === name);
    return index > 0;
  }, [tabs]);

  /**
   * Verifica se a aba pode ser movida para baixo
   */
  const canMoveDown = useCallback((name: string) => {
    const index = tabs.findIndex((tab) => tab.name === name);
    // DEVOLUÇÃO sempre fica por último
    if (name === SECAO_ESPECIAL.DEVOLUCAO) return false;
    return index >= 0 && index < tabs.length - 1;
  }, [tabs]);

  return {
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
    canRenameTab,
    canMoveUp,
    canMoveDown,
  };
}
