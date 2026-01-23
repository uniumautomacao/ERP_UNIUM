import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Dropdown,
  Input,
  Label,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  Text,
  tokens,
} from '@fluentui/react-components';
import { ArrowSync24Regular, Search24Regular, Save24Regular, Copy24Regular } from '@fluentui/react-icons';
import { DataGrid, createTableColumn } from '../../../components/shared/DataGrid';
import { EmptyState } from '../../../components/shared/EmptyState';
import { LoadingState } from '../../../components/shared/LoadingState';
import { SearchableCombobox } from '../../../components/shared/SearchableCombobox';
import {
  Cr22fModelosdeProdutoFromSharepointListService,
  NewRegimedecotacaotemporariaService,
  NewTipodeservicoregimedecotacaotemporariaService,
} from '../../../generated';
import { escapeOData, formatNumber, toNumberOrUndefined } from './ajustesCadastroProdutosUtils';

type RegimeItem = {
  new_regimedecotacaotemporariaid: string;
  new_name?: string;
  new_referenciadoproduto?: string;
  new_validade?: number;
  new_markup?: number;
  new_descontopercentualdecompra?: number;
  _new_modelodeproduto_value?: string;
};

type LookupOption = {
  id: string;
  label: string;
};

type RegimeFormState = {
  nome: string;
  referencia: string;
  modeloId: string;
  validade: string;
  markup: string;
  desconto: string;
};

type ActionMode = 'edit' | 'duplicate' | 'copy';

const emptyForm = (): RegimeFormState => ({
  nome: '',
  referencia: '',
  modeloId: '',
  validade: '',
  markup: '',
  desconto: '',
});

type RegimesAjustesTabProps = {
  refreshToken: number;
};

export function RegimesAjustesTab({ refreshToken }: RegimesAjustesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<RegimeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modeloFiltroId, setModeloFiltroId] = useState('');
  const [modeloFiltroLabel, setModeloFiltroLabel] = useState('');
  const [selectedItem, setSelectedItem] = useState<RegimeItem | null>(null);
  const [form, setForm] = useState<RegimeFormState>(emptyForm());
  const [mode, setMode] = useState<ActionMode>('edit');
  const [copyServices, setCopyServices] = useState(true);
  const [destinoModeloId, setDestinoModeloId] = useState('');
  const [destinoModeloLabel, setDestinoModeloLabel] = useState('');
  const [modeloLabel, setModeloLabel] = useState('');

  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState<{ intent: 'success' | 'error' | 'warning'; title: string; body?: string } | null>(
    null
  );

  const resolveModeloLabel = useCallback(async (id: string) => {
    if (!id) return '';
    const result = await Cr22fModelosdeProdutoFromSharepointListService.getAll({
      select: ['cr22f_modelosdeprodutofromsharepointlistid', 'cr22f_title'],
      filter: `cr22f_modelosdeprodutofromsharepointlistid eq '${id}'`,
      top: 1,
    });
    if (result.success && result.data && result.data[0]) {
      return result.data[0].cr22f_title || 'Modelo';
    }
    return '';
  }, []);

  const searchModelos = useCallback(async (term: string) => {
    const normalized = term.trim();
    const filter =
      normalized.length >= 2
        ? `statecode eq 0 and (contains(cr22f_title, '${escapeOData(normalized)}') or contains(new_descricao, '${escapeOData(normalized)}'))`
        : 'statecode eq 0';

    const result = await Cr22fModelosdeProdutoFromSharepointListService.getAll({
      select: ['cr22f_modelosdeprodutofromsharepointlistid', 'cr22f_title'],
      filter,
      orderBy: ['cr22f_title asc'],
      top: 50,
    });

    if (result.success && result.data) {
      return result.data.map((item: any) => ({
        id: item.cr22f_modelosdeprodutofromsharepointlistid,
        label: item.cr22f_title || 'Modelo',
      }));
    }

    return [];
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const select = [
        'new_regimedecotacaotemporariaid',
        'new_name',
        'new_referenciadoproduto',
        'new_validade',
        'new_markup',
        'new_descontopercentualdecompra',
        '_new_modelodeproduto_value',
      ];

      const baseFilters = ['statecode eq 0'];
      if (modeloFiltroId) {
        baseFilters.push(`_new_modelodeproduto_value eq '${modeloFiltroId}'`);
      }

      const baseOptions = {
        select,
        orderBy: ['new_name asc'],
        top: 100,
      };

      const normalized = searchTerm.trim();
      if (normalized.length < 2) {
        const result = await NewRegimedecotacaotemporariaService.getAll({
          ...baseOptions,
          filter: baseFilters.join(' and '),
        });

        if (!result.success) {
          throw result.error || new Error('Falha ao buscar regimes de cotação.');
        }

        setItems((result.data || []) as RegimeItem[]);
        return;
      }

      const escaped = escapeOData(normalized);
      const filters = [
        `contains(new_name, '${escaped}')`,
        `contains(new_referenciadoproduto, '${escaped}')`,
      ];

      const responses = await Promise.all(
        filters.map((filter) =>
          NewRegimedecotacaotemporariaService.getAll({
            ...baseOptions,
            filter: `${baseFilters.join(' and ')} and ${filter}`,
          })
        )
      );

      const merged = new Map<string, RegimeItem>();
      responses.forEach((response) => {
        if (response.success && response.data) {
          response.data.forEach((item) => {
            merged.set(item.new_regimedecotacaotemporariaid, item as RegimeItem);
          });
        }
      });

      setItems(Array.from(merged.values()));
    } catch (loadError) {
      const messageText = loadError instanceof Error ? loadError.message : String(loadError);
      setError(messageText);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [modeloFiltroId, searchTerm]);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshToken]);

  useEffect(() => {
    if (!selectedItem) {
      setForm(emptyForm());
      setMode('edit');
      setDestinoModeloId('');
      return;
    }

    setForm({
      nome: selectedItem.new_name || '',
      referencia: selectedItem.new_referenciadoproduto || '',
      modeloId: selectedItem._new_modelodeproduto_value || '',
      validade: selectedItem.new_validade?.toString() || '',
      markup: selectedItem.new_markup?.toString() || '',
      desconto: selectedItem.new_descontopercentualdecompra?.toString() || '',
    });
    setMode('edit');
    setDestinoModeloId(selectedItem._new_modelodeproduto_value || '');
    setDestinoModeloLabel('');
    setModeloLabel('');

    let isActive = true;
    const syncLabels = async () => {
      const modelo = await resolveModeloLabel(selectedItem._new_modelodeproduto_value || '');
      if (!isActive) return;
      setModeloLabel(modelo);
      setDestinoModeloLabel(modelo);
    };
    void syncLabels();

    return () => {
      isActive = false;
    };
  }, [resolveModeloLabel, selectedItem]);

  const handleModeChange = useCallback(
    (nextMode: ActionMode) => {
      if (selectedItem && nextMode !== 'edit') {
        const nomeAtual = selectedItem.new_name || '';
        if (form.nome === nomeAtual && nomeAtual.trim()) {
          setForm((prev) => ({ ...prev, nome: `${nomeAtual} (cópia)` }));
        }
      }
      setMode(nextMode);
    },
    [form.nome, selectedItem]
  );

  const buildPayload = useCallback(
    (modeloId: string) => {
      const payload: Record<string, any> = {
        new_name: form.nome.trim(),
        new_referenciadoproduto: form.referencia.trim(),
        new_validade: toNumberOrUndefined(form.validade),
        new_markup: toNumberOrUndefined(form.markup),
        new_descontopercentualdecompra: toNumberOrUndefined(form.desconto),
      };

      if (modeloId) {
        payload['new_ModelodeProduto@odata.bind'] = `/cr22f_modelosdeprodutofromsharepointlists(${modeloId})`;
      }

      return payload;
    },
    [form]
  );

  const copyVinculosServico = useCallback(
    async (novoRegimeId: string) => {
      if (!selectedItem || !copyServices) return;

      const servicosResult = await NewTipodeservicoregimedecotacaotemporariaService.getAll({
        select: ['_new_tipodeservico_value', 'new_descricao', 'new_tipodeservicoregimedecotacaotemporariaid'],
        filter: `_new_regime_value eq '${selectedItem.new_regimedecotacaotemporariaid}' and statecode eq 0`,
      });

      if (servicosResult.success && servicosResult.data && servicosResult.data.length > 0) {
        await Promise.all(
          servicosResult.data.map((item: any) =>
            NewTipodeservicoregimedecotacaotemporariaService.create({
              new_descricao: item.new_descricao,
              'new_Regime@odata.bind': `/new_regimedecotacaotemporarias(${novoRegimeId})`,
              'new_TipodeServico@odata.bind': `/new_tipodeservicos(${item._new_tipodeservico_value})`,
            })
          )
        );
      }
    },
    [copyServices, selectedItem]
  );

  const handleSave = useCallback(async () => {
    if (!selectedItem) {
      setMessage({
        intent: 'warning',
        title: 'Selecione um regime',
        body: 'Escolha um regime de cotação na lista para editar ou copiar.',
      });
      return;
    }

    const modeloDestino = mode === 'edit' ? form.modeloId : destinoModeloId;
    if (!modeloDestino) {
      setMessage({
        intent: 'warning',
        title: 'Selecione o modelo de produto',
        body: 'Informe o modelo para salvar o regime.',
      });
      return;
    }

    if (!form.nome.trim()) {
      setMessage({
        intent: 'warning',
        title: 'Informe o nome do regime',
        body: 'Preencha o nome do regime antes de salvar.',
      });
      return;
    }

    setActionBusy(true);
    setMessage(null);

    try {
      if (mode === 'edit') {
        const payload = buildPayload(form.modeloId);
        const result = await NewRegimedecotacaotemporariaService.update(
          selectedItem.new_regimedecotacaotemporariaid,
          payload
        );
        if (!result.success) {
          throw result.error || new Error('Falha ao atualizar o regime.');
        }
        setMessage({ intent: 'success', title: 'Regime atualizado com sucesso.' });
      } else {
        const payload = buildPayload(modeloDestino);
        const result = await NewRegimedecotacaotemporariaService.create(payload);
        if (!result.success || !result.data) {
          throw result.error || new Error('Falha ao criar o regime.');
        }
        const novoRegimeId = (result.data as any).new_regimedecotacaotemporariaid;
        if (!novoRegimeId) {
          throw new Error('Não foi possível recuperar o ID do novo regime.');
        }
        await copyVinculosServico(novoRegimeId);
        setMessage({ intent: 'success', title: 'Regime copiado com sucesso.' });
      }

      await loadItems();
    } catch (saveError) {
      const messageText = saveError instanceof Error ? saveError.message : String(saveError);
      setMessage({ intent: 'error', title: 'Erro ao salvar', body: messageText });
    } finally {
      setActionBusy(false);
    }
  }, [buildPayload, copyVinculosServico, form, loadItems, mode, destinoModeloId, selectedItem]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void loadItems();
      }
    },
    [loadItems]
  );

  const columns = useMemo(
    () => [
      createTableColumn<RegimeItem>({
        columnId: 'nome',
        renderHeaderCell: () => 'Nome do Regime',
        renderCell: (item) => item.new_name || '-',
      }),
      createTableColumn<RegimeItem>({
        columnId: 'referencia',
        renderHeaderCell: () => 'Referência',
        renderCell: (item) => item.new_referenciadoproduto || '-',
      }),
      createTableColumn<RegimeItem>({
        columnId: 'validade',
        renderHeaderCell: () => 'Validade',
        renderCell: (item) => (item.new_validade !== undefined ? item.new_validade : '-'),
      }),
      createTableColumn<RegimeItem>({
        columnId: 'markup',
        renderHeaderCell: () => 'Markup',
        renderCell: (item) => formatNumber(item.new_markup),
      }),
      createTableColumn<RegimeItem>({
        columnId: 'acoes',
        renderHeaderCell: () => 'Ações',
        renderCell: (item) => (
          <Button
            appearance={
              selectedItem?.new_regimedecotacaotemporariaid === item.new_regimedecotacaotemporariaid
                ? 'primary'
                : 'secondary'
            }
            onClick={() => setSelectedItem(item)}
          >
            {selectedItem?.new_regimedecotacaotemporariaid === item.new_regimedecotacaotemporariaid
              ? 'Selecionado'
              : 'Selecionar'}
          </Button>
        ),
      }),
    ],
    [selectedItem]
  );

  return (
    <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
      <Card style={{ padding: 20 }}>
        <div className="flex items-center justify-between gap-3 mb-5">
          <Text size={500} weight="semibold">
            Regimes de Cotação Temporária
          </Text>
          <Button icon={<ArrowSync24Regular />} onClick={() => void loadItems()}>
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-modelo-regime">Filtrar por modelo</Label>
            <SearchableCombobox
              id="filtro-modelo-regime"
              placeholder="Todos os modelos"
              value={modeloFiltroLabel}
              selectedId={modeloFiltroId}
              onSelect={(id, label) => {
                setModeloFiltroId(id || '');
                setModeloFiltroLabel(label);
              }}
              onSearch={searchModelos}
            />
          </div>

          <div className="flex items-center gap-3">
            <Input
              contentBefore={<Search24Regular />}
              placeholder="Buscar por nome ou referência"
              value={searchTerm}
              onChange={(_, data) => setSearchTerm(data.value)}
              onKeyDown={handleSearchKeyDown}
              style={{ flexGrow: 1 }}
            />
            <Button onClick={() => void loadItems()}>Buscar</Button>
          </div>
        </div>

        {loading && <LoadingState label="Carregando regimes..." />}
        {!loading && error && (
          <Text size={300} style={{ color: tokens.colorPaletteRedForeground1 }}>
            {error}
          </Text>
        )}
        {!loading && !error && items.length === 0 && (
          <EmptyState title="Nenhum regime encontrado" description="Tente ajustar o termo de busca ou o filtro." />
        )}
        {!loading && !error && items.length > 0 && (
          <DataGrid items={items} columns={columns} getRowId={(item) => item.new_regimedecotacaotemporariaid} />
        )}
      </Card>

      <Card style={{ padding: 20 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
          Ajustar regime selecionado
        </Text>

        {message && (
          <div className="mb-4">
            <MessageBar intent={message.intent}>
              <MessageBarBody>
                <MessageBarTitle>{message.title}</MessageBarTitle>
                {message.body && <div>{message.body}</div>}
              </MessageBarBody>
            </MessageBar>
          </div>
        )}

        {!selectedItem && (
          <EmptyState
            title="Selecione um regime"
            description="Escolha um regime na lista ao lado para editar, duplicar ou copiar."
          />
        )}

        {selectedItem && (
          <div className="grid grid-cols-1 gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="modo-regime">Modo de ação</Label>
              <Dropdown
                id="modo-regime"
                value={
                  mode === 'edit'
                    ? 'Editar regime existente'
                    : mode === 'duplicate'
                      ? 'Duplicar regime'
                      : 'Copiar para outro modelo'
                }
                onOptionSelect={(_, data) => handleModeChange((data.optionValue as ActionMode) || 'edit')}
              >
                <Option value="edit">Editar regime existente</Option>
                <Option value="duplicate">Duplicar regime</Option>
                <Option value="copy">Copiar para outro modelo</Option>
              </Dropdown>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="nome-regime">Nome do Regime</Label>
              <Input
                id="nome-regime"
                value={form.nome}
                onChange={(_, data) => setForm((prev) => ({ ...prev, nome: data.value }))}
                placeholder="Descrição do regime"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="referencia-regime">Referência do Produto</Label>
              <Input
                id="referencia-regime"
                value={form.referencia}
                onChange={(_, data) => setForm((prev) => ({ ...prev, referencia: data.value }))}
                placeholder="Referência do produto"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="modelo-regime">Modelo de Produto</Label>
              <SearchableCombobox
                id="modelo-regime"
                placeholder="Buscar modelo"
                value={mode === 'edit' ? modeloLabel : destinoModeloLabel}
                selectedId={mode === 'edit' ? form.modeloId : destinoModeloId}
                onSelect={(id, label) => {
                  if (mode === 'edit') {
                    setForm((prev) => ({ ...prev, modeloId: id || '' }));
                    setModeloLabel(label);
                  } else {
                    setDestinoModeloId(id || '');
                    setDestinoModeloLabel(label);
                  }
                }}
                onSearch={searchModelos}
              />
            </div>

            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="validade-regime">Validade</Label>
                <Input
                  id="validade-regime"
                  type="number"
                  value={form.validade}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, validade: data.value }))}
                  placeholder="Validade"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="markup-regime">Markup</Label>
                <Input
                  id="markup-regime"
                  type="number"
                  value={form.markup}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, markup: data.value }))}
                  placeholder="Markup"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="desconto-regime">Desconto Percentual de Compra</Label>
                <Input
                  id="desconto-regime"
                  type="number"
                  value={form.desconto}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, desconto: data.value }))}
                  placeholder="Desconto"
                />
              </div>
            </div>

            {mode !== 'edit' && (
              <div className="flex flex-col gap-2">
                <Checkbox
                  checked={copyServices}
                  onChange={(_, data) => setCopyServices(Boolean(data.checked))}
                  label="Copiar serviços vinculados ao regime original"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                appearance="primary"
                icon={mode === 'edit' ? <Save24Regular /> : <Copy24Regular />}
                onClick={handleSave}
                disabled={actionBusy}
              >
                {mode === 'edit' ? 'Salvar alterações' : 'Criar cópia'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
