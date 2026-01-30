/**
 * Hook principal de dados para orçamentos
 * Implementa request ID pattern para prevenir race conditions
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { OrcamentoService } from '../../services/orcamentos/OrcamentoService';
import { ItemOrcamentoService } from '../../services/orcamentos/ItemOrcamentoService';
import { CreditoService } from '../../services/orcamentos/CreditoService';
import { PagamentoService } from '../../services/orcamentos/PagamentoService';
import type {
  Orcamento,
  ItemOrcamento,
  OrcamentoSecao,
  CreditoCliente,
  OpcaoPagamento,
  UtilizacaoCredito,
} from '../../features/orcamentos/types';

export interface OrcamentoTotals {
  totalItems: number;
  totalProducts: number;
  totalServices: number;
  totalValue: number;
}

export interface UseOrcamentoDataReturn {
  // Estado
  orcamento: Orcamento | null;
  items: ItemOrcamento[];
  sections: OrcamentoSecao[];
  creditos: CreditoCliente[];
  utilizacoes: UtilizacaoCredito[];
  opcoesPagamento: OpcaoPagamento[];
  isLoading: boolean;
  isLoadingItems: boolean;
  isLoadingCreditos: boolean;
  error: string | null;

  // Ações
  loadOrcamento: (orcamentoId: string) => Promise<void>;
  refreshItems: () => Promise<void>;
  refreshCreditos: () => Promise<void>;
  refreshPagamentos: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Derivados
  totals: OrcamentoTotals;
  creditosDisponiveis: number;
  creditosUtilizados: number;
}

export function useOrcamentoData(orcamentoId: string | null): UseOrcamentoDataReturn {
  // Estado
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [items, setItems] = useState<ItemOrcamento[]>([]);
  const [creditos, setCreditos] = useState<CreditoCliente[]>([]);
  const [utilizacoes, setUtilizacoes] = useState<UtilizacaoCredito[]>([]);
  const [opcoesPagamento, setOpcoesPagamento] = useState<OpcaoPagamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingCreditos, setIsLoadingCreditos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request IDs para race condition prevention
  const orcamentoRequestId = useRef(0);
  const itemsRequestId = useRef(0);
  const creditosRequestId = useRef(0);

  /**
   * Carregar orçamento por ID
   */
  const loadOrcamento = useCallback(async (id: string) => {
    console.log('[useOrcamentoData.loadOrcamento] Iniciando carregamento do orçamento:', id);
    const requestId = ++orcamentoRequestId.current;
    console.log('[useOrcamentoData.loadOrcamento] Request ID:', requestId);
    setIsLoading(true);
    setError(null);

    try {
      console.log('[useOrcamentoData.loadOrcamento] Chamando OrcamentoService.fetchOrcamentoById');
      const orcamentoData = await OrcamentoService.fetchOrcamentoById(id);
      console.log('[useOrcamentoData.loadOrcamento] Dados retornados:', orcamentoData);

      // Verificar se request ainda é atual
      if (requestId !== orcamentoRequestId.current) {
        console.log('[useOrcamentoData.loadOrcamento] Request cancelado (não é mais atual)');
        return;
      }

      if (!orcamentoData) {
        console.error('[useOrcamentoData.loadOrcamento] Orçamento retornou null');
        throw new Error('Orçamento não encontrado');
      }

      console.log('[useOrcamentoData.loadOrcamento] Orçamento carregado com sucesso');
      console.log('[useOrcamentoData.loadOrcamento] Cliente do orçamento:', {
        new_cliente: orcamentoData.new_cliente,
        _new_cliente_value: (orcamentoData as any)._new_cliente_value,
      });
      console.log('[useOrcamentoData.loadOrcamento] Atualizando estado do orçamento com dados:', {
        id: orcamentoData.new_orcamentoid,
        name: orcamentoData.new_name,
      });
      setOrcamento(orcamentoData);
      console.log('[useOrcamentoData.loadOrcamento] Estado do orçamento atualizado');

      // Carregar dados relacionados em paralelo
      const clienteId = orcamentoData.new_cliente || (orcamentoData as any)._new_cliente_value || '';
      console.log('[useOrcamentoData.loadOrcamento] Chamando carregamento de dados relacionados com clienteId:', clienteId);

      await Promise.all([
        loadItems(id, requestId),
        loadCreditos(clienteId, requestId),
        loadPagamentos(id, requestId),
      ]);
    } catch (err) {
      if (requestId !== orcamentoRequestId.current) return;
      console.error('Erro ao carregar orçamento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar orçamento');
    } finally {
      if (requestId === orcamentoRequestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Carregar itens do orçamento
   */
  const loadItems = useCallback(async (id: string, parentRequestId?: number) => {
    console.log('[useOrcamentoData.loadItems] Iniciando carregamento de itens:', { id, parentRequestId });
    const requestId = parentRequestId ?? ++itemsRequestId.current;
    console.log('[useOrcamentoData.loadItems] Request ID:', requestId);
    setIsLoadingItems(true);

    try {
      console.log('[useOrcamentoData.loadItems] Chamando ItemOrcamentoService.fetchItemsByOrcamento');
      const itemsData = await ItemOrcamentoService.fetchItemsByOrcamento(id);
      console.log('[useOrcamentoData.loadItems] Itens retornados:', itemsData.length);

      // Verificar se request ainda é atual
      if (requestId !== itemsRequestId.current && !parentRequestId) {
        console.log('[useOrcamentoData.loadItems] Request cancelado (items)');
        return;
      }
      if (parentRequestId && requestId !== orcamentoRequestId.current) {
        console.log('[useOrcamentoData.loadItems] Request cancelado (parent)');
        return;
      }

      console.log('[useOrcamentoData.loadItems] Atualizando estado com itens');
      setItems(itemsData);
    } catch (err) {
      console.error('[useOrcamentoData.loadItems] Erro ao carregar itens:', err);
      if (!parentRequestId) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar itens');
      }
    } finally {
      if ((parentRequestId && requestId === orcamentoRequestId.current) ||
          (!parentRequestId && requestId === itemsRequestId.current)) {
        setIsLoadingItems(false);
      }
    }
  }, []);

  /**
   * Carregar créditos do cliente
   */
  const loadCreditos = useCallback(async (clienteId: string, parentRequestId?: number) => {
    console.log('[useOrcamentoData.loadCreditos] Iniciando carregamento de créditos:', { clienteId, parentRequestId });
    if (!clienteId) {
      console.log('[useOrcamentoData.loadCreditos] clienteId vazio, abortando');
      return;
    }

    const requestId = parentRequestId ?? ++creditosRequestId.current;
    console.log('[useOrcamentoData.loadCreditos] Request ID:', requestId);
    setIsLoadingCreditos(true);

    try {
      console.log('[useOrcamentoData.loadCreditos] Chamando serviços de crédito em paralelo');
      const [creditosData, utilizacoesData] = await Promise.all([
        CreditoService.fetchCreditosByCliente(clienteId),
        orcamentoId ? CreditoService.fetchUtilizacoesByOrcamento(orcamentoId) : Promise.resolve([]),
      ]);

      // Verificar se request ainda é atual
      if (requestId !== creditosRequestId.current && !parentRequestId) return;
      if (parentRequestId && requestId !== orcamentoRequestId.current) return;

      setCreditos(creditosData);
      setUtilizacoes(utilizacoesData);
    } catch (err) {
      console.error('Erro ao carregar créditos:', err);
      if (!parentRequestId) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar créditos');
      }
    } finally {
      if ((parentRequestId && requestId === orcamentoRequestId.current) ||
          (!parentRequestId && requestId === creditosRequestId.current)) {
        setIsLoadingCreditos(false);
      }
    }
  }, [orcamentoId]);

  /**
   * Carregar opções de pagamento
   */
  const loadPagamentos = useCallback(async (id: string, parentRequestId?: number) => {
    console.log('[useOrcamentoData.loadPagamentos] Iniciando carregamento de pagamentos:', { id, parentRequestId });
    try {
      console.log('[useOrcamentoData.loadPagamentos] Chamando PagamentoService.fetchOpcoesByOrcamento');
      const pagamentosData = await PagamentoService.fetchOpcoesByOrcamento(id);
      console.log('[useOrcamentoData.loadPagamentos] Pagamentos retornados:', pagamentosData.length);

      // Verificar se request ainda é atual
      if (parentRequestId && parentRequestId !== orcamentoRequestId.current) {
        console.log('[useOrcamentoData.loadPagamentos] Request cancelado');
        return;
      }

      console.log('[useOrcamentoData.loadPagamentos] Atualizando estado com pagamentos');
      setOpcoesPagamento(pagamentosData);
    } catch (err) {
      console.error('Erro ao carregar opções de pagamento:', err);
    }
  }, []);

  /**
   * Refresh apenas itens
   */
  const refreshItems = useCallback(async () => {
    if (!orcamentoId) return;
    await loadItems(orcamentoId);
  }, [orcamentoId, loadItems]);

  /**
   * Refresh apenas créditos
   */
  const refreshCreditos = useCallback(async () => {
    if (!orcamento?.new_cliente) return;
    await loadCreditos(orcamento.new_cliente);
  }, [orcamento?.new_cliente, loadCreditos]);

  /**
   * Refresh apenas pagamentos
   */
  const refreshPagamentos = useCallback(async () => {
    if (!orcamentoId) return;
    await loadPagamentos(orcamentoId);
  }, [orcamentoId, loadPagamentos]);

  /**
   * Refresh tudo
   */
  const refreshAll = useCallback(async () => {
    if (!orcamentoId) return;
    await loadOrcamento(orcamentoId);
  }, [orcamentoId, loadOrcamento]);

  /**
   * Calcular seções com base nos itens
   */
  const sections = useMemo((): OrcamentoSecao[] => {
    const sectionMap = new Map<string, OrcamentoSecao>();

    items.forEach(item => {
      const sectionName = item.new_section || 'Sem seção';
      const existing = sectionMap.get(sectionName);

      if (existing) {
        existing.itemCount++;
        existing.valorTotal += item.new_valortotal || 0;
      } else {
        sectionMap.set(sectionName, {
          name: sectionName,
          orderIndex: item.new_sectionorderindex || 0,
          itemCount: 1,
          valorTotal: item.new_valortotal || 0,
        });
      }
    });

    return Array.from(sectionMap.values()).sort((a, b) => a.orderIndex - b.orderIndex);
  }, [items]);

  /**
   * Calcular totais
   */
  const totals = useMemo((): OrcamentoTotals => {
    return items.reduce(
      (acc, item) => {
        const quantidade = item.new_quantidade || 0;
        const valorProduto = (item.new_valordeproduto || 0) * quantidade;
        const valorServico = (item.new_valordeservico || 0) * quantidade;

        return {
          totalItems: acc.totalItems + 1,
          totalProducts: acc.totalProducts + valorProduto,
          totalServices: acc.totalServices + valorServico,
          totalValue: acc.totalValue + (item.new_valortotal || 0),
        };
      },
      { totalItems: 0, totalProducts: 0, totalServices: 0, totalValue: 0 }
    );
  }, [items]);

  /**
   * Calcular créditos disponíveis
   */
  const creditosDisponiveis = useMemo(() => {
    return creditos.reduce((total, credito) => total + (credito.new_valordisponivel || 0), 0);
  }, [creditos]);

  /**
   * Calcular créditos utilizados
   */
  const creditosUtilizados = useMemo(() => {
    return utilizacoes.reduce((total, utilizacao) => total + (utilizacao.new_valor || 0), 0);
  }, [utilizacoes]);

  /**
   * Carregar orçamento quando ID muda
   */
  useEffect(() => {
    console.log('[useOrcamentoData] useEffect - orcamentoId mudou:', orcamentoId);
    if (orcamentoId) {
      console.log('[useOrcamentoData] useEffect - Chamando loadOrcamento com ID:', orcamentoId);
      loadOrcamento(orcamentoId);
    } else {
      console.log('[useOrcamentoData] useEffect - orcamentoId é null, limpando estado');
      setOrcamento(null);
      setItems([]);
      setCreditos([]);
      setUtilizacoes([]);
      setOpcoesPagamento([]);
      setError(null);
    }
  }, [orcamentoId, loadOrcamento]);

  console.log('[useOrcamentoData] Estado atual do hook:', {
    hasOrcamento: !!orcamento,
    orcamentoId: orcamento?.new_orcamentoid,
    orcamentoName: orcamento?.new_name,
    itemsCount: items.length,
    sectionsCount: sections.length,
    isLoading,
    error,
  });

  return {
    // Estado
    orcamento,
    items,
    sections,
    creditos,
    utilizacoes,
    opcoesPagamento,
    isLoading,
    isLoadingItems,
    isLoadingCreditos,
    error,

    // Ações
    loadOrcamento,
    refreshItems,
    refreshCreditos,
    refreshPagamentos,
    refreshAll,

    // Derivados
    totals,
    creditosDisponiveis,
    creditosUtilizados,
  };
}
