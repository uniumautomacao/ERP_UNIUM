import { NewComentariodeOrdemdeServicoService } from '../../generated/services/NewComentariodeOrdemdeServicoService';
import { NewOrdemdeServicoFieldControlService } from '../../generated/services/NewOrdemdeServicoFieldControlService';
import { SystemusersService } from '../../generated/services/SystemusersService';
import { escapeODataValue, chunkIds } from '../../utils/guia-conexoes/odata';
import type { TipoServicoFiltro } from './types';
import { STATUS_PROGRAMACAO, TIPO_SERVICO } from './constants';

const DATA_CAMPO_PREVISAO = 'new_previsaodeentregadosprodutos';

export const buildBaseFilter = () => 'statecode eq 0 and new_concluido ne true';

export const buildServiceFilter = (tipoServico: TipoServicoFiltro) => {
  if (tipoServico === 'todos') return ` and (new_tipodeservico eq ${TIPO_SERVICO.Cabeamento} or new_tipodeservico eq ${TIPO_SERVICO.Instalacao})`;
  const value = tipoServico === 'cabeamento' ? TIPO_SERVICO.Cabeamento : TIPO_SERVICO.Instalacao;
  return ` and new_tipodeservico eq ${value}`;
};

export const buildSearchFilter = (term: string) => {
  const normalized = term.trim();
  if (!normalized) return '';
  const escaped = escapeODataValue(normalized);
  return ` and (contains(new_projetoapelido, '${escaped}') or contains(new_nomedoclientefx, '${escaped}') or contains(new_name, '${escaped}'))`;
};

export const buildYearRangeFilter = (year: number) => {
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));
  return ` and ${DATA_CAMPO_PREVISAO} ge ${start.toISOString()} and ${DATA_CAMPO_PREVISAO} lt ${end.toISOString()}`;
};

export const buildMonthRangeFilter = (year: number, month: number) => {
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
  return ` and ${DATA_CAMPO_PREVISAO} ge ${start.toISOString()} and ${DATA_CAMPO_PREVISAO} lt ${end.toISOString()}`;
};

export const selectListaOS = [
  'new_ordemdeservicofieldcontrolid',
  'new_name',
  'new_id',
  'new_projetoapelido',
  'new_nomedoclientefx',
  'new_tipodeservico',
  'new_tipodeservicotexto',
  'new_tipodeservicotagcolor',
  'new_tiposdesistematexto',
  'new_previsaodeentregadosprodutos',
  'new_datadaultimaconfirmacao',
  'new_datadaultimatentativadecontato',
  'new_contagemdetentativasdecontato',
  'new_statusdaprogramacao',
  'createdon',
];

export const selectCalendario = [
  'new_ordemdeservicofieldcontrolid',
  'new_projetoapelido',
  'new_nomedoclientefx',
  'new_tipodeservico',
  'new_tipodeservicotexto',
  'new_previsaodeentregadosprodutos',
  'new_statusdaprogramacao',
];

export const fetchPendentesGroups = async (params: {
  ano: number;
  tipoServico: TipoServicoFiltro;
  searchTerm: string;
}) => {
  const base = buildBaseFilter();
  const service = buildServiceFilter(params.tipoServico);
  const search = buildSearchFilter(params.searchTerm);
  const yearRange = buildYearRangeFilter(params.ano);

  const fetchGroup = async (status: number, includeYearRange: boolean, orderBy: string[]) => {
    let statusFilter = `new_statusdaprogramacao eq ${status}`;
    if (status === STATUS_PROGRAMACAO.AguardandoPrimeiroContato) {
      statusFilter = `(new_statusdaprogramacao eq ${status} or new_statusdaprogramacao eq null) and new_numerodeentregaspendentes gt 0`;
    }
    const filter = `${base}${service}${search} and ${statusFilter}${includeYearRange ? yearRange : ''} and _new_cliente_value ne null`;
    return NewOrdemdeServicoFieldControlService.getAll({
      filter,
      select: selectListaOS,
      orderBy,
      maxPageSize: 5000,
    });
  };

  const [aguardando, pendente15, pendente30, pendente60] = await Promise.all([
    fetchGroup(STATUS_PROGRAMACAO.AguardandoPrimeiroContato, false, ['createdon asc']),
    fetchGroup(STATUS_PROGRAMACAO.PendenteReconfirmacao15d, true, [`${DATA_CAMPO_PREVISAO} asc`]),
    fetchGroup(STATUS_PROGRAMACAO.PendenteReconfirmacao30d, true, [`${DATA_CAMPO_PREVISAO} asc`]),
    fetchGroup(STATUS_PROGRAMACAO.PendenteReconfirmacao60d, true, [`${DATA_CAMPO_PREVISAO} asc`]),
  ]);

  return {
    aguardando,
    pendente15,
    pendente30,
    pendente60,
  };
};

export const fetchSemResposta = async (params: {
  tipoServico: TipoServicoFiltro;
  searchTerm: string;
}) => {
  const base = buildBaseFilter();
  const service = buildServiceFilter(params.tipoServico);
  const search = buildSearchFilter(params.searchTerm);
  const filter = `${base}${service}${search} and new_statusdaprogramacao eq ${STATUS_PROGRAMACAO.SemResposta}`;

  return NewOrdemdeServicoFieldControlService.getAll({
    filter,
    select: selectListaOS,
    orderBy: ['new_datadaultimatentativadecontato desc', 'createdon desc'],
    maxPageSize: 5000,
  });
};

export const fetchCalendarioMonth = async (params: {
  ano: number;
  mes: number;
  tipoServico: TipoServicoFiltro;
  searchTerm: string;
}) => {
  const base = buildBaseFilter();
  const service = buildServiceFilter(params.tipoServico);
  const search = buildSearchFilter(params.searchTerm);
  const monthRange = buildMonthRangeFilter(params.ano, params.mes);
  const filter = `${base}${service}${search} and ${DATA_CAMPO_PREVISAO} ne null${monthRange}`;

  return NewOrdemdeServicoFieldControlService.getAll({
    filter,
    select: selectCalendario,
    orderBy: [`${DATA_CAMPO_PREVISAO} asc`],
    maxPageSize: 5000,
  });
};

export const fetchComentarios = async (osId: string) => {
  return NewComentariodeOrdemdeServicoService.getAll({
    filter: `statecode eq 0 and _new_ordemdeservico_value eq '${escapeODataValue(osId)}'`,
    select: ['new_comentariodeordemdeservicoid', 'new_datetime', 'new_tipodecomentario', 'new_comentario', '_new_usuario_value'],
    orderBy: ['new_datetime desc'],
    maxPageSize: 5000,
  });
};

export const fetchAnoBounds = async () => {
  const base = buildBaseFilter();
  const filter = `${base} and ${DATA_CAMPO_PREVISAO} ne null`;

  const [minResult, maxResult] = await Promise.all([
    NewOrdemdeServicoFieldControlService.getAll({
      filter,
      select: [DATA_CAMPO_PREVISAO],
      orderBy: [`${DATA_CAMPO_PREVISAO} asc`],
      top: 1,
      maxPageSize: 1,
    }),
    NewOrdemdeServicoFieldControlService.getAll({
      filter,
      select: [DATA_CAMPO_PREVISAO],
      orderBy: [`${DATA_CAMPO_PREVISAO} desc`],
      top: 1,
      maxPageSize: 1,
    }),
  ]);

  return { minResult, maxResult };
};

export const fetchUsuariosByIds = async (ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  if (uniqueIds.length === 0) return new Map<string, string>();

  const chunks = chunkIds(uniqueIds, 20);
  const results = await Promise.all(
    chunks.map((chunk) =>
      SystemusersService.getAll({
        filter: chunk.map((id) => `systemuserid eq '${escapeODataValue(id)}'`).join(' or '),
        select: ['systemuserid', 'fullname'],
      })
    )
  );

  const map = new Map<string, string>();
  results.forEach((result) => {
    (result.data || []).forEach((row: any) => {
      if (row.systemuserid) {
        map.set(row.systemuserid, row.fullname || 'Usuário');
      }
    });
  });
  return map;
};

