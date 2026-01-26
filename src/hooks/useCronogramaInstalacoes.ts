import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComentarioOS, CronogramaOS, FiltrosCronograma, StatusProgramacao } from '../features/cronograma-instalacoes/types';
import { calcularStatus, formatDateLong, obterAnosDisponiveis } from '../features/cronograma-instalacoes/utils';
import { STATUS_LABELS, STATUS_PROGRAMACAO, TIPO_COMENTARIO, TIPO_SERVICO } from '../features/cronograma-instalacoes/constants';
import {
  fetchAnoBounds,
  fetchCalendarioMonth,
  fetchComentarios,
  fetchPendentesGroups,
  fetchSemResposta,
  fetchUsuariosByIds,
} from '../features/cronograma-instalacoes/dataverse';
import { useCurrentSystemUser } from './useCurrentSystemUser';
import { NewComentariodeOrdemdeServicoService } from '../generated/services/NewComentariodeOrdemdeServicoService';
import { NewOrdemdeServicoFieldControlService } from '../generated/services/NewOrdemdeServicoFieldControlService';

interface CronogramaHookOptions extends FiltrosCronograma {
  mes: number;
}

const buildTipodeServicoLabel = (value?: number | null, texto?: string | null) => {
  if (value === TIPO_SERVICO.Cabeamento) return 'Cabeamento';
  if (value === TIPO_SERVICO.Instalacao) return 'Instalação';
  if (texto?.toLowerCase().includes('cabeamento')) return 'Cabeamento';
  return 'Instalação';
};

const mapConfirmacoes = (status?: StatusProgramacao | null) => {
  if (!status) return { confirmacao60d: false, confirmacao30d: false, confirmacao15d: false };
  const confirm60 = [
    STATUS_PROGRAMACAO.Confirmado60d,
    STATUS_PROGRAMACAO.PendenteReconfirmacao30d,
    STATUS_PROGRAMACAO.Confirmado30d,
    STATUS_PROGRAMACAO.PendenteReconfirmacao15d,
    STATUS_PROGRAMACAO.Confirmado15d,
    STATUS_PROGRAMACAO.ProntoParaAgendar,
  ].includes(status);
  const confirm30 = [
    STATUS_PROGRAMACAO.Confirmado30d,
    STATUS_PROGRAMACAO.PendenteReconfirmacao15d,
    STATUS_PROGRAMACAO.Confirmado15d,
    STATUS_PROGRAMACAO.ProntoParaAgendar,
  ].includes(status);
  const confirm15 = [
    STATUS_PROGRAMACAO.Confirmado15d,
    STATUS_PROGRAMACAO.ProntoParaAgendar,
  ].includes(status);
  return { confirmacao60d: confirm60, confirmacao30d: confirm30, confirmacao15d: confirm15 };
};

const mapOrdemServico = (record: any): CronogramaOS => {
  const statusValue = record.new_statusdaprogramacao as StatusProgramacao | undefined;
  const confirmacoes = mapConfirmacoes(statusValue ?? null);
  return {
    id: record.new_ordemdeservicofieldcontrolid,
    name: record.new_name || record.new_id || 'OS',
    projetoapelido: record.new_projetoapelido || null,
    cliente: record.new_nomedoclientefx || '-',
    tipodeservico: buildTipodeServicoLabel(record.new_tipodeservico, record.new_tipodeservicotexto),
    tiposdesistematexto: record.new_tiposdesistematexto ?? null,
    datadaproximaatividade: record.new_previsaodeentregadosprodutos ?? null,
    statusdaprogramacao: statusValue ?? STATUS_PROGRAMACAO.AguardandoPrimeiroContato,
    dataCriacao: record.createdon ?? null,
    datadaultimaconfirmacao: record.new_datadaultimaconfirmacao ?? null,
    datadaultimatentativadecontato: record.new_datadaultimatentativadecontato ?? null,
    contagemtentativascontato: record.new_contagemdetentativasdecontato ?? null,
    ultimaPrevisaoConhecida: record.new_previsaodeentregadosprodutos ?? null,
    ...confirmacoes,
  };
};

const buildDateIso = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toISOString();
};

const buildAutoComment = (prefixo: string, campos: Array<{ campo: string; antes: string; depois: string }>) => {
  const detalhes = campos.map((item) => `${item.campo} ${item.antes} → ${item.depois}`).join('; ');
  return `[AUTO] ${prefixo}: ${detalhes}`;
};

export function useCronogramaInstalacoes({ mes, ...filtros }: CronogramaHookOptions) {
  const { systemUserId } = useCurrentSystemUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendentes, setPendentes] = useState<Record<StatusProgramacao, CronogramaOS[]>>({
    100000000: [],
    100000001: [],
    100000002: [],
    100000003: [],
    100000004: [],
    100000005: [],
    100000006: [],
    100000007: [],
    100000008: [],
    100000009: [],
  });
  const [semResposta, setSemResposta] = useState<CronogramaOS[]>([]);
  const [calendarioItens, setCalendarioItens] = useState<CronogramaOS[]>([]);
  const [comentariosPorOs, setComentariosPorOs] = useState<Map<string, ComentarioOS[]>>(new Map());
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([
    new Date().getFullYear(),
    new Date().getFullYear() + 1,
  ]);
  const [debouncedSearch, setDebouncedSearch] = useState(filtros.searchTerm);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(filtros.searchTerm), 300);
    return () => clearTimeout(handle);
  }, [filtros.searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendentesResult, semRespostaResult, calendarioResult, boundsResult] = await Promise.all([
        fetchPendentesGroups({ ano: filtros.ano, tipoServico: filtros.tipoServico, searchTerm: debouncedSearch }),
        fetchSemResposta({ tipoServico: filtros.tipoServico, searchTerm: debouncedSearch }),
        fetchCalendarioMonth({ ano: filtros.ano, mes, tipoServico: filtros.tipoServico, searchTerm: debouncedSearch }),
        fetchAnoBounds(),
      ]);

      const mapList = (result: any) => (result.success && result.data ? result.data.map(mapOrdemServico) : []);
      const aguardando = mapList(pendentesResult.aguardando);
      const pend15 = mapList(pendentesResult.pendente15);
      const pend30 = mapList(pendentesResult.pendente30);
      const pend60 = mapList(pendentesResult.pendente60);

      setPendentes((prev) => ({
        ...prev,
        [STATUS_PROGRAMACAO.AguardandoPrimeiroContato]: aguardando,
        [STATUS_PROGRAMACAO.PendenteReconfirmacao15d]: pend15,
        [STATUS_PROGRAMACAO.PendenteReconfirmacao30d]: pend30,
        [STATUS_PROGRAMACAO.PendenteReconfirmacao60d]: pend60,
      }));

      setSemResposta(mapList(semRespostaResult));
      setCalendarioItens(mapList(calendarioResult));

      if (boundsResult.minResult.success && boundsResult.maxResult.success) {
        const minDate = boundsResult.minResult.data?.[0]?.new_previsaodeentregadosprodutos;
        const maxDate = boundsResult.maxResult.data?.[0]?.new_previsaodeentregadosprodutos;
        const anos = obterAnosDisponiveis(
          [
            ...aguardando,
            ...pend15,
            ...pend30,
            ...pend60,
            ...semResposta,
            ...calendarioItens,
          ].map((os) => ({
            ...os,
            datadaproximaatividade: os.datadaproximaatividade ?? minDate ?? maxDate ?? null,
          }))
        );
        setAnosDisponiveis(anos);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados do cronograma.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filtros.ano, filtros.tipoServico, mes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const itens = useMemo(() => {
    const map = new Map<string, CronogramaOS>();
    Object.values(pendentes).flat().forEach((os) => map.set(os.id, os));
    semResposta.forEach((os) => map.set(os.id, os));
    calendarioItens.forEach((os) => map.set(os.id, os));
    return Array.from(map.values());
  }, [pendentes, semResposta, calendarioItens]);

  const carregarComentarios = useCallback(async (osId: string) => {
    if (!osId || comentariosPorOs.has(osId)) return;
    const result = await fetchComentarios(osId);
    if (!result.success || !result.data) return;

    const userIds = Array.from(new Set(result.data.map((item: any) => item._new_usuario_value).filter(Boolean)));
    const usersMap = await fetchUsuariosByIds(userIds);

    const comentarios: ComentarioOS[] = result.data.map((item: any) => {
      const formattedUser = item['new_Usuario@OData.Community.Display.V1.FormattedValue'];
      const userName = formattedUser || usersMap.get(item._new_usuario_value) || 'Usuário';
      return {
        id: item.new_comentariodeordemdeservicoid,
        ordemdeservico: item._new_ordemdeservico_value,
        tipodecomentario: item.new_tipodecomentario,
        comentario: item.new_comentario ?? '',
        usuario: userName,
        datetime: item.new_datetime,
      };
    });

    setComentariosPorOs((prev) => {
      const next = new Map(prev);
      next.set(osId, comentarios);
      return next;
    });
  }, [comentariosPorOs]);

  const updateOs = useCallback(async (osId: string, payload: Record<string, unknown>) => {
    const result = await NewOrdemdeServicoFieldControlService.update(osId, payload as any);
    if (!result.success) {
      throw new Error('Falha ao atualizar OS no Dataverse.');
    }
  }, []);

  const createComentario = useCallback(async (osId: string, tipo: number, comentario: string) => {
    if (!systemUserId) {
      throw new Error('Usuário atual não encontrado no Dataverse.');
    }
    const payload: any = {
      new_tipodecomentario: tipo,
      new_comentario: comentario,
      new_datetime: new Date().toISOString(),
    };
    payload['new_OrdemdeServico@odata.bind'] = `/new_ordemdeservicofieldcontrols(${osId})`;
    payload['new_Usuario@odata.bind'] = `/systemusers(${systemUserId})`;

    const result = await NewComentariodeOrdemdeServicoService.create(payload);
    if (!result.success) {
      throw new Error('Falha ao criar comentário no Dataverse.');
    }
  }, [systemUserId]);

  const definirDataPrevista = useCallback(async (os: CronogramaOS, dataSelecionada: string, comentario: string) => {
    const iso = buildDateIso(dataSelecionada);
    const statusCalculado = calcularStatus({
      ...os,
      datadaproximaatividade: iso,
      confirmacao60d: false,
      confirmacao30d: false,
      confirmacao15d: false,
    });
    await updateOs(os.id, {
      new_previsaodeentregadosprodutos: iso,
      new_datadaultimaalteracaodeprevisao: new Date().toISOString(),
      new_datadaultimaconfirmacao: new Date().toISOString(),
      new_statusdaprogramacao: statusCalculado,
    });
    await createComentario(os.id, TIPO_COMENTARIO.DefinicaoData, comentario);
    await loadData();
  }, [createComentario, loadData, updateOs]);

  const confirmarData = useCallback(async (os: CronogramaOS, comentario: string, manterData: boolean, novaData?: string) => {
    if (manterData) {
      let nextStatus = os.statusdaprogramacao;
      if (os.statusdaprogramacao === STATUS_PROGRAMACAO.PendenteReconfirmacao60d) {
        nextStatus = STATUS_PROGRAMACAO.Confirmado60d;
      } else if (os.statusdaprogramacao === STATUS_PROGRAMACAO.PendenteReconfirmacao30d) {
        nextStatus = STATUS_PROGRAMACAO.Confirmado30d;
      } else if (os.statusdaprogramacao === STATUS_PROGRAMACAO.PendenteReconfirmacao15d) {
        nextStatus = STATUS_PROGRAMACAO.Confirmado15d;
      }
      await updateOs(os.id, {
        new_datadaultimaconfirmacao: new Date().toISOString(),
        new_statusdaprogramacao: nextStatus,
      });
      const tipoComentario =
        nextStatus === STATUS_PROGRAMACAO.Confirmado60d
          ? TIPO_COMENTARIO.Confirmacao60d
          : nextStatus === STATUS_PROGRAMACAO.Confirmado30d
            ? TIPO_COMENTARIO.Confirmacao30d
            : TIPO_COMENTARIO.Confirmacao15d;
      await createComentario(os.id, tipoComentario, comentario);
      await loadData();
      return;
    }

    if (!novaData) {
      throw new Error('Nova data não informada.');
    }
    const iso = buildDateIso(novaData);
    const statusCalculado = calcularStatus({
      ...os,
      datadaproximaatividade: iso,
      confirmacao60d: false,
      confirmacao30d: false,
      confirmacao15d: false,
    });
    await updateOs(os.id, {
      new_previsaodeentregadosprodutos: iso,
      new_datadaultimaalteracaodeprevisao: new Date().toISOString(),
      new_datadaultimaconfirmacao: new Date().toISOString(),
      new_statusdaprogramacao: statusCalculado,
    });
    await createComentario(os.id, TIPO_COMENTARIO.AlteracaoData, comentario);
    await createComentario(
      os.id,
      TIPO_COMENTARIO.ObservacaoGeral,
      buildAutoComment('Alteração de data', [
        {
          campo: 'new_previsaodeentregadosprodutos',
          antes: formatDateLong(os.datadaproximaatividade),
          depois: formatDateLong(iso),
        },
      ])
    );
    await loadData();
  }, [createComentario, loadData, updateOs]);

  const registrarTentativa = useCallback(async (os: CronogramaOS, comentario: string) => {
    const tentativaAtual = os.contagemtentativascontato ?? 0;
    await updateOs(os.id, {
      new_datadaultimatentativadecontato: new Date().toISOString(),
      new_contagemdetentativasdecontato: tentativaAtual + 1,
    });
    await createComentario(os.id, TIPO_COMENTARIO.TentativaContato, comentario);
    await loadData();
  }, [createComentario, loadData, updateOs]);

  const marcarSemResposta = useCallback(async (os: CronogramaOS) => {
    await updateOs(os.id, {
      new_statusdaprogramacao: STATUS_PROGRAMACAO.SemResposta,
      new_previsaodeentregadosprodutos: null,
    });
    await createComentario(
      os.id,
      TIPO_COMENTARIO.ClienteSemResposta,
      'Cliente marcado como sem resposta após tentativas de contato.'
    );
    await createComentario(
      os.id,
      TIPO_COMENTARIO.ObservacaoGeral,
      buildAutoComment('Sem resposta', [
        {
          campo: `new_statusdaprogramacao ${STATUS_LABELS[os.statusdaprogramacao]}(${os.statusdaprogramacao})`,
          antes: STATUS_LABELS[os.statusdaprogramacao],
          depois: `Sem Resposta(${STATUS_PROGRAMACAO.SemResposta})`,
        },
        {
          campo: 'new_previsaodeentregadosprodutos',
          antes: formatDateLong(os.datadaproximaatividade),
          depois: '(vazio)',
        },
      ])
    );
    await loadData();
  }, [createComentario, loadData, updateOs]);

  const clienteRetornou = useCallback(async (os: CronogramaOS) => {
    await updateOs(os.id, {
      new_statusdaprogramacao: STATUS_PROGRAMACAO.AguardandoPrimeiroContato,
      new_contagemdetentativasdecontato: 0,
    });
    await createComentario(
      os.id,
      TIPO_COMENTARIO.ObservacaoGeral,
      'Cliente retornou contato após período sem resposta.'
    );
    await loadData();
  }, [createComentario, loadData, updateOs]);

  return {
    itens,
    pendentes,
    semResposta,
    calendarioItens,
    comentariosPorOs,
    anosDisponiveis,
    loading,
    error,
    reload: loadData,
    carregarComentarios,
    definirDataPrevista,
    confirmarData,
    registrarTentativa,
    marcarSemResposta,
    clienteRetornou,
  };
}

