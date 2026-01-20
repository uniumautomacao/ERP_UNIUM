import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Field,
  Input,
  Spinner,
  Text,
  Textarea,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ArrowSync24Regular, Filter24Regular } from '@fluentui/react-icons';
import { InteractionRequiredAuthError, PublicClientApplication } from '@azure/msal-browser';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataGrid, createTableColumn } from '../../components/shared/DataGrid';
import { BarChart } from '../../components/charts/BarChart';
import { useCurrentSystemUser } from '../../hooks/useCurrentSystemUser';
import {
  Cr22fEstoqueFromSharepointListService,
  NewAjustedeEstoqueService,
  NewAppPreferenceService,
  NewContagemEstoqueService,
} from '../../generated';
import type { ChartDataPoint } from '../../types';

type ContagemRecord = {
  new_contagemestoqueid: string;
  new_datacontagem?: string;
  new_sku?: string;
  new_enderecocompleto?: string;
  new_quantidadecontada?: number;
  new_quantidadeesperada?: number;
  new_situacao?: number;
  _new_itemestoque_value?: string;
  _new_usuario_value?: string;
  new_ItemEstoque?: {
    cr22f_querytag?: number;
    cr22f_serialnumber?: string;
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
};

type PreferenceRecord = {
  id: string;
  value?: number;
};

const SITUACAO_CONTAGEM = {
  Pendente: 100000000,
  Validada: 100000001,
};

const TAB_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'divergencias', label: 'Divergências' },
  { value: 'ajustes', label: 'Ajustes' },
  { value: 'config', label: 'Configurações' },
  { value: 'relatorios', label: 'Relatórios' },
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

const toLocalDateKey = (iso: string) => {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FLOW_TRIGGER_URL =
  'https://b52cf2e94b61e3d68faec290205ed8.e5.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9fda300eb402448ba88423989aa78b4b/triggers/manual/paths/invoke?api-version=1';
const FLOW_TENANT_ID = 'e3d20045-1678-4bd0-96bb-4195baba23a6';
const FLOW_CLIENT_ID = '46f2a64f-f3ef-4585-aa24-2d3182c6429b';
// Delegated permission required in Entra ID (App Registration):
// API Permissions -> Microsoft Flow Service -> Delegated -> user_impersonation
const FLOW_SCOPES = ['https://service.flow.microsoft.com/user_impersonation'];

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: FLOW_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${FLOW_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
});
const msalInitPromise = msalInstance.initialize();
const isInIframe = window.self !== window.top;

const getFlowAccessToken = async () => {
  await msalInitPromise;
  await msalInstance.handleRedirectPromise();
  const accounts = msalInstance.getAllAccounts();
  let account = accounts[0];
  if (!account) {
    try {
      const login = await msalInstance.loginPopup({ scopes: FLOW_SCOPES });
      account = login.account || undefined;
    } catch (error: any) {
      if (error?.errorCode === 'timed_out' || error?.errorCode === 'popup_window_error') {
        const reason = isInIframe
          ? 'Popup bloqueado no Power Apps. Permita popups e tente novamente.'
          : 'Popup expirou. Tente novamente.';
        throw new Error(reason);
      }
      throw error;
    }
  }
  try {
    const result = await msalInstance.acquireTokenSilent({
      account,
      scopes: FLOW_SCOPES,
    });
    return result.accessToken;
  } catch (error: any) {
    if (error instanceof InteractionRequiredAuthError) {
      try {
        const result = await msalInstance.acquireTokenPopup({ scopes: FLOW_SCOPES });
        return result.accessToken;
      } catch (popupError: any) {
        if (popupError?.errorCode === 'timed_out' || popupError?.errorCode === 'popup_window_error') {
          const reason = isInIframe
            ? 'Popup bloqueado no Power Apps. Permita popups e tente novamente.'
            : 'Popup expirou. Tente novamente.';
          throw new Error(reason);
        }
        throw popupError;
      }
    }
    throw error;
  }
};

const runAjusteFlow = async (payload: {
  contagemId: string;
  itemEstoqueId: string;
  saldoAnterior: number;
  saldoNovo: number;
  justificativa?: string;
  usuarioAjusteId: string;
}) => {
  const token = await getFlowAccessToken();
  if (!token) return;
  const response = await fetch(FLOW_TRIGGER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const message = data?.message || data?.error || text || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
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
  const [ajustesStart, setAjustesStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [ajustesEnd, setAjustesEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);
  const [thresholdA, setThresholdA] = useState('20');
  const [thresholdB, setThresholdB] = useState('40');
  const [thresholdC, setThresholdC] = useState('60');
  const [configPrefs, setConfigPrefs] = useState<Record<string, PreferenceRecord>>({});

  const [reportStart, setReportStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportEnd, setReportEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportSituacao, setReportSituacao] = useState('all');
  const [reportPage, setReportPage] = useState(0);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ContagemRecord[]>([]);

  const reportColumns = useMemo(
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
        columnId: 'usuario',
        renderHeaderCell: () => 'Usuário',
        renderCell: (item) => formatShortId(item._new_usuario_value),
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
        renderCell: (item) => formatShortId(item._new_contagem_value),
      }),
      createTableColumn<AjusteRecord>({
        columnId: 'usuario',
        renderHeaderCell: () => 'Usuário',
        renderCell: (item) => formatShortId(item._new_usuarioajuste_value),
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

  const loadDivergencias = useCallback(async () => {
    setDivergenciasLoading(true);
    setDivergenciasError(null);
    try {
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
      setAjustes((result.data ?? []) as AjusteRecord[]);
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
        columnId: 'acoes',
        renderHeaderCell: () => 'Ações',
        renderCell: (item) => (
          <div className={styles.actionsRow}>
            <Button appearance="primary" size="small" onClick={() => handleOpenAjuste(item)}>
              Gerar ajuste
            </Button>
          </div>
        ),
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

      await runAjusteFlow({
        contagemId: ajusteTarget.new_contagemestoqueid,
        itemEstoqueId: itemId,
        saldoAnterior,
        saldoNovo,
        justificativa: ajusteJustificativa || undefined,
        usuarioAjusteId: systemUserId,
      });

      setAjusteTarget(null);
      setAjusteSaldoNovo('');
      setAjusteJustificativa('');
      void loadDivergencias();
      void loadAjustes();
    } catch (err) {
      console.error('[GestaoContagem] erro ao ajustar', err);
      const message = err instanceof Error ? err.message : 'Erro ao chamar fluxo de ajuste.';
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

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      const start = toIsoStart(reportStart);
      const end = toIsoEnd(reportEnd);
      const filters = [`new_datacontagem ge ${start} and new_datacontagem le ${end}`, 'statecode eq 0'];
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
          'new_sku',
          'new_enderecocompleto',
          'new_quantidadecontada',
          'new_quantidadeesperada',
          '_new_usuario_value',
        ],
        top: 50,
        skip: reportPage * 50,
      });
      setReportData((result.data ?? []) as ContagemRecord[]);
    } catch (err: any) {
      console.error('[GestaoContagem] erro relatorio', err);
      setReportError(err.message || 'Erro ao carregar relatório.');
    } finally {
      setReportLoading(false);
    }
  }, [reportEnd, reportPage, reportSituacao, reportStart]);

  const exportCsv = useCallback(() => {
    if (reportData.length === 0) return;
    const headers = ['Data', 'SKU', 'Endereço', 'Contada', 'Esperada', 'Usuário'];
    const rows = reportData.map((item) => [
      formatDate(item.new_datacontagem),
      item.new_sku || '',
      item.new_enderecocompleto || '',
      String(item.new_quantidadecontada ?? 0),
      String(item.new_quantidadeesperada ?? 0),
      item._new_usuario_value || '',
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
            setReportPage(0);
            void loadReport();
          },
        },
      ];
    }
    return [];
  }, [loadAjustes, loadConfig, loadDashboard, loadDivergencias, loadReport, selectedTab]);

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
            <BarChart data={dashboardChartData} dataKey="value" />
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
                    {formatDate(item.new_datacontagem)}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
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
            {divergencias.map((item) => (
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
                  <div className={styles.actionsRow}>
                    <Button appearance="primary" onClick={() => handleOpenAjuste(item)}>
                      Gerar ajuste
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
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
                    Contagem: {formatShortId(item._new_contagem_value)}
                  </Text>
                  <Text size={200} className={styles.infoText}>
                    Usuário: {formatShortId(item._new_usuarioajuste_value)}
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
              <Button appearance="primary" onClick={() => { setReportPage(0); void loadReport(); }} disabled={reportLoading}>
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
              onClick={() => setReportPage((value) => Math.max(0, value - 1))}
              disabled={reportPage === 0}
            >
              Página anterior
            </Button>
            <Button appearance="subtle" onClick={() => setReportPage((value) => value + 1)}>
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
          if (value === 'divergencias') void loadDivergencias();
          if (value === 'ajustes') void loadAjustes();
          if (value === 'config') void loadConfig();
          if (value === 'relatorios') void loadReport();
        }}
      />
      <PageContainer>
        {selectedTab === 'dashboard' && renderDashboard()}
        {selectedTab === 'divergencias' && renderDivergencias()}
        {selectedTab === 'ajustes' && renderAjustes()}
        {selectedTab === 'config' && renderConfig()}
        {selectedTab === 'relatorios' && renderRelatorios()}
      </PageContainer>
    </>
  );
}
