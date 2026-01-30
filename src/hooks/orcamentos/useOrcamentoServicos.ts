/*!
 * Hook para gerenciar cálculo de serviços agrupados
 * Busca tipos de serviço do Dataverse e calcula valores
 */
import { useState, useEffect, useMemo } from 'react';
import { ServicoService, TipoServicoPreco } from '../../services/orcamentos/ServicoService';
import { calcularServicosAgrupados, ServicoCalculado } from '../../features/orcamentos/utils';
import type { ItemOrcamento } from '../../features/orcamentos/types';

export function useOrcamentoServicos(items: ItemOrcamento[], orcamentoId: string | null) {
  const [refToPrecoId, setRefToPrecoId] = useState<Map<string, string>>(new Map());
  const [tiposServico, setTiposServico] = useState<Map<string, TipoServicoPreco[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Extrair referências únicas
  const referencias = useMemo(() => {
    return [...new Set(items.map(i => i.new_ref).filter(Boolean))] as string[];
  }, [items]);

  // Buscar dados quando referências mudarem
  useEffect(() => {
    if (!referencias.length || !orcamentoId) {
      setRefToPrecoId(new Map());
      setTiposServico(new Map());
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Buscar preços de produto por referência
        const precosMap = await ServicoService.fetchPrecosPorReferencias(referencias);
        setRefToPrecoId(precosMap);

        // 2. Buscar tipos de serviço pelos IDs de preço
        const precoIds = [...precosMap.values()];
        if (precoIds.length > 0) {
          const tiposMap = await ServicoService.fetchTiposServicoPorPrecos(precoIds);
          setTiposServico(tiposMap);
        } else {
          setTiposServico(new Map());
        }
      } catch (error) {
        console.error('[useOrcamentoServicos] Erro ao buscar serviços:', error);
        setRefToPrecoId(new Map());
        setTiposServico(new Map());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [referencias, orcamentoId]);

  // Calcular serviços agrupados
  const servicos = useMemo(() => {
    if (!items.length) {
      return [];
    }

    // Permitir cálculo mesmo se alguns maps estiverem vazios
    // Apenas items com dados disponíveis gerarão serviços
    return calcularServicosAgrupados(items, refToPrecoId, tiposServico);
  }, [items, refToPrecoId, tiposServico]);

  // Filtrar por seção
  const getServicosBySection = (section: string | null): ServicoCalculado[] => {
    if (!section) return servicos;
    return servicos.filter(s => s.section === section);
  };

  return { servicos, getServicosBySection, isLoading };
}
