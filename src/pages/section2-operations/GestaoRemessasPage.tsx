import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Dropdown,
  Field,
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
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowSync24Regular, Box24Regular, CalendarClock24Regular, Dismiss24Regular, Warning24Regular } from '@fluentui/react-icons';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { FilterBar } from '../../components/shared/FilterBar';
import { LoadingState } from '../../components/shared/LoadingState';
import { EmptyState } from '../../components/shared/EmptyState';
import { KanbanBoard } from '../../components/domain/remessas/KanbanBoard';
import { KanbanColumn } from '../../components/domain/remessas/KanbanColumn';
import { RemessaCard } from '../../components/domain/remessas/RemessaCard';
import { RemessaDetailsPanel } from '../../components/domain/remessas/RemessaDetailsPanel';
import { DividirRemessaDialog } from '../../components/domain/remessas/DividirRemessaDialog';
import { JuntarRemessasDialog } from '../../components/domain/remessas/JuntarRemessasDialog';
import { MoverProdutosDialog } from '../../components/domain/remessas/MoverProdutosDialog';
import { DataGrid, createTableColumn } from '../../components/shared/DataGrid';
import {
  REMESSA_HISTORICO_DIVISAO,
  REMESSA_HISTORICO_EDICAO,
  REMESSA_HISTORICO_JUNCAO,
  REMESSA_HISTORICO_MOVIMENTACAO,
  REMESSA_HISTORICO_MOVER_ITENS,
  REMESSA_STAGE_ENTREGUE,
  REMESSA_STAGE_ENVIO,
  REMESSA_STAGES,
  REMESSA_PRIORITIES,
} from '../../features/remessas/constants';
import { RemessaCardData, RemessaCotacaoItem, RemessaHistoricoItem, RemessaLookupOption, RemessaProdutoItem, TransportadoraOption } from '../../features/remessas/types';
import { buildProdutoServicoSearchFilter, buildRemessaSearchFilter, chunkIds } from '../../features/remessas/utils';
import { NewRemessaService } from '../../generated/services/NewRemessaService';
import { NewProdutoServicoService } from '../../generated/services/NewProdutoServicoService';
import { NewHistoricoRemessaService } from '../../generated/services/NewHistoricoRemessaService';
import { NewTransportadoraService } from '../../generated/services/NewTransportadoraService';
import { NewCotacaoService } from '../../services/NewCotacaoService';
import { useCurrentSystemUser } from '../../hooks/useCurrentSystemUser';

interface RemessaDetails extends RemessaCardData {
  transportadoraId?: string | null;
  fornecedorId?: string | null;
  remessaOrigemId?: string | null;
}

const REFERENCE_CHUNK_SIZE = 25;

const selectRemessaFields = [
  'new_remessaid',
  'new_id',
  'new_entregue',
  'new_estagiodamovimentacao',
  'new_nomedofornecedorfx',
  'new_nomedatransportadora',
  'new_previsaodechegada',
  'new_previsaodeenvio',
  'new_datadeenvio',
  'new_dataderecebimento',
  'new_codigoderastreio',
  'new_prioridade',
  'new_notas',
  '_new_fornecedor_value',
  '_new_transportadora_value',
  '_new_remessaorigem_value',
];

const selectProdutoFields = [
  'new_produtoservicoid',
  'new_referenciadoproduto',
  'new_descricao',
  'new_nomedofabricante',
  'new_nomedoclientefx',
  'new_apelidodoprojetofx',
  'new_quantidade',
  '_new_remessa_value',
  '_new_cotacao_value',
];

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

const toDataverseDate = (value?: string | null) => {
  if (!value) return null;
  return `${value}T00:00:00Z`;
};

const getStageLabel = (value?: number | null) => {
  if (value === null || value === undefined) return '-';
  return REMESSA_STAGES.find((stage) => stage.value === value)?.label ?? String(value);
};

const getPrioridadeLabel = (value?: number | null) => {
  if (value === null || value === undefined) return '-';
  return REMESSA_PRIORITIES.find((item) => item.value === value)?.label ?? String(value);
};

export function GestaoRemessasPage() {
  const { systemUserId } = useCurrentSystemUser();
  const [selectedTab, setSelectedTab] = useState('kanban');
  const [searchValue, setSearchValue] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [columns, setColumns] = useState<Record<number, RemessaCardData[]>>({});
  const [listItems, setListItems] = useState<RemessaCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [kpis, setKpis] = useState({ atrasadas: 0, chegando: 0, emTransito: 0 });
  const [selectedRemessaId, setSelectedRemessaId] = useState<string | null>(null);
  const [selectedRemessa, setSelectedRemessa] = useState<RemessaDetails | null>(null);
  const [produtos, setProdutos] = useState<RemessaProdutoItem[]>([]);
  const [produtosLoading, setProdutosLoading] = useState(false);
  const [cotacoes, setCotacoes] = useState<RemessaCotacaoItem[]>([]);
  const [cotacoesLoading, setCotacoesLoading] = useState(false);
  const [historico, setHistorico] = useState<RemessaHistoricoItem[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [selectedProdutos, setSelectedProdutos] = useState<RemessaProdutoItem[]>([]);
  const [transportadoras, setTransportadoras] = useState<TransportadoraOption[]>([]);
  const [remessaOptions, setRemessaOptions] = useState<RemessaLookupOption[]>([]);
  const [dialogs, setDialogs] = useState({
    dividir: false,
    juntar: false,
    mover: false,
    batchStage: false,
    batchTransportadora: false,
  });
  const [listSelection, setListSelection] = useState<RemessaCardData[]>([]);
  const [batchStageValue, setBatchStageValue] = useState('');
  const [batchTransportadoraId, setBatchTransportadoraId] = useState('');
  const [saving, setSaving] = useState(false);
  const loadRequestId = useRef(0);
  const cotacoesRequestId = useRef(0);
  const toasterId = useId('remessas-toast');
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

  const effectiveStages = useMemo(() => {
    if (stageFilter !== 'all') {
      const stageValue = Number(stageFilter);
      return REMESSA_STAGES.filter((stage) => stage.value === stageValue);
    }
    return REMESSA_STAGES;
  }, [stageFilter]);

  const isRemessaAtrasada = useCallback((item: RemessaCardData) => {
    if (!item.previsaoChegada || item.entregue) return false;
    const previsao = new Date(item.previsaoChegada);
    if (Number.isNaN(previsao.getTime())) return false;
    const hoje = new Date();
    const startHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const startPrev = new Date(previsao.getFullYear(), previsao.getMonth(), previsao.getDate());
    return startPrev < startHoje;
  }, []);

  const mapRecordToCard = useCallback((record: any): RemessaCardData => ({
    id: record.new_remessaid,
    codigo: record.new_id ?? null,
    stageValue: record.new_estagiodamovimentacao ?? undefined,
    fornecedor: record.new_nomedofornecedorfx ?? null,
    transportadora: record.new_nomedatransportadora ?? null,
    previsaoChegada: record.new_previsaodechegada ?? null,
    previsaoEnvio: record.new_previsaodeenvio ?? null,
    dataEnvio: record.new_datadeenvio ?? null,
    dataRecebimento: record.new_dataderecebimento ?? null,
    codigoRastreio: record.new_codigoderastreio ?? null,
    prioridade: record.new_prioridade ?? null,
    entregue: Boolean(record.new_entregue),
    notas: record.new_notas ?? null,
  }), []);

  const buildSearchFilter = useCallback(async () => {
    const trimmed = searchValue.trim();
    if (!trimmed) {
      return {
        remessaSearchFilter: '',
        remessaIdsFromProdutos: [],
      };
    }

    const produtoFilter = buildProdutoServicoSearchFilter(trimmed);
    if (!produtoFilter) {
      return {
        remessaSearchFilter: buildRemessaSearchFilter(trimmed),
        remessaIdsFromProdutos: [],
      };
    }

    const produtosResult = await NewProdutoServicoService.getAll({
      filter: `statecode eq 0 and ${produtoFilter}`,
      select: ['_new_remessa_value'],
    });
    const remessaIdsFromProdutos = Array.from(new Set(
      (produtosResult.data ?? [])
        .map((item) => item._new_remessa_value)
        .filter((id): id is string => Boolean(id))
    ));

    return {
      remessaSearchFilter: buildRemessaSearchFilter(trimmed),
      remessaIdsFromProdutos,
    };
  }, [searchValue]);

  const buildRemessaIdFilter = useCallback((ids: string[]) => {
    if (ids.length === 0) return '';
    const chunks = chunkIds(ids, REFERENCE_CHUNK_SIZE);
    const chunkFilters = chunks.map((chunk) => `(${chunk.map((id) => `new_remessaid eq ${id}`).join(' or ')})`);
    return chunkFilters.join(' or ');
  }, []);

  const buildBaseFilter = useCallback(async () => {
    const { remessaSearchFilter, remessaIdsFromProdutos } = await buildSearchFilter();
    const filterParts = ['statecode eq 0'];

    if (priorityFilter !== 'all') {
      filterParts.push(`new_prioridade eq ${priorityFilter}`);
    }

    if (searchValue.trim()) {
      const searchParts: string[] = [];
      if (remessaSearchFilter) {
        searchParts.push(remessaSearchFilter);
      }
      const remessaIdFilter = buildRemessaIdFilter(remessaIdsFromProdutos);
      if (remessaIdFilter) {
        searchParts.push(remessaIdFilter);
      }
      if (searchParts.length > 0) {
        filterParts.push(`(${searchParts.join(' or ')})`);
      } else {
        filterParts.push('new_remessaid eq null');
      }
    }

    return filterParts.join(' and ');
  }, [buildRemessaIdFilter, buildSearchFilter, priorityFilter, searchValue]);

  const loadColumnData = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setLoading(true);
    try {
      const baseFilter = await buildBaseFilter();
      const results = await Promise.all(
        effectiveStages.map(async (stage) => {
          const filter = `${baseFilter} and new_estagiodamovimentacao eq ${stage.value}`;
          const result = await NewRemessaService.getAll({
            select: selectRemessaFields,
            filter,
            orderBy: ['new_previsaodechegada asc'],
          });
          return {
            stageValue: stage.value,
            items: (result.data || []).map(mapRecordToCard),
          };
        })
      );

      if (requestId !== loadRequestId.current) return;
      const nextColumns: Record<number, RemessaCardData[]> = {};
      results.forEach((column) => {
        nextColumns[column.stageValue] = column.items;
      });
      setColumns(nextColumns);
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao carregar remessas', err);
      showError('Erro ao carregar remessas.');
    } finally {
      if (requestId === loadRequestId.current) {
        setLoading(false);
      }
    }
  }, [buildBaseFilter, effectiveStages, mapRecordToCard, showError]);

  const loadListData = useCallback(async () => {
    if (selectedTab !== 'lista') return;
    setListLoading(true);
    try {
      const baseFilter = await buildBaseFilter();
      const filter = stageFilter !== 'all'
        ? `${baseFilter} and new_estagiodamovimentacao eq ${stageFilter}`
        : baseFilter;
      const result = await NewRemessaService.getAll({
        select: selectRemessaFields,
        filter,
        orderBy: ['new_previsaodechegada asc'],
        top: 200,
      });
      setListItems((result.data || []).map(mapRecordToCard));
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao carregar lista', err);
      showError('Erro ao carregar lista de remessas.');
    } finally {
      setListLoading(false);
    }
  }, [buildBaseFilter, mapRecordToCard, selectedTab, showError, stageFilter]);

  const loadTransportadoras = useCallback(async () => {
    const result = await NewTransportadoraService.getAll({
      filter: 'statecode eq 0',
      select: ['new_transportadoraid', 'new_name'],
      orderBy: ['new_name asc'],
    });
    const options = (result.data || []).map((item) => ({
      id: item.new_transportadoraid,
      label: item.new_name ?? item.new_transportadoraid,
    }));
    setTransportadoras(options);
  }, []);

  const loadRemessaOptions = useCallback(async () => {
    const result = await NewRemessaService.getAll({
      filter: `statecode eq 0 and new_estagiodamovimentacao ne ${REMESSA_STAGE_ENTREGUE} and (new_entregue ne true or new_entregue eq null)`,
      select: [
        'new_remessaid',
        'new_id',
        'new_nomedofornecedorfx',
        'new_nomedatransportadora',
        'new_previsaodechegada',
        'new_codigoderastreio',
        'new_prioridade',
        'new_entregue',
        'new_estagiodamovimentacao',
      ],
      orderBy: ['new_id asc'],
      top: 200,
    });
    const options = (result.data || []).map((item) => ({
      id: item.new_remessaid,
      label: `${item.new_id ?? item.new_remessaid} - ${item.new_nomedofornecedorfx ?? 'Fornecedor não informado'}`,
      fornecedor: item.new_nomedofornecedorfx ?? null,
      transportadora: item.new_nomedatransportadora ?? null,
      previsaoChegada: item.new_previsaodechegada ?? null,
      codigoRastreio: item.new_codigoderastreio ?? null,
      prioridade: item.new_prioridade ?? null,
      entregue: Boolean(item.new_entregue),
      stageValue: item.new_estagiodamovimentacao ?? null,
    }));
    setRemessaOptions(options);
  }, []);

  const loadKpis = useCallback(async () => {
    const hoje = new Date();
    const startHoje = new Date(hoje.toISOString().split('T')[0] + 'T00:00:00Z');
    const startAmanha = new Date(startHoje);
    startAmanha.setDate(startAmanha.getDate() + 1);
    const startDepois = new Date(startAmanha);
    startDepois.setDate(startDepois.getDate() + 1);

    const atrasadasResult = await NewRemessaService.getAll({
      filter: `statecode eq 0 and new_previsaodechegada lt ${startHoje.toISOString()} and (new_entregue ne true or new_entregue eq null)`,
      select: ['new_remessaid'],
    });
    const chegandoResult = await NewRemessaService.getAll({
      filter: `statecode eq 0 and new_previsaodechegada ge ${startHoje.toISOString()} and new_previsaodechegada lt ${startDepois.toISOString()}`,
      select: ['new_remessaid'],
    });
    const emTransitoResult = await NewRemessaService.getAll({
      filter: `statecode eq 0 and new_estagiodamovimentacao eq ${REMESSA_STAGE_ENVIO}`,
      select: ['new_remessaid'],
    });

    setKpis({
      atrasadas: (atrasadasResult.data || []).length,
      chegando: (chegandoResult.data || []).length,
      emTransito: (emTransitoResult.data || []).length,
    });
  }, []);

  const loadRemessaDetails = useCallback(async (remessaId: string) => {
    const result = await NewRemessaService.get(remessaId, {
      select: selectRemessaFields,
    });
    if (!result.data) return;
    const data = result.data as any;
    setSelectedRemessa({
      ...mapRecordToCard(data),
      transportadoraId: data._new_transportadora_value ?? null,
      fornecedorId: data._new_fornecedor_value ?? null,
      remessaOrigemId: data._new_remessaorigem_value ?? null,
    });
  }, [mapRecordToCard]);

  const loadCotacoes = useCallback(async (items: RemessaProdutoItem[]) => {
    const requestId = ++cotacoesRequestId.current;
    setCotacoesLoading(true);
    try {
      const cotacaoIds = Array.from(new Set(
        items
          .map((item) => item.cotacaoId)
          .filter((id): id is string => Boolean(id))
      ));

      if (cotacaoIds.length === 0) {
        if (requestId === cotacoesRequestId.current) {
          setCotacoes([]);
        }
        return;
      }

      const chunks = chunkIds(cotacaoIds, REFERENCE_CHUNK_SIZE);
      const results = await Promise.all(
        chunks.map((chunk) => (
          NewCotacaoService.getAll({
            filter: `statecode eq 0 and (${chunk.map((id) => `new_cotacaoid eq '${id}'`).join(' or ')})`,
            select: [
              'new_cotacaoid',
              'new_name',
              'new_nomedofornecedor',
              'new_valortotal',
              'new_opcaodeentrega',
              'new_enderecodeentrega',
              'new_observacoes',
              'new_datadeaprovacao',
            ],
          })
        ))
      );

      if (requestId !== cotacoesRequestId.current) return;

      const mapped = results
        .flatMap((result) => result.data ?? [])
        .map((item) => ({
          id: (item as any).new_cotacaoid,
          nome: (item as any).new_name ?? null,
          fornecedor: (item as any).new_nomedofornecedor ?? null,
          valorTotal: (item as any).new_valortotal ?? null,
          opcaoEntrega: (item as any).new_opcaodeentrega ?? null,
          enderecoEntrega: (item as any).new_enderecodeentrega ?? null,
          observacoes: (item as any).new_observacoes ?? null,
          dataAprovacao: (item as any).new_datadeaprovacao ?? null,
        }));

      const uniqueMap = new Map<string, RemessaCotacaoItem>();
      mapped.forEach((item) => {
        if (item.id) uniqueMap.set(item.id, item);
      });

      setCotacoes(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao carregar cotacoes', err);
      if (requestId === cotacoesRequestId.current) {
        setCotacoes([]);
      }
    } finally {
      if (requestId === cotacoesRequestId.current) {
        setCotacoesLoading(false);
      }
    }
  }, []);

  const loadProdutos = useCallback(async (remessaId: string) => {
    setProdutosLoading(true);
    try {
      const result = await NewProdutoServicoService.getAll({
        filter: `statecode eq 0 and _new_remessa_value eq '${remessaId}'`,
        select: selectProdutoFields,
      });
      const items = (result.data || []).map((item) => ({
        id: item.new_produtoservicoid,
        referencia: (item as any).new_referenciadoproduto ?? null,
        descricao: (item as any).new_descricao ?? null,
        fabricante: (item as any).new_nomedofabricante ?? null,
        cliente: (item as any).new_nomedoclientefx ?? null,
        projeto: (item as any).new_apelidodoprojetofx ?? null,
        quantidade: (item as any).new_quantidade ?? null,
        cotacaoId: (item as any)._new_cotacao_value ?? null,
      }));
      setProdutos(items);
      void loadCotacoes(items);
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao carregar produtos', err);
      setProdutos([]);
      setCotacoes([]);
    } finally {
      setProdutosLoading(false);
    }
  }, [loadCotacoes]);

  const loadHistorico = useCallback(async (remessaId: string) => {
    setHistoricoLoading(true);
    try {
      const result = await NewHistoricoRemessaService.getAll({
        filter: `statecode eq 0 and _new_remessa_value eq '${remessaId}'`,
        select: ['new_historicoremessaid', 'new_dataalteracao', 'new_campoalterado', 'new_valoranterior', 'new_valornovo', 'new_tipoacao'],
        orderBy: ['new_dataalteracao desc'],
      });
      const items = (result.data || []).map((item) => ({
        id: item.new_historicoremessaid,
        data: item.new_dataalteracao ?? null,
        campo: item.new_campoalterado ?? null,
        anterior: item.new_valoranterior ?? null,
        novo: item.new_valornovo ?? null,
        tipo: item.new_tipoacao ?? null,
      }));
      setHistorico(items);
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao carregar historico', err);
      setHistorico([]);
    } finally {
      setHistoricoLoading(false);
    }
  }, []);

  const registerHistorico = useCallback(async (remessaId: string, campo: string, anterior?: string | null, novo?: string | null, tipo?: number) => {
    try {
      await NewHistoricoRemessaService.create({
        new_campoalterado: campo,
        new_valoranterior: anterior ?? null,
        new_valornovo: novo ?? null,
        new_dataalteracao: new Date().toISOString(),
        new_tipoacao: tipo ?? null,
        'new_Remessa@odata.bind': `/new_remessas(${remessaId})`,
        ...(systemUserId ? { 'new_AlteradoPor@odata.bind': `/systemusers(${systemUserId})` } : {}),
      });
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao registrar historico', err);
    }
  }, [systemUserId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadColumnData(), loadListData(), loadKpis()]);
  }, [loadColumnData, loadKpis, loadListData]);

  useEffect(() => {
    void loadTransportadoras();
  }, [loadTransportadoras]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!selectedRemessaId) {
      setSelectedRemessa(null);
      setProdutos([]);
      setCotacoes([]);
      setCotacoesLoading(false);
      cotacoesRequestId.current += 1;
      setHistorico([]);
      return;
    }
    void loadRemessaDetails(selectedRemessaId);
    void loadProdutos(selectedRemessaId);
    void loadHistorico(selectedRemessaId);
  }, [loadHistorico, loadProdutos, loadRemessaDetails, selectedRemessaId]);

  useEffect(() => {
    void loadListData();
  }, [loadListData]);

  const handleCardSelect = useCallback((id: string) => {
    setSelectedRemessaId(id);
  }, []);

  const handleOpenRemessa = useCallback((id: string) => {
    setSelectedRemessaId(id);
  }, []);

  const findStageForItem = (itemId: string) => {
    const entry = Object.entries(columns).find(([_, items]) => items.some((item) => item.id === itemId));
    return entry ? Number(entry[0]) : null;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const sourceStage = findStageForItem(activeId);
    if (sourceStage === null) return;

    const destStage = overId.startsWith('column-')
      ? Number(overId.replace('column-', ''))
      : findStageForItem(overId);

    if (destStage === null) return;

    if (sourceStage === destStage && activeId === overId) return;

    const sourceItems = columns[sourceStage] ?? [];
    const destItems = columns[destStage] ?? [];
    const activeIndex = sourceItems.findIndex((item) => item.id === activeId);
    const overIndex = destItems.findIndex((item) => item.id === overId);
    if (activeIndex < 0) return;

    const item = sourceItems[activeIndex];
    if (destStage === REMESSA_STAGE_ENVIO && !item.dataEnvio) {
      showError('Para mover para "Envio" preencha a data de envio.');
      return;
    }
    if (destStage === REMESSA_STAGE_ENTREGUE && !item.dataRecebimento) {
      showError('Para mover para "Entregue" preencha a data de recebimento.');
      return;
    }

    const nextColumns = { ...columns };
    if (sourceStage === destStage) {
      nextColumns[sourceStage] = arrayMove(sourceItems, activeIndex, overIndex);
    } else {
      nextColumns[sourceStage] = sourceItems.filter((item) => item.id !== activeId);
      const updatedItem = { ...item, stageValue: destStage };
      nextColumns[destStage] = [
        ...destItems.slice(0, overIndex < 0 ? destItems.length : overIndex),
        updatedItem,
        ...destItems.slice(overIndex < 0 ? destItems.length : overIndex),
      ];
    }
    setColumns(nextColumns);

    try {
      await NewRemessaService.update(activeId, {
        new_estagiodamovimentacao: destStage,
      } as any);
      await registerHistorico(
        activeId,
        'Estágio',
        getStageLabel(item.stageValue),
        getStageLabel(destStage),
        REMESSA_HISTORICO_MOVIMENTACAO
      );
      await refreshAll();
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao mover remessa', err);
      showError('Erro ao atualizar estágio da remessa.');
      await refreshAll();
    }
  };

  const handleSalvarDetalhes = useCallback(async (changes: {
    new_estagiodamovimentacao?: number | null;
    new_transportadoraId?: string | null;
    new_prioridade?: number | null;
    new_codigoderastreio?: string | null;
    new_previsaodeenvio?: string | null;
    new_previsaodechegada?: string | null;
    new_datadeenvio?: string | null;
    new_dataderecebimento?: string | null;
    new_notas?: string | null;
  }) => {
    if (!selectedRemessa) return;
    const nextStage = changes.new_estagiodamovimentacao ?? selectedRemessa.stageValue;
    const nextDataEnvio = changes.new_datadeenvio ?? selectedRemessa.dataEnvio;
    const nextDataRecebimento = changes.new_dataderecebimento ?? selectedRemessa.dataRecebimento;
    if (nextStage === REMESSA_STAGE_ENVIO && !nextDataEnvio) {
      showError('Para mover para "Envio" preencha a data de envio.');
      return;
    }
    if (nextStage === REMESSA_STAGE_ENTREGUE && !nextDataRecebimento) {
      showError('Para mover para "Entregue" preencha a data de recebimento.');
      return;
    }
    setSaving(true);
    try {
      const previsaoEnvioValue = toDataverseDate(changes.new_previsaodeenvio);
      const previsaoChegadaValue = toDataverseDate(changes.new_previsaodechegada);
      const dataEnvioValue = toDataverseDate(changes.new_datadeenvio);
      const dataRecebimentoValue = toDataverseDate(changes.new_dataderecebimento);
      const payload: any = {
        new_estagiodamovimentacao: changes.new_estagiodamovimentacao ?? null,
        new_prioridade: changes.new_prioridade ?? null,
        new_codigoderastreio: changes.new_codigoderastreio ?? null,
        new_previsaodeenvio: previsaoEnvioValue,
        new_previsaodechegada: previsaoChegadaValue,
        new_datadeenvio: dataEnvioValue,
        new_dataderecebimento: dataRecebimentoValue,
        new_notas: changes.new_notas ?? null,
      };

      if (changes.new_transportadoraId) {
        payload['new_Transportadora@odata.bind'] = `/new_transportadoras(${changes.new_transportadoraId})`;
      } else {
        payload['new_Transportadora@odata.bind'] = null;
      }

      await NewRemessaService.update(selectedRemessa.id, payload);

      if (selectedRemessa.stageValue !== changes.new_estagiodamovimentacao) {
        await registerHistorico(
          selectedRemessa.id,
          'Estágio',
          getStageLabel(selectedRemessa.stageValue),
          getStageLabel(changes.new_estagiodamovimentacao),
          REMESSA_HISTORICO_EDICAO
        );
      }
      if (selectedRemessa.transportadoraId !== changes.new_transportadoraId) {
        await registerHistorico(
          selectedRemessa.id,
          'Transportadora',
          selectedRemessa.transportadora ?? '-',
          transportadoras.find((item) => item.id === changes.new_transportadoraId)?.label ?? '-',
          REMESSA_HISTORICO_EDICAO
        );
      }
      if (selectedRemessa.prioridade !== changes.new_prioridade) {
        await registerHistorico(
          selectedRemessa.id,
          'Prioridade',
          getPrioridadeLabel(selectedRemessa.prioridade),
          getPrioridadeLabel(changes.new_prioridade),
          REMESSA_HISTORICO_EDICAO
        );
      }
      if (selectedRemessa.codigoRastreio !== changes.new_codigoderastreio) {
        await registerHistorico(
          selectedRemessa.id,
          'Código de rastreio',
          selectedRemessa.codigoRastreio ?? '-',
          changes.new_codigoderastreio ?? '-',
          REMESSA_HISTORICO_EDICAO
        );
      }
      if (selectedRemessa.previsaoEnvio !== previsaoEnvioValue) {
        await registerHistorico(
          selectedRemessa.id,
          'Previsão de envio',
          formatDate(selectedRemessa.previsaoEnvio),
          previsaoEnvioValue ? formatDate(previsaoEnvioValue) : '-',
          REMESSA_HISTORICO_EDICAO
        );
      }
      if (selectedRemessa.previsaoChegada !== previsaoChegadaValue) {
        await registerHistorico(
          selectedRemessa.id,
          'Previsão de chegada',
          formatDate(selectedRemessa.previsaoChegada),
          previsaoChegadaValue ? formatDate(previsaoChegadaValue) : '-',
          REMESSA_HISTORICO_EDICAO
        );
      }
      if (selectedRemessa.dataEnvio !== dataEnvioValue) {
        await registerHistorico(
          selectedRemessa.id,
          'Data de envio',
          formatDate(selectedRemessa.dataEnvio),
          dataEnvioValue ? formatDate(dataEnvioValue) : '-',
          REMESSA_HISTORICO_EDICAO
        );
      }
      if (selectedRemessa.dataRecebimento !== dataRecebimentoValue) {
        await registerHistorico(
          selectedRemessa.id,
          'Data de recebimento',
          formatDate(selectedRemessa.dataRecebimento),
          dataRecebimentoValue ? formatDate(dataRecebimentoValue) : '-',
          REMESSA_HISTORICO_EDICAO
        );
      }
      if (selectedRemessa.notas !== changes.new_notas) {
        await registerHistorico(
          selectedRemessa.id,
          'Notas',
          selectedRemessa.notas ?? '-',
          changes.new_notas ?? '-',
          REMESSA_HISTORICO_EDICAO
        );
      }

      await refreshAll();
      await loadRemessaDetails(selectedRemessa.id);
      await loadHistorico(selectedRemessa.id);
      showSuccess('Remessa atualizada', 'As alterações foram salvas com sucesso.');
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao salvar detalhes', err);
      showError('Erro ao salvar alterações da remessa.');
    } finally {
      setSaving(false);
    }
  }, [loadHistorico, loadRemessaDetails, refreshAll, registerHistorico, selectedRemessa, showError, showSuccess, transportadoras]);

  const handleDividir = useCallback(async (payload: { codigoRastreio?: string; previsaoEnvio?: string; previsaoChegada?: string }) => {
    if (!selectedRemessa || selectedProdutos.length === 0) return;
    setSaving(true);
    try {
      const createResult = await NewRemessaService.create({
        new_estagiodamovimentacao: selectedRemessa.stageValue ?? null,
        new_prioridade: selectedRemessa.prioridade ?? null,
        new_codigoderastreio: payload.codigoRastreio || selectedRemessa.codigoRastreio || null,
        new_previsaodeenvio: toDataverseDate(payload.previsaoEnvio) || selectedRemessa.previsaoEnvio || null,
        new_previsaodechegada: toDataverseDate(payload.previsaoChegada) || selectedRemessa.previsaoChegada || null,
        ...(selectedRemessa.fornecedorId
          ? { 'new_Fornecedor@odata.bind': `/cr22f_fornecedoresfromsharepointlists(${selectedRemessa.fornecedorId})` }
          : {}),
        ...(selectedRemessa.transportadoraId
          ? { 'new_Transportadora@odata.bind': `/new_transportadoras(${selectedRemessa.transportadoraId})` }
          : {}),
        ...(selectedRemessa.id
          ? { 'new_RemessaOrigem@odata.bind': `/new_remessas(${selectedRemessa.id})` }
          : {}),
      } as any);
      const newRemessaId = (createResult.data as any)?.new_remessaid || (createResult as any).id;
      if (!newRemessaId) throw new Error('Remessa criada sem id');

      await Promise.all(selectedProdutos.map((item) => (
        NewProdutoServicoService.update(item.id, {
          'new_Remessa@odata.bind': `/new_remessas(${newRemessaId})`,
        } as any)
      )));

      await registerHistorico(selectedRemessa.id, 'Divisão', selectedRemessa.codigo ?? selectedRemessa.id, newRemessaId, REMESSA_HISTORICO_DIVISAO);
      await registerHistorico(newRemessaId, 'Divisão', selectedRemessa.codigo ?? selectedRemessa.id, 'Nova remessa criada', REMESSA_HISTORICO_DIVISAO);
      setDialogs((prev) => ({ ...prev, dividir: false }));
      setSelectedProdutos([]);
      await refreshAll();
      await loadRemessaDetails(selectedRemessa.id);
      await loadProdutos(selectedRemessa.id);
      await loadHistorico(selectedRemessa.id);
      await loadRemessaOptions();
      showSuccess('Remessa dividida', 'Nova remessa criada com sucesso.');
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao dividir remessa', err);
      showError('Erro ao dividir remessa.');
    } finally {
      setSaving(false);
    }
  }, [
    loadHistorico,
    loadProdutos,
    loadRemessaDetails,
    loadRemessaOptions,
    refreshAll,
    registerHistorico,
    selectedProdutos,
    selectedRemessa,
    showError,
    showSuccess,
  ]);

  const handleJuntar = useCallback(async (payload: { principalId: string; mergeIds: string[] }) => {
    if (!payload.principalId || payload.mergeIds.length === 0) return;
    setSaving(true);
    try {
      const principal = remessaOptions.find((opt) => opt.id === payload.principalId);
      const invalidFornecedor = payload.mergeIds.some((id) => {
        const item = remessaOptions.find((opt) => opt.id === id);
        return item?.fornecedor && principal?.fornecedor && item.fornecedor !== principal.fornecedor;
      });
      if (invalidFornecedor) {
        showError('As remessas selecionadas precisam ter o mesmo fornecedor.');
        setSaving(false);
        return;
      }

      const produtosResult = await Promise.all(payload.mergeIds.map((id) =>
        NewProdutoServicoService.getAll({
          filter: `statecode eq 0 and _new_remessa_value eq '${id}'`,
          select: ['new_produtoservicoid'],
        })
      ));
      const produtoIds = produtosResult.flatMap((result) => (result.data || []).map((item) => item.new_produtoservicoid));

      await Promise.all(produtoIds.map((id) => (
        NewProdutoServicoService.update(id, {
          'new_Remessa@odata.bind': `/new_remessas(${payload.principalId})`,
        } as any)
      )));

      await Promise.all(payload.mergeIds.map((id) => (
        NewRemessaService.update(id, { statecode: 1, statuscode: 2 } as any)
      )));

      await registerHistorico(payload.principalId, 'Junção', '-', `Remessas juntadas: ${payload.mergeIds.length}`, REMESSA_HISTORICO_JUNCAO);
      await Promise.all(payload.mergeIds.map((id) => (
        registerHistorico(id, 'Junção', id, payload.principalId, REMESSA_HISTORICO_JUNCAO)
      )));
      setDialogs((prev) => ({ ...prev, juntar: false }));
      await refreshAll();
      await loadRemessaOptions();
      showSuccess('Remessas juntadas', 'As remessas foram consolidadas com sucesso.');
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao juntar remessas', err);
      showError('Erro ao juntar remessas.');
    } finally {
      setSaving(false);
    }
  }, [loadRemessaOptions, refreshAll, registerHistorico, remessaOptions, showError, showSuccess]);

  const handleMoverProdutos = useCallback(async (destinoId: string) => {
    if (!destinoId || selectedProdutos.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(selectedProdutos.map((item) => (
        NewProdutoServicoService.update(item.id, {
          'new_Remessa@odata.bind': `/new_remessas(${destinoId})`,
        } as any)
      )));
      if (selectedRemessa?.id) {
        await registerHistorico(
          selectedRemessa.id,
          'Mover itens',
          selectedRemessa.codigo ?? selectedRemessa.id,
          destinoId,
          REMESSA_HISTORICO_MOVER_ITENS
        );
      }
      setDialogs((prev) => ({ ...prev, mover: false }));
      setSelectedProdutos([]);
      await refreshAll();
      if (selectedRemessa?.id) {
        await loadProdutos(selectedRemessa.id);
      }
      showSuccess('Itens movidos', 'Os produtos foram movidos para a remessa selecionada.');
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao mover itens', err);
      showError('Erro ao mover itens.');
    } finally {
      setSaving(false);
    }
  }, [loadProdutos, refreshAll, registerHistorico, selectedProdutos, selectedRemessa, showError, showSuccess]);

  const handleBatchStage = useCallback(async () => {
    if (batchStageValue === '' || listSelection.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(listSelection.map((item) => (
        NewRemessaService.update(item.id, { new_estagiodamovimentacao: Number(batchStageValue) } as any)
      )));
      await Promise.all(listSelection.map((item) => (
        registerHistorico(item.id, 'Estágio', getStageLabel(item.stageValue), getStageLabel(Number(batchStageValue)), REMESSA_HISTORICO_EDICAO)
      )));
      setDialogs((prev) => ({ ...prev, batchStage: false }));
      setBatchStageValue('');
      setListSelection([]);
      await refreshAll();
      showSuccess('Estágio atualizado', 'As remessas selecionadas foram atualizadas.');
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao atualizar estágio', err);
      showError('Erro ao atualizar estágio.');
    } finally {
      setSaving(false);
    }
  }, [batchStageValue, listSelection, refreshAll, registerHistorico, showError, showSuccess]);

  const handleBatchTransportadora = useCallback(async () => {
    if (!batchTransportadoraId || listSelection.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(listSelection.map((item) => (
        NewRemessaService.update(item.id, {
          'new_Transportadora@odata.bind': `/new_transportadoras(${batchTransportadoraId})`,
        } as any)
      )));
      await Promise.all(listSelection.map((item) => (
        registerHistorico(
          item.id,
          'Transportadora',
          item.transportadora ?? '-',
          transportadoras.find((t) => t.id === batchTransportadoraId)?.label ?? '-',
          REMESSA_HISTORICO_EDICAO
        )
      )));
      setDialogs((prev) => ({ ...prev, batchTransportadora: false }));
      setBatchTransportadoraId('');
      setListSelection([]);
      await refreshAll();
      showSuccess('Transportadora atualizada', 'As remessas selecionadas foram atualizadas.');
    } catch (err) {
      console.error('[GestaoRemessasPage] erro ao atualizar transportadora', err);
      showError('Erro ao atualizar transportadora.');
    } finally {
      setSaving(false);
    }
  }, [batchTransportadoraId, listSelection, refreshAll, registerHistorico, showError, showSuccess, transportadoras]);

  const listColumns = [
    createTableColumn<RemessaCardData>({
      columnId: 'codigo',
      renderHeaderCell: () => 'Código',
      renderCell: (item) => item.codigo ?? item.id,
    }),
    createTableColumn<RemessaCardData>({
      columnId: 'fornecedor',
      renderHeaderCell: () => 'Fornecedor',
      renderCell: (item) => item.fornecedor ?? '-',
    }),
    createTableColumn<RemessaCardData>({
      columnId: 'transportadora',
      renderHeaderCell: () => 'Transportadora',
      renderCell: (item) => item.transportadora ?? '-',
    }),
    createTableColumn<RemessaCardData>({
      columnId: 'estagio',
      renderHeaderCell: () => 'Estágio',
      renderCell: (item) => getStageLabel(item.stageValue),
    }),
    createTableColumn<RemessaCardData>({
      columnId: 'prioridade',
      renderHeaderCell: () => 'Prioridade',
      renderCell: (item) => getPrioridadeLabel(item.prioridade),
    }),
    createTableColumn<RemessaCardData>({
      columnId: 'previsao',
      renderHeaderCell: () => 'Previsão chegada',
      renderCell: (item) => formatDate(item.previsaoChegada),
    }),
  ];

  const activeFilters = useMemo(() => {
    const filters = [];
    if (stageFilter !== 'all') {
      filters.push({
        id: 'stage',
        label: `Estágio: ${getStageLabel(Number(stageFilter))}`,
      });
    }
    if (priorityFilter !== 'all') {
      filters.push({
        id: 'priority',
        label: `Prioridade: ${getPrioridadeLabel(Number(priorityFilter))}`,
      });
    }
    return filters;
  }, [priorityFilter, stageFilter]);

  const handleClearFilter = (id: string) => {
    if (id === 'stage') setStageFilter('all');
    if (id === 'priority') setPriorityFilter('all');
  };

  const handleClearAll = () => {
    setStageFilter('all');
    setPriorityFilter('all');
  };

  return (
    <div className="flex flex-col h-full">
      <Toaster toasterId={toasterId} />
      <PageHeader
        title="Gestão de Remessas"
        subtitle="Monitoramento, logística e histórico das remessas"
        kpis={[
          {
            label: 'Atrasadas',
            value: kpis.atrasadas,
            icon: <Warning24Regular />,
            color: kpis.atrasadas > 0 ? tokens.colorPaletteRedForeground2 : tokens.colorNeutralForeground2,
          },
          {
            label: 'Chegam hoje/amanhã',
            value: kpis.chegando,
            icon: <CalendarClock24Regular />,
            color: tokens.colorPaletteGreenForeground2,
          },
          {
            label: 'Em trânsito',
            value: kpis.emTransito,
            icon: <Box24Regular />,
            color: tokens.colorPaletteBlueForeground2,
          },
        ]}
        tabs={[
          { value: 'kanban', label: 'Kanban' },
          { value: 'lista', label: 'Lista' },
        ]}
        selectedTab={selectedTab}
        onTabSelect={setSelectedTab}
      />

      <PageContainer>
        <div className="flex items-center justify-between gap-4 mb-3">
          <FilterBar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filters={[
              {
                id: 'stage',
                label: 'Estágio',
                selectedKey: stageFilter,
                options: [
                  { key: 'all', text: 'Todos' },
                  ...REMESSA_STAGES.map((stage) => ({ key: String(stage.value), text: stage.label })),
                ],
                onChange: setStageFilter,
              },
              {
                id: 'priority',
                label: 'Prioridade',
                selectedKey: priorityFilter,
                options: [
                  { key: 'all', text: 'Todas' },
                  ...REMESSA_PRIORITIES.map((item) => ({ key: String(item.value), text: item.label })),
                ],
                onChange: setPriorityFilter,
              },
            ]}
            activeFilters={activeFilters}
            onClearFilter={handleClearFilter}
            onClearAll={handleClearAll}
          />
          <Button appearance="secondary" icon={<ArrowSync24Regular />} onClick={refreshAll}>
            Atualizar
          </Button>
        </div>

        <Drawer
          open={selectedRemessaId !== null}
          position="end"
          size="large"
          onOpenChange={(_, data) => {
            if (!data.open) {
              setSelectedRemessaId(null);
            }
          }}
        >
          <DrawerHeader>
            <DrawerHeaderTitle
              action={
                <Button
                  appearance="subtle"
                  icon={<Dismiss24Regular />}
                  onClick={() => setSelectedRemessaId(null)}
                  aria-label="Fechar painel"
                />
              }
            >
              Detalhes da Remessa
            </DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody>
            <RemessaDetailsPanel
              remessa={selectedRemessa}
              saving={saving}
              transportadoras={transportadoras}
              produtos={produtos}
              produtosLoading={produtosLoading}
              cotacoes={cotacoes}
              cotacoesLoading={cotacoesLoading}
              historico={historico}
              historicoLoading={historicoLoading}
              selectedProdutos={selectedProdutos}
              onSalvar={handleSalvarDetalhes}
              onSelecionarProdutos={setSelectedProdutos}
              onOpenDividir={async () => {
                await loadRemessaOptions();
                setDialogs((prev) => ({ ...prev, dividir: true }));
              }}
              onOpenJuntar={async () => {
                await loadRemessaOptions();
                setDialogs((prev) => ({ ...prev, juntar: true }));
              }}
              onOpenMover={async () => {
                await loadRemessaOptions();
                setDialogs((prev) => ({ ...prev, mover: true }));
              }}
            />
          </DrawerBody>
        </Drawer>

        {selectedTab === 'kanban' && (
          <div>
            {loading ? (
              <LoadingState />
            ) : (
              <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                <KanbanBoard>
                  {effectiveStages.map((stage) => (
                    <KanbanColumn
                      key={stage.value}
                      stageValue={stage.value}
                      title={stage.label}
                      count={(columns[stage.value] || []).length}
                      lateCount={(columns[stage.value] || []).filter(isRemessaAtrasada).length}
                    >
                      <SortableContext
                        items={(columns[stage.value] || []).map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {(columns[stage.value] || []).map((item) => (
                          <RemessaCard
                            key={item.id}
                            item={item}
                            title={`${item.codigo ?? item.id} - ${item.fornecedor ?? 'Fornecedor'}`}
                            isSelected={item.id === selectedRemessaId}
                            onSelect={handleCardSelect}
                            onOpen={handleOpenRemessa}
                          />
                        ))}
                      </SortableContext>
                    </KanbanColumn>
                  ))}
                </KanbanBoard>
              </DndContext>
            )}
          </div>
        )}

        {selectedTab === 'lista' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Button appearance="secondary" onClick={() => setDialogs((prev) => ({ ...prev, batchStage: true }))} disabled={listSelection.length === 0}>
                Atualizar estágio
              </Button>
              <Button appearance="secondary" onClick={() => setDialogs((prev) => ({ ...prev, batchTransportadora: true }))} disabled={listSelection.length === 0}>
                Atualizar transportadora
              </Button>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {listSelection.length > 0 ? `${listSelection.length} selecionadas` : 'Nenhuma selecionada'}
              </Text>
            </div>
            {listLoading ? (
              <LoadingState />
            ) : (
              <DataGrid
                items={listItems}
                columns={listColumns}
                selectionMode="multiselect"
                onSelectionChange={setListSelection}
                getRowId={(item) => item.id}
                emptyState={<EmptyState title="Sem remessas" description="Nenhuma remessa encontrada com os filtros atuais." />}
              />
            )}
          </div>
        )}
      </PageContainer>

      <DividirRemessaDialog
        open={dialogs.dividir}
        produtos={produtos}
        selectedCount={selectedProdutos.length}
        selectedProdutos={selectedProdutos}
        loading={saving}
        produtosLoading={produtosLoading}
        onOpenChange={(open) => setDialogs((prev) => ({ ...prev, dividir: open }))}
        onSelectionChange={setSelectedProdutos}
        onConfirm={handleDividir}
      />
      <JuntarRemessasDialog
        open={dialogs.juntar}
        loading={saving}
        options={remessaOptions}
        defaultPrincipalId={selectedRemessa?.id ?? null}
        onOpenChange={(open) => setDialogs((prev) => ({ ...prev, juntar: open }))}
        onConfirm={handleJuntar}
      />
      <MoverProdutosDialog
        open={dialogs.mover}
        loading={saving}
        selectedCount={selectedProdutos.length}
        options={remessaOptions}
        onOpenChange={(open) => setDialogs((prev) => ({ ...prev, mover: open }))}
        onConfirm={handleMoverProdutos}
      />

      <DialogBatchStage
        open={dialogs.batchStage}
        loading={saving}
        value={batchStageValue}
        onChange={setBatchStageValue}
        onOpenChange={(open) => setDialogs((prev) => ({ ...prev, batchStage: open }))}
        onConfirm={handleBatchStage}
      />
      <DialogBatchTransportadora
        open={dialogs.batchTransportadora}
        loading={saving}
        value={batchTransportadoraId}
        transportadoras={transportadoras}
        onChange={setBatchTransportadoraId}
        onOpenChange={(open) => setDialogs((prev) => ({ ...prev, batchTransportadora: open }))}
        onConfirm={handleBatchTransportadora}
      />
    </div>
  );
}

interface DialogBatchStageProps {
  open: boolean;
  loading?: boolean;
  value: string;
  onChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function DialogBatchStage({ open, loading, value, onChange, onOpenChange, onConfirm }: DialogBatchStageProps) {
  const selectedLabel = value
    ? REMESSA_STAGES.find((stage) => String(stage.value) === value)?.label ?? ''
    : '';

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Atualizar estágio (em lote)</DialogTitle>
          <DialogContent>
            <Field label="Estágio">
              <Dropdown
                value={selectedLabel}
                placeholder="Selecione um estágio"
                onOptionSelect={(_, data) => onChange(data.optionValue as string)}
              >
                {REMESSA_STAGES.map((stage) => (
                  <Option key={stage.value} value={String(stage.value)}>
                    {stage.label}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button appearance="primary" onClick={onConfirm} disabled={!value || loading}>
              Aplicar
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

interface DialogBatchTransportadoraProps {
  open: boolean;
  loading?: boolean;
  value: string;
  transportadoras: TransportadoraOption[];
  onChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function DialogBatchTransportadora({
  open,
  loading,
  value,
  transportadoras,
  onChange,
  onOpenChange,
  onConfirm,
}: DialogBatchTransportadoraProps) {
  const selectedLabel = value
    ? transportadoras.find((item) => item.id === value)?.label ?? ''
    : '';

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Atualizar transportadora (em lote)</DialogTitle>
          <DialogContent>
            <Field label="Transportadora">
              <Dropdown
                value={selectedLabel}
                placeholder="Selecione uma transportadora"
                onOptionSelect={(_, data) => onChange(data.optionValue as string)}
              >
                {transportadoras.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {item.label}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button appearance="primary" onClick={onConfirm} disabled={!value || loading}>
              Aplicar
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
