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
    const refs = [...new Set(items.map(i => i.new_ref).filter(Boolean))] as string[];
    console.log('[useOrcamentoServicos] Referências extraídas dos items:', {
      itemsCount: items.length,
      referencias: refs,
      itemsDetalhes: items.map(i => ({ new_ref: i.new_ref, new_descricao: i.new_descricao })),
    });
    return refs;
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
        console.warn('[useOrcamentoServicos] Estado:', {
          referencias: referencias.length,
          refToPrecoId: refToPrecoId.size,
          tiposServico: tiposServico.size,
        });
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
    const resultado = calcularServicosAgrupados(items, refToPrecoId, tiposServico);

    console.log('[useOrcamentoServicos] Serviços calculados:', {
      itemsCount: items.length,
      refToPrecoIdSize: refToPrecoId.size,
      tiposServicoSize: tiposServico.size,
      servicosCount: resultado.length,
      servicos: resultado,
    });

    return resultado;
  }, [items, refToPrecoId, tiposServico]);

  // Filtrar por seção
  const getServicosBySection = (section: string | null): ServicoCalculado[] => {
    if (!section) return servicos;
    return servicos.filter(s => s.section === section);
  };

  return { servicos, getServicosBySection, isLoading };
}
