/**
 * Hook para gerenciar os itens do orçamento
 */

import { useState, useCallback, useMemo } from 'react';
import type { ItemOrcamento } from '../../features/orcamentos/types';
import { calcularValorTotalItem, calcularItemStatus } from '../../features/orcamentos/utils';

export function useOrcamentoItems(initialItems: ItemOrcamento[] = []) {
  const [items, setItems] = useState<ItemOrcamento[]>(initialItems);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  /**
   * Filtra itens por seção/aba
   */
  const getItemsBySection = useCallback(
    (sectionName: string | null) => {
      if (!sectionName) return items;
      return items.filter((item) => item.new_section === sectionName);
    },
    [items]
  );

  /**
   * Adiciona um novo item
   */
  const addItem = useCallback((item: ItemOrcamento) => {
    setItems((prev) => [...prev, item]);
  }, []);

  /**
   * Remove itens selecionados
   */
  const removeSelectedItems = useCallback(() => {
    setItems((prev) => prev.filter((item) => !selectedItems.has(item.new_itemdeorcamentoid)));
    setSelectedItems(new Set());
  }, [selectedItems]);

  /**
   * Atualiza um item
   */
  const updateItem = useCallback(
    (itemId: string, updates: Partial<ItemOrcamento>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.new_itemdeorcamentoid === itemId ? { ...item, ...updates } : item
        )
      );
    },
    []
  );

  /**
   * Seleciona/desseleciona um item
   */
  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  /**
   * Seleciona todos os itens
   */
  const selectAll = useCallback(() => {
    setSelectedItems(new Set(items.map((item) => item.new_itemdeorcamentoid)));
  }, [items]);

  /**
   * Limpa seleção
   */
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  /**
   * Move itens selecionados para outra seção
   */
  const moveItemsToSection = useCallback(
    (targetSection: string) => {
      setItems((prev) =>
        prev.map((item) =>
          selectedItems.has(item.new_itemdeorcamentoid)
            ? { ...item, new_section: targetSection }
            : item
        )
      );
    },
    [selectedItems]
  );

  /**
   * Calcula totais dos itens
   */
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const valorTotal = calcularValorTotalItem(item);
        return {
          totalItems: acc.totalItems + 1,
          totalValue: acc.totalValue + valorTotal,
          totalProducts: acc.totalProducts + (item.new_valordeproduto ?? 0) * (item.new_quantidade ?? 1),
          totalServices: acc.totalServices + (item.new_valordeservico ?? 0) * (item.new_quantidade ?? 1),
        };
      },
      { totalItems: 0, totalValue: 0, totalProducts: 0, totalServices: 0 }
    );
  }, [items]);

  /**
   * Itens com status calculado
   */
  const itemsWithStatus = useMemo(() => {
    return items.map((item) => ({
      ...item,
      _status: calcularItemStatus(item),
    }));
  }, [items]);

  return {
    items: itemsWithStatus,
    selectedItems,
    totals,
    getItemsBySection,
    addItem,
    removeSelectedItems,
    updateItem,
    toggleItemSelection,
    selectAll,
    clearSelection,
    moveItemsToSection,
  };
}
