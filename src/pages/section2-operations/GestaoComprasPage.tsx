import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ArrowSync24Regular, CheckmarkCircle24Regular, ClipboardText24Regular, DocumentBulletList24Regular, Share24Regular } from '@fluentui/react-icons';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { FilterBar } from '../../components/shared/FilterBar';
import { DataGrid, createTableColumn } from '../../components/shared/DataGrid';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingState } from '../../components/shared/LoadingState';
import { buildProdutoServicoSearchFilter, chunkIds, escapeODataString } from '../../features/remessas/utils';
import {
  Cr22fFornecedoresFromSharepointListService,
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
};

type FornecedorItem = {
  id: string;
  nome?: string | null;
  razaoSocial?: string | null;
  prazoFrete?: number | null;
  leadTimeTotal?: number | null;
};

const FAIXAS_PRAZO = [
  { value: 100000001, label: 'Pedir agora', color: 'danger' as const },
  { value: 100000007, label: '7 dias', color: 'warning' as const },
  { value: 100000030, label: '30 dias', color: 'informative' as const },
  { value: 100000099, label: 'Futuro', color: 'subtle' as const },
];

const getFaixaLabel = (value?: number | null) =>
  FAIXAS_PRAZO.find((faixa) => faixa.value === value)?.label ?? 'Sem prazo';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const buildProdutosFilter = (params: {
  search: string;
  prazo?: string;
  fornecedorId?: string;
  cliente?: string;
  fabricante?: string;
}) => {
  const filters = [
    'statecode eq 0',
    '_new_ordemdeservico_value ne null',
    'new_fornecedorprincipalid ne null',
    '(new_contemcotacao eq false or _new_cotacao_value eq null)',
    '(new_situacaoreserva eq 100000006 or new_situacaoreserva eq 100000007 or new_situacaoreserva eq 100000009)',
    'new_opcaodefornecimento eq 100000000',
    '(new_eemprestimo ne true or new_eemprestimo eq null)',
    "(new_datalimiteparapedido ne null or new_nomedoclientefx eq 'Estoque Mínimo')",
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
  const [loading, setLoading] = useState(true);
  const [fornecedoresLoading, setFornecedoresLoading] = useState(true);
  const [produtos, setProdutos] = useState<ProdutoCompraItem[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorItem[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<ProdutoCompraItem[]>([]);
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<string | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyText, setCopyText] = useState('');
  const [processing, setProcessing] = useState(false);
  const loadRequestId = useRef(0);
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

  const loadFornecedores = useCallback(async () => {
    setFornecedoresLoading(true);
    try {
      const result = await Cr22fFornecedoresFromSharepointListService.getAll({
        select: [
          'cr22f_fornecedoresfromsharepointlistid',
          'cr22f_nomefantasia',
          'cr22f_title',
          'cr22f_razosocial',
          'new_prazofrete',
          'new_leadtimetotal',
        ],
        filter: 'statecode eq 0',
        orderBy: ['cr22f_nomefantasia asc'],
        top: 500,
      });
      setFornecedores((result.data || []).map((item: any) => ({
        id: item.cr22f_fornecedoresfromsharepointlistid,
        nome: item.cr22f_nomefantasia || item.cr22f_title || null,
        razaoSocial: item.cr22f_razosocial || null,
        prazoFrete: item.new_prazofrete ?? null,
        leadTimeTotal: item.new_leadtimetotal ?? null,
      })));
    } catch (error) {
      console.error('[GestaoCompras] erro ao carregar fornecedores', error);
      showError('Erro ao carregar fornecedores');
      setFornecedores([]);
    } finally {
      setFornecedoresLoading(false);
    }
  }, [showError]);

  const loadPrecos = useCallback(async (modeloIds: string[]) => {
    if (modeloIds.length === 0) return new Map<string, number>();
    const chunks = chunkIds(modeloIds, REFERENCE_CHUNK_SIZE);
    const results = await Promise.all(
      chunks.map((chunk) => (
        NewPrecodeProdutoService.getAll({
          select: ['new_precodecompra', '_new_modelodeproduto_value'],
          filter: `statecode eq 0 and (${chunk.map((id) => `_new_modelodeproduto_value eq '${id}'`).join(' or ')})`,
        })
      ))
    );
    const priceMap = new Map<string, number>();
    results.flatMap((res) => res.data ?? []).forEach((item: any) => {
      const modeloId = item._new_modelodeproduto_value;
      const preco = item.new_precodecompra;
      if (modeloId && typeof preco === 'number' && !priceMap.has(modeloId)) {
        priceMap.set(modeloId, preco);
      }
    });
    return priceMap;
  }, []);

  const loadProdutos = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setLoading(true);
    try {
      const filter = buildProdutosFilter({
        search: searchValue,
        prazo: prazoFilter,
        fornecedorId: fornecedorFilter === 'all' ? undefined : fornecedorFilter,
        cliente: clienteFilter === 'all' ? undefined : clienteFilter,
        fabricante: fabricanteFilter === 'all' ? undefined : fabricanteFilter,
      });

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
          '_new_cotacao_value',
          'new_contemcotacao',
          '_new_modelodeprodutooriginal_value',
        ],
        filter,
        orderBy: ['new_faixadeprazo asc', 'new_datalimiteparapedido asc', 'new_nomedoclientefx asc'],
        top: 500,
      });

      if (requestId !== loadRequestId.current) return;

      const items = (result.data || []).map((item: any) => ({
        id: item.new_produtoservicoid,
        referencia: item.new_referenciadoproduto ?? null,
        descricao: item.new_descricao ?? null,
        quantidade: item.new_quantidade ?? null,
        cliente: item.new_nomedoclientefx ?? null,
        entrega: item.new_previsaodeentrega ?? null,
        dataLimite: item.new_datalimiteparapedido ?? null,
        diasParaPedido: item.new_diasparapedido ?? null,
        faixaPrazo: item.new_faixadeprazo ?? null,
        fornecedorId: item.new_fornecedorprincipalid ?? null,
        fornecedorNome: item.new_nomedofornecedorprincipal ?? null,
        fabricante: item.new_nomedofabricante ?? null,
        cotacaoId: item._new_cotacao_value ?? null,
        contemCotacao: item.new_contemcotacao ?? null,
        modeloId: item._new_modelodeprodutooriginal_value ?? null,
      })) as ProdutoCompraItem[];

      const modeloIds = Array.from(new Set(items.map((item) => item.modeloId).filter(Boolean))) as string[];
      const precos = await loadPrecos(modeloIds);
      const withPrices = items.map((item) => {
        const precoUnitario = item.modeloId ? precos.get(item.modeloId) ?? 0 : 0;
        return {
          ...item,
          precoUnitario,
          valorTotal: (item.quantidade ?? 0) * precoUnitario,
        };
      });

      setProdutos(withPrices);
    } catch (error) {
      console.error('[GestaoCompras] erro ao carregar produtos', error);
      showError('Erro ao carregar produtos');
      setProdutos([]);
    } finally {
      if (requestId === loadRequestId.current) {
        setLoading(false);
      }
    }
  }, [clienteFilter, fornecedorFilter, fabricanteFilter, loadPrecos, prazoFilter, searchValue, showError]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadFornecedores(), loadProdutos()]);
  }, [loadFornecedores, loadProdutos]);

  useEffect(() => {
    void loadFornecedores();
  }, [loadFornecedores]);

  useEffect(() => {
    void loadProdutos();
  }, [loadProdutos]);

  const fornecedorMap = useMemo(() => {
    return new Map(fornecedores.map((item) => [item.id, item]));
  }, [fornecedores]);

  const fornecedorResumo = useMemo(() => {
    const summary = new Map<string, { count: number; total: number; faixas: Map<number, number> }>();
    produtos.forEach((item) => {
      if (!item.fornecedorId) return;
      if (!summary.has(item.fornecedorId)) {
        summary.set(item.fornecedorId, { count: 0, total: 0, faixas: new Map() });
      }
      const data = summary.get(item.fornecedorId)!;
      data.count += 1;
      data.total += item.valorTotal ?? 0;
      if (item.faixaPrazo) {
        data.faixas.set(item.faixaPrazo, (data.faixas.get(item.faixaPrazo) ?? 0) + 1);
      }
    });
    return summary;
  }, [produtos]);

  const fornecedorOptions = useMemo(() => {
    const options = fornecedores.map((item) => ({
      key: item.id,
      text: resolveFornecedorNome(item),
    }));
    return [{ key: 'all', text: 'Todos' }, ...options];
  }, [fornecedores]);

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

  const resumoPorFaixa = useMemo(() => {
    return FAIXAS_PRAZO.map((faixa) => {
      const items = produtos.filter((item) => item.faixaPrazo === faixa.value);
      const fornecedoresSet = new Set(items.map((item) => item.fornecedorId).filter(Boolean));
      return {
        ...faixa,
        count: items.length,
        total: items.reduce((acc, item) => acc + (item.valorTotal ?? 0), 0),
        fornecedores: fornecedoresSet.size,
      };
    });
  }, [produtos]);

  const filteredFornecedores = useMemo(() => {
    const termo = fornecedorSearch.trim().toLowerCase();
    if (!termo) return fornecedores;
    return fornecedores.filter((item) => resolveFornecedorNome(item).toLowerCase().includes(termo));
  }, [fornecedores, fornecedorSearch]);

  const produtosPorFaixa = useMemo(() => {
    const groups = new Map<number, ProdutoCompraItem[]>();
    produtos.forEach((item) => {
      if (!item.faixaPrazo) return;
      if (!groups.has(item.faixaPrazo)) groups.set(item.faixaPrazo, []);
      groups.get(item.faixaPrazo)!.push(item);
    });
    return groups;
  }, [produtos]);

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
      renderCell: (item) => `${formatDate(item.entrega)} ${item.cliente ? `• ${item.cliente}` : ''}`,
    }),
    createTableColumn<ProdutoCompraItem>({
      columnId: 'pedirAte',
      compare: (a, b) => (a.dataLimite || '').localeCompare(b.dataLimite || ''),
      renderHeaderCell: () => 'Pedir até',
      renderCell: (item) => formatDate(item.dataLimite),
    }),
    createTableColumn<ProdutoCompraItem>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <Badge color={item.cotacaoId ? 'warning' : 'danger'}>
          {item.cotacaoId ? 'Cotado' : 'A cotar'}
        </Badge>
      ),
    }),
  ], []);

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
      formatDate(item.entrega),
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
    const itensSemCotacao = itens.filter((item) => !item.cotacaoId);
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

  return (
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
                {fornecedoresLoading ? (
                  <LoadingState />
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
              {loading ? (
                <LoadingState />
              ) : (
                <div className="flex flex-col gap-4">
                  {FAIXAS_PRAZO.map((faixa) => {
                    const items = produtosPorFaixa.get(faixa.value) || [];
                    if (items.length === 0) return null;
                    return (
                      <div key={faixa.value}>
                        <div className="flex items-center justify-between mb-2">
                          <Text weight="semibold">{faixa.label}</Text>
                          <Badge color={faixa.color}>{items.length}</Badge>
                        </div>
                        <DataGrid
                          items={items}
                          columns={listColumns}
                          selectionMode="multiselect"
                          selectedItems={selectedProdutos}
                          onSelectionChange={(selectedInGroup) => handleGroupSelection(items, selectedInGroup)}
                          getRowId={(item) => item.id}
                          emptyState={<EmptyState title="Sem itens" description="Nenhum item nesta faixa de prazo." />}
                        />
                      </div>
                    );
                  })}
                  {produtos.length === 0 && (
                    <EmptyState title="Sem itens para comprar" description="Nenhum item encontrado com os filtros atuais." />
                  )}
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
            {[
              { key: 'acotar', label: 'A Cotar', filter: (item: ProdutoCompraItem) => !item.cotacaoId },
              { key: 'cotado', label: 'Cotado', filter: (item: ProdutoCompraItem) => Boolean(item.cotacaoId) },
              { key: 'pedido', label: 'Pedido', filter: (_: ProdutoCompraItem) => false },
            ].map((col) => {
              const items = produtos.filter(col.filter);
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
                              {item.cliente || '-'} • {formatDate(item.dataLimite)}
                            </Text>
                          </div>
                          <Checkbox
                            checked={selectedProdutos.some((selected) => selected.id === item.id)}
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
            {fornecedoresLoading ? (
              <LoadingState />
            ) : (
              fornecedores.map((fornecedor) => {
                const resumo = fornecedorResumo.get(fornecedor.id);
                const itens = produtos.filter((item) => item.fornecedorId === fornecedor.id);
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
                        <Button appearance="secondary" icon={<ClipboardText24Regular />} onClick={() => {
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
                                {item.cliente || '-'} • {formatDate(item.entrega)}
                              </Text>
                              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                {item.quantidade ?? 0} un • {formatCurrency(item.precoUnitario ?? 0)}
                              </Text>
                            </div>
                            <Checkbox
                              checked={selectedProdutos.some((selected) => selected.id === item.id)}
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
            <Button appearance="secondary" icon={<ClipboardText24Regular />} onClick={handleCopyResumo} disabled={processing}>
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
}
