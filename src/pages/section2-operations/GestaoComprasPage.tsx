import { Dispatch, Profiler, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Input,
  Option,
  Text,
  Toaster,
  Toast,
  ToastBody,
  ToastTitle,
  tokens,
  useId,
  useToastController,
} from '@fluentui/react-components';
import { 
  ArrowSync24Regular, 
  CheckmarkCircle24Regular, 
  ChevronDown16Regular,
  ChevronUp16Regular,
  Copy24Regular, 
  DocumentBulletList24Regular, 
  Info24Regular,
  Open24Regular,
  Share24Regular 
} from '@fluentui/react-icons';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { FilterBar } from '../../components/shared/FilterBar';
import { DataGrid, createTableColumn } from '../../components/shared/DataGrid';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingState } from '../../components/shared/LoadingState';
import { buildProdutoServicoSearchFilter, chunkIds, escapeODataString } from '../../features/remessas/utils';
import {
  Cr22fFornecedoresFromSharepointListService,
  Cr22fModelosdeProdutoFromSharepointListService,
  NewCacheComprasProdutosPendentesService,
  NewProdutoServicoService,
} from '../../generated';
import { NewCotacaoService } from '../../services/NewCotacaoService';
import { ProcurementTimeline } from '../../components/domain/compras/ProcurementTimeline';

const REFERENCE_CHUNK_SIZE = 25;
const CRM_APP_ID = '3ec4d8a9-2a8e-ee11-8179-002248de6f66';

type ProdutoCompraItem = {
  id: string;
  referencia?: string | null;
  descricao?: string | null;
  quantidade?: number | null;
  fornecedorId?: string | null;
  fornecedorNome?: string | null;
  cliente?: string | null;
  entrega?: string | null;
  dataLimite?: string | null;
  diasParaPedido?: number | null;
  faixaPrazo?: number | null;
  fabricante?: string | null;
  cotacaoId?: string | null;
  contemCotacao?: boolean | null;
  modeloId?: string | null;
  precoUnitario?: number;
  valorTotal?: number;
  entregaFmt?: string;
  dataLimiteFmt?: string;
};

type FornecedorItem = {
  id: string;
  nome?: string | null;
  razaoSocial?: string | null;
  prazoFrete?: number | null;
  leadTimeTotal?: number | null;
};

type CotacaoDetalhes = {
  id: string;
  nome?: string | null;
  fornecedor?: string | null;
  valorTotal?: number | null;
  opcaoEntrega?: number | null;
  enderecoEntrega?: string | null;
  observacoes?: string | null;
  dataAprovacao?: string | null;
  dataCriacao?: string | null;
  prazodeEnvio?: number | null;
  aprovado?: boolean | null;
  statecode?: number | null;
};

type CotacaoKanbanGroup = {
  cotacaoId: string;
  cotacao?: CotacaoDetalhes;
  produtos: ProdutoCompraItem[];
  totalProdutos: number;
  totalValorProdutos: number;
  minDataLimite?: string | null;
};

const FAIXAS_PRAZO = [
  { value: 100000000, label: 'Atrasado', color: 'danger' as const },
  { value: 100000001, label: 'Pedir agora', color: 'warning' as const },
  { value: 100000007, label: '7 dias', color: 'informative' as const },
  { value: 100000030, label: '30 dias', color: 'subtle' as const },
  { value: 100000099, label: 'Futuro', color: 'subtle' as const },
];

const getFaixaLabel = (value?: number | null) =>
  FAIXAS_PRAZO.find((faixa) => faixa.value === value)?.label ?? 'Sem prazo';

const getFaixaColor = (value?: number | null) =>
  FAIXAS_PRAZO.find((faixa) => faixa.value === value)?.color ?? 'subtle';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR');

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date);
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return currencyFormatter.format(value);
};

const formatOpcaoEntrega = (value?: number | null) => {
  if (value === null || value === undefined) return '-';
  // Mapeamento baseado nos valores comuns de opção de entrega no Dataverse
  const opcoes: Record<number, string> = {
    100000000: 'Retirada',
    100000001: 'Entrega no endereço',
    100000002: 'Transportadora',
  };
  return opcoes[value] || `Opção ${value}`;
};

const formatPrazoEnvio = (value?: number | null) => {
  if (value === null || value === undefined) return '-';
  const prazos: Record<number, string> = {
    100000030: '30 dias',
    100000060: '60 dias',
    100000090: '90 dias',
    100000120: '120 dias',
    100000180: '180 dias',
    900000000: 'Mais de 180 dias',
  };
  return prazos[value] || `Prazo ${value}`;
};

const OPCAO_ENTREGA_OPTIONS = [
  { value: 100000000, label: 'Retirada' },
  { value: 100000001, label: 'Entrega no endereço' },
  { value: 100000002, label: 'Transportadora' },
];

const PRAZO_ENVIO_OPTIONS = [
  { value: 100000030, label: '30 dias' },
  { value: 100000060, label: '60 dias' },
  { value: 100000090, label: '90 dias' },
  { value: 100000120, label: '120 dias' },
  { value: 100000180, label: '180 dias' },
  { value: 900000000, label: 'Mais de 180 dias' },
];

const resolvePrazoEnvioDefault = (prazoDias?: number | null) => {
  if (!prazoDias || prazoDias <= 0) return null;
  if (prazoDias <= 30) return 100000030;
  if (prazoDias <= 60) return 100000060;
  if (prazoDias <= 90) return 100000090;
  if (prazoDias <= 120) return 100000120;
  if (prazoDias <= 180) return 100000180;
  return 900000000;
};

const buildCacheProdutosFilter = (params: {
  search: string;
  prazo?: string;
  fornecedorId?: string;
  cliente?: string;
  fabricante?: string;
}) => {
  const filters = [
    'statecode eq 0',
    'new_originalpendenteparacompras eq true',
  ];

  const searchFilter = buildProdutoServicoSearchFilter(params.search);
  if (searchFilter) filters.push(searchFilter);

  if (params.prazo && params.prazo !== 'all') {
    filters.push(`new_faixadeprazo eq ${params.prazo}`);
  }

  if (params.fornecedorId) {
    filters.push(`new_fornecedorprincipalid eq '${escapeODataString(params.fornecedorId)}'`);
  }

  if (params.cliente && params.cliente !== 'all') {
    filters.push(`new_nomedoclientefx eq '${escapeODataString(params.cliente)}'`);
  }

  if (params.fabricante && params.fabricante !== 'all') {
    filters.push(`new_nomedofabricante eq '${escapeODataString(params.fabricante)}'`);
  }

  return filters.join(' and ');
};

const buildProdutoServicoFilters = (params: {
  search: string;
  prazo?: string;
  fornecedorId?: string;
  cliente?: string;
  fabricante?: string;
}) => {
  const filters = ['statecode eq 0'];

  const searchFilter = buildProdutoServicoSearchFilter(params.search);
  if (searchFilter) filters.push(searchFilter);

  if (params.prazo && params.prazo !== 'all') {
    filters.push(`new_faixadeprazo eq ${params.prazo}`);
  }

  if (params.fornecedorId) {
    filters.push(`new_fornecedorprincipalid eq '${escapeODataString(params.fornecedorId)}'`);
  }

  if (params.cliente && params.cliente !== 'all') {
    filters.push(`new_nomedoclientefx eq '${escapeODataString(params.cliente)}'`);
  }

  if (params.fabricante && params.fabricante !== 'all') {
    filters.push(`new_nomedofabricante eq '${escapeODataString(params.fabricante)}'`);
  }

  return filters;
};

const hasCotacao = (item: ProdutoCompraItem) => item.contemCotacao === true;

const resolveFornecedorNome = (fornecedor?: FornecedorItem | null) =>
  fornecedor?.nome || fornecedor?.razaoSocial || 'Fornecedor';

export function GestaoComprasPage() {
  const [selectedTab, setSelectedTab] = useState('lista');
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [prazoFilter, setPrazoFilter] = useState('all');
  const [fornecedorFilter, setFornecedorFilter] = useState('all');
  const [clienteFilter, setClienteFilter] = useState('all');
  const [fabricanteFilter, setFabricanteFilter] = useState('all');
  const [fornecedorSearch, setFornecedorSearch] = useState('');
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [loadingPrecos, setLoadingPrecos] = useState(false);
  const [loadingCotados, setLoadingCotados] = useState(false);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [fornecedoresDetalhesLoading, setFornecedoresDetalhesLoading] = useState(false);
  const [produtosCache, setProdutosCache] = useState<ProdutoCompraItem[]>([]);
  const [produtosCotados, setProdutosCotados] = useState<ProdutoCompraItem[]>([]);
  const [cotacoesAgrupadas, setCotacoesAgrupadas] = useState<CotacaoKanbanGroup[]>([]);
  const [cotacoesPedidosAgrupadas, setCotacoesPedidosAgrupadas] = useState<CotacaoKanbanGroup[]>([]);
  const [expandedCotacaoIds, setExpandedCotacaoIds] = useState<Record<string, boolean>>({});
  const [cotacaoModalId, setCotacaoModalId] = useState<string | null>(null);
  const [cotacaoModalOpen, setCotacaoModalOpen] = useState(false);
  const [cotacaoActionLoading, setCotacaoActionLoading] = useState(false);
  const [cotacaoActionDisabled, setCotacaoActionDisabled] = useState(true);
  const [cotacaoDraft, setCotacaoDraft] = useState<{ opcaoEntrega?: number | null; prazoEnvio?: number | null }>({});
  const [produtosPedidos, setProdutosPedidos] = useState<ProdutoCompraItem[]>([]);
  const [fornecedoresDetalhados, setFornecedoresDetalhados] = useState<FornecedorItem[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<ProdutoCompraItem[]>([]);
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<string | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyText, setCopyText] = useState('');
  const [processing, setProcessing] = useState(false);
  const loadRequestId = useRef(0);
  const cotadosRequestId = useRef(0);
  const pedidosRequestId = useRef(0);
  const precosCacheRef = useRef(new Map<string, number>());
  const [pedidoSearchInput, setPedidoSearchInput] = useState('');
  const [pedidoSearchValue, setPedidoSearchValue] = useState('');
  const [pedidoRangeDays, setPedidoRangeDays] = useState('30');
  const [pedidoSkipToken, setPedidoSkipToken] = useState<string | null>(null);
  const pedidoSkipTokenRef = useRef<string | null>(null);
  const [pedidoHasMore, setPedidoHasMore] = useState(false);
  const [pedidoLoadingMore, setPedidoLoadingMore] = useState(false);
  const toasterId = useId('compras-toast');
  const { dispatchToast } = useToastController(toasterId);

  const showError = useCallback((title: string, description?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {description && <ToastBody>{description}</ToastBody>}
      </Toast>,
      { intent: 'error' }
    );
  }, [dispatchToast]);

  const showSuccess = useCallback((title: string, description?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {description && <ToastBody>{description}</ToastBody>}
      </Toast>,
      { intent: 'success' }
    );
  }, [dispatchToast]);

  const profilerEnabled = import.meta.env.DEV;
  const timingEnabled = import.meta.env.DEV;
  const isListTab = selectedTab === 'lista';
  const handleProfileRender = useCallback((
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number
  ) => {
    if (!profilerEnabled) return;
    console.debug(
      `[Profiler:${id}] ${phase} - atual: ${actualDuration.toFixed(1)}ms, base: ${baseDuration.toFixed(1)}ms`
    );
  }, [profilerEnabled]);

  const timeStart = useCallback((label: string) => {
    if (timingEnabled) console.time(label);
  }, [timingEnabled]);

  const timeEnd = useCallback((label: string, meta?: Record<string, unknown>) => {
    if (!timingEnabled) return;
    console.timeEnd(label);
    if (meta) {
      console.debug(`[GestaoCompras] ${label}`, meta);
    }
  }, [timingEnabled]);

  const cotacoesKanbanMap = useMemo(() => {
    const map = new Map<string, CotacaoKanbanGroup>();
    cotacoesAgrupadas.forEach((grupo) => map.set(grupo.cotacaoId, grupo));
    cotacoesPedidosAgrupadas.forEach((grupo) => map.set(grupo.cotacaoId, grupo));
    return map;
  }, [cotacoesAgrupadas, cotacoesPedidosAgrupadas]);

  const loadFornecedores = useCallback(async (ids?: string[]) => {
    setFornecedoresDetalhesLoading(true);
    try {
      timeStart('compras.fornecedores');
      const select = [
        'cr22f_fornecedoresfromsharepointlistid',
        'cr22f_nomefantasia',
        'cr22f_title',
        'cr22f_razosocial',
        'new_prazofrete',
        'new_leadtimetotal',
      ];
      const filtroIds = (ids ?? []).filter(Boolean);
      const results = filtroIds.length > 0
        ? await Promise.all(
          chunkIds(filtroIds, REFERENCE_CHUNK_SIZE).map((chunk) => (
            Cr22fFornecedoresFromSharepointListService.getAll({
              select,
              filter: `statecode eq 0 and (${chunk.map((id) => `cr22f_fornecedoresfromsharepointlistid eq '${escapeODataString(id)}'`).join(' or ')})`,
              orderBy: ['cr22f_nomefantasia asc'],
            })
          ))
        )
        : [
          await Cr22fFornecedoresFromSharepointListService.getAll({
            select,
            filter: 'statecode eq 0',
            orderBy: ['cr22f_nomefantasia asc'],
            top: 500,
          }),
        ];

      const data = results.flatMap((res) => res.data ?? []);
      timeEnd('compras.fornecedores', {
        total: data.length,
        ids: filtroIds.length,
        chunks: filtroIds.length > 0 ? Math.ceil(filtroIds.length / REFERENCE_CHUNK_SIZE) : 1,
      });
      setFornecedoresDetalhados(data.map((item: any) => ({
        id: item.cr22f_fornecedoresfromsharepointlistid,
        nome: item.cr22f_nomefantasia || item.cr22f_title || null,
        razaoSocial: item.cr22f_razosocial || null,
        prazoFrete: item.new_prazofrete ?? null,
        leadTimeTotal: item.new_leadtimetotal ?? null,
      })));
    } catch (error) {
      console.error('[GestaoCompras] erro ao carregar fornecedores', error);
      showError('Erro ao carregar fornecedores');
      setFornecedoresDetalhados([]);
    } finally {
      setFornecedoresDetalhesLoading(false);
    }
  }, [showError, timeEnd, timeStart]);

  const loadPrecos = useCallback(async (modeloIds: string[]) => {
    if (modeloIds.length === 0) return new Map<string, number>();

    const cache = precosCacheRef.current;
    const missingIds = modeloIds.filter((id) => !cache.has(id));

    if (missingIds.length > 0) {
      const chunks = chunkIds(missingIds, REFERENCE_CHUNK_SIZE);
      timeStart('compras.precos');
      const results = await Promise.all(
        chunks.map((chunk) => (
          Cr22fModelosdeProdutoFromSharepointListService.getAll({
            select: ['cr22f_modelosdeprodutofromsharepointlistid', 'new_precodecompra'],
            filter: `statecode eq 0 and (${chunk.map((id) => `cr22f_modelosdeprodutofromsharepointlistid eq '${id}'`).join(' or ')})`,
          })
        ))
      );
      timeEnd('compras.precos', { totalModelos: modeloIds.length, faltantes: missingIds.length, chunks: chunks.length });

      const stillMissing = new Set(missingIds);
      results.flatMap((res) => res.data ?? []).forEach((item: any) => {
        const modeloId = item.cr22f_modelosdeprodutofromsharepointlistid;
        const preco = item.new_precodecompra;
        if (modeloId && typeof preco === 'number') {
          cache.set(modeloId, preco);
          stillMissing.delete(modeloId);
        }
      });

      stillMissing.forEach((modeloId) => {
        cache.set(modeloId, 0);
      });
    }

    const priceMap = new Map<string, number>();
    modeloIds.forEach((id) => {
      const preco = cache.get(id);
      if (typeof preco === 'number') {
        priceMap.set(id, preco);
      }
    });

    return priceMap;
  }, [timeEnd, timeStart]);

  const loadProdutosCache = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setLoadingProdutos(true);
    setLoadingPrecos(false);
    const renderStart = performance.now();
    try {
      
      const filter = buildCacheProdutosFilter({
        search: searchValue,
        prazo: prazoFilter,
        fornecedorId: fornecedorFilter === 'all' ? undefined : fornecedorFilter,
        cliente: clienteFilter === 'all' ? undefined : clienteFilter,
        fabricante: fabricanteFilter === 'all' ? undefined : fabricanteFilter,
      });

      const top = 5000;
      const orderBy = isListTab
        ? ['new_datalimiteparapedido asc']
        : ['new_faixadeprazo asc', 'new_datalimiteparapedido asc', 'new_nomedoclientefx asc'];
      
        timeStart('compras.produtos');
      const result = await NewCacheComprasProdutosPendentesService.getAll({
        select: [
          'new_cachecomprasprodutospendentesid',
          'new_referenciadoproduto',
          'new_descricao',
          'new_quantidade',
          'new_nomedoclientefx',
          'new_previsaodeentrega',
          'new_datalimiteparapedido',
          'new_diasparapedido',
          'new_faixadeprazo',
          'new_nomedofornecedorprincipal',
          'new_fornecedorprincipalid',
          'new_nomedofabricante',
          'new_contemcotacao',
          '_new_modelodeprodutooriginal_value',
          '_new_produtoservico_value',
        ],
        filter,
        orderBy,
        top,
      });
      timeEnd('compras.produtos', { total: result.data?.length ?? 0, top, tab: selectedTab, orderBy });

      if (requestId !== loadRequestId.current) return;

      const cachedPrecos = precosCacheRef.current;
      const items = (result.data || []).map((item: any) => {
        const originalId = item._new_produtoservico_value ?? null;
        if (!originalId) return null;
        const modeloId = item._new_modelodeprodutooriginal_value ?? null;
        const precoUnitario = modeloId ? cachedPrecos.get(modeloId) ?? 0 : 0;
        return {
          id: originalId,
          referencia: item.new_referenciadoproduto ?? null,
          descricao: item.new_descricao ?? null,
          quantidade: item.new_quantidade ?? null,
          cliente: item.new_nomedoclientefx ?? null,
          entrega: item.new_previsaodeentrega ?? null,
          entregaFmt: formatDate(item.new_previsaodeentrega ?? null),
          dataLimite: item.new_datalimiteparapedido ?? null,
          dataLimiteFmt: formatDate(item.new_datalimiteparapedido ?? null),
          diasParaPedido: item.new_diasparapedido ?? null,
          faixaPrazo: item.new_faixadeprazo ?? null,
          fornecedorId: item.new_fornecedorprincipalid ?? null,
          fornecedorNome: item.new_nomedofornecedorprincipal ?? null,
          fabricante: item.new_nomedofabricante ?? null,
          contemCotacao: item.new_contemcotacao ?? null,
          modeloId,
          precoUnitario,
          valorTotal: (item.new_quantidade ?? 0) * precoUnitario,
        };
      }).filter(Boolean) as ProdutoCompraItem[];

      const modeloIds = Array.from(new Set(items.map((item) => item.modeloId).filter(Boolean))) as string[];
      setProdutosCache(items);
      setLoadingProdutos(false);
      if (timingEnabled) {
        console.debug('[GestaoCompras] render-util', {
          ms: Math.round(performance.now() - renderStart),
          total: items.length,
        });
      }

      if (modeloIds.length === 0) return;
      setLoadingPrecos(true);
      void (async () => {
        const precos = await loadPrecos(modeloIds);
        if (requestId !== loadRequestId.current) return;
        setProdutosCache((prev) => prev.map((item) => {
          if (!item.modeloId) return item;
          const precoUnitario = precos.get(item.modeloId);
          if (precoUnitario === undefined) return item;
          if (precoUnitario === item.precoUnitario) return item;
          return {
            ...item,
            precoUnitario,
            valorTotal: (item.quantidade ?? 0) * precoUnitario,
          };
        }));
      })().finally(() => {
        if (requestId === loadRequestId.current) {
          setLoadingPrecos(false);
        }
      });
    } catch (error) {
      console.error('[GestaoCompras] erro ao carregar produtos', error);
      showError('Erro ao carregar produtos');
      setProdutosCache([]);
    } finally {
      if (requestId === loadRequestId.current) {
        setLoadingProdutos(false);
        setLoadingPrecos(false);
      }
    }
  }, [clienteFilter, fornecedorFilter, fabricanteFilter, isListTab, loadPrecos, prazoFilter, searchValue, showError, timeEnd, timeStart, timingEnabled]);

  const mapProdutoServicoItem = useCallback((item: any) => {
    const modeloId = item._new_modelodeprodutooriginal_value ?? null;
    const precoUnitario = modeloId ? precosCacheRef.current.get(modeloId) ?? 0 : 0;
    return {
      id: item.new_produtoservicoid ?? '',
      referencia: item.new_referenciadoproduto ?? null,
      descricao: item.new_descricao ?? null,
      quantidade: item.new_quantidade ?? null,
      cliente: item.new_nomedoclientefx ?? null,
      entrega: item.new_previsaodeentrega ?? null,
      entregaFmt: formatDate(item.new_previsaodeentrega ?? null),
      dataLimite: item.new_datalimiteparapedido ?? null,
      dataLimiteFmt: formatDate(item.new_datalimiteparapedido ?? null),
      diasParaPedido: item.new_diasparapedido ?? null,
      faixaPrazo: item.new_faixadeprazo ?? null,
      fornecedorId: item.new_fornecedorprincipalid ?? null,
      fornecedorNome: item.new_nomedofornecedorprincipal ?? null,
      fabricante: item.new_nomedofabricante ?? null,
      cotacaoId: item._new_cotacao_value ?? null,
      contemCotacao: true,
      modeloId,
      precoUnitario,
      valorTotal: (item.new_quantidade ?? 0) * precoUnitario,
    } as ProdutoCompraItem;
  }, []);

  const enrichProdutosComPrecos = useCallback(async (
    items: ProdutoCompraItem[],
    requestId: number,
    requestRef: { current: number },
    setState: Dispatch<SetStateAction<ProdutoCompraItem[]>>
  ) => {
    const modeloIds = Array.from(new Set(items.map((item) => item.modeloId).filter(Boolean))) as string[];
    if (modeloIds.length === 0) return;
    const precos = await loadPrecos(modeloIds);
    if (requestId !== requestRef.current) return;
    setState((prev) => prev.map((item) => {
      if (!item.modeloId) return item;
      const precoUnitario = precos.get(item.modeloId);
      if (precoUnitario === undefined || precoUnitario === item.precoUnitario) return item;
      return {
        ...item,
        precoUnitario,
        valorTotal: (item.quantidade ?? 0) * precoUnitario,
      };
    }));
  }, [loadPrecos]);

  const loadCotadosFromProdutoServico = useCallback(async () => {
    const requestId = ++cotadosRequestId.current;
    setLoadingCotados(true);
    try {
      const filters = buildProdutoServicoFilters({
        search: searchValue,
        prazo: prazoFilter,
        fornecedorId: fornecedorFilter === 'all' ? undefined : fornecedorFilter,
        cliente: clienteFilter === 'all' ? undefined : clienteFilter,
        fabricante: fabricanteFilter === 'all' ? undefined : fabricanteFilter,
      });
      filters.push('_new_cotacao_value ne null');
      filters.push('new_Cotacao/new_aprovarcotacao ne true');

      const result = await NewProdutoServicoService.getAll({
        select: [
          'new_produtoservicoid',
          'new_referenciadoproduto',
          'new_descricao',
          'new_quantidade',
          'new_nomedoclientefx',
          'new_previsaodeentrega',
          'new_datalimiteparapedido',
          'new_diasparapedido',
          'new_faixadeprazo',
          'new_nomedofornecedorprincipal',
          'new_fornecedorprincipalid',
          'new_nomedofabricante',
          '_new_modelodeprodutooriginal_value',
          '_new_cotacao_value',
        ],
        filter: filters.join(' and '),
        orderBy: ['new_datalimiteparapedido asc'],
        top: 5000,
      });
      if (requestId !== cotadosRequestId.current) return;

      const items = (result.data || [])
        .map((item: any) => mapProdutoServicoItem(item))
        .filter((item: ProdutoCompraItem) => Boolean(item.id));
      setProdutosCotados(items);
      await enrichProdutosComPrecos(items, requestId, cotadosRequestId, setProdutosCotados);

      // Agrupar produtos por cotação
      const cotacaoMap = new Map<string, ProdutoCompraItem[]>();
      items.forEach((item) => {
        if (!item.cotacaoId) return;
        if (!cotacaoMap.has(item.cotacaoId)) {
          cotacaoMap.set(item.cotacaoId, []);
        }
        cotacaoMap.get(item.cotacaoId)!.push(item);
      });

      // Extrair IDs únicos de cotações
      const cotacaoIds = Array.from(cotacaoMap.keys());
      
      if (cotacaoIds.length === 0) {
        setCotacoesAgrupadas([]);
        return;
      }

      // Carregar detalhes das cotações em chunks
      const chunks = chunkIds(cotacaoIds, REFERENCE_CHUNK_SIZE);
      const cotacoesResults = await Promise.all(
        chunks.map((chunk) =>
          NewCotacaoService.getAll({
            filter: `statecode eq 0 and (${chunk.map((id) => `new_cotacaoid eq '${escapeODataString(id)}'`).join(' or ')})`,
            select: [
              'new_cotacaoid',
              'new_name',
              'new_nomedofornecedor',
              'new_valortotal',
              'new_opcaodeentrega',
              'new_enderecodeentrega',
              'new_observacoes',
              'new_datadeaprovacao',
              'createdon',
              'new_prazodeenvio',
              'new_aprovarcotacao',
              'statecode',
            ],
          })
        )
      );

      if (requestId !== cotadosRequestId.current) return;

      // Mapear detalhes das cotações
      const cotacoesDetalhesMap = new Map<string, CotacaoDetalhes>();
      cotacoesResults.flatMap((res) => res.data ?? []).forEach((item: any) => {
        cotacoesDetalhesMap.set(item.new_cotacaoid, {
          id: item.new_cotacaoid,
          nome: item.new_name ?? null,
          fornecedor: item.new_nomedofornecedor ?? null,
          valorTotal: item.new_valortotal ?? null,
          opcaoEntrega: item.new_opcaodeentrega ?? null,
          enderecoEntrega: item.new_enderecodeentrega ?? null,
          observacoes: item.new_observacoes ?? null,
          dataAprovacao: item.new_datadeaprovacao ?? null,
          dataCriacao: item.createdon ?? null,
          prazodeEnvio: item.new_prazodeenvio ?? null,
          aprovado: item.new_aprovarcotacao ?? null,
          statecode: item.statecode ?? null,
        });
      });

      // Montar grupos com detalhes
      const grupos: CotacaoKanbanGroup[] = Array.from(cotacaoMap.entries()).map(([cotacaoId, produtos]) => {
        const totalValor = produtos.reduce((acc, p) => acc + (p.valorTotal ?? 0), 0);
        const datasLimite = produtos.map((p) => p.dataLimite).filter(Boolean) as string[];
        const minDataLimite = datasLimite.length > 0 ? datasLimite.sort()[0] : null;

        return {
          cotacaoId,
          cotacao: cotacoesDetalhesMap.get(cotacaoId),
          produtos,
          totalProdutos: produtos.length,
          totalValorProdutos: totalValor,
          minDataLimite,
        };
      });

      setCotacoesAgrupadas(grupos);
    } catch (error) {
      console.error('[GestaoCompras] erro ao carregar produtos cotados', error);
      setProdutosCotados([]);
      setCotacoesAgrupadas([]);
    } finally {
      if (requestId === cotadosRequestId.current) {
        setLoadingCotados(false);
      }
    }
  }, [
    clienteFilter,
    fornecedorFilter,
    fabricanteFilter,
    mapProdutoServicoItem,
    prazoFilter,
    searchValue,
    enrichProdutosComPrecos,
  ]);

  const loadPedidosFromProdutoServico = useCallback(async (options?: { append?: boolean }) => {
    const append = options?.append ?? false;
    const requestId = append ? pedidosRequestId.current : ++pedidosRequestId.current;
    const skipToken = append ? pedidoSkipTokenRef.current : null;
    if (!append) {
      setLoadingPedidos(true);
      setPedidoHasMore(false);
      setPedidoSkipToken(null);
      pedidoSkipTokenRef.current = null;
    } else {
      setPedidoLoadingMore(true);
    }
    try {
      const hasPedidoSearch = pedidoSearchValue.trim().length > 0;
      const searchTerm = hasPedidoSearch ? pedidoSearchValue : searchValue;
      if (!hasPedidoSearch) {
        const rangeDays = Number(pedidoRangeDays) || 30;
        const isoCutoff = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

        const cotacoesResult = await NewCotacaoService.getAll({
          filter: `statecode eq 0 and new_aprovarcotacao eq true and new_datadeaprovacao ge ${isoCutoff}`,
          select: [
            'new_cotacaoid',
            'new_name',
            'new_nomedofornecedor',
            'new_valortotal',
            'new_opcaodeentrega',
            'new_enderecodeentrega',
            'new_observacoes',
            'new_datadeaprovacao',
            'createdon',
            'new_prazodeenvio',
            'new_aprovarcotacao',
            'statecode',
          ],
          orderBy: ['new_datadeaprovacao desc'],
          top: 200,
        });
        if (requestId !== pedidosRequestId.current) return;

        const cotacoes = cotacoesResult.data ?? [];
        const cotacaoIds = cotacoes.map((item: any) => item.new_cotacaoid).filter(Boolean) as string[];

        if (cotacaoIds.length === 0) {
          setProdutosPedidos([]);
          setCotacoesPedidosAgrupadas([]);
          setPedidoHasMore(false);
          setPedidoSkipToken(null);
          pedidoSkipTokenRef.current = null;
          return;
        }

        const cotacoesDetalhesMap = new Map<string, CotacaoDetalhes>();
        cotacoes.forEach((item: any) => {
          cotacoesDetalhesMap.set(item.new_cotacaoid, {
            id: item.new_cotacaoid,
            nome: item.new_name ?? null,
            fornecedor: item.new_nomedofornecedor ?? null,
            valorTotal: item.new_valortotal ?? null,
            opcaoEntrega: item.new_opcaodeentrega ?? null,
            enderecoEntrega: item.new_enderecodeentrega ?? null,
            observacoes: item.new_observacoes ?? null,
            dataAprovacao: item.new_datadeaprovacao ?? null,
            dataCriacao: item.createdon ?? null,
            prazodeEnvio: item.new_prazodeenvio ?? null,
            aprovado: item.new_aprovarcotacao ?? null,
            statecode: item.statecode ?? null,
          });
        });

        const produtoFilters = buildProdutoServicoFilters({
          search: searchTerm,
          prazo: prazoFilter,
          fornecedorId: fornecedorFilter === 'all' ? undefined : fornecedorFilter,
          cliente: clienteFilter === 'all' ? undefined : clienteFilter,
          fabricante: fabricanteFilter === 'all' ? undefined : fabricanteFilter,
        });
        produtoFilters.push('_new_cotacao_value ne null');

        const produtosResults = await Promise.all(
          chunkIds(cotacaoIds, REFERENCE_CHUNK_SIZE).map((chunk) => (
            NewProdutoServicoService.getAll({
              select: [
                'new_produtoservicoid',
                'new_referenciadoproduto',
                'new_descricao',
                'new_quantidade',
                'new_nomedoclientefx',
                'new_previsaodeentrega',
                'new_datalimiteparapedido',
                'new_diasparapedido',
                'new_faixadeprazo',
                'new_nomedofornecedorprincipal',
                'new_fornecedorprincipalid',
                'new_nomedofabricante',
                '_new_modelodeprodutooriginal_value',
                '_new_cotacao_value',
                'createdon',
              ],
              filter: [
                ...produtoFilters,
                `(${chunk.map((id) => `_new_cotacao_value eq '${escapeODataString(id)}'`).join(' or ')})`,
              ].join(' and '),
              orderBy: ['createdon desc'],
              top: 500,
            })
          ))
        );
        if (requestId !== pedidosRequestId.current) return;

        const fetched = produtosResults
          .flatMap((result) => result.data ?? [])
          .map((item: any) => mapProdutoServicoItem(item))
          .filter((item: ProdutoCompraItem) => Boolean(item.id));

        setProdutosPedidos(fetched);
        setPedidoHasMore(false);
        setPedidoSkipToken(null);
        pedidoSkipTokenRef.current = null;

        await enrichProdutosComPrecos(fetched, requestId, pedidosRequestId, setProdutosPedidos);

        const cotacaoMap = new Map<string, ProdutoCompraItem[]>();
        fetched.forEach((item) => {
          if (!item.cotacaoId) return;
          if (!cotacaoMap.has(item.cotacaoId)) cotacaoMap.set(item.cotacaoId, []);
          cotacaoMap.get(item.cotacaoId)!.push(item);
        });

        const grupos = Array.from(cotacaoMap.entries()).map(([cotacaoId, produtos]) => {
          const totalValor = produtos.reduce((acc, p) => acc + (p.valorTotal ?? 0), 0);
          const datasLimite = produtos.map((p) => p.dataLimite).filter(Boolean) as string[];
          const minDataLimite = datasLimite.length > 0 ? datasLimite.sort()[0] : null;

          return {
            cotacaoId,
            cotacao: cotacoesDetalhesMap.get(cotacaoId),
            produtos,
            totalProdutos: produtos.length,
            totalValorProdutos: totalValor,
            minDataLimite,
          } as CotacaoKanbanGroup;
        }).filter((grupo) => grupo.produtos.length > 0);

        setCotacoesPedidosAgrupadas(grupos);
        return;
      }

      const filters = buildProdutoServicoFilters({
        search: searchTerm,
        prazo: prazoFilter,
        fornecedorId: fornecedorFilter === 'all' ? undefined : fornecedorFilter,
        cliente: clienteFilter === 'all' ? undefined : clienteFilter,
        fabricante: fabricanteFilter === 'all' ? undefined : fabricanteFilter,
      });
      filters.push('_new_cotacao_value ne null');
      filters.push('new_Cotacao/new_aprovarcotacao eq true');

      const result = await NewProdutoServicoService.getAll({
        select: [
          'new_produtoservicoid',
          'new_referenciadoproduto',
          'new_descricao',
          'new_quantidade',
          'new_nomedoclientefx',
          'new_previsaodeentrega',
          'new_datalimiteparapedido',
          'new_diasparapedido',
          'new_faixadeprazo',
          'new_nomedofornecedorprincipal',
          'new_fornecedorprincipalid',
          'new_nomedofabricante',
          '_new_modelodeprodutooriginal_value',
          '_new_cotacao_value',
          'createdon',
        ],
        filter: filters.join(' and '),
        orderBy: ['createdon desc'],
        top: 100,
        ...(append && skipToken ? { skipToken } : {}),
      });
      if (requestId !== pedidosRequestId.current) return;

      const fetched = (result.data || [])
        .map((item: any) => mapProdutoServicoItem(item))
        .filter((item: ProdutoCompraItem) => Boolean(item.id));

      let nextItems: ProdutoCompraItem[] = [];
      setProdutosPedidos((prev) => {
        nextItems = append ? [...prev, ...fetched] : fetched;
        return nextItems;
      });

      const nextToken = result.skipToken ?? null;
      pedidoSkipTokenRef.current = nextToken;
      setPedidoSkipToken(nextToken);
      setPedidoHasMore(Boolean(nextToken) && hasPedidoSearch);

      await enrichProdutosComPrecos(nextItems, requestId, pedidosRequestId, setProdutosPedidos);

      const cotacaoIds = Array.from(new Set(
        nextItems.map((item) => item.cotacaoId).filter((id): id is string => Boolean(id))
      ));

      const cotacoesResults = await Promise.all(
        chunkIds(cotacaoIds, REFERENCE_CHUNK_SIZE).map((chunk) => (
          NewCotacaoService.getAll({
            filter: `statecode eq 0 and (${chunk.map((id) => `new_cotacaoid eq '${escapeODataString(id)}'`).join(' or ')})`,
            select: [
              'new_cotacaoid',
              'new_name',
              'new_nomedofornecedor',
              'new_valortotal',
              'new_opcaodeentrega',
              'new_enderecodeentrega',
              'new_observacoes',
              'new_datadeaprovacao',
              'createdon',
              'new_prazodeenvio',
              'new_aprovarcotacao',
              'statecode',
            ],
          })
        ))
      );
      if (requestId !== pedidosRequestId.current) return;

      const cotacoesDetalhesMap = new Map<string, CotacaoDetalhes>();
      cotacoesResults.flatMap((res) => res.data ?? []).forEach((item: any) => {
        cotacoesDetalhesMap.set(item.new_cotacaoid, {
          id: item.new_cotacaoid,
          nome: item.new_name ?? null,
          fornecedor: item.new_nomedofornecedor ?? null,
          valorTotal: item.new_valortotal ?? null,
          opcaoEntrega: item.new_opcaodeentrega ?? null,
          enderecoEntrega: item.new_enderecodeentrega ?? null,
          observacoes: item.new_observacoes ?? null,
          dataAprovacao: item.new_datadeaprovacao ?? null,
          dataCriacao: item.createdon ?? null,
          prazodeEnvio: item.new_prazodeenvio ?? null,
          aprovado: item.new_aprovarcotacao ?? null,
          statecode: item.statecode ?? null,
        });
      });

      const cotacaoMap = new Map<string, ProdutoCompraItem[]>();
      nextItems.forEach((item) => {
        if (!item.cotacaoId) return;
        if (!cotacaoMap.has(item.cotacaoId)) cotacaoMap.set(item.cotacaoId, []);
        cotacaoMap.get(item.cotacaoId)!.push(item);
      });

      const grupos = Array.from(cotacaoMap.entries()).map(([cotacaoId, produtos]) => {
        const totalValor = produtos.reduce((acc, p) => acc + (p.valorTotal ?? 0), 0);
        const datasLimite = produtos.map((p) => p.dataLimite).filter(Boolean) as string[];
        const minDataLimite = datasLimite.length > 0 ? datasLimite.sort()[0] : null;

        return {
          cotacaoId,
          cotacao: cotacoesDetalhesMap.get(cotacaoId),
          produtos,
          totalProdutos: produtos.length,
          totalValorProdutos: totalValor,
          minDataLimite,
        } as CotacaoKanbanGroup;
      }).filter((grupo) => grupo.produtos.length > 0);

      setCotacoesPedidosAgrupadas(grupos);
    } catch (error) {
      console.error('[GestaoCompras] erro ao carregar produtos pedidos', error);
      setProdutosPedidos([]);
      setCotacoesPedidosAgrupadas([]);
    } finally {
      if (requestId === pedidosRequestId.current) {
        setLoadingPedidos(false);
        setPedidoLoadingMore(false);
      }
    }
  }, [
    clienteFilter,
    fornecedorFilter,
    fabricanteFilter,
    mapProdutoServicoItem,
    pedidoRangeDays,
    pedidoSearchValue,
    prazoFilter,
    searchValue,
    enrichProdutosComPrecos,
  ]);

  const clearPrecoCache = useCallback(() => {
    precosCacheRef.current = new Map();
  }, []);

  useEffect(() => {
    void (async () => {
      await loadProdutosCache();
      if (selectedTab !== 'kanban') return;
      await Promise.all([
        loadCotadosFromProdutoServico(),
        loadPedidosFromProdutoServico(),
      ]);
    })();
  }, [
    loadCotadosFromProdutoServico,
    loadPedidosFromProdutoServico,
    loadProdutosCache,
    selectedTab,
  ]);

  const derivedData = useMemo(() => {
    const produtosByFaixa = new Map<number, ProdutoCompraItem[]>();
    const fornecedorResumo = new Map<string, { count: number; total: number; faixas: Map<number, number> }>();
    const resumoPorFaixaMap = new Map<number, { count: number; total: number; fornecedores: Set<string> }>();
    const produtosACotar: ProdutoCompraItem[] = [];
    const produtosCotadosCache: ProdutoCompraItem[] = [];
    const baseProdutos = produtosCache;

    baseProdutos.forEach((item) => {
      if (hasCotacao(item)) {
        produtosCotadosCache.push(item);
      } else {
        produtosACotar.push(item);
      }

      if (item.faixaPrazo) {
        if (!produtosByFaixa.has(item.faixaPrazo)) produtosByFaixa.set(item.faixaPrazo, []);
        produtosByFaixa.get(item.faixaPrazo)!.push(item);

        if (!resumoPorFaixaMap.has(item.faixaPrazo)) {
          resumoPorFaixaMap.set(item.faixaPrazo, { count: 0, total: 0, fornecedores: new Set() });
        }
        const resumo = resumoPorFaixaMap.get(item.faixaPrazo)!;
        resumo.count += 1;
        resumo.total += item.valorTotal ?? 0;
        if (item.fornecedorId) resumo.fornecedores.add(item.fornecedorId);
      }

      if (item.fornecedorId) {
        if (!fornecedorResumo.has(item.fornecedorId)) {
          fornecedorResumo.set(item.fornecedorId, { count: 0, total: 0, faixas: new Map() });
        }
        const data = fornecedorResumo.get(item.fornecedorId)!;
        data.count += 1;
        data.total += item.valorTotal ?? 0;
        if (item.faixaPrazo) {
          data.faixas.set(item.faixaPrazo, (data.faixas.get(item.faixaPrazo) ?? 0) + 1);
        }
      }
    });

    if (timingEnabled) {
      console.log('[GestaoCompras] produtos cotados', {
        total: produtosCotadosCache.length,
        totalAmostrar: baseProdutos.length,
      });
    }

    const resumoPorFaixa = FAIXAS_PRAZO.map((faixa) => {
      const resumo = resumoPorFaixaMap.get(faixa.value);
      return {
        ...faixa,
        count: resumo?.count ?? 0,
        total: resumo?.total ?? 0,
        fornecedores: resumo?.fornecedores.size ?? 0,
      };
    });

    return {
      produtosByFaixa,
      fornecedorResumo,
      resumoPorFaixa,
      produtosACotar,
    };
  }, [produtosCache, timingEnabled]);

  const fornecedoresBasicos = useMemo(() => {
    const map = new Map<string, FornecedorItem>();
    produtosCache.forEach((item) => {
      if (!item.fornecedorId) return;
      if (!map.has(item.fornecedorId)) {
        map.set(item.fornecedorId, {
          id: item.fornecedorId,
          nome: item.fornecedorNome ?? null,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => resolveFornecedorNome(a).localeCompare(resolveFornecedorNome(b)));
  }, [produtosCache]);

  const fornecedorIds = useMemo(() => (
    fornecedoresBasicos.map((item) => item.id)
  ), [fornecedoresBasicos]);

  useEffect(() => {
    if (selectedTab !== 'lista') return;
    if (fornecedoresDetalhados.length > 0 || fornecedoresDetalhesLoading) return;
    void loadFornecedores(fornecedorIds);
  }, [fornecedoresDetalhados.length, fornecedoresDetalhesLoading, fornecedorIds, loadFornecedores, selectedTab]);

  const refreshAll = useCallback(async () => {
    clearPrecoCache();
    await loadProdutosCache();
    if (selectedTab === 'kanban') {
      await Promise.all([loadCotadosFromProdutoServico(), loadPedidosFromProdutoServico()]);
    }
  }, [
    clearPrecoCache,
    loadCotadosFromProdutoServico,
    loadPedidosFromProdutoServico,
    loadProdutosCache,
    selectedTab,
  ]);

  useEffect(() => {
    const group = cotacaoModalId ? cotacoesKanbanMap.get(cotacaoModalId) : null;
    if (!cotacaoModalOpen || !group) {
      setCotacaoActionDisabled(true);
      return;
    }

    const nomeCotacao = group.cotacao?.nome?.trim();
    if (!nomeCotacao) {
      const aprovado = group.cotacao?.aprovado === true;
      const inativo = group.cotacao?.statecode === 1;
      setCotacaoActionDisabled(aprovado || inativo);
      return;
    }

    let alive = true;
    void (async () => {
      try {
        const lookup = await NewCotacaoService.getAll({
          filter: `new_name eq '${escapeODataString(nomeCotacao)}' and (new_aprovarcotacao eq true or statecode eq 1)`,
          select: ['new_cotacaoid'],
          top: 1,
        });
        if (!alive) return;
        setCotacaoActionDisabled((lookup.data?.length ?? 0) > 0);
      } catch (err) {
        console.error('[GestaoCompras] erro ao validar aprovação/cancelamento', err);
        const aprovado = group.cotacao?.aprovado === true;
        const inativo = group.cotacao?.statecode === 1;
        setCotacaoActionDisabled(aprovado || inativo);
      }
    })();

    return () => {
      alive = false;
    };
  }, [cotacaoModalId, cotacaoModalOpen, cotacoesKanbanMap]);

  const fornecedoresLookup = useMemo(() => {
    const merged = new Map<string, FornecedorItem>();
    fornecedoresBasicos.forEach((item) => merged.set(item.id, item));
    fornecedoresDetalhados.forEach((item) => merged.set(item.id, item));
    return Array.from(merged.values());
  }, [fornecedoresBasicos, fornecedoresDetalhados]);

  const fornecedorMap = useMemo(() => {
    return new Map(fornecedoresLookup.map((item) => [item.id, item]));
  }, [fornecedoresLookup]);

  useEffect(() => {
    if (!cotacaoModalOpen || !cotacaoModalId) return;
    const grupo = cotacaoModalId ? cotacoesKanbanMap.get(cotacaoModalId) : null;
    if (!grupo) return;
    const fornecedorId = grupo.produtos[0]?.fornecedorId ?? null;
    const fornecedor = fornecedorId ? fornecedorMap.get(fornecedorId) : null;
    const prazoDefault = grupo.cotacao?.prazodeEnvio ?? resolvePrazoEnvioDefault(fornecedor?.prazoFrete ?? null);
    setCotacaoDraft({
      opcaoEntrega: grupo.cotacao?.opcaoEntrega ?? null,
      prazoEnvio: prazoDefault ?? null,
    });
  }, [cotacaoModalId, cotacaoModalOpen, cotacoesKanbanMap, fornecedorMap]);

  const { fornecedorResumo, resumoPorFaixa, produtosACotar } = derivedData;

  const fornecedorOptions = useMemo(() => {
    const options = fornecedoresBasicos.map((item) => ({
      key: item.id,
      text: resolveFornecedorNome(item),
    }));
    return [{ key: 'all', text: 'Todos' }, ...options];
  }, [fornecedoresBasicos]);

  const clienteOptions = useMemo(() => {
    const clientes = new Set<string>();
    produtosCache.forEach((item) => {
      if (item.cliente) clientes.add(item.cliente);
    });
    const options = Array.from(clientes).sort().map((cliente) => ({ key: cliente, text: cliente }));
    return [{ key: 'all', text: 'Todos' }, ...options];
  }, [produtosCache]);

  const fabricanteOptions = useMemo(() => {
    const fabricantes = new Set<string>();
    produtosCache.forEach((item) => {
      if (item.fabricante) fabricantes.add(item.fabricante);
    });
    const options = Array.from(fabricantes).sort().map((fabricante) => ({ key: fabricante, text: fabricante }));
    return [{ key: 'all', text: 'Todos' }, ...options];
  }, [produtosCache]);

  const pedidoRangeOptions = useMemo(() => ([
    { key: '7', text: 'Últimos 7 dias' },
    { key: '30', text: 'Últimos 30 dias' },
    { key: '60', text: 'Últimos 60 dias' },
    { key: '90', text: 'Últimos 90 dias' },
  ]), []);

  const prazoOptions = useMemo(() => [
    { key: 'all', text: 'Todos' },
    ...FAIXAS_PRAZO.map((faixa) => ({ key: String(faixa.value), text: faixa.label })),
  ], []);

  const activeFilters = useMemo(() => {
    const filters: Array<{ id: string; label: string }> = [];
    if (prazoFilter !== 'all') {
      filters.push({ id: 'prazo', label: `Prazo: ${getFaixaLabel(Number(prazoFilter))}` });
    }
    if (fornecedorFilter !== 'all') {
      const fornecedor = fornecedorMap.get(fornecedorFilter);
      filters.push({ id: 'fornecedor', label: `Fornecedor: ${resolveFornecedorNome(fornecedor)}` });
    }
    if (clienteFilter !== 'all') {
      filters.push({ id: 'cliente', label: `Cliente: ${clienteFilter}` });
    }
    if (fabricanteFilter !== 'all') {
      filters.push({ id: 'fabricante', label: `Fabricante: ${fabricanteFilter}` });
    }
    return filters;
  }, [clienteFilter, fabricanteFilter, fornecedorFilter, fornecedorMap, prazoFilter]);

  const hasActiveFilters = useMemo(() => (
    searchValue.trim() !== ''
    || prazoFilter !== 'all'
    || fornecedorFilter !== 'all'
    || clienteFilter !== 'all'
    || fabricanteFilter !== 'all'
  ), [clienteFilter, fabricanteFilter, fornecedorFilter, prazoFilter, searchValue]);

  const emptyState = useMemo(() => {
    if (!hasActiveFilters && produtosCache.length === 0) {
      return (
        <EmptyState
          title="Snapshot do dia ainda não foi gerado"
          description="Verifique se o dataflow já rodou para gerar o cache diário."
        />
      );
    }
    return (
      <EmptyState
        title="Sem itens para comprar"
        description="Nenhum item encontrado com os filtros atuais."
      />
    );
  }, [hasActiveFilters, produtosCache.length]);

  const handleClearFilter = (id: string) => {
    if (id === 'prazo') setPrazoFilter('all');
    if (id === 'fornecedor') setFornecedorFilter('all');
    if (id === 'cliente') setClienteFilter('all');
    if (id === 'fabricante') setFabricanteFilter('all');
  };

  const handleClearAll = () => {
    setPrazoFilter('all');
    setFornecedorFilter('all');
    setClienteFilter('all');
    setFabricanteFilter('all');
  };

  const totalSelecionado = useMemo(() => (
    selectedProdutos.reduce((acc, item) => acc + (item.valorTotal ?? 0), 0)
  ), [selectedProdutos]);

  const selectedProdutoIds = useMemo(() => (
    new Set(selectedProdutos.map((item) => item.id))
  ), [selectedProdutos]);

  const listItems = produtosACotar;

  const fornecedoresComItens = useMemo(() => {
    const base = fornecedoresBasicos;
    if (selectedFornecedorId && !base.some((item) => item.id === selectedFornecedorId)) {
      const selected = fornecedoresLookup.find((item) => item.id === selectedFornecedorId);
      if (selected) return [selected, ...base];
    }
    return base;
  }, [fornecedoresBasicos, fornecedoresLookup, selectedFornecedorId]);

  const fornecedoresExibicao = useMemo(() => (
    fornecedoresComItens.map((item) => fornecedorMap.get(item.id) ?? item)
  ), [fornecedorMap, fornecedoresComItens]);

  const filteredFornecedores = useMemo(() => {
    const termo = fornecedorSearch.trim().toLowerCase();
    if (!termo) return fornecedoresExibicao;
    return fornecedoresExibicao.filter((item) => resolveFornecedorNome(item).toLowerCase().includes(termo));
  }, [fornecedorSearch, fornecedoresExibicao]);

  const listColumns = useMemo(() => [
    createTableColumn<ProdutoCompraItem>({
      columnId: 'item',
      compare: (a, b) => (a.referencia || '').localeCompare(b.referencia || ''),
      renderHeaderCell: () => 'Item',
      renderCell: (item) => (
        <div>
          <Text weight="semibold" block>{item.referencia || '-'}</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>
            {item.descricao || '-'}
          </Text>
        </div>
      ),
    }),
    createTableColumn<ProdutoCompraItem>({
      columnId: 'fornecedor',
      compare: (a, b) => (a.fornecedorNome || '').localeCompare(b.fornecedorNome || ''),
      renderHeaderCell: () => 'Fornecedor',
      renderCell: (item) => item.fornecedorNome || '-',
    }),
    createTableColumn<ProdutoCompraItem>({
      columnId: 'quantidade',
      compare: (a, b) => (a.quantidade || 0) - (b.quantidade || 0),
      renderHeaderCell: () => 'Qtd',
      renderCell: (item) => item.quantidade ?? 0,
    }),
    createTableColumn<ProdutoCompraItem>({
      columnId: 'entrega',
      compare: (a, b) => (a.entrega || '').localeCompare(b.entrega || ''),
      renderHeaderCell: () => 'Entrega Cliente',
      renderCell: (item) => `${item.entregaFmt ?? formatDate(item.entrega)} ${item.cliente ? `• ${item.cliente}` : ''}`,
    }),
    createTableColumn<ProdutoCompraItem>({
      columnId: 'pedirAte',
      compare: (a, b) => (a.dataLimite || '').localeCompare(b.dataLimite || ''),
      renderHeaderCell: () => 'Pedir até',
      renderCell: (item) => item.dataLimiteFmt ?? formatDate(item.dataLimite),
    }),
    createTableColumn<ProdutoCompraItem>({
      columnId: 'prazo',
      compare: (a, b) => (a.faixaPrazo || 0) - (b.faixaPrazo || 0),
      renderHeaderCell: () => 'Prazo',
      renderCell: (item) => (
        <Badge color={getFaixaColor(item.faixaPrazo)}>
          {getFaixaLabel(item.faixaPrazo)}
        </Badge>
      ),
    }),
    createTableColumn<ProdutoCompraItem>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <Badge color={hasCotacao(item) ? 'warning' : 'danger'}>
          {hasCotacao(item) ? 'Cotado' : 'A cotar'}
        </Badge>
      ),
    }),
  ], []);

  const kanbanColumns = useMemo(() => ([
    { key: 'acotar', label: 'A Cotar', items: produtosACotar, type: 'produtos' as const },
    { key: 'cotado', label: 'Cotado', items: cotacoesAgrupadas, type: 'cotacoes' as const },
    { key: 'pedido', label: 'Pedido', items: cotacoesPedidosAgrupadas, type: 'cotacoes' as const },
  ]), [produtosACotar, cotacoesAgrupadas, cotacoesPedidosAgrupadas]);

  const handleGroupSelection = useCallback((groupItems: ProdutoCompraItem[], selectedInGroup: ProdutoCompraItem[]) => {
    const groupIds = new Set(groupItems.map((item) => item.id));
    setSelectedProdutos((prev) => {
      const preserved = prev.filter((item) => !groupIds.has(item.id));
      return [...preserved, ...selectedInGroup];
    });
  }, []);

  const handleCopyResumo = useCallback(() => {
    if (!selectedFornecedorId) {
      showError('Selecione um fornecedor');
      return;
    }
    const fornecedor = fornecedorMap.get(selectedFornecedorId);
    const itens = selectedProdutos.filter((item) => item.fornecedorId === selectedFornecedorId);
    if (itens.length === 0) {
      showError('Selecione itens do fornecedor');
      return;
    }

    const lines = itens
      .reduce((acc, item) => {
        const key = item.referencia || item.descricao || item.id;
        acc.set(key, (acc.get(key) ?? 0) + (item.quantidade ?? 0));
        return acc;
      }, new Map<string, number>());

    const body = Array.from(lines.entries())
      .map(([label, qtd]) => `${qtd}x ${label}`)
      .join('\n');

    const resumo = [
      `Fornecedor: ${resolveFornecedorNome(fornecedor)}`,
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      '',
      body,
      '',
      '---',
      `Total: ${itens.length} itens`,
      `Valor estimado: ${formatCurrency(itens.reduce((acc, item) => acc + (item.valorTotal ?? 0), 0))}`,
    ].join('\n');

    setCopyText(resumo);
    setCopyDialogOpen(true);
  }, [fornecedorMap, selectedFornecedorId, selectedProdutos, showError]);

  const handleExportCsv = useCallback(() => {
    if (selectedProdutos.length === 0) {
      showError('Selecione itens para exportar');
      return;
    }
    const header = 'Referência;Descrição;Qtd;Cliente;Entrega;Valor Unit.;Valor Total';
    const rows = selectedProdutos.map((item) => [
      item.referencia ?? '',
      item.descricao ?? '',
      item.quantidade ?? 0,
      item.cliente ?? '',
      item.entregaFmt ?? formatDate(item.entrega),
      item.precoUnitario ?? 0,
      item.valorTotal ?? 0,
    ].join(';'));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gestao-compras.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [selectedProdutos, showError]);

  const resolveFornecedorBindId = useCallback(async (fornecedorId: string) => {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (guidRegex.test(fornecedorId)) {
      return fornecedorId;
    }
    console.log('[GestaoCompras] fornecedor id nao GUID, resolvendo por cr22f_id', { fornecedorId });
    const lookup = await Cr22fFornecedoresFromSharepointListService.getAll({
      select: ['cr22f_fornecedoresfromsharepointlistid', 'cr22f_id'],
      filter: `statecode eq 0 and cr22f_id eq '${escapeODataString(fornecedorId)}'`,
      top: 1,
    });
    const resolvedId = (lookup.data as any)?.[0]?.cr22f_fornecedoresfromsharepointlistid as string | undefined;
    console.log('[GestaoCompras] fornecedor id resolvido', { fornecedorId, resolvedId, lookup });
    return resolvedId ?? null;
  }, []);

  const handleIniciarCotacao = useCallback(async () => {
    if (!selectedFornecedorId) {
      showError('Selecione um fornecedor');
      return;
    }
    const itens = selectedProdutos.filter((item) => item.fornecedorId === selectedFornecedorId);
    if (itens.length === 0) {
      showError('Selecione itens do fornecedor');
      return;
    }
    const itensSemCotacao = itens.filter((item) => !hasCotacao(item));
    if (itensSemCotacao.length === 0) {
      showError('Todos os itens já possuem cotação');
      return;
    }

    setProcessing(true);
    try {
      const fornecedorBindId = await resolveFornecedorBindId(selectedFornecedorId);
      if (!fornecedorBindId) {
        throw new Error('Fornecedor inválido para criar cotação.');
      }
      const cotacaoPayload = {
        'new_Fornecedor@odata.bind': `/cr22f_fornecedoresfromsharepointlists(${fornecedorBindId})`,
      };
      console.log('[GestaoCompras] criando cotacao', {
        fornecedorId: selectedFornecedorId,
        fornecedorBindId,
        itensSelecionados: itensSemCotacao.length,
        cotacaoPayload,
      });
      const novaCotacao = await NewCotacaoService.create(cotacaoPayload);
      console.log('[GestaoCompras] resultado create cotacao', novaCotacao);
      if (!novaCotacao.success) {
        console.error('[GestaoCompras] create cotacao falhou', {
          error: novaCotacao.error,
          cotacaoPayload,
        });
        throw novaCotacao.error ?? new Error('Falha ao criar cotação.');
      }
      let cotacaoId = (novaCotacao.data as any)?.new_cotacaoid || (novaCotacao as any).id;
      if (!cotacaoId) {
        console.log('[GestaoCompras] create sem id, buscando cotacao recente', {
          fornecedorId: selectedFornecedorId,
        });
        const lookupResult = await NewCotacaoService.getAll({
          filter: `statecode eq 0 and _new_fornecedor_value eq '${escapeODataString(selectedFornecedorId)}'`,
          select: ['new_cotacaoid'],
          orderBy: ['createdon desc'],
          top: 1,
        });
        console.log('[GestaoCompras] resultado lookup cotacao', lookupResult);
        cotacaoId = (lookupResult.data as any)?.[0]?.new_cotacaoid;
      }
      if (!cotacaoId) {
        throw new Error('Cotação não retornou ID.');
      }

      await Promise.all(
        itensSemCotacao.map((item) =>
          NewProdutoServicoService.update(
            item.id,
            { 'new_Cotacao@odata.bind': `/new_cotacaos(${cotacaoId})` } as unknown as Record<string, unknown>
          )
        )
      );

      const valorTotal = itensSemCotacao.reduce((acc, item) => acc + (item.valorTotal ?? 0), 0);
      await NewCotacaoService.update(cotacaoId, { new_valortotal: valorTotal });

      showSuccess('Cotação criada', `Itens vinculados: ${itensSemCotacao.length}`);
      setSelectedProdutos([]);
      await loadProdutosCache();
      if (selectedTab === 'kanban') {
        await Promise.all([loadCotadosFromProdutoServico(), loadPedidosFromProdutoServico()]);
      }

      window.open(
        `https://unium.crm2.dynamics.com/main.aspx?appid=${CRM_APP_ID}&forceUCI=1&pagetype=entityrecord&etn=new_cotacao&id=${cotacaoId}`,
        '_blank'
      );
    } catch (error) {
      console.error('[GestaoCompras] erro ao criar cotação', error);
      showError('Erro ao criar cotação', error instanceof Error ? error.message : undefined);
    } finally {
      setProcessing(false);
    }
  }, [
    loadCotadosFromProdutoServico,
    loadPedidosFromProdutoServico,
    loadProdutosCache,
    resolveFornecedorBindId,
    selectedFornecedorId,
    selectedProdutos,
    selectedTab,
    showError,
    showSuccess,
  ]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      showSuccess('Resumo copiado');
      setCopyDialogOpen(false);
    } catch (error) {
      showError('Erro ao copiar', error instanceof Error ? error.message : undefined);
    }
  }, [copyText, showError, showSuccess]);

  const pageContent = (
    <div className="flex flex-col h-full">
      <Toaster toasterId={toasterId} />
      <PageHeader
        title="Gestão de Compras"
        subtitle="Urgências, cotações e planejamento de pedidos"
        tabs={[
          { value: 'lista', label: 'Lista' },
          { value: 'timeline', label: 'Timeline' },
          { value: 'kanban', label: 'Kanban' },
        ]}
        selectedTab={selectedTab}
        onTabSelect={setSelectedTab}
      />

      <PageContainer>
        <div className="flex items-center justify-between gap-4 mb-4">
          <FilterBar
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={setSearchValue}
            filters={[
              { id: 'prazo', label: 'Prazo', options: prazoOptions, selectedKey: prazoFilter, onChange: setPrazoFilter },
              { id: 'fornecedor', label: 'Fornecedor', options: fornecedorOptions, selectedKey: fornecedorFilter, onChange: setFornecedorFilter },
              { id: 'cliente', label: 'Cliente', options: clienteOptions, selectedKey: clienteFilter, onChange: setClienteFilter },
              { id: 'fabricante', label: 'Fabricante', options: fabricanteOptions, selectedKey: fabricanteFilter, onChange: setFabricanteFilter },
            ]}
            activeFilters={activeFilters}
            onClearFilter={handleClearFilter}
            onClearAll={handleClearAll}
          />
          <Button appearance="secondary" icon={<ArrowSync24Regular />} onClick={refreshAll}>
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-5">
          {resumoPorFaixa.map((faixa) => (
            <Card
              key={faixa.value}
              onClick={() => setPrazoFilter(String(faixa.value))}
              style={{ cursor: 'pointer', border: `1px solid ${tokens.colorNeutralStroke2}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <Text weight="semibold">{faixa.label}</Text>
                <Badge color={faixa.color}>{faixa.count}</Badge>
              </div>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {formatCurrency(faixa.total)}
              </Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {faixa.fornecedores} fornecedor{faixa.fornecedores === 1 ? '' : 'es'}
              </Text>
            </Card>
          ))}
        </div>

        {selectedTab === 'lista' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <Card style={{ padding: '12px' }}>
                <Text weight="semibold" block>Fornecedores</Text>
                <Input
                  value={fornecedorSearch}
                  onChange={(_, data) => setFornecedorSearch(data.value)}
                  placeholder="Filtrar fornecedor..."
                  style={{ marginTop: 8, marginBottom: 12 }}
                />
                {loadingProdutos ? (
                  <LoadingState label="Carregando produtos..." />
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredFornecedores.map((fornecedor) => {
                      const resumo = fornecedorResumo.get(fornecedor.id);
                      const ativo = selectedFornecedorId === fornecedor.id;
                      return (
                        <Card
                          key={fornecedor.id}
                          onClick={() => {
                            setSelectedFornecedorId(fornecedor.id);
                            setFornecedorFilter(fornecedor.id);
                          }}
                          style={{
                            cursor: 'pointer',
                            border: ativo ? `1px solid ${tokens.colorPaletteBlueBorder2}` : `1px solid ${tokens.colorNeutralStroke2}`,
                            backgroundColor: ativo ? tokens.colorNeutralBackground1Selected : tokens.colorNeutralBackground1,
                          }}
                        >
                          <Text weight="semibold" block>{resolveFornecedorNome(fornecedor)}</Text>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            {formatCurrency(resumo?.total ?? 0)} • {resumo?.count ?? 0} itens
                          </Text>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            <div className="lg:col-span-8">
              {loadingProdutos ? (
                <LoadingState label="Carregando produtos..." />
              ) : (
                <div className="flex flex-col gap-4">
                  {loadingPrecos && (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Calculando preços...
                    </Text>
                  )}
                  <DataGrid
                    items={listItems}
                    columns={listColumns}
                    selectionMode="multiselect"
                    selectedItems={selectedProdutos}
                    onSelectionChange={(selectedInList) => handleGroupSelection(listItems, selectedInList)}
                    getRowId={(item) => item.id}
                    emptyState={emptyState}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'timeline' && (
          <ProcurementTimeline
            items={produtosCache}
            initialDateRange={{
              start: new Date(2026, 0, 1),
              end: new Date(2026, 11, 31),
            }}
          />
        )}

        {selectedTab === 'kanban' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {kanbanColumns.map((col) => {
              const items = col.items;
              const isPedido = col.key === 'pedido';
              const isCotado = col.key === 'cotado';
              const isAcotar = col.key === 'acotar';
              const isCotacaoColumn = col.type === 'cotacoes';
              const isLoading = isAcotar ? loadingProdutos : isCotado ? loadingCotados : loadingPedidos;
              return (
                <Card key={col.key} style={{ padding: '12px' }}>
                  <div className="flex items-center justify-between mb-2">
                    <Text weight="semibold">{col.label}</Text>
                    <Badge appearance="filled">{items.length}</Badge>
                  </div>
                  {isPedido && (
                    <div className="flex flex-col gap-2 mb-2">
                      <Dropdown
                        placeholder="Últimos 30 dias"
                        value={pedidoRangeOptions.find((opt) => opt.key === pedidoRangeDays)?.text ?? ''}
                        onOptionSelect={(_, data) => setPedidoRangeDays(String(data.optionValue))}
                      >
                        {pedidoRangeOptions.map((option) => (
                          <Option key={option.key} value={option.key}>
                            {option.text}
                          </Option>
                        ))}
                      </Dropdown>
                      <Input
                        value={pedidoSearchInput}
                        onChange={(_, data) => setPedidoSearchInput(data.value)}
                        placeholder="Buscar pedidos (todos os tempos)"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            setPedidoSearchValue(pedidoSearchInput.trim());
                          }
                        }}
                      />
                      <Button
                        appearance="secondary"
                        onClick={() => setPedidoSearchValue(pedidoSearchInput.trim())}
                        disabled={loadingPedidos || pedidoLoadingMore}
                      >
                        Buscar
                      </Button>
                      {pedidoSearchValue && (
                        <Button
                          appearance="subtle"
                          onClick={() => {
                            setPedidoSearchInput('');
                            setPedidoSearchValue('');
                          }}
                          disabled={loadingPedidos || pedidoLoadingMore}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {isLoading && items.length === 0 && (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Carregando itens...
                      </Text>
                    )}
                    {!isLoading && isCotacaoColumn && (col.items as CotacaoKanbanGroup[]).map((grupo) => {
                      const isExpanded = expandedCotacaoIds[grupo.cotacaoId] ?? false;
                      const MAX_PRODUTOS_PREVIEW = 8;
                      const produtosParaMostrar = isExpanded ? grupo.produtos.slice(0, MAX_PRODUTOS_PREVIEW) : [];
                      const temMais = grupo.produtos.length > MAX_PRODUTOS_PREVIEW;

                      return (
                        <Card key={grupo.cotacaoId} style={{ padding: '12px' }}>
                          <div className="flex items-start justify-between mb-2">
                            <div style={{ flex: 1 }}>
                              <Text weight="semibold" block>
                                {grupo.cotacao?.nome ? `${grupo.cotacao.nome} • ${grupo.cotacao.fornecedor || 'Fornecedor'}` : (grupo.cotacao?.fornecedor || 'Fornecedor')}
                              </Text>
                              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                {formatCurrency(grupo.cotacao?.valorTotal ?? grupo.totalValorProdutos)} • {grupo.totalProdutos} {grupo.totalProdutos === 1 ? 'item' : 'itens'}
                              </Text>
                              {grupo.cotacao?.observacoes && (
                                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>
                                  {grupo.cotacao.observacoes.length > 60 
                                    ? `${grupo.cotacao.observacoes.slice(0, 60)}...` 
                                    : grupo.cotacao.observacoes}
                                </Text>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Info24Regular />}
                                onClick={() => {
                                  setCotacaoModalId(grupo.cotacaoId);
                                  setCotacaoModalOpen(true);
                                }}
                                title="Ver detalhes"
                              />
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={isExpanded ? <ChevronUp16Regular /> : <ChevronDown16Regular />}
                                onClick={() => {
                                  setExpandedCotacaoIds((prev) => ({
                                    ...prev,
                                    [grupo.cotacaoId]: !isExpanded,
                                  }));
                                }}
                              />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="flex flex-col gap-1 mt-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                              {produtosParaMostrar.map((produto) => (
                                <div
                                  key={produto.id}
                                  style={{
                                    padding: '6px',
                                    border: `1px solid ${tokens.colorNeutralStroke2}`,
                                    borderRadius: tokens.borderRadiusMedium,
                                  }}
                                >
                                  <Text size={200} weight="semibold" block>
                                    {produto.referencia || produto.descricao || 'Item'}
                                  </Text>
                                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                                    {produto.quantidade ?? 0} un • {formatCurrency(produto.valorTotal ?? 0)}
                                  </Text>
                                </div>
                              ))}
                              {temMais && (
                                <Button
                                  appearance="subtle"
                                  size="small"
                                  style={{ minHeight: '28px', padding: '6px 10px' }}
                                  onClick={() => {
                                    setCotacaoModalId(grupo.cotacaoId);
                                    setCotacaoModalOpen(true);
                                  }}
                                >
                                  Ver todos ({grupo.produtos.length})
                                </Button>
                              )}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                    {!isLoading && !isCotado && (items as ProdutoCompraItem[]).map((item) => (
                      <Card key={item.id} style={{ padding: '10px' }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <Text weight="semibold" block>{item.referencia || item.descricao || 'Item'}</Text>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                              {item.fornecedorNome || '-'} • {item.quantidade ?? 0} un
                            </Text>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                              {item.cliente || '-'} • {item.dataLimiteFmt ?? formatDate(item.dataLimite)}
                            </Text>
                          </div>
                          <Checkbox
                            checked={selectedProdutoIds.has(item.id)}
                            onChange={() => {
                              setSelectedProdutos((prev) => {
                                if (prev.some((selected) => selected.id === item.id)) {
                                  return prev.filter((selected) => selected.id !== item.id);
                                }
                                return [...prev, item];
                              });
                            }}
                          />
                        </div>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          {formatCurrency(item.valorTotal ?? 0)}
                        </Text>
                      </Card>
                    ))}
                    {!isLoading && items.length === 0 && (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Nenhum item nesta coluna.
                      </Text>
                    )}
                    {isPedido && pedidoHasMore && (
                      <Button
                        appearance="secondary"
                        onClick={() => void loadPedidosFromProdutoServico({ append: true })}
                        disabled={pedidoLoadingMore || loadingPedidos}
                      >
                        {pedidoLoadingMore ? 'Carregando...' : 'Carregar mais'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

      </PageContainer>

      <div style={{ borderTop: `1px solid ${tokens.colorNeutralStroke2}` }}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {selectedProdutos.length} item{selectedProdutos.length === 1 ? '' : 's'} selecionado{selectedProdutos.length === 1 ? '' : 's'} • {formatCurrency(totalSelecionado)}
          </Text>
          <div className="flex items-center gap-2">
            <Button appearance="secondary" icon={<Copy24Regular />} onClick={handleCopyResumo} disabled={processing}>
              Copiar resumo
            </Button>
            <Button appearance="secondary" icon={<Share24Regular />} onClick={handleExportCsv} disabled={processing}>
              Exportar CSV
            </Button>
            <Button appearance="primary" icon={<CheckmarkCircle24Regular />} onClick={handleIniciarCotacao} disabled={processing}>
              Iniciar cotação
            </Button>
          </div>
        </div>
      </div>

      <Dialog 
        open={cotacaoModalOpen} 
        onOpenChange={(_, data) => {
          setCotacaoModalOpen(Boolean(data.open));
          if (!data.open) setCotacaoModalId(null);
        }}
      >
        <DialogSurface style={{ maxWidth: '600px' }}>
          <DialogBody>
            <DialogTitle>Detalhes da Cotação</DialogTitle>
            <DialogContent>
              {cotacaoModalId && (() => {
                const grupo = cotacoesKanbanMap.get(cotacaoModalId);
                if (!grupo) return <Text>Cotação não encontrada</Text>;
                const isCotacaoBloqueada = grupo.cotacao?.aprovado === true || grupo.cotacao?.statecode === 1;

                return (
                  <div className="flex flex-col gap-3">
                    {grupo.cotacao?.nome && (
                      <div>
                        <Text weight="semibold" block>Nome da Cotação</Text>
                        <Text>{grupo.cotacao.nome}</Text>
                      </div>
                    )}
                    <div>
                      <Text weight="semibold" block>Fornecedor</Text>
                      <Text>{grupo.cotacao?.fornecedor || '-'}</Text>
                    </div>
                    <div>
                      <Text weight="semibold" block>Valor Total</Text>
                      <Text>{formatCurrency(grupo.cotacao?.valorTotal ?? grupo.totalValorProdutos)}</Text>
                    </div>
                    {grupo.cotacao?.dataCriacao && (
                      <div>
                        <Text weight="semibold" block>Data de Criação</Text>
                        <Text>{formatDate(grupo.cotacao.dataCriacao)}</Text>
                      </div>
                    )}
                    <div>
                      <Text weight="semibold" block>Opção de Entrega</Text>
                      {isCotacaoBloqueada ? (
                        <Text>{formatOpcaoEntrega(grupo.cotacao?.opcaoEntrega ?? null)}</Text>
                      ) : (
                        <Dropdown
                          placeholder="Selecione..."
                          value={OPCAO_ENTREGA_OPTIONS.find((opt) => opt.value === cotacaoDraft.opcaoEntrega)?.label ?? ''}
                          onOptionSelect={(_, data) => {
                            setCotacaoDraft((prev) => ({ ...prev, opcaoEntrega: Number(data.optionValue) }));
                          }}
                        >
                          {OPCAO_ENTREGA_OPTIONS.map((option) => (
                            <Option key={option.value} value={String(option.value)}>
                              {option.label}
                            </Option>
                          ))}
                        </Dropdown>
                      )}
                    </div>
                    {grupo.cotacao?.enderecoEntrega && (
                      <div>
                        <Text weight="semibold" block>Endereço de Entrega</Text>
                        <Text>{grupo.cotacao.enderecoEntrega}</Text>
                      </div>
                    )}
                    <div>
                      <Text weight="semibold" block>Prazo de Envio</Text>
                      {isCotacaoBloqueada ? (
                        <Text>{formatPrazoEnvio(grupo.cotacao?.prazodeEnvio ?? null)}</Text>
                      ) : (
                        <Dropdown
                          placeholder="Selecione..."
                          value={PRAZO_ENVIO_OPTIONS.find((opt) => opt.value === cotacaoDraft.prazoEnvio)?.label ?? ''}
                          onOptionSelect={(_, data) => {
                            setCotacaoDraft((prev) => ({ ...prev, prazoEnvio: Number(data.optionValue) }));
                          }}
                        >
                          {PRAZO_ENVIO_OPTIONS.map((option) => (
                            <Option key={option.value} value={String(option.value)}>
                              {option.label}
                            </Option>
                          ))}
                        </Dropdown>
                      )}
                    </div>
                    {grupo.cotacao?.observacoes && (
                      <div>
                        <Text weight="semibold" block>Observações</Text>
                        <Text>{grupo.cotacao.observacoes}</Text>
                      </div>
                    )}
                    {grupo.cotacao?.dataAprovacao && (
                      <div>
                        <Text weight="semibold" block>Data de Aprovação</Text>
                        <Text>{formatDate(grupo.cotacao.dataAprovacao)}</Text>
                      </div>
                    )}
                    <div>
                      <Text weight="semibold" block>Produtos ({grupo.produtos.length})</Text>
                      <div 
                        className="flex flex-col gap-2 mt-2" 
                        style={{ 
                          maxHeight: '300px', 
                          overflowY: 'auto',
                          padding: '8px',
                          border: `1px solid ${tokens.colorNeutralStroke2}`,
                          borderRadius: tokens.borderRadiusMedium,
                        }}
                      >
                        {grupo.produtos.map((produto) => (
                          <div
                            key={produto.id}
                            style={{
                              padding: '8px',
                              borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                            }}
                          >
                            <Text weight="semibold" block>{produto.referencia || produto.descricao || 'Item'}</Text>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                              Qtd: {produto.quantidade ?? 0} • {formatCurrency(produto.valorTotal ?? 0)}
                            </Text>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                              Cliente: {produto.cliente || '-'} • Entrega: {produto.entregaFmt ?? formatDate(produto.entrega)}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                disabled={cotacaoActionDisabled || cotacaoActionLoading}
                onClick={async () => {
                  if (!cotacaoModalId) return;
                  const grupo = cotacoesKanbanMap.get(cotacaoModalId);
                  if (!grupo) {
                    showError('Falha ao obter cotação');
                    return;
                  }
                  setCotacaoActionLoading(true);
                  try {
                    const result = await NewCotacaoService.update(cotacaoModalId, {
                      statecode: 1,
                      statuscode: 2,
                    } as any);
                    if (!result.success) {
                      throw result.error ?? new Error('Falha ao cancelar cotação.');
                    }
                    await Promise.all(
                      grupo.produtos.map((produto) =>
                        NewProdutoServicoService.update(
                          produto.id,
                          { 'new_Cotacao@odata.bind': null } as unknown as Record<string, unknown>
                        )
                      )
                    );
                    showSuccess('Cotação cancelada');
                    setCotacaoModalOpen(false);
                    await Promise.all([loadCotadosFromProdutoServico(), loadPedidosFromProdutoServico()]);
                  } catch (error) {
                    console.error('[GestaoCompras] erro ao cancelar cotação', error);
                    showError('Erro ao cancelar cotação', error instanceof Error ? error.message : undefined);
                  } finally {
                    setCotacaoActionLoading(false);
                  }
                }}
              >
                Cancelar cotação
              </Button>
              <Button
                appearance="primary"
                disabled={cotacaoActionDisabled || cotacaoActionLoading}
                onClick={async () => {
                  if (!cotacaoModalId) return;
                  const grupo = cotacoesKanbanMap.get(cotacaoModalId);
                  if (!grupo) {
                    showError('Falha ao obter cotação');
                    return;
                  }
                  const missing: string[] = [];
                  if (!cotacaoDraft.prazoEnvio) missing.push('Prazo de Envio');
                  if (!cotacaoDraft.opcaoEntrega) missing.push('Opção de Entrega');
                  if (missing.length > 0) {
                    showError(`Verifique se os campos obrigatórios estão preenchidos: ${missing.join(', ')}`);
                    return;
                  }
                  setCotacaoActionLoading(true);
                  try {
                    const result = await NewCotacaoService.update(cotacaoModalId, {
                      new_aprovarcotacao: true,
                      new_datadeaprovacao: new Date().toISOString(),
                      new_opcaodeentrega: cotacaoDraft.opcaoEntrega,
                      new_prazodeenvio: cotacaoDraft.prazoEnvio,
                    } as any);
                    if (!result.success) {
                      throw result.error ?? new Error('Falha ao aprovar cotação.');
                    }
                    showSuccess('Cotação aprovada');
                    setCotacaoModalOpen(false);
                    await Promise.all([loadCotadosFromProdutoServico(), loadPedidosFromProdutoServico()]);
                  } catch (error) {
                    console.error('[GestaoCompras] erro ao aprovar cotação', error);
                    showError('Erro ao aprovar cotação', error instanceof Error ? error.message : undefined);
                  } finally {
                    setCotacaoActionLoading(false);
                  }
                }}
              >
                Aprovar cotação
              </Button>
              <Button 
                appearance="secondary" 
                icon={<Open24Regular />}
                onClick={() => {
                  if (cotacaoModalId) {
                    window.open(
                      `https://unium.crm2.dynamics.com/main.aspx?appid=${CRM_APP_ID}&forceUCI=1&pagetype=entityrecord&etn=new_cotacao&id=${cotacaoModalId}`,
                      '_blank'
                    );
                  }
                }}
              >
                Abrir no CRM
              </Button>
              <Button appearance="primary" onClick={() => setCotacaoModalOpen(false)}>
                Fechar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={copyDialogOpen} onOpenChange={(_, data) => setCopyDialogOpen(Boolean(data.open))}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Resumo para copiar</DialogTitle>
            <DialogContent>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{copyText}</pre>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setCopyDialogOpen(false)}>
                Fechar
              </Button>
              <Button appearance="primary" onClick={handleCopyToClipboard}>
                Copiar texto
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );

  return profilerEnabled ? (
    <Profiler id="GestaoComprasPage" onRender={handleProfileRender}>
      {pageContent}
    </Profiler>
  ) : pageContent;
}
