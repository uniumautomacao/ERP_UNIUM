import { useMemo } from 'react';
import type { FiltrosCronograma } from '../features/cronograma-instalacoes/types';
import { mockComentarios, mockOrdensDeServico } from '../features/cronograma-instalacoes/mockData';
import { calcularStatus, filtrarPorAno, filtrarPorBusca, filtrarPorTipoServico, obterAnosDisponiveis, agruparPendentes } from '../features/cronograma-instalacoes/utils';
import { PENDENTES_STATUS } from '../features/cronograma-instalacoes/constants';

export function useCronogramaInstalacoes(filtros: FiltrosCronograma) {
  const itens = useMemo(() => {
    return mockOrdensDeServico.map((os) => ({
      ...os,
      statusdaprogramacao: calcularStatus(os),
    }));
  }, []);

  const itensFiltrados = useMemo(() => {
    return itens.filter(
      (os) =>
        filtrarPorAno(os, filtros.ano) &&
        filtrarPorTipoServico(os, filtros.tipoServico) &&
        filtrarPorBusca(os, filtros.searchTerm)
    );
  }, [filtros, itens]);

  const pendentes = useMemo(() => {
    const pendentesList = itensFiltrados.filter((os) => PENDENTES_STATUS.includes(os.statusdaprogramacao));
    return agruparPendentes(pendentesList);
  }, [itensFiltrados]);

  const semResposta = useMemo(() => {
    return itensFiltrados.filter((os) => os.statusdaprogramacao === 10);
  }, [itensFiltrados]);

  const comentariosPorOs = useMemo(() => {
    const map = new Map<string, typeof mockComentarios>();
    mockComentarios.forEach((comentario) => {
      const list = map.get(comentario.ordemdeservico) ?? [];
      list.push(comentario);
      map.set(comentario.ordemdeservico, list);
    });
    map.forEach((list, key) => {
      map.set(
        key,
        [...list].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
      );
    });
    return map;
  }, []);

  const anosDisponiveis = useMemo(() => obterAnosDisponiveis(itens), [itens]);

  return {
    itens: itensFiltrados,
    pendentes,
    semResposta,
    comentariosPorOs,
    anosDisponiveis,
    loading: false,
    error: null as string | null,
    reload: () => undefined,
  };
}

