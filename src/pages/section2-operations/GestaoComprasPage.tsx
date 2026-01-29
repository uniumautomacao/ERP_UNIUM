import { Profiler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Input,
  Text,
  Toaster,
  Toast,
  ToastBody,
  ToastTitle,
  tokens,
  useId,
  useToastController,
} from '@fluentui/react-components';
import { ArrowSync24Regular, CheckmarkCircle24Regular, Copy24Regular, DocumentBulletList24Regular, Share24Regular } from '@fluentui/react-icons';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { FilterBar } from '../../components/shared/FilterBar';
import { DataGrid, createTableColumn } from '../../components/shared/DataGrid';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingState } from '../../components/shared/LoadingState';
import { buildProdutoServicoSearchFilter, chunkIds, escapeODataString } from '../../features/remessas/utils';
import {
  Cr22fFornecedoresFromSharepointListService,
  NewCacheComprasProdutosPendentesService,
  NewPrecodeProdutoService,
  NewProdutoServicoService,
} from '../../generated';
import { NewCotacaoService } from '../../services/NewCotacaoService';

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
  const [fornecedoresDetalhesLoading, setFornecedoresDetalhesLoading] = useState(false);
  const [produtos, setProdutos] = useState<ProdutoCompraItem[]>([]);
  const [fornecedoresDetalhados, setFornecedoresDetalhados] = useState<FornecedorItem[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<ProdutoCompraItem[]>([]);
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<string | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyText, setCopyText] = useState('');
  const [processing, setProcessing] = useState(false);
  const loadRequestId = useRef(0);
  const precosCacheRef = useRef(new Map<string, number>());
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
          NewPrecodeProdutoService.getAll({
            select: ['new_precodecompra', '_new_modelodeproduto_value'],
            filter: `statecode eq 0 and (${chunk.map((id) => `_new_modelodeproduto_value eq '${id}'`).join(' or ')})`,
          })
        ))
      );
      timeEnd('compras.precos', { totalModelos: modeloIds.length, faltantes: missingIds.length, chunks: chunks.length });

      const stillMissing = new Set(missingIds);
      results.flatMap((res) => res.data ?? []).forEach((item: any) => {
        const modeloId = item._new_modelodeproduto_value;
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

  const loadProdutos = useCallback(async () => {
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
      setProdutos(items);
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
        setProdutos((prev) => prev.map((item) => {
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
      setProdutos([]);
    } finally {
      if (requestId === loadRequestId.current) {
        setLoadingProdutos(false);
        setLoadingPrecos(false);
      }
    }
  }, [clienteFilter, fornecedorFilter, fabricanteFilter, isListTab, loadPrecos, prazoFilter, searchValue, selectedTab, showError, timeEnd, timeStart, timingEnabled]);

  const clearPrecoCache = useCallback(() => {
    precosCacheRef.current = new Map();
  }, []);

  useEffect(() => {
    void loadProdutos();
  }, [loadProdutos]);

  const derivedData = useMemo(() => {
    const produtosByFaixa = new Map<number, ProdutoCompraItem[]>();
    const produtosByFornecedor = new Map<string, ProdutoCompraItem[]>();
    const fornecedorResumo = new Map<string, { count: number; total: number; faixas: Map<number, number> }>();
    const resumoPorFaixaMap = new Map<number, { count: number; total: number; fornecedores: Set<string> }>();
    const produtosACotar: ProdutoCompraItem[] = [];
    const produtosCotados: ProdutoCompraItem[] = [];

    produtos.forEach((item) => {
      if (hasCotacao(item)) {
        produtosCotados.push(item);
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
        if (!produtosByFornecedor.has(item.fornecedorId)) produtosByFornecedor.set(item.fornecedorId, []);
        produtosByFornecedor.get(item.fornecedorId)!.push(item);

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

    const resumoPorFaixa = FAIXAS_PRAZO.map((faixa) => {
      const resumo = resumoPorFaixaMap.get(faixa.value);
      return {
        ...faixa,
        count: resumo?.count ?? 0,
        total: resumo?.total ?? 0,
        fornecedores: resumo?.fornecedores.size ?? 0,
      };
    });

    return { produtosByFaixa, produtosByFornecedor, fornecedorResumo, resumoPorFaixa, produtosACotar, produtosCotados };
  }, [produtos]);

  const fornecedoresBasicos = useMemo(() => {
    const map = new Map<string, FornecedorItem>();
    produtos.forEach((item) => {
      if (!item.fornecedorId) return;
      if (!map.has(item.fornecedorId)) {
        map.set(item.fornecedorId, {
          id: item.fornecedorId,
          nome: item.fornecedorNome ?? null,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => resolveFornecedorNome(a).localeCompare(resolveFornecedorNome(b)));
  }, [produtos]);

  const fornecedorIds = useMemo(() => (
    fornecedoresBasicos.map((item) => item.id)
  ), [fornecedoresBasicos]);

  useEffect(() => {
    const shouldLoad = selectedTab === 'fornecedor' || selectedTab === 'lista';
    if (!shouldLoad) return;
    if (fornecedoresDetalhados.length > 0 || fornecedoresDetalhesLoading) return;
    void loadFornecedores(fornecedorIds);
  }, [fornecedoresDetalhados.length, fornecedoresDetalhesLoading, fornecedorIds, loadFornecedores, selectedTab]);

  const refreshAll = useCallback(async () => {
    clearPrecoCache();
    if (selectedTab === 'fornecedor') {
      await Promise.all([loadFornecedores(fornecedorIds), loadProdutos()]);
      return;
    }
    await loadProdutos();
  }, [clearPrecoCache, fornecedorIds, loadFornecedores, loadProdutos, selectedTab]);

  const fornecedoresLookup = useMemo(() => {
    const merged = new Map<string, FornecedorItem>();
    fornecedoresBasicos.forEach((item) => merged.set(item.id, item));
    fornecedoresDetalhados.forEach((item) => merged.set(item.id, item));
    return Array.from(merged.values());
  }, [fornecedoresBasicos, fornecedoresDetalhados]);

  const fornecedorMap = useMemo(() => {
    return new Map(fornecedoresLookup.map((item) => [item.id, item]));
  }, [fornecedoresLookup]);

  const { fornecedorResumo, resumoPorFaixa, produtosByFornecedor, produtosACotar, produtosCotados } = derivedData;

  const fornecedorOptions = useMemo(() => {
    const options = fornecedoresBasicos.map((item) => ({
      key: item.id,
      text: resolveFornecedorNome(item),
    }));
    return [{ key: 'all', text: 'Todos' }, ...options];
  }, [fornecedoresBasicos]);

  const clienteOptions = useMemo(() => {
    const clientes = new Set<string>();
    produtos.forEach((item) => {
      if (item.cliente) clientes.add(item.cliente);
    });
    const options = Array.from(clientes).sort().map((cliente) => ({ key: cliente, text: cliente }));
    return [{ key: 'all', text: 'Todos' }, ...options];
  }, [produtos]);

  const fabricanteOptions = useMemo(() => {
    const fabricantes = new Set<string>();
    produtos.forEach((item) => {
      if (item.fabricante) fabricantes.add(item.fabricante);
    });
    const options = Array.from(fabricantes).sort().map((fabricante) => ({ key: fabricante, text: fabricante }));
    return [{ key: 'all', text: 'Todos' }, ...options];
  }, [produtos]);

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
    if (!hasActiveFilters && produtos.length === 0) {
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
  }, [hasActiveFilters, produtos.length]);

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

  const listItems = produtos;

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
    { key: 'acotar', label: 'A Cotar', items: produtosACotar },
    { key: 'cotado', label: 'Cotado', items: produtosCotados },
    { key: 'pedido', label: 'Pedido', items: [] as ProdutoCompraItem[] },
  ]), [produtosACotar, produtosCotados]);

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
      const novaCotacao = await NewCotacaoService.create({
        'new_Fornecedor@odata.bind': `/cr22f_fornecedoresfromsharepointlists(${selectedFornecedorId})`,
      });
      const cotacaoId = (novaCotacao.data as any)?.new_cotacaoid;
      if (!cotacaoId) {
        throw new Error('Cotação não retornou ID.');
      }

      await Promise.all(
        itensSemCotacao.map((item) =>
          NewProdutoServicoService.update(item.id, {
            'new_Cotacao@odata.bind': `/new_cotacaos(${cotacaoId})`,
          })
        )
      );

      const valorTotal = itensSemCotacao.reduce((acc, item) => acc + (item.valorTotal ?? 0), 0);
      await NewCotacaoService.update(cotacaoId, { new_valortotal: valorTotal });

      showSuccess('Cotação criada', `Itens vinculados: ${itensSemCotacao.length}`);
      setSelectedProdutos([]);
      await loadProdutos();

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
  }, [loadProdutos, selectedFornecedorId, selectedProdutos, showError, showSuccess]);

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
          { value: 'fornecedor', label: 'Por fornecedor' },
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
          <Card style={{ padding: '16px' }}>
            <Text weight="semibold" block>Timeline</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              MVP: a timeline será exibida aqui com agrupamento por cliente/projeto.
            </Text>
          </Card>
        )}

        {selectedTab === 'kanban' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {kanbanColumns.map((col) => {
              const items = col.items;
              return (
                <Card key={col.key} style={{ padding: '12px' }}>
                  <div className="flex items-center justify-between mb-2">
                    <Text weight="semibold">{col.label}</Text>
                    <Badge appearance="filled">{items.length}</Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
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
                    {items.length === 0 && (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Nenhum item nesta coluna.
                      </Text>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {selectedTab === 'fornecedor' && (
          <div className="flex flex-col gap-4">
            {fornecedoresDetalhesLoading ? (
              <LoadingState label="Carregando fornecedores..." />
            ) : (
              fornecedoresExibicao.map((fornecedor) => {
                const resumo = fornecedorResumo.get(fornecedor.id);
                const itens = produtosByFornecedor.get(fornecedor.id) || [];
                if (itens.length === 0) return null;
                return (
                  <Card key={fornecedor.id} style={{ padding: '16px' }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Text weight="semibold" block>{resolveFornecedorNome(fornecedor)}</Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          Lead time: {fornecedor.leadTimeTotal ?? '-'} dias • Total {formatCurrency(resumo?.total ?? 0)}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button appearance="secondary" icon={<Copy24Regular />} onClick={() => {
                          setSelectedFornecedorId(fornecedor.id);
                          handleCopyResumo();
                        }}>
                          Copiar resumo
                        </Button>
                        <Button appearance="primary" icon={<DocumentBulletList24Regular />} onClick={() => {
                          setSelectedFornecedorId(fornecedor.id);
                          void handleIniciarCotacao();
                        }}>
                          Iniciar cotação
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {itens.map((item) => (
                        <Card key={item.id} style={{ padding: '10px' }}>
                          <div className="flex items-start justify-between">
                            <div>
                              <Text weight="semibold" block>{item.referencia || item.descricao || 'Item'}</Text>
                              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                {item.cliente || '-'} • {item.entregaFmt ?? formatDate(item.entrega)}
                              </Text>
                              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                {item.quantidade ?? 0} un • {formatCurrency(item.precoUnitario ?? 0)}
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
                        </Card>
                      ))}
                    </div>
                  </Card>
                );
              })
            )}
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
