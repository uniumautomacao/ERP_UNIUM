/**
 * Hook principal de dados para orçamentos
 * Implementa request ID pattern para prevenir race conditions
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { OrcamentoService } from '../../services/orcamentos/OrcamentoService';
import { ItemOrcamentoService } from '../../services/orcamentos/ItemOrcamentoService';
import { CreditoService } from '../../services/orcamentos/CreditoService';
import { PagamentoService } from '../../services/orcamentos/PagamentoService';
import { calcularTotaisItens, extrairSecoes } from '../../features/orcamentos/utils';
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
    const requestId = ++orcamentoRequestId.current;
    setIsLoading(true);
    setError(null);

    try {
      const orcamentoData = await OrcamentoService.fetchOrcamentoById(id);

      // Verificar se request ainda é atual
      if (requestId !== orcamentoRequestId.current) {
        return;
      }

      if (!orcamentoData) {
        throw new Error('Orçamento não encontrado');
      }

      setOrcamento(orcamentoData);

      // Carregar dados relacionados em paralelo
      const clienteId = orcamentoData.new_cliente || (orcamentoData as any)._new_cliente_value || '';

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
    const requestId = parentRequestId ?? ++itemsRequestId.current;
    setIsLoadingItems(true);

    try {
      const itemsData = await ItemOrcamentoService.fetchItemsByOrcamento(id);

      // Verificar se request ainda é atual
      if (requestId !== itemsRequestId.current && !parentRequestId) {
        return;
      }
      if (parentRequestId && requestId !== orcamentoRequestId.current) {
        return;
      }

      setItems(itemsData);
    } catch (err) {
      console.error('Erro ao carregar itens:', err);
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
    if (!clienteId) {
      return;
    }

    const requestId = parentRequestId ?? ++creditosRequestId.current;
    setIsLoadingCreditos(true);

    try {
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
    try {
      const pagamentosData = await PagamentoService.fetchOpcoesByOrcamento(id);

      // Verificar se request ainda é atual
      if (parentRequestId && parentRequestId !== orcamentoRequestId.current) {
        return;
      }

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
    return extrairSecoes(items);
  }, [items]);

  /**
   * Calcular totais
   */
  const totals = useMemo((): OrcamentoTotals => {
    return calcularTotaisItens(items);
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
    if (orcamentoId) {
      loadOrcamento(orcamentoId);
    } else {
      setOrcamento(null);
      setItems([]);
      setCreditos([]);
      setUtilizacoes([]);
      setOpcoesPagamento([]);
      setError(null);
    }
  }, [orcamentoId, loadOrcamento]);

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
