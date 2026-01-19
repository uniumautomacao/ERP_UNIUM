import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Option, Text, tokens } from '@fluentui/react-components';
import { Add24Regular, ArrowSync24Regular } from '@fluentui/react-icons';
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { FilterBar } from '../../components/shared/FilterBar';
import { LoadingState } from '../../components/shared/LoadingState';
import { KanbanBoard } from '../../components/domain/rmas/KanbanBoard';
import { KanbanColumn } from '../../components/domain/rmas/KanbanColumn';
import { RmaCard } from '../../components/domain/rmas/RmaCard';
import { useCurrentSystemUser } from '../../hooks/useCurrentSystemUser';
import {
  APP_PREFERENCE_RMA_CONTEXT_PREFIX,
  APP_PREFERENCE_STAGE_PREFIX,
  DYNAMICS_CADASTRO_MERCADORIA_URL,
  DYNAMICS_RMA_RECORD_URL_BASE,
  RMA_STAGE_DEFAULTS,
  RMA_STAGE_DEVOLVIDO,
  RMA_STAGES,
} from '../../features/rmas/constants';
import { buildRmaSearchFilter, getStageOwnerLabel } from '../../features/rmas/utils';
import { RmaCardData } from '../../features/rmas/types';
import { New_rmasService } from '../../generated/services/New_rmasService';
import { NewAppPreferenceService } from '../../generated/services/NewAppPreferenceService';

interface PreferenceRecord {
  id: string;
  key: string;
  boolValue?: boolean;
}

const selectFields = [
  'new_rmaid',
  'new_id',
  'new_situacao',
  'new_posicao',
  'new_descricao',
  'new_observacoes',
  'new_datadolembrete',
  'new_lembreteexpirado',
  'new_sinalizar',
  'new_tipoderma',
  'new_clienteinformadosobreestagioatual',
  'new_ultimoestagioinformadoaocliente',
  'new_nomedoclientefx',
  'new_projetoapelidofx',
  'new_assistenciatecnica',
  'new_codigoderastreiodatransportadora',
];

export function RMAsKanbanPage() {
  const { systemUserId, loading: userLoading, error: userError } = useCurrentSystemUser();
  const [searchValue, setSearchValue] = useState('');
  const [selectedStages, setSelectedStages] = useState<number[]>([]);
  const [preferences, setPreferences] = useState<Record<string, PreferenceRecord>>({});
  const [columns, setColumns] = useState<Record<number, RmaCardData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveStages = useMemo(() => {
    const stageValues = selectedStages.length
      ? selectedStages
      : RMA_STAGE_DEFAULTS.map((stage) => stage.value);
    return RMA_STAGES.filter((stage) => stageValues.includes(stage.value) && stage.value !== RMA_STAGE_DEVOLVIDO);
  }, [selectedStages]);

  const openRmaRecord = useCallback((rmaId: string) => {
    window.open(`${DYNAMICS_RMA_RECORD_URL_BASE}${rmaId}`, '_blank');
  }, []);

  const openCadastroMercadoria = useCallback(async (rmaId: string) => {
    if (!systemUserId) return;
    const nowKey = `${APP_PREFERENCE_RMA_CONTEXT_PREFIX}${new Date().toISOString()}`;
    try {
      await NewAppPreferenceService.create({
        new_preferencekey: nowKey,
        new_stringvalue: rmaId,
        'new_User@odata.bind': `/systemusers(${systemUserId})`,
      });
      window.open(DYNAMICS_CADASTRO_MERCADORIA_URL, '_blank');
    } catch (err) {
      console.error('[RMAsKanbanPage] erro ao abrir cadastro mercadoria', err);
      setError('Erro ao abrir cadastro de mercadoria.');
    }
  }, [systemUserId]);

  const mapRecordToCard = useCallback((record: any): RmaCardData => ({
    id: record.new_rmaid,
    stageValue: record.new_situacao ?? undefined,
    position: record.new_posicao ?? null,
    descricao: record.new_descricao ?? null,
    observacoes: record.new_observacoes ?? null,
    lembreteExpirado: Boolean(record.new_lembreteexpirado),
    sinalizar: Boolean(record.new_sinalizar),
    dataLembrete: record.new_datadolembrete ?? null,
    clienteInformado: Boolean(record.new_clienteinformadosobreestagioatual),
    ultimoEstagioInformado: record.new_ultimoestagioinformadoaocliente ?? null,
    nomeClienteFx: record.new_nomedoclientefx ?? null,
    projetoApelidoFx: record.new_projetoapelidofx ?? null,
    assistenciaTecnica: record.new_assistenciatecnica ?? null,
    codigoRastreio: record.new_codigoderastreiodatransportadora ?? null,
    tipoRma: record.new_tipoderma ?? null,
  }), []);

  const buildTitle = useCallback((item: RmaCardData, fallbackId?: string | null) => {
    const idLabel = fallbackId || item.id;
    const name = item.nomeClienteFx || item.projetoApelidoFx;
    return name ? `${idLabel}: ${name}` : `${idLabel}`;
  }, []);

  const loadStagePreferences = useCallback(async () => {
    if (!systemUserId) return;
    try {
      const result = await NewAppPreferenceService.getAll({
        filter: `_new_user_value eq '${systemUserId}' and startswith(new_preferencekey, '${APP_PREFERENCE_STAGE_PREFIX}')`,
        select: ['new_apppreferenceid', 'new_preferencekey', 'new_boolvalue'],
      });
      const prefs: Record<string, PreferenceRecord> = {};
      (result.data || []).forEach((item) => {
        if (item.new_preferencekey && item.new_apppreferenceid) {
          prefs[item.new_preferencekey] = {
            id: item.new_apppreferenceid,
            key: item.new_preferencekey,
            boolValue: item.new_boolvalue,
          };
        }
      });
      setPreferences(prefs);

      const selected = Object.values(prefs)
        .filter((pref) => pref.boolValue)
        .map((pref) => {
          const raw = pref.key.split('_').pop();
          return raw ? Number(raw) : NaN;
        })
        .filter((value) => Number.isFinite(value));
      setSelectedStages(selected as number[]);
    } catch (err) {
      console.error('[RMAsKanbanPage] erro ao carregar preferencias', err);
      setError('Erro ao carregar preferências de estágio.');
    }
  }, [systemUserId]);

  const syncStagePreferences = useCallback(async (stageValues: number[]) => {
    if (!systemUserId) return;
    const nextKeys = new Set(stageValues.map((value) => `${APP_PREFERENCE_STAGE_PREFIX}${value}`));
    const updates: Promise<any>[] = [];

    RMA_STAGE_DEFAULTS.forEach((stage) => {
      const key = `${APP_PREFERENCE_STAGE_PREFIX}${stage.value}`;
      const exists = preferences[key];
      const shouldBeSelected = nextKeys.has(key);

      if (!exists && shouldBeSelected) {
        updates.push(NewAppPreferenceService.create({
          new_preferencekey: key,
          new_boolvalue: true,
          'new_User@odata.bind': `/systemusers(${systemUserId})`,
        }));
      } else if (exists && exists.boolValue !== shouldBeSelected) {
        updates.push(NewAppPreferenceService.update(exists.id, {
          new_boolvalue: shouldBeSelected,
        }));
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      await loadStagePreferences();
    }
  }, [preferences, systemUserId, loadStagePreferences]);

  const loadColumnData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchFilter = buildRmaSearchFilter(searchValue);
      const baseFilter = `statecode eq 0`;
      const promises = effectiveStages.map(async (stage) => {
        const filters = [`${baseFilter}`, `new_situacao eq ${stage.value}`];
        if (searchFilter) {
          filters.push(searchFilter);
        }
        const filter = filters.join(' and ');

        const result = await New_rmasService.getAll({
          select: selectFields,
          filter,
          orderBy: ['new_lembreteexpirado desc', 'new_posicao asc'],
        });
        return {
          stageValue: stage.value,
          items: (result.data || []).map(mapRecordToCard),
        };
      });

      const results = await Promise.all(promises);
      const nextColumns: Record<number, RmaCardData[]> = {};
      results.forEach((column) => {
        nextColumns[column.stageValue] = column.items;
      });
      setColumns(nextColumns);
    } catch (err) {
      console.error('[RMAsKanbanPage] erro ao carregar RMAs', err);
      setError('Erro ao carregar RMAs.');
    } finally {
      setLoading(false);
    }
  }, [effectiveStages, mapRecordToCard, searchValue]);

  const fixMissingPositions = useCallback(async () => {
    try {
      const result = await New_rmasService.getAll({
        filter: 'statecode eq 0 and new_posicao eq null',
        select: ['new_rmaid'],
        top: 500,
      });
      if (!result.data || result.data.length === 0) return;
      await Promise.all(result.data.map((item) => (
        New_rmasService.update(item.new_rmaid, {
          new_posicao: Math.floor(Math.random() * 1001),
        })
      )));
    } catch (err) {
      console.error('[RMAsKanbanPage] erro ao corrigir posicoes', err);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fixMissingPositions();
    await loadColumnData();
  }, [fixMissingPositions, loadColumnData]);

  const handleNewRma = useCallback(async () => {
    setLoading(true);
    try {
      const result = await New_rmasService.getAll({
        filter: `statecode eq 0 and new_situacao ne ${RMA_STAGE_DEVOLVIDO}`,
        select: ['new_posicao'],
        orderBy: ['new_posicao asc'],
        top: 1,
      });
      const minPos = result.data?.[0]?.new_posicao ?? 0;
      const createResult = await New_rmasService.create({
        new_posicao: (typeof minPos === 'number' ? minPos - 1 : 0),
      } as any);
      const rmaId = createResult.data?.new_rmaid || (createResult as any).id;
      if (rmaId) {
        openRmaRecord(rmaId);
      }
    } catch (err) {
      console.error('[RMAsKanbanPage] erro ao criar RMA', err);
      setError('Erro ao criar novo RMA.');
    } finally {
      setLoading(false);
      await loadColumnData();
    }
  }, [loadColumnData, openRmaRecord]);

  const handleClienteInformado = useCallback(async (rmaId: string, checked: boolean) => {
    try {
      const stageValue = Object.values(columns)
        .flat()
        .find((item) => item.id === rmaId)?.stageValue;
      await New_rmasService.update(rmaId, {
        new_ultimoestagioinformadoaocliente: checked ? stageValue ?? null : null,
      } as any);
      await loadColumnData();
    } catch (err) {
      console.error('[RMAsKanbanPage] erro ao atualizar cliente informado', err);
      setError('Erro ao atualizar cliente informado.');
    }
  }, [columns, loadColumnData]);

  const reorderColumn = (stageValue: number, items: RmaCardData[]) => {
    const updated = items.map((item, index) => ({
      ...item,
      position: index * 10,
    }));
    return updated;
  };

  const persistPositions = async (items: RmaCardData[], stageValue: number) => {
    const updates = items.map((item) => New_rmasService.update(item.id, {
      new_posicao: item.position ?? 0,
      new_situacao: stageValue,
    } as any));
    await Promise.all(updates);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const findStageByItem = (id: string) => (
      Object.entries(columns).find(([, items]) => items.some((item) => item.id === id))?.[0]
    );

    const sourceStageKey = findStageByItem(activeId);
    if (!sourceStageKey) return;
    const sourceStage = Number(sourceStageKey);

    const isColumnDrop = overId.startsWith('column-');
    const destStage = isColumnDrop ? Number(overId.replace('column-', '')) : Number(findStageByItem(overId));
    if (!destStage) return;

    if (sourceStage === destStage) {
      const currentItems = columns[sourceStage] || [];
      const oldIndex = currentItems.findIndex((item) => item.id === activeId);
      const newIndex = isColumnDrop ? currentItems.length - 1 : currentItems.findIndex((item) => item.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(currentItems, oldIndex, newIndex);
      const normalized = reorderColumn(sourceStage, reordered);
      setColumns((prev) => ({ ...prev, [sourceStage]: normalized }));
      await persistPositions(normalized, sourceStage);
      return;
    }

    const sourceItems = columns[sourceStage] || [];
    const destItems = columns[destStage] || [];
    const movingItem = sourceItems.find((item) => item.id === activeId);
    if (!movingItem) return;
    const sourceWithout = sourceItems.filter((item) => item.id !== activeId);
    const destIndex = isColumnDrop ? destItems.length : destItems.findIndex((item) => item.id === overId);
    const nextDest = [...destItems];
    nextDest.splice(destIndex === -1 ? destItems.length : destIndex, 0, { ...movingItem, stageValue: destStage });

    const normalizedSource = reorderColumn(sourceStage, sourceWithout);
    const normalizedDest = reorderColumn(destStage, nextDest);

    setColumns((prev) => ({
      ...prev,
      [sourceStage]: normalizedSource,
      [destStage]: normalizedDest,
    }));

    await Promise.all([
      persistPositions(normalizedSource, sourceStage),
      persistPositions(normalizedDest, destStage),
    ]);
  };

  useEffect(() => {
    if (!userLoading && systemUserId) {
      loadStagePreferences();
    }
  }, [userLoading, systemUserId, loadStagePreferences]);

  useEffect(() => {
    if (!systemUserId || userLoading) return;
    const timer = setTimeout(() => {
      loadColumnData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadColumnData, systemUserId, userLoading, searchValue, selectedStages]);

  const commandPrimaryActions = useMemo(() => [
    {
      id: 'new-rma',
      label: 'Novo RMA',
      icon: <Add24Regular />,
      onClick: handleNewRma,
      appearance: 'primary' as const,
    },
    {
      id: 'refresh',
      label: 'Atualizar',
      icon: <ArrowSync24Regular />,
      onClick: handleRefresh,
    },
  ], [handleNewRma, handleRefresh]);

  const stageOptions = RMA_STAGE_DEFAULTS.map((stage) => ({
    key: String(stage.value),
    label: stage.label,
  }));

  if (userLoading) {
    return (
      <>
        <CommandBar primaryActions={[]} />
        <PageHeader title="Quadro de RMAs" subtitle="Carregando usuário..." />
        <PageContainer>
          <LoadingState label="Carregando usuário..." />
        </PageContainer>
      </>
    );
  }

  if (userError) {
    return (
      <>
        <CommandBar primaryActions={[]} />
        <PageHeader title="Quadro de RMAs" subtitle="Erro ao carregar usuário" />
        <PageContainer>
          <EmptyState title="Erro ao carregar usuário" description={userError} />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <CommandBar primaryActions={commandPrimaryActions} />
      <PageHeader
        title="Quadro de RMAs"
        subtitle="Kanban de acompanhamento e movimentação de RMAs"
      />
      <PageContainer>
        <div className="flex flex-col gap-4 h-full min-h-0">
          <div className="flex flex-wrap items-center gap-3">
            <FilterBar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              isInline
            />
            <div className="flex items-center gap-3">
              <Dropdown
                multiselect
                placeholder="Selecione os estágios"
                style={{ minWidth: 260 }}
                selectedOptions={selectedStages.map(String)}
                onOptionSelect={(_, data) => {
                  const selected = (data.selectedOptions || []).map((value) => Number(value));
                  setSelectedStages(selected);
                  syncStagePreferences(selected);
                }}
              >
                {stageOptions.map((stage) => (
                  <Option key={stage.key} value={stage.key}>
                    {stage.label}
                  </Option>
                ))}
              </Dropdown>
              <Text 
                size={200} 
                style={{ 
                  color: tokens.colorNeutralForeground3,
                  whiteSpace: 'nowrap',
                  marginTop: '4px' // Pequeno ajuste para alinhar visualmente com a base do dropdown
                }}
              >
                {selectedStages.length === 0 ? 'Exibindo todos os estágios' : `${selectedStages.length} selecionados`}
              </Text>
            </div>
          </div>

          {loading ? (
            <LoadingState label="Carregando RMAs..." />
          ) : error ? (
            <EmptyState title="Erro ao carregar RMAs" description={error} actionLabel="Tentar novamente" onAction={handleRefresh} />
          ) : effectiveStages.length === 0 ? (
            <EmptyState title="Nenhum estágio disponível" description="Selecione pelo menos um estágio para visualizar o quadro." />
          ) : (
            <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <KanbanBoard>
                {effectiveStages.map((stage) => {
                  const items = columns[stage.value] || [];
                  return (
                    <SortableContext
                      key={stage.value}
                      items={items.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <KanbanColumn
                        stageValue={stage.value}
                        title={stage.label}
                        ownerLabel={getStageOwnerLabel(stage.value)}
                        count={items.length}
                      >
                        {items.map((item) => (
                          <RmaCard
                            key={item.id}
                            item={item}
                            title={buildTitle(item, item.id)}
                            onOpenRma={openRmaRecord}
                            onOpenCadastro={openCadastroMercadoria}
                            onClienteInformadoChange={handleClienteInformado}
                          />
                        ))}
                      </KanbanColumn>
                    </SortableContext>
                  );
                })}
              </KanbanBoard>
            </DndContext>
          )}
        </div>
      </PageContainer>
    </>
  );
}
