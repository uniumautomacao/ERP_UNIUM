import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  MessageBar,
  Spinner,
  Text,
  Textarea,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ArrowSync24Regular, Filter24Regular } from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataGrid, createTableColumn } from '../../components/shared/DataGrid';
import { BarChart } from '../../components/charts/BarChart';
import { LineChart } from '../../components/charts/LineChart';
import { useCurrentSystemUser } from '../../hooks/useCurrentSystemUser';
import {
  Cr22fEstoqueFromSharepointListService,
  NewAjustedeEstoqueService,
  NewAppPreferenceService,
  NewContagemEstoqueService,
  NewContagemDoDiaItemService,
  NewContagemDoDiaService,
  NewSolicitacaodeAjustedeEstoqueService,
  SystemusersService,
} from '../../generated';
import type { ChartDataPoint } from '../../types';
import { buildUtcDayRangeFromDateKey, toDateOnlyKey } from '../../utils/inventory/contagemListaDoDia';

type ContagemRecord = {
  new_contagemestoqueid: string;
  new_datacontagem?: string;
  createdon?: string;
  new_sku?: string;
  new_enderecocompleto?: string;
  new_quantidadecontada?: number;
  new_quantidadeesperada?: number;
  new_situacao?: number;
  _new_itemestoque_value?: string;
  _new_usuario_value?: string;
  _usuario_nome?: string;
  new_ItemEstoque?: {
    cr22f_querytag?: number;
    cr22f_serialnumber?: string;
  };
  _solicitacao?: {
    new_solicitacaodeajustedeestoqueid?: string;
    new_statusdoprocessamento?: number;
    new_mensagemdeerro?: string;
    new_datahoraprocessamento?: string;
  };
};

type AjusteRecord = {
  new_ajustedeestoqueid: string;
  new_dataajuste?: string;
  new_justificativa?: string;
  new_saldoanterior?: number;
  new_saldonovo?: number;
  _new_contagem_value?: string;
  _new_itemestoque_value?: string;
  _new_usuarioajuste_value?: string;
  _contagem_nome?: string;
  _usuario_nome?: string;
};

type PreferenceRecord = {
  id: string;
  value?: number;
};

type ContagemDiaRecord = {
  new_contagemdodiaid: string;
  new_data?: string;
  createdon?: string;
  new_esperados?: number;
  _new_usuario_value?: string;
};

type AderenciaResumoRecord = {
  snapshotId: string;
  snapshotDate?: string;
  esperados: number;
  contados: number;
  percentual: number;
};

type ContagemDiaItemRecord = {
  new_contagemdodiaitemid: string;
  new_sku?: string;
  new_querytag?: number;
  new_endereco?: string;
  new_classecriticidade?: number;
  _new_snapshot_value?: string;
  _new_itemestoque_value?: string;
};

const SITUACAO_CONTAGEM = {
  Pendente: 100000000,
  Validada: 100000001,
  Ajustada: 100000002,
};

const STATUS_PROCESSAMENTO = {
  Pendente: 100000000,
  Processando: 100000001,
  Concludo: 100000002, // Typo no Dataverse: "Concludo" em vez de "Concluído"
  Erro: 100000003,
};

const normalizeStatusProcessamento = (value?: number | string | null | Record<string, any>) => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') return value;

  if (typeof value === 'object') {
    const possible =
      value.value ??
      value.Value ??
      value.option ??
      value.Option ??
      value.id ??
      value.Id;
    if (typeof possible === 'number') return possible;
    if (typeof possible === 'string') return normalizeStatusProcessamento(possible);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const digits = trimmed.match(/\d+/);
    if (digits) {
      const parsed = Number(digits[0]);
      if (!Number.isNaN(parsed)) return parsed;
    }
    const lower = trimmed.toLowerCase();
    if (lower === 'pendente' || lower === 'pending') return STATUS_PROCESSAMENTO.Pendente;
    if (lower === 'processando' || lower === 'processing') return STATUS_PROCESSAMENTO.Processando;
    if (lower === 'concluido' || lower === 'concludo' || lower === 'completed') {
      return STATUS_PROCESSAMENTO.Concludo;
    }
    if (lower === 'erro' || lower === 'error') return STATUS_PROCESSAMENTO.Erro;
  }

  return null;
};

const TAB_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'aderencia', label: 'Aderência' },
  { value: 'divergencias', label: 'Divergências' },
  { value: 'ajustes', label: 'Ajustes' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'config', label: 'Configurações' },
];

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  infoText: {
    color: tokens.colorNeutralForeground3,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
  },
  listRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  actionsRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  tableWrapper: {
    display: 'none',
    '@media (min-width: 768px)': {
      display: 'block',
    },
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    '@media (min-width: 768px)': {
      display: 'none',
    },
  },
});

const toIsoStart = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return date.toISOString();
};

const toIsoEnd = (value: string) => {
  const date = new Date(`${value}T23:59:59`);
  return date.toISOString();
};

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('pt-BR') : '---');

const formatShortId = (value?: string) => (value ? `${value.slice(0, 6)}...` : '---');

const formatChartLabel = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const getReportDate = (item: ContagemRecord) => item.new_datacontagem || item.createdon;

const formatClasseCriticidade = (value?: number) => {
  if (value === 100000000) return 'A';
  if (value === 100000001) return 'B';
  if (value === 100000002) return 'C';
  return '---';
};

const extractNextSkipToken = (result: any) => {
  const directToken =
    result?.skipToken ??
    result?.skiptoken ??
    result?.SkipToken ??
    result?.['@odata.skipToken'];
  if (typeof directToken === 'string' && directToken) {
    return directToken;
  }

  const nextLink =
    result?.nextLink ??
    result?.nextlink ??
    result?.NextLink ??
    result?.['@odata.nextLink'] ??
    result?.['odata.nextLink'];
  if (typeof nextLink === 'string' && nextLink) {
    const match = nextLink.match(/(?:\\$skiptoken|%24skiptoken)=([^&]+)/i);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
};

const toLocalDateKey = (iso: string) => {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


export function ContagemEstoqueGestaoPage() {
  const styles = useStyles();
  const { systemUserId } = useCurrentSystemUser();
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const [dashboardStart, setDashboardStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().slice(0, 10);
  });
  const [dashboardEnd, setDashboardEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pendentes: 0,
    validadas: 0,
  });
  const [dashboardItems, setDashboardItems] = useState<ContagemRecord[]>([]);
  const [dashboardChartData, setDashboardChartData] = useState<ChartDataPoint[]>([]);

  const [aderenciaStart, setAderenciaStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().slice(0, 10);
  });
  const [aderenciaEnd, setAderenciaEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [aderenciaLoading, setAderenciaLoading] = useState(false);
  const [aderenciaError, setAderenciaError] = useState<string | null>(null);
  const [aderenciaData, setAderenciaData] = useState<AderenciaResumoRecord[]>([]);
  const [aderenciaChartData, setAderenciaChartData] = useState<ChartDataPoint[]>([]);
  const [aderenciaSelected, setAderenciaSelected] = useState<AderenciaResumoRecord | null>(null);
  const [aderenciaItensLoading, setAderenciaItensLoading] = useState(false);
  const [aderenciaItensError, setAderenciaItensError] = useState<string | null>(null);
  const [aderenciaItens, setAderenciaItens] = useState<ContagemDiaItemRecord[]>([]);

  const [divergenciasLoading, setDivergenciasLoading] = useState(false);
  const [divergenciasError, setDivergenciasError] = useState<string | null>(null);
  const [divergencias, setDivergencias] = useState<ContagemRecord[]>([]);
  const [ajusteTarget, setAjusteTarget] = useState<ContagemRecord | null>(null);
  const [ajusteSaldoNovo, setAjusteSaldoNovo] = useState('');
  const [ajusteJustificativa, setAjusteJustificativa] = useState('');
  const [ajusteLoading, setAjusteLoading] = useState(false);

  const [ajustesLoading, setAjustesLoading] = useState(false);
  const [ajustesError, setAjustesError] = useState<string | null>(null);
  const [ajustes, setAjustes] = useState<AjusteRecord[]>([]);
  const [ajustesStart, setAjustesStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().slice(0, 10);
  });
  const [ajustesEnd, setAjustesEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);
  const [thresholdA, setThresholdA] = useState('20');
  const [thresholdB, setThresholdB] = useState('40');
  const [thresholdC, setThresholdC] = useState('60');
  const [configPrefs, setConfigPrefs] = useState<Record<string, PreferenceRecord>>({});

  const [reportStart, setReportStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().slice(0, 10);
  });
  const [reportEnd, setReportEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportSituacao, setReportSituacao] = useState('all');
  const [reportPageIndex, setReportPageIndex] = useState(0);
  const [reportPageTokens, setReportPageTokens] = useState<Array<string | null>>([null]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ContagemRecord[]>([]);

  const reportColumns = useMemo(
    () => [
      createTableColumn<ContagemRecord>({
        columnId: 'data',
        renderHeaderCell: () => 'Data',
        renderCell: (item) => formatDate(getReportDate(item)),
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'sku',
        renderHeaderCell: () => 'SKU',
        renderCell: (item) => item.new_sku || '---',
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'endereco',
        renderHeaderCell: () => 'Endereço',
        renderCell: (item) => item.new_enderecocompleto || '---',
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'contada',
        renderHeaderCell: () => 'Contada',
        renderCell: (item) => item.new_quantidadecontada ?? 0,
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'esperada',
        renderHeaderCell: () => 'Esperada',
        renderCell: (item) => item.new_quantidadeesperada ?? 0,
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'usuario',
        renderHeaderCell: () => 'Usuário',
        renderCell: (item) => item._usuario_nome || formatShortId(item._new_usuario_value),
      }),
    ],
    []
  );


  const dashboardColumns = useMemo(
    () => [
      createTableColumn<ContagemRecord>({
        columnId: 'data',
        renderHeaderCell: () => 'Data',
        renderCell: (item) => formatDate(item.new_datacontagem),
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'tag',
        renderHeaderCell: () => 'Etiqueta',
        renderCell: (item) => item.new_ItemEstoque?.cr22f_querytag || '---',
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'sku',
        renderHeaderCell: () => 'SKU',
        renderCell: (item) => item.new_sku || '---',
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'serial',
        renderHeaderCell: () => 'S/N',
        renderCell: (item) => item.new_ItemEstoque?.cr22f_serialnumber || '---',
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'endereco',
        renderHeaderCell: () => 'Endereço',
        renderCell: (item) => item.new_enderecocompleto || '---',
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'contada',
        renderHeaderCell: () => 'Contada',
        renderCell: (item) => item.new_quantidadecontada ?? 0,
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'esperada',
        renderHeaderCell: () => 'Esperada',
        renderCell: (item) => item.new_quantidadeesperada ?? 0,
      }),
    ],
    []
  );

  const ajustesColumns = useMemo(
    () => [
      createTableColumn<AjusteRecord>({
        columnId: 'data',
        renderHeaderCell: () => 'Data',
        renderCell: (item) => formatDate(item.new_dataajuste),
      }),
      createTableColumn<AjusteRecord>({
        columnId: 'saldoAnterior',
        renderHeaderCell: () => 'Saldo anterior',
        renderCell: (item) => item.new_saldoanterior ?? 0,
      }),
      createTableColumn<AjusteRecord>({
        columnId: 'saldoNovo',
        renderHeaderCell: () => 'Saldo novo',
        renderCell: (item) => item.new_saldonovo ?? 0,
      }),
      createTableColumn<AjusteRecord>({
        columnId: 'contagem',
        renderHeaderCell: () => 'Contagem',
        renderCell: (item) => item._contagem_nome || formatShortId(item._new_contagem_value),
      }),
      createTableColumn<AjusteRecord>({
        columnId: 'usuario',
        renderHeaderCell: () => 'Usuário',
        renderCell: (item) => item._usuario_nome || formatShortId(item._new_usuarioajuste_value),
      }),
    ],
    []
  );

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      console.info('[GestaoContagem][Dashboard] Iniciando carregamento', {
        dashboardStart,
        dashboardEnd,
      });
      const start = toIsoStart(dashboardStart);
      const end = toIsoEnd(dashboardEnd);
      const dateFilter = `new_datacontagem ge ${start} and new_datacontagem le ${end}`; 

      const [totalResult, pendenteResult, validadaResult, listResult] = await Promise.all([
        NewContagemEstoqueService.getAll({
          filter: `${dateFilter} and statecode eq 0`,
          select: ['new_contagemestoqueid'],
        }),
        NewContagemEstoqueService.getAll({
          filter: `${dateFilter} and statecode eq 0 and new_situacao eq ${SITUACAO_CONTAGEM.Pendente}`,
          select: ['new_contagemestoqueid'],
        }),
        NewContagemEstoqueService.getAll({
          filter: `${dateFilter} and statecode eq 0 and new_situacao eq ${SITUACAO_CONTAGEM.Validada}`,
          select: ['new_contagemestoqueid'],
        }),
        NewContagemEstoqueService.getAll({
          filter: `${dateFilter} and statecode eq 0`,
          orderBy: ['new_datacontagem desc'],
          select: [
            'new_contagemestoqueid',
            'new_datacontagem',
            'new_sku',
            'new_enderecocompleto',
            'new_quantidadecontada',
            'new_quantidadeesperada',
            '_new_usuario_value',
            '_new_itemestoque_value',
          ],
          top: 500,
        }),
      ]);

      console.info('[GestaoContagem][Dashboard] Totais', {
        total: totalResult.data?.length ?? 0,
        pendentes: pendenteResult.data?.length ?? 0,
        validadas: validadaResult.data?.length ?? 0,
      });

      setDashboardStats({
        total: totalResult.data?.length ?? 0,
        pendentes: pendenteResult.data?.length ?? 0,
        validadas: validadaResult.data?.length ?? 0,
      });

      const items = (listResult.data ?? []) as ContagemRecord[];
      console.info('[GestaoContagem][Dashboard] Contagens carregadas', {
        total: items.length,
        sample: items.slice(0, 3),
      });
      const estoqueIds: string[] = [];
      const estoqueIdsSet = new Set<string>();
      for (const item of items) {
        const itemId = item._new_itemestoque_value;
        if (itemId && !estoqueIdsSet.has(itemId)) {
          estoqueIdsSet.add(itemId);
          estoqueIds.push(itemId);
        }
      }

      let enrichedItems = items;
      if (estoqueIds.length > 0) {
        console.info('[GestaoContagem][Dashboard] Carregando estoque relacionado', {
          totalIds: estoqueIds.length,
        });
        const chunkSize = 50;
        const estoqueRequests: Promise<any>[] = [];
        for (let i = 0; i < estoqueIds.length; i += chunkSize) {
          const chunk = estoqueIds.slice(i, i + chunkSize);
          const filter = chunk.map((id) => `cr22f_estoquefromsharepointlistid eq '${id}'`).join(' or ');
          estoqueRequests.push(
            Cr22fEstoqueFromSharepointListService.getAll({
              filter,
              select: ['cr22f_estoquefromsharepointlistid', 'cr22f_querytag', 'cr22f_serialnumber'],
              top: chunk.length,
            })
          );
        }

        const estoqueResults = await Promise.all(estoqueRequests);
        const estoqueMap = new Map<string, { cr22f_querytag?: number; cr22f_serialnumber?: string }>();
        for (const result of estoqueResults) {
          const data = (result.data ?? []) as Array<{
            cr22f_estoquefromsharepointlistid?: string;
            cr22f_querytag?: number;
            cr22f_serialnumber?: string;
          }>;
          for (const record of data) {
            if (record.cr22f_estoquefromsharepointlistid) {
              estoqueMap.set(record.cr22f_estoquefromsharepointlistid, {
                cr22f_querytag: record.cr22f_querytag,
                cr22f_serialnumber: record.cr22f_serialnumber,
              });
            }
          }
        }
        console.info('[GestaoContagem][Dashboard] Estoque relacionado carregado', {
          totalRegistros: estoqueMap.size,
          sample: Array.from(estoqueMap.entries()).slice(0, 3),
        });

        enrichedItems = items.map((item) => {
          const estoque = item._new_itemestoque_value
            ? estoqueMap.get(item._new_itemestoque_value)
            : undefined;
          return estoque ? { ...item, new_ItemEstoque: estoque } : item;
        });
        console.info('[GestaoContagem][Dashboard] Contagens enriquecidas', {
          total: enrichedItems.length,
          sample: enrichedItems.slice(0, 3),
        });
      } else {
        console.warn('[GestaoContagem][Dashboard] Nenhuma contagem com item de estoque relacionado.');
      }

      setDashboardItems(enrichedItems);

      const grouped = enrichedItems.reduce<Record<string, number>>((acc, item) => {
        if (!item.new_datacontagem) return acc;
        const dayKey = toLocalDateKey(item.new_datacontagem);
        acc[dayKey] = (acc[dayKey] ?? 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dayKey, count]) => {
          const [year, month, day] = dayKey.split('-').map((value) => Number(value));
          const date = new Date(year, month - 1, day);
          return {
            date: formatChartLabel(date),
            value: count,
          };
        });

      setDashboardChartData(chartData);
    } catch (err: any) {
      console.error('[GestaoContagem] erro dashboard', err);
      setDashboardError(err.message || 'Erro ao carregar dashboard.');
    } finally {
      setDashboardLoading(false);
    }
  }, [dashboardEnd, dashboardStart]);

  const loadAderencia = useCallback(async () => {
    setAderenciaLoading(true);
    setAderenciaError(null);
    try {
      const startRange = buildUtcDayRangeFromDateKey(aderenciaStart);
      const endRange = buildUtcDayRangeFromDateKey(aderenciaEnd);
      const result = await NewContagemDoDiaService.getAll({
        filter: `statecode eq 0 and new_data ge ${startRange.start} and new_data le ${endRange.end}`,
        orderBy: ['new_data desc'],
        select: [
          'new_contagemdodiaid',
          'new_data',
          'createdon',
          'new_esperados',
          '_new_usuario_value',
        ],
        top: 500,
      });

      const snapshots = (result.data ?? []) as ContagemDiaRecord[];
      if (snapshots.length === 0) {
        setAderenciaData([]);
        setAderenciaSelected(null);
        setAderenciaItens([]);
        setAderenciaChartData([]);
        return;
      }

      const contagensResult = await NewContagemEstoqueService.getAll({
        filter: `statecode eq 0 and ((new_datacontagem ge ${startRange.start} and new_datacontagem le ${endRange.end}) or (new_datacontagem eq null and createdon ge ${startRange.start} and createdon le ${endRange.end}))`,
        select: ['new_datacontagem', 'createdon', '_new_itemestoque_value'],
        top: 2000,
      });

      const contadosPorDia = new Map<string, Set<string>>();
      (contagensResult.data ?? []).forEach((contagem: any) => {
        const dateKey = toDateOnlyKey(contagem?.new_datacontagem ?? contagem?.createdon);
        if (!dateKey || !contagem?._new_itemestoque_value) return;
        if (!contadosPorDia.has(dateKey)) {
          contadosPorDia.set(dateKey, new Set<string>());
        }
        contadosPorDia.get(dateKey)!.add(contagem._new_itemestoque_value);
      });

      const snapshotPorDia = new Map<string, ContagemDiaRecord>();
      snapshots.forEach((item) => {
        const dateKey = toDateOnlyKey(item.new_data);
        if (!dateKey) return;
        const current = snapshotPorDia.get(dateKey);
        if (!current) {
          snapshotPorDia.set(dateKey, item);
          return;
        }
        if (item.createdon && current.createdon) {
          if (item.createdon < current.createdon) {
            snapshotPorDia.set(dateKey, item);
          }
          return;
        }
        if (item.createdon && !current.createdon) {
          snapshotPorDia.set(dateKey, item);
        }
      });

      const consolidated = Array.from(snapshotPorDia.entries()).map(([dateKey, item]) => {
        const contados = contadosPorDia.get(dateKey)?.size ?? 0;
        const esperados = item.new_esperados ?? 0;
        const percentual = esperados > 0 ? Math.round((contados / esperados) * 100) : 0;
        return {
          snapshotId: item.new_contagemdodiaid,
          snapshotDate: item.new_data,
          esperados,
          contados,
          percentual,
        } as AderenciaResumoRecord;
      });

      setAderenciaData(consolidated);
      setAderenciaSelected(null);
      setAderenciaItens([]);

      const chartData = [...consolidated]
        .sort((a, b) => (a.snapshotDate || '').localeCompare(b.snapshotDate || ''))
        .map((item) => {
          const dateKey = toDateOnlyKey(item.snapshotDate);
          const date = dateKey ? new Date(`${dateKey}T00:00:00`) : new Date();
          const esperados = item.esperados ?? 0;
          const contados = item.contados ?? 0;
          const percentual = esperados > 0 ? Math.round((contados / esperados) * 100) : 0;
          return {
            date: formatChartLabel(date),
            value: percentual,
            id: item.snapshotId,
            esperados,
            contados,
            percentual,
          } as ChartDataPoint;
        });

      setAderenciaChartData(chartData);
    } catch (err: any) {
      console.error('[GestaoContagem] erro aderencia', err);
      setAderenciaError(err.message || 'Erro ao carregar aderência.');
    } finally {
      setAderenciaLoading(false);
    }
  }, [aderenciaEnd, aderenciaStart]);

  const loadAderenciaItens = useCallback(async (snapshotId: string, snapshotDate?: string) => {
    setAderenciaItensLoading(true);
    setAderenciaItensError(null);
    try {
      const dateKey = toDateOnlyKey(snapshotDate);
      if (!dateKey) {
        setAderenciaItens([]);
        setAderenciaItensError('Snapshot sem data válida para calcular faltantes.');
        return;
      }
      const { start, end } = buildUtcDayRangeFromDateKey(dateKey);
      const result = await NewContagemDoDiaItemService.getAll({
        filter: `_new_snapshot_value eq '${snapshotId}'`,
        orderBy: ['new_endereco asc'],
        select: [
          'new_contagemdodiaitemid',
          'new_sku',
          'new_querytag',
          'new_endereco',
          'new_classecriticidade',
          '_new_snapshot_value',
          '_new_itemestoque_value',
        ],
        top: 500,
      });
      const contagensResult = await NewContagemEstoqueService.getAll({
        filter: `statecode eq 0 and ((new_datacontagem ge ${start} and new_datacontagem le ${end}) or (new_datacontagem eq null and createdon ge ${start} and createdon le ${end}))`,
        select: ['_new_itemestoque_value'],
        top: 2000,
      });
      const contadosSet = new Set<string>();
      (contagensResult.data ?? []).forEach((contagem: any) => {
        if (contagem?._new_itemestoque_value) {
          contadosSet.add(contagem._new_itemestoque_value);
        }
      });
      const itens = (result.data ?? []) as ContagemDiaItemRecord[];
      const faltantes = itens.filter(
        (item) => !item._new_itemestoque_value || !contadosSet.has(item._new_itemestoque_value)
      );
      setAderenciaItens(faltantes);
    } catch (err: any) {
      console.error('[GestaoContagem] erro aderencia itens', err);
      setAderenciaItensError(err.message || 'Erro ao carregar itens pendentes.');
    } finally {
      setAderenciaItensLoading(false);
    }
  }, []);

  const handleAderenciaSelect = useCallback(
    (item: AderenciaResumoRecord) => {
      setAderenciaSelected(item);
      void loadAderenciaItens(item.snapshotId, item.snapshotDate);
    },
    [loadAderenciaItens]
  );

  const aderenciaItensColumns = useMemo(
    () => [
      createTableColumn<ContagemDiaItemRecord>({
        columnId: 'sku',
        renderHeaderCell: () => 'SKU',
        renderCell: (item) => item.new_sku || '---',
      }),
      createTableColumn<ContagemDiaItemRecord>({
        columnId: 'tag',
        renderHeaderCell: () => 'Tag',
        renderCell: (item) => item.new_querytag ?? '---',
      }),
      createTableColumn<ContagemDiaItemRecord>({
        columnId: 'endereco',
        renderHeaderCell: () => 'Endereço',
        renderCell: (item) => item.new_endereco || '---',
      }),
      createTableColumn<ContagemDiaItemRecord>({
        columnId: 'classe',
        renderHeaderCell: () => 'Classe',
        renderCell: (item) => formatClasseCriticidade(item.new_classecriticidade),
      }),
      createTableColumn<ContagemDiaItemRecord>({
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: () => <Badge color="danger">Faltante</Badge>,
      }),
    ],
    []
  );

  const aderenciaResumoColumns = useMemo(
    () => [
      createTableColumn<AderenciaResumoRecord>({
        columnId: 'data',
        renderHeaderCell: () => 'Data',
        renderCell: (item) =>
          (() => {
            const dateKey = toDateOnlyKey(item.snapshotDate);
            return dateKey ? new Date(`${dateKey}T00:00:00`).toLocaleDateString('pt-BR') : '---';
          })(),
      }),
      createTableColumn<AderenciaResumoRecord>({
        columnId: 'esperados',
        renderHeaderCell: () => 'Esperados',
        renderCell: (item) => item.esperados ?? 0,
      }),
      createTableColumn<AderenciaResumoRecord>({
        columnId: 'contados',
        renderHeaderCell: () => 'Contados',
        renderCell: (item) => item.contados ?? 0,
      }),
      createTableColumn<AderenciaResumoRecord>({
        columnId: 'percentual',
        renderHeaderCell: () => '%',
        renderCell: (item) => {
          const esperados = item.esperados ?? 0;
          const contados = item.contados ?? 0;
          const percentual = esperados > 0 ? Math.round((contados / esperados) * 100) : 0;
          return `${percentual}%`;
        },
      }),
      createTableColumn<AderenciaResumoRecord>({
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: (item) => {
          const esperados = item.esperados ?? 0;
          const contados = item.contados ?? 0;
          if (esperados > 0 && contados >= esperados) {
            return <Badge color="success">Completo</Badge>;
          }
          return <Badge color="warning">Incompleto</Badge>;
        },
      }),
      createTableColumn<AderenciaResumoRecord>({
        columnId: 'acoes',
        renderHeaderCell: () => 'Ações',
        renderCell: (item) => (
          <Button appearance="subtle" size="small" onClick={() => handleAderenciaSelect(item)}>
            Ver faltantes
          </Button>
        ),
      }),
    ],
    [handleAderenciaSelect]
  );

  const loadDivergencias = useCallback(async () => {
    setDivergenciasLoading(true);
    setDivergenciasError(null);
    try {
      // 1. Buscar solicitações dos últimos 30 dias (todas as contagens que tiveram solicitação recentemente)
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
      const dataFiltro = trintaDiasAtras.toISOString().split('T')[0] + 'T00:00:00Z';
      const fimDia = new Date().toISOString().split('T')[0] + 'T23:59:59Z';

      const solicitacoesResult = await NewSolicitacaodeAjustedeEstoqueService.getAll({
        filter: `statecode eq 0 and createdon ge ${dataFiltro} and createdon le ${fimDia}`,
        orderBy: ['createdon desc'],
        select: [
          'new_solicitacaodeajustedeestoqueid',
          '_new_contagem_value',
          'new_statusdoprocessamento',
          'new_mensagemdeerro',
          'new_datahoraprocessamento',
        ],
      });

      const solicitacoes = solicitacoesResult.data ?? [];
      
      if (solicitacoes.length === 0) {
        // Se não há solicitações do dia, buscar apenas contagens pendentes sem solicitação
        const result = await NewContagemEstoqueService.getAll({
          filter: `statecode eq 0 and new_situacao eq ${SITUACAO_CONTAGEM.Pendente}`,
          orderBy: ['new_datacontagem desc'],
          select: [
            'new_contagemestoqueid',
            'new_datacontagem',
            'new_sku',
            'new_enderecocompleto',
            'new_quantidadecontada',
            'new_quantidadeesperada',
            'new_situacao',
            '_new_itemestoque_value',
            '_new_usuario_value',
          ],
          top: 200,
        });
        setDivergencias((result.data ?? []) as ContagemRecord[]);
        return;
      }

      // 2. Mapear última solicitação por contagem
      const solicitacaoMap = new Map<string, any>();
      const contagemIdsSet = new Set<string>();
      
      (solicitacoes as any[]).forEach((sol: any) => {
        const contagemId = sol._new_contagem_value;
        if (contagemId) {
          contagemIdsSet.add(contagemId);
          if (!solicitacaoMap.has(contagemId)) {
            // Log para debug de status
            console.debug(`[GestaoContagem] Status recebido para contagem ${contagemId}:`, {
              original: sol.new_statusdoprocessamento,
              type: typeof sol.new_statusdoprocessamento,
              normalized: normalizeStatusProcessamento(sol.new_statusdoprocessamento)
            });

            solicitacaoMap.set(contagemId, {
              new_solicitacaodeajustedeestoqueid: sol.new_solicitacaodeajustedeestoqueid,
              new_statusdoprocessamento: sol.new_statusdoprocessamento,
              new_mensagemdeerro: sol.new_mensagemdeerro,
              new_datahoraprocessamento: sol.new_datahoraprocessamento,
            });
          }
        }
      });

      // 3. Buscar contagens (pendentes + ajustadas que têm solicitação)
      const contagemIds = Array.from(contagemIdsSet);
      const filterParts = contagemIds.map((id) => `new_contagemestoqueid eq '${id}'`);
      const contagensComSolicitacao = filterParts.join(' or ');

      const result = await NewContagemEstoqueService.getAll({
        filter: `statecode eq 0 and (new_situacao eq ${SITUACAO_CONTAGEM.Pendente} or (${contagensComSolicitacao}))`,
        orderBy: ['new_datacontagem desc'],
        select: [
          'new_contagemestoqueid',
          'new_datacontagem',
          'new_sku',
          'new_enderecocompleto',
          'new_quantidadecontada',
          'new_quantidadeesperada',
          'new_situacao',
          '_new_itemestoque_value',
          '_new_usuario_value',
        ],
        top: 200,
      });

      const contagens = (result.data ?? []) as ContagemRecord[];

      // 4. Enriquecer contagens com dados da solicitação
      const enrichedContagens = contagens.map((contagem) => ({
        ...contagem,
        _solicitacao: solicitacaoMap.get(contagem.new_contagemestoqueid),
      }));

      console.info('[GestaoContagem] Contagens enriquecidas:', {
        total: enrichedContagens.length,
        comSolicitacao: enrichedContagens.filter((c) => c._solicitacao).length,
        pendentes: enrichedContagens.filter((c) => !c._solicitacao || c._solicitacao.new_statusdoprocessamento === STATUS_PROCESSAMENTO.Pendente).length,
        processando: enrichedContagens.filter((c) => c._solicitacao?.new_statusdoprocessamento === STATUS_PROCESSAMENTO.Processando).length,
        concluidas: enrichedContagens.filter((c) => c._solicitacao?.new_statusdoprocessamento === STATUS_PROCESSAMENTO.Concludo).length,
        erro: enrichedContagens.filter((c) => c._solicitacao?.new_statusdoprocessamento === STATUS_PROCESSAMENTO.Erro).length,
      });

      setDivergencias(enrichedContagens);
    } catch (err: any) {
      console.error('[GestaoContagem] erro divergencias', err);
      setDivergenciasError(err.message || 'Erro ao carregar divergências.');
    } finally {
      setDivergenciasLoading(false);
    }
  }, []);

  const loadAjustes = useCallback(async () => {
    setAjustesLoading(true);
    setAjustesError(null);
    try {
      const start = toIsoStart(ajustesStart);
      const end = toIsoEnd(ajustesEnd);
      const result = await NewAjustedeEstoqueService.getAll({
        filter: `statecode eq 0 and new_dataajuste ge ${start} and new_dataajuste le ${end}`,
        orderBy: ['new_dataajuste desc'],
        select: [
          'new_ajustedeestoqueid',
          'new_dataajuste',
          'new_justificativa',
          'new_saldoanterior',
          'new_saldonovo',
          '_new_contagem_value',
          '_new_itemestoque_value',
          '_new_usuarioajuste_value',
        ],
        top: 200,
      });
      const ajustesData = (result.data ?? []) as AjusteRecord[];

      const contagemIds = Array.from(
        new Set(ajustesData.map((item) => item._new_contagem_value).filter(Boolean))
      ) as string[];
      const usuarioIds = Array.from(
        new Set(ajustesData.map((item) => item._new_usuarioajuste_value).filter(Boolean))
      ) as string[];

      const contagemMap = new Map<string, string>();
      const usuarioMap = new Map<string, string>();

      if (contagemIds.length > 0) {
        const contagemFilter = contagemIds.map((id) => `new_contagemestoqueid eq '${id}'`).join(' or ');
        const contagemResult = await NewContagemEstoqueService.getAll({
          filter: contagemFilter,
          select: ['new_contagemestoqueid', 'new_id'],
          top: contagemIds.length,
        });
        (contagemResult.data ?? []).forEach((item: any) => {
          if (item.new_contagemestoqueid && item.new_id) {
            contagemMap.set(item.new_contagemestoqueid, item.new_id);
          }
        });
      }

      if (usuarioIds.length > 0) {
        const usuarioFilter = usuarioIds.map((id) => `systemuserid eq '${id}'`).join(' or ');
        const usuarioResult = await SystemusersService.getAll({
          filter: usuarioFilter,
          select: ['systemuserid', 'fullname'],
          top: usuarioIds.length,
        });
        (usuarioResult.data ?? []).forEach((item: any) => {
          if (item.systemuserid && item.fullname) {
            usuarioMap.set(item.systemuserid, item.fullname);
          }
        });
      }

      const ajustesEnriquecidos = ajustesData.map((item) => ({
        ...item,
        _contagem_nome: item._new_contagem_value
          ? contagemMap.get(item._new_contagem_value)
          : undefined,
        _usuario_nome: item._new_usuarioajuste_value
          ? usuarioMap.get(item._new_usuarioajuste_value)
          : undefined,
      }));

      setAjustes(ajustesEnriquecidos);
    } catch (err: any) {
      console.error('[GestaoContagem] erro ajustes', err);
      setAjustesError(err.message || 'Erro ao carregar ajustes.');
    } finally {
      setAjustesLoading(false);
    }
  }, [ajustesEnd, ajustesStart]);

  const handleOpenAjuste = useCallback((contagem: ContagemRecord) => {
    setAjusteTarget(contagem);
    setAjusteSaldoNovo(String(contagem.new_quantidadecontada ?? ''));
    setAjusteJustificativa('');
  }, []);

  const divergenciasColumns = useMemo(
    () => [
      createTableColumn<ContagemRecord>({
        columnId: 'data',
        renderHeaderCell: () => 'Data',
        renderCell: (item) => formatDate(item.new_datacontagem),
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'sku',
        renderHeaderCell: () => 'SKU',
        renderCell: (item) => item.new_sku || '---',
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'endereco',
        renderHeaderCell: () => 'Endereço',
        renderCell: (item) => item.new_enderecocompleto || '---',
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'contada',
        renderHeaderCell: () => 'Contada',
        renderCell: (item) => item.new_quantidadecontada ?? 0,
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'esperada',
        renderHeaderCell: () => 'Esperada',
        renderCell: (item) => item.new_quantidadeesperada ?? 0,
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: (item) => {
          const status = normalizeStatusProcessamento(item._solicitacao?.new_statusdoprocessamento);
          if (!status) {
            return <Badge color="warning">Pendente</Badge>;
          }
          if (status === STATUS_PROCESSAMENTO.Processando) {
            return (
              <Badge color="informative">
                <Spinner size="tiny" style={{ marginRight: '4px' }} />
                Processando
              </Badge>
            );
          }
          if (status === STATUS_PROCESSAMENTO.Concludo) {
            return <Badge color="success">Ajustada</Badge>;
          }
          if (status === STATUS_PROCESSAMENTO.Erro) {
            return <Badge color="danger">Erro</Badge>;
          }
          return <Badge>Desconhecido</Badge>;
        },
      }),
      createTableColumn<ContagemRecord>({
        columnId: 'acoes',
        renderHeaderCell: () => 'Ações',
        renderCell: (item) => {
          const status = normalizeStatusProcessamento(item._solicitacao?.new_statusdoprocessamento);
          const hasSolicitacao = status !== null;
          const isProcessando = status === STATUS_PROCESSAMENTO.Processando;
          const isPendente = status === STATUS_PROCESSAMENTO.Pendente;
          const isConcluido = status === STATUS_PROCESSAMENTO.Concludo;
          const hasError = status === STATUS_PROCESSAMENTO.Erro;
          const shouldDisable = hasSolicitacao && !hasError && !isConcluido;
          
          return (
            <div className={styles.actionsRow}>
              {hasError && item._solicitacao?.new_mensagemdeerro && (
                <MessageBar intent="error" style={{ marginBottom: '8px', maxWidth: '400px' }}>
                  {item._solicitacao.new_mensagemdeerro}
                </MessageBar>
              )}
              {isConcluido ? (
                <Text size={200} className={styles.infoText}>
                  Ajuste concluído
                </Text>
              ) : (
                <Button
                  appearance="primary"
                  size="small"
                  onClick={() => handleOpenAjuste(item)}
                  disabled={shouldDisable}
                >
                  {isProcessando || isPendente ? 'Processando...' : hasError ? 'Tentar novamente' : 'Gerar ajuste'}
                </Button>
              )}
            </div>
          );
        },
      }),
    ],
    [handleOpenAjuste, styles.actionsRow]
  );

  const handleConfirmAjuste = useCallback(async () => {
    if (!ajusteTarget || !systemUserId) return;
    const saldoNovo = Number(ajusteSaldoNovo);
    if (Number.isNaN(saldoNovo)) {
      setDivergenciasError('Informe um saldo novo válido.');
      return;
    }

    setAjusteLoading(true);
    setDivergenciasError(null);
    try {
      const itemId = ajusteTarget._new_itemestoque_value;
      if (!itemId) {
        setDivergenciasError('Item de estoque não encontrado para a contagem.');
        return;
      }

      const itemResult = await Cr22fEstoqueFromSharepointListService.get(itemId, {
        select: ['new_quantidade'],
      });
      const saldoAnterior = (itemResult.data as { new_quantidade?: number } | undefined)?.new_quantidade ?? 0;

      // Cria a solicitação de ajuste no Dataverse
      // O fluxo Power Automate será acionado automaticamente quando o registro for criado
      const solicitacaoPayload: Record<string, any> = {
        new_name: `Ajuste ${ajusteTarget.new_sku || 'SKU'} - ${new Date().toLocaleString('pt-BR')}`,
        new_saldoanterior: saldoAnterior,
        new_saldonovo: saldoNovo,
        new_statusdoprocessamento: STATUS_PROCESSAMENTO.Pendente,
        // Adiciona lookups com binding OData (IMPORTANTE: PascalCase depois do underscore)
        'new_Contagem@odata.bind': `/new_contagemestoques(${ajusteTarget.new_contagemestoqueid})`,
        'new_ItemdeEstoque@odata.bind': `/cr22f_estoquefromsharepointlists(${itemId})`,
        'new_UsuarioSolicitante@odata.bind': `/systemusers(${systemUserId})`,
      };

      if (ajusteJustificativa) {
        solicitacaoPayload.new_justificativa = ajusteJustificativa;
      }

      console.log('[GestaoContagem] Criando solicitação de ajuste:', solicitacaoPayload);

      await NewSolicitacaodeAjustedeEstoqueService.create(solicitacaoPayload);

      console.info('[GestaoContagem] Solicitação de ajuste criada com sucesso. O Power Automate irá processar e atualizar a contagem.');

      setAjusteTarget(null);
      setAjusteSaldoNovo('');
      setAjusteJustificativa('');
      void loadDivergencias();
      void loadAjustes();
    } catch (err) {
      console.error('[GestaoContagem] erro ao criar solicitação de ajuste', err);
      const message = err instanceof Error ? err.message : 'Erro ao criar solicitação de ajuste.';
      setDivergenciasError(message);
    } finally {
      setAjusteLoading(false);
    }
  }, [ajusteJustificativa, ajusteSaldoNovo, ajusteTarget, loadAjustes, loadDivergencias, systemUserId]);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    setConfigSuccess(null);
    try {
      const result = await NewAppPreferenceService.getAll({
        filter: "startswith(new_preferencekey, 'contagem_threshold_')",
        select: ['new_apppreferenceid', 'new_preferencekey', 'new_integervalue'],
      });
      const nextPrefs: Record<string, PreferenceRecord> = {};
      (result.data ?? []).forEach((item: any) => {
        if (item.new_preferencekey && item.new_apppreferenceid) {
          nextPrefs[item.new_preferencekey] = {
            id: item.new_apppreferenceid,
            value: item.new_integervalue,
          };
        }
      });
      setConfigPrefs(nextPrefs);
      setThresholdA(String(nextPrefs.contagem_threshold_A?.value ?? 20));
      setThresholdB(String(nextPrefs.contagem_threshold_B?.value ?? 40));
      setThresholdC(String(nextPrefs.contagem_threshold_C?.value ?? 60));
    } catch (err: any) {
      console.error('[GestaoContagem] erro config', err);
      setConfigError(err.message || 'Erro ao carregar configurações.');
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const saveConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    setConfigSuccess(null);
    try {
      const updates: Promise<any>[] = [];
      const entries = [
        { key: 'contagem_threshold_A', value: Number(thresholdA) },
        { key: 'contagem_threshold_B', value: Number(thresholdB) },
        { key: 'contagem_threshold_C', value: Number(thresholdC) },
      ];

      entries.forEach((entry) => {
        const existing = configPrefs[entry.key];
        if (existing) {
          updates.push(
            NewAppPreferenceService.update(existing.id, {
              new_integervalue: entry.value,
            })
          );
        } else {
          updates.push(
            NewAppPreferenceService.create({
              new_preferencekey: entry.key,
              new_integervalue: entry.value,
            })
          );
        }
      });

      await Promise.all(updates);
      await loadConfig();
      setConfigSuccess('Configurações salvas com sucesso.');
    } catch (err: any) {
      console.error('[GestaoContagem] erro salvar config', err);
      setConfigError(err.message || 'Erro ao salvar configurações.');
    } finally {
      setConfigLoading(false);
    }
  }, [configPrefs, loadConfig, thresholdA, thresholdB, thresholdC]);

  const loadReport = useCallback(
    async (pageIndex = reportPageIndex) => {
      const skipToken = reportPageTokens[pageIndex] ?? null;
    setReportLoading(true);
    setReportError(null);
      try {
        const start = toIsoStart(reportStart);
        const end = toIsoEnd(reportEnd);
        const filters = [
          `((new_datacontagem ge ${start} and new_datacontagem le ${end}) or (new_datacontagem eq null and createdon ge ${start} and createdon le ${end}))`,
          'statecode eq 0',
        ];
        if (reportSituacao !== 'all') {
          filters.push(`new_situacao eq ${reportSituacao}`);
        }
        const filter = filters.join(' and ');
        const result = await NewContagemEstoqueService.getAll({
          filter,
          orderBy: ['new_datacontagem desc'],
          select: [
            'new_contagemestoqueid',
            'new_datacontagem',
            'createdon',
            'new_sku',
            'new_enderecocompleto',
            'new_quantidadecontada',
            'new_quantidadeesperada',
            '_new_usuario_value',
          ],
          top: 50,
          ...(skipToken ? { skipToken } : {}),
        });
        const reportItems = (result.data ?? []) as ContagemRecord[];
        const usuarioIds = Array.from(
          new Set(reportItems.map((item) => item._new_usuario_value).filter(Boolean))
        ) as string[];
        const usuarioMap = new Map<string, string>();

        if (usuarioIds.length > 0) {
          const usuarioFilter = usuarioIds.map((id) => `systemuserid eq '${id}'`).join(' or ');
          const usuarioResult = await SystemusersService.getAll({
            filter: usuarioFilter,
            select: ['systemuserid', 'fullname'],
            top: usuarioIds.length,
          });
          (usuarioResult.data ?? []).forEach((item: any) => {
            if (item.systemuserid && item.fullname) {
              usuarioMap.set(item.systemuserid, item.fullname);
            }
          });
        }

        const reportEnriched = reportItems.map((item) => ({
          ...item,
          _usuario_nome: item._new_usuario_value
            ? usuarioMap.get(item._new_usuario_value)
            : undefined,
        }));

        setReportData(reportEnriched);
        const nextToken = extractNextSkipToken(result);
        setReportPageTokens((prev) => {
          const next = [...prev];
          next[pageIndex + 1] = nextToken;
          return next;
        });
      } catch (err: any) {
        console.error('[GestaoContagem] erro relatorio', err);
        setReportError(err.message || 'Erro ao carregar relatório.');
      } finally {
        setReportLoading(false);
      }
    },
    [reportEnd, reportPageIndex, reportPageTokens, reportSituacao, reportStart]
  );

  const exportCsv = useCallback(() => {
    if (reportData.length === 0) return;
    const headers = ['Data', 'SKU', 'Endereço', 'Contada', 'Esperada', 'Usuário'];
    const rows = reportData.map((item) => [
      formatDate(getReportDate(item)),
      item.new_sku || '',
      item.new_enderecocompleto || '',
      String(item.new_quantidadecontada ?? 0),
      String(item.new_quantidadeesperada ?? 0),
      item._usuario_nome || item._new_usuario_value || '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contagem_relatorio_${reportStart}_${reportEnd}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [reportData, reportEnd, reportStart]);

  const exportAderenciaCsv = useCallback(() => {
    if (!aderenciaSelected || aderenciaItens.length === 0) return;
    const dateLabel = aderenciaSelected.snapshotDate ?? 'sem_data';
    const headers = ['SKU', 'Tag', 'Endereço', 'Classe', 'Status'];
    const rows = aderenciaItens.map((item) => [
      item.new_sku || '',
      String(item.new_querytag ?? ''),
      item.new_endereco || '',
      formatClasseCriticidade(item.new_classecriticidade),
      'Faltante',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aderencia_faltantes_${dateLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [aderenciaItens, aderenciaSelected]);

  const commandBarActions = useMemo(() => {
    if (selectedTab === 'dashboard') {
      return [
        {
          id: 'dashboard-refresh',
          label: 'Atualizar',
          icon: <ArrowSync24Regular />,
          onClick: loadDashboard,
        },
      ];
    }
    if (selectedTab === 'aderencia') {
      return [
        {
          id: 'aderencia-refresh',
          label: 'Atualizar',
          icon: <ArrowSync24Regular />,
          onClick: loadAderencia,
        },
      ];
    }
    if (selectedTab === 'divergencias') {
      return [
        {
          id: 'divergencias-refresh',
          label: 'Atualizar',
          icon: <ArrowSync24Regular />,
          onClick: loadDivergencias,
        },
      ];
    }
    if (selectedTab === 'ajustes') {
      return [
        {
          id: 'ajustes-refresh',
          label: 'Atualizar',
          icon: <ArrowSync24Regular />,
          onClick: loadAjustes,
        },
      ];
    }
    if (selectedTab === 'config') {
      return [
        {
          id: 'config-refresh',
          label: 'Atualizar',
          icon: <ArrowSync24Regular />,
          onClick: loadConfig,
        },
      ];
    }
    if (selectedTab === 'relatorios') {
      return [
        {
          id: 'relatorios-refresh',
          label: 'Filtrar',
          icon: <Filter24Regular />,
          onClick: () => {
            setReportPageIndex(0);
            setReportPageTokens([null]);
            void loadReport(0);
          },
        },
      ];
    }
    return [];
  }, [loadAderencia, loadAjustes, loadConfig, loadDashboard, loadDivergencias, loadReport, selectedTab]);

  const renderDashboard = () => (
    <div className={styles.container}>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <Text weight="semibold">Período</Text>
          <div className={styles.formRow}>
            <Field label="De">
              <Input type="date" value={dashboardStart} onChange={(e) => setDashboardStart(e.target.value)} />
            </Field>
            <Field label="Até">
              <Input type="date" value={dashboardEnd} onChange={(e) => setDashboardEnd(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button appearance="primary" onClick={loadDashboard} disabled={dashboardLoading}>
                {dashboardLoading ? 'Carregando...' : 'Aplicar'}
              </Button>
            </div>
          </div>
          {dashboardError && <Text className={styles.errorText}>{dashboardError}</Text>}
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <Text weight="semibold">Itens contados por dia</Text>
          {dashboardLoading ? (
            <Spinner label="Carregando gráfico..." />
          ) : dashboardChartData.length === 0 ? (
            <Text size={200} className={styles.infoText}>
              Sem dados para o período selecionado.
            </Text>
          ) : (
            <BarChart
              data={dashboardChartData}
              dataKey="value"
              valueFormatter={(value) => `${new Intl.NumberFormat('pt-BR').format(value)} un`}
            />
          )}
        </div>
      </Card>
      <div className={styles.cardsGrid}>
        <Card>
          <div className="flex flex-col gap-2 p-4">
            <Text size={200} className={styles.infoText}>
              Contagens no período
            </Text>
            <Text size={600} weight="semibold">
              {dashboardLoading ? <Spinner size="tiny" /> : dashboardStats.total}
            </Text>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-2 p-4">
            <Text size={200} className={styles.infoText}>
              Pendentes
            </Text>
            <Text size={600} weight="semibold">
              {dashboardLoading ? <Spinner size="tiny" /> : dashboardStats.pendentes}
            </Text>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-2 p-4">
            <Text size={200} className={styles.infoText}>
              Validadas
            </Text>
            <Text size={600} weight="semibold">
              {dashboardLoading ? <Spinner size="tiny" /> : dashboardStats.validadas}
            </Text>
          </div>
        </Card>
      </div>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <Text weight="semibold">Produtos contados no período</Text>
          {dashboardLoading && <Spinner label="Carregando lista..." />}
          {!dashboardLoading && dashboardItems.length === 0 && (
            <Text size={200} className={styles.infoText}>
              Nenhum item contado no período.
            </Text>
          )}
          <div className={styles.tableWrapper}>
            <DataGrid items={dashboardItems} columns={dashboardColumns} />
          </div>
          <div className={styles.cardList}>
            {dashboardItems.map((item) => (
              <Card key={item.new_contagemestoqueid}>
                <div className="flex flex-col gap-2 p-3">
                  <div className="flex items-center justify-between">
                    <Text weight="semibold">{item.new_sku || 'SKU'}</Text>
                    <Text size={200} className={styles.infoText}>
                      Tag: {item.new_ItemEstoque?.cr22f_querytag || '---'}
                    </Text>
                  </div>
                  <Text size={200}>S/N: {item.new_ItemEstoque?.cr22f_serialnumber || '---'}</Text>
                  <Text size={200}>{item.new_enderecocompleto || 'Endereço não informado'}</Text>
                  <Text size={200}>
                    Contada: {item.new_quantidadecontada ?? 0} | Esperada: {item.new_quantidadeesperada ?? 0}
                  </Text>
                  <Text size={200} className={styles.infoText}>
                    {formatDate(getReportDate(item))}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAderencia = () => (
    <div className={styles.container}>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <Text weight="semibold">Período</Text>
          <div className={styles.formRow}>
            <Field label="De">
              <Input type="date" value={aderenciaStart} onChange={(e) => setAderenciaStart(e.target.value)} />
            </Field>
            <Field label="Até">
              <Input type="date" value={aderenciaEnd} onChange={(e) => setAderenciaEnd(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button appearance="primary" onClick={loadAderencia} disabled={aderenciaLoading}>
                {aderenciaLoading ? 'Carregando...' : 'Aplicar'}
              </Button>
            </div>
          </div>
          {aderenciaError && <Text className={styles.errorText}>{aderenciaError}</Text>}
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <Text weight="semibold">Aderência por dia (%)</Text>
          {aderenciaLoading ? (
            <Spinner label="Carregando gráfico..." />
          ) : aderenciaChartData.length === 0 ? (
            <Text size={200} className={styles.infoText}>
              Sem snapshots para o período selecionado.
            </Text>
          ) : (
            <LineChart
              data={aderenciaChartData}
              lines={[
                {
                  dataKey: 'value',
                  name: 'Aderência',
                  color: tokens.colorBrandBackground,
                },
              ]}
              valueFormatter={(value) => `${value}%`}
              referenceValue={100}
              referenceLabel="Meta"
              onPointClick={(data) => {
                const target = aderenciaData.find((item) => item.snapshotId === data.id);
                if (target) {
                  handleAderenciaSelect(target);
                }
              }}
            />
          )}
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <Text weight="semibold">Resumo diário</Text>
          {aderenciaLoading && <Spinner label="Carregando aderência..." />}
          {!aderenciaLoading && aderenciaData.length === 0 && (
            <Text size={200} className={styles.infoText}>
              Nenhum snapshot encontrado.
            </Text>
          )}
          <div className={styles.tableWrapper}>
            <DataGrid items={aderenciaData} columns={aderenciaResumoColumns} />
          </div>
          <div className={styles.cardList}>
            {aderenciaData.map((item) => {
              const esperados = item.esperados ?? 0;
              const contados = item.contados ?? 0;
              const percentual = esperados > 0 ? Math.round((contados / esperados) * 100) : 0;
              const status = esperados > 0 && contados >= esperados ? 'Completo' : 'Incompleto';
              return (
                <Card key={item.snapshotId}>
                  <div className="flex flex-col gap-2 p-3">
                    <Text weight="semibold">
                      {(() => {
                        const dateKey = toDateOnlyKey(item.snapshotDate);
                        return dateKey ? new Date(`${dateKey}T00:00:00`).toLocaleDateString('pt-BR') : '---';
                      })()}
                    </Text>
                    <Text size={200}>
                      Esperados: {esperados} | Contados: {contados}
                    </Text>
                    <Text size={200}>Aderência: {percentual}%</Text>
                    <Badge color={status === 'Completo' ? 'success' : 'warning'}>{status}</Badge>
                    <div className={styles.actionsRow}>
                      <Button appearance="subtle" size="small" onClick={() => handleAderenciaSelect(item)}>
                        Ver faltantes
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Card>
      {aderenciaSelected && (
        <Card>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
              <Text weight="semibold">
                Faltantes em{' '}
                {(() => {
                const dateKey = toDateOnlyKey(aderenciaSelected.snapshotDate);
                  return dateKey ? new Date(`${dateKey}T00:00:00`).toLocaleDateString('pt-BR') : '---';
                })()}
              </Text>
              <Button appearance="secondary" onClick={exportAderenciaCsv} disabled={aderenciaItens.length === 0}>
                Exportar CSV
              </Button>
            </div>
            {aderenciaItensLoading && <Spinner label="Carregando faltantes..." />}
            {aderenciaItensError && <Text className={styles.errorText}>{aderenciaItensError}</Text>}
            {!aderenciaItensLoading && aderenciaItens.length === 0 && (
              <Text size={200} className={styles.infoText}>
                Nenhum item pendente neste dia.
              </Text>
            )}
            <div className={styles.tableWrapper}>
              <DataGrid items={aderenciaItens} columns={aderenciaItensColumns} />
            </div>
            <div className={styles.cardList}>
              {aderenciaItens.map((item) => (
                <Card key={item.new_contagemdodiaitemid}>
                  <div className="flex flex-col gap-2 p-3">
                    <Text weight="semibold">{item.new_sku || 'SKU'}</Text>
                    <Text size={200}>Tag: {item.new_querytag ?? '---'}</Text>
                    <Text size={200}>{item.new_endereco || 'Endereço não informado'}</Text>
                    <Text size={200}>Classe: {formatClasseCriticidade(item.new_classecriticidade)}</Text>
                    <Badge color="danger">Faltante</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderDivergencias = () => (
    <div className={styles.container}>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <Text weight="semibold">Contagens pendentes</Text>
            <Button appearance="subtle" onClick={loadDivergencias} disabled={divergenciasLoading}>
              Atualizar
            </Button>
          </div>
          {divergenciasLoading && <Spinner label="Carregando divergências..." />}
          {divergenciasError && <Text className={styles.errorText}>{divergenciasError}</Text>}
          {!divergenciasLoading && divergencias.length === 0 && (
            <Text size={200} className={styles.infoText}>
              Nenhuma divergência pendente.
            </Text>
          )}
          <div className={styles.tableWrapper}>
            <DataGrid items={divergencias} columns={divergenciasColumns} />
          </div>
          <div className={styles.cardList}>
            {divergencias.map((item) => {
              const status = normalizeStatusProcessamento(item._solicitacao?.new_statusdoprocessamento);
              const hasSolicitacao = status !== null;
              const isProcessando = status === STATUS_PROCESSAMENTO.Processando;
              const isPendente = status === STATUS_PROCESSAMENTO.Pendente;
              const isConcluido = status === STATUS_PROCESSAMENTO.Concludo;
              const hasError = status === STATUS_PROCESSAMENTO.Erro;
              const shouldDisable = hasSolicitacao && !hasError && !isConcluido;
              
              let statusBadge = <Badge color="warning">Pendente</Badge>;
              if (status === STATUS_PROCESSAMENTO.Processando) {
                statusBadge = (
                  <Badge color="informative">
                    <Spinner size="tiny" style={{ marginRight: '4px' }} />
                    Processando
                  </Badge>
                );
              } else if (status === STATUS_PROCESSAMENTO.Concludo) {
                statusBadge = <Badge color="success">Ajustada</Badge>;
              } else if (status === STATUS_PROCESSAMENTO.Erro) {
                statusBadge = <Badge color="danger">Erro</Badge>;
              }
              
              return (
                <Card key={item.new_contagemestoqueid}>
                  <div className="flex flex-col gap-2 p-3">
                    <div className="flex items-center justify-between">
                      <Text weight="semibold">{item.new_sku || 'SKU'}</Text>
                      {statusBadge}
                    </div>
                    <Text size={200}>{item.new_enderecocompleto || 'Endereço não informado'}</Text>
                    <Text size={200}>
                      Contada: {item.new_quantidadecontada ?? 0} | Esperada: {item.new_quantidadeesperada ?? 0}
                    </Text>
                    <Text size={200} className={styles.infoText}>
                      {formatDate(item.new_datacontagem)}
                    </Text>
                    {hasError && item._solicitacao?.new_mensagemdeerro && (
                      <MessageBar intent="error">
                        {item._solicitacao.new_mensagemdeerro}
                      </MessageBar>
                    )}
                    <div className={styles.actionsRow}>
                      {isConcluido ? (
                        <Text size={200} className={styles.infoText}>
                          Ajuste concluído
                        </Text>
                      ) : (
                        <Button
                          appearance="primary"
                          onClick={() => handleOpenAjuste(item)}
                          disabled={shouldDisable}
                        >
                          {isProcessando || isPendente ? 'Processando...' : hasError ? 'Tentar novamente' : 'Gerar ajuste'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Card>
      {ajusteTarget && (
        <Card>
          <div className="flex flex-col gap-3 p-4">
            <Text weight="semibold">Ajuste de estoque</Text>
            <Text size={200} className={styles.infoText}>
              SKU: {ajusteTarget.new_sku || '---'} | Endereço: {ajusteTarget.new_enderecocompleto || '---'}
            </Text>
            <div className={styles.formRow}>
              <Field label="Saldo novo">
                <Input
                  value={ajusteSaldoNovo}
                  type="number"
                  onChange={(e) => setAjusteSaldoNovo(e.target.value)}
                />
              </Field>
              <Field label="Justificativa">
                <Textarea
                  value={ajusteJustificativa}
                  onChange={(_, data) => setAjusteJustificativa(data.value)}
                />
              </Field>
            </div>
            <div className={styles.actionsRow}>
              <Button appearance="primary" onClick={() => void handleConfirmAjuste()} disabled={ajusteLoading}>
                {ajusteLoading ? 'Salvando...' : 'Confirmar ajuste'}
              </Button>
              <Button appearance="secondary" onClick={() => setAjusteTarget(null)} disabled={ajusteLoading}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderAjustes = () => (
    <div className={styles.container}>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <Text weight="semibold">Filtros</Text>
          <div className={styles.formRow}>
            <Field label="De">
              <Input type="date" value={ajustesStart} onChange={(e) => setAjustesStart(e.target.value)} />
            </Field>
            <Field label="Até">
              <Input type="date" value={ajustesEnd} onChange={(e) => setAjustesEnd(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button appearance="primary" onClick={loadAjustes} disabled={ajustesLoading}>
                Aplicar
              </Button>
            </div>
          </div>
          {ajustesError && <Text className={styles.errorText}>{ajustesError}</Text>}
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <Text weight="semibold">Histórico de ajustes</Text>
          {ajustesLoading && <Spinner label="Carregando ajustes..." />}
          {!ajustesLoading && ajustes.length === 0 && (
            <Text size={200} className={styles.infoText}>
              Nenhum ajuste encontrado no período.
            </Text>
          )}
          <div className={styles.tableWrapper}>
            <DataGrid items={ajustes} columns={ajustesColumns} />
          </div>
          <div className={styles.cardList}>
            {ajustes.map((item) => (
              <Card key={item.new_ajustedeestoqueid}>
                <div className="flex flex-col gap-2 p-3">
                  <Text weight="semibold">{formatDate(item.new_dataajuste)}</Text>
                  <Text size={200}>Saldo anterior: {item.new_saldoanterior ?? 0}</Text>
                  <Text size={200}>Saldo novo: {item.new_saldonovo ?? 0}</Text>
                  <Text size={200} className={styles.infoText}>
                    Contagem: {item._contagem_nome || formatShortId(item._new_contagem_value)}
                  </Text>
                  <Text size={200} className={styles.infoText}>
                    Usuário: {item._usuario_nome || formatShortId(item._new_usuarioajuste_value)}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderConfig = () => (
    <div className={styles.container}>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <Text weight="semibold">Parâmetros de criticidade (dias)</Text>
          <div className={styles.formRow}>
            <Field label="Classe A">
              <Input type="number" value={thresholdA} onChange={(e) => setThresholdA(e.target.value)} />
            </Field>
            <Field label="Classe B">
              <Input type="number" value={thresholdB} onChange={(e) => setThresholdB(e.target.value)} />
            </Field>
            <Field label="Classe C">
              <Input type="number" value={thresholdC} onChange={(e) => setThresholdC(e.target.value)} />
            </Field>
          </div>
          <div className={styles.actionsRow}>
            <Button appearance="primary" onClick={saveConfig} disabled={configLoading}>
              {configLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button appearance="secondary" onClick={loadConfig} disabled={configLoading}>
              Recarregar
            </Button>
          </div>
          {configError && <Text className={styles.errorText}>{configError}</Text>}
          {configSuccess && <Text className={styles.infoText}>{configSuccess}</Text>}
        </div>
      </Card>
    </div>
  );

  const renderRelatorios = () => (
    <div className={styles.container}>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <Text weight="semibold">Filtros</Text>
          <div className={styles.formRow}>
            <Field label="De">
              <Input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
            </Field>
            <Field label="Até">
              <Input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
            </Field>
            <Field label="Situação">
              <select
                value={reportSituacao}
                onChange={(e) => setReportSituacao(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  backgroundColor: tokens.colorNeutralBackground1,
                }}
              >
                <option value="all">Todas</option>
                <option value={SITUACAO_CONTAGEM.Pendente}>Pendentes</option>
                <option value={SITUACAO_CONTAGEM.Validada}>Validadas</option>
              </select>
            </Field>
            <div className="flex items-end gap-2">
              <Button
                appearance="primary"
                onClick={() => {
                  setReportPageIndex(0);
                  setReportPageTokens([null]);
                  void loadReport(0);
                }}
                disabled={reportLoading}
              >
                Filtrar
              </Button>
              <Button appearance="secondary" onClick={exportCsv} disabled={reportData.length === 0}>
                Exportar CSV
              </Button>
            </div>
          </div>
          {reportError && <Text className={styles.errorText}>{reportError}</Text>}
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <Text weight="semibold">Resultados</Text>
          {reportLoading && <Spinner label="Carregando relatório..." />}
          {!reportLoading && reportData.length === 0 && (
            <Text size={200} className={styles.infoText}>
              Nenhum registro encontrado.
            </Text>
          )}
          <div className={styles.tableWrapper}>
            <DataGrid items={reportData} columns={reportColumns} />
          </div>
          <div className={styles.cardList}>
            {reportData.map((item) => (
              <Card key={item.new_contagemestoqueid}>
                <div className="flex flex-col gap-2 p-3">
                  <Text weight="semibold">{item.new_sku || 'SKU'}</Text>
                  <Text size={200}>{item.new_enderecocompleto || 'Endereço não informado'}</Text>
                  <Text size={200}>
                    Contada: {item.new_quantidadecontada ?? 0} | Esperada: {item.new_quantidadeesperada ?? 0}
                  </Text>
                  <Text size={200} className={styles.infoText}>
                    {formatDate(item.new_datacontagem)}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
          <div className={styles.actionsRow}>
            <Button
              appearance="subtle"
              onClick={() => {
                const nextIndex = Math.max(0, reportPageIndex - 1);
                setReportPageIndex(nextIndex);
                void loadReport(nextIndex);
              }}
              disabled={reportPageIndex === 0}
            >
              Página anterior
            </Button>
            <Button
              appearance="subtle"
              onClick={() => {
                const nextIndex = reportPageIndex + 1;
                setReportPageIndex(nextIndex);
                void loadReport(nextIndex);
              }}
              disabled={!reportPageTokens[reportPageIndex + 1]}
            >
              Próxima página
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Polling inteligente com intervalo gradativo
  useEffect(() => {
    if (selectedTab !== 'divergencias') return;

    // Verificar se há contagens pendentes ou em processamento
    const hasPendentes = divergencias.some(
      (d) => !d._solicitacao || 
             d._solicitacao.new_statusdoprocessamento === STATUS_PROCESSAMENTO.Pendente ||
             d._solicitacao.new_statusdoprocessamento === STATUS_PROCESSAMENTO.Processando
    );

    if (!hasPendentes) {
      console.info('[GestaoContagem] Nenhuma contagem pendente/processando. Polling desativado.');
      return;
    }

    // Calcular intervalo baseado no número de tentativas (intervalo gradativo)
    // Começa com 5s, depois 10s, 15s, 20s (máximo 30s)
    const tentativas = divergencias.filter(
      (d) => d._solicitacao?.new_statusdoprocessamento === STATUS_PROCESSAMENTO.Processando
    ).length;
    
    const intervalo = Math.min(5000 + tentativas * 5000, 30000);

    console.info('[GestaoContagem] Polling ativo com intervalo de', intervalo / 1000, 'segundos');

    const interval = setInterval(() => {
      console.info('[GestaoContagem] Polling: atualizando divergências...');
      void loadDivergencias();
    }, intervalo);

    return () => clearInterval(interval);
  }, [selectedTab, divergencias, loadDivergencias]);

  return (
    <>
      <CommandBar primaryActions={commandBarActions} />
      <PageHeader
        title="Gestão de Contagem"
        subtitle="Supervisor: validações, ajustes e relatórios"
        tabs={TAB_OPTIONS}
        selectedTab={selectedTab}
        onTabSelect={(value) => {
          setSelectedTab(value);
          if (value === 'dashboard') void loadDashboard();
          if (value === 'aderencia') void loadAderencia();
          if (value === 'divergencias') void loadDivergencias();
          if (value === 'ajustes') void loadAjustes();
          if (value === 'config') void loadConfig();
          if (value === 'relatorios') {
            setReportPageIndex(0);
            setReportPageTokens([null]);
            void loadReport(0);
          }
        }}
      />
      <PageContainer>
        {selectedTab === 'dashboard' && renderDashboard()}
        {selectedTab === 'aderencia' && renderAderencia()}
        {selectedTab === 'divergencias' && renderDivergencias()}
        {selectedTab === 'ajustes' && renderAjustes()}
        {selectedTab === 'config' && renderConfig()}
        {selectedTab === 'relatorios' && renderRelatorios()}
      </PageContainer>
    </>
  );
}
