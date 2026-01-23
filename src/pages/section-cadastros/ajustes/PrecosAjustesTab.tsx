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
  Cr22fFornecedoresFromSharepointListService,
  Cr22fModelosdeProdutoFromSharepointListService,
  NewPrecodeProdutoService,
  NewTiposervicoprecodeprodutoService,
} from '../../../generated';
import { escapeOData, formatCurrency, formatNumber, toNumberOrUndefined } from './ajustesCadastroProdutosUtils';

type PrecoItem = {
  new_precodeprodutoid: string;
  new_descricao?: string;
  new_referenciadoproduto?: string;
  new_precobase?: number;
  new_descontopercentualdecompra?: number;
  new_markup?: number;
  new_requerinstalacao?: boolean;
  new_aceitadesconto?: boolean;
  new_taxadeservico?: number;
  _new_modelodeproduto_value?: string;
  _new_fornecedor_value?: string;
};

type LookupOption = {
  id: string;
  label: string;
};

type PriceFormState = {
  referencia: string;
  descricao: string;
  modeloId: string;
  fornecedorId: string;
  precoBase: string;
  descontoCompra: string;
  markup: string;
  taxaServico: string;
  requerInstalacao: boolean;
  aceitaDesconto: boolean;
};

type ActionMode = 'edit' | 'duplicate' | 'copy';

const emptyForm = (): PriceFormState => ({
  referencia: '',
  descricao: '',
  modeloId: '',
  fornecedorId: '',
  precoBase: '',
  descontoCompra: '',
  markup: '',
  taxaServico: '',
  requerInstalacao: false,
  aceitaDesconto: false,
});

type PrecosAjustesTabProps = {
  refreshToken: number;
};

export function PrecosAjustesTab({ refreshToken }: PrecosAjustesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<PrecoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modeloFiltroId, setModeloFiltroId] = useState('');
  const [modeloFiltroLabel, setModeloFiltroLabel] = useState('');
  const [selectedItem, setSelectedItem] = useState<PrecoItem | null>(null);
  const [form, setForm] = useState<PriceFormState>(emptyForm());
  const [mode, setMode] = useState<ActionMode>('edit');
  const [copyServices, setCopyServices] = useState(true);
  const [destinoModeloId, setDestinoModeloId] = useState('');
  const [destinoModeloLabel, setDestinoModeloLabel] = useState('');
  const [modeloLabel, setModeloLabel] = useState('');
  const [fornecedorLabel, setFornecedorLabel] = useState('');

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

  const resolveFornecedorLabel = useCallback(async (id: string) => {
    if (!id) return '';
    const result = await Cr22fFornecedoresFromSharepointListService.getAll({
      select: ['cr22f_fornecedoresfromsharepointlistid', 'cr22f_title', 'cr22f_nomefantasia'],
      filter: `cr22f_fornecedoresfromsharepointlistid eq '${id}'`,
      top: 1,
    });
    if (result.success && result.data && result.data[0]) {
      return result.data[0].cr22f_title || result.data[0].cr22f_nomefantasia || 'Fornecedor';
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

  const searchFornecedores = useCallback(async (term: string) => {
    const normalized = term.trim();
    const filter =
      normalized.length >= 2
        ? `statecode eq 0 and (contains(cr22f_title, '${escapeOData(normalized)}') or contains(cr22f_nomefantasia, '${escapeOData(normalized)}'))`
        : 'statecode eq 0';

    const result = await Cr22fFornecedoresFromSharepointListService.getAll({
      select: ['cr22f_fornecedoresfromsharepointlistid', 'cr22f_title', 'cr22f_nomefantasia'],
      filter,
      orderBy: ['cr22f_title asc'],
      top: 50,
    });

    if (result.success && result.data) {
      return result.data.map((item: any) => ({
        id: item.cr22f_fornecedoresfromsharepointlistid,
        label: item.cr22f_title || item.cr22f_nomefantasia || 'Fornecedor',
      }));
    }

    return [];
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const select = [
        'new_precodeprodutoid',
        'new_descricao',
        'new_referenciadoproduto',
        'new_precobase',
        'new_descontopercentualdecompra',
        'new_markup',
        'new_requerinstalacao',
        'new_aceitadesconto',
        'new_taxadeservico',
        '_new_modelodeproduto_value',
        '_new_fornecedor_value',
      ];

      const baseFilters = ['statecode eq 0'];
      if (modeloFiltroId) {
        baseFilters.push(`_new_modelodeproduto_value eq '${modeloFiltroId}'`);
      }

      const baseOptions = {
        select,
        orderBy: ['new_referenciadoproduto asc'],
        top: 100,
      };

      const normalized = searchTerm.trim();
      if (normalized.length < 2) {
        const result = await NewPrecodeProdutoService.getAll({
          ...baseOptions,
          filter: baseFilters.join(' and '),
        });

        if (!result.success) {
          throw result.error || new Error('Falha ao buscar preços de produto.');
        }

        setItems((result.data || []) as PrecoItem[]);
        return;
      }

      const escaped = escapeOData(normalized);
      const filters = [
        `contains(new_descricao, '${escaped}')`,
        `contains(new_referenciadoproduto, '${escaped}')`,
      ];

      const responses = await Promise.all(
        filters.map((filter) =>
          NewPrecodeProdutoService.getAll({
            ...baseOptions,
            filter: `${baseFilters.join(' and ')} and ${filter}`,
          })
        )
      );

      const merged = new Map<string, PrecoItem>();
      responses.forEach((response) => {
        if (response.success && response.data) {
          response.data.forEach((item) => {
            merged.set(item.new_precodeprodutoid, item as PrecoItem);
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
      referencia: selectedItem.new_referenciadoproduto || '',
      descricao: selectedItem.new_descricao || '',
      modeloId: selectedItem._new_modelodeproduto_value || '',
      fornecedorId: selectedItem._new_fornecedor_value || '',
      precoBase: selectedItem.new_precobase?.toString() || '',
      descontoCompra: selectedItem.new_descontopercentualdecompra?.toString() || '',
      markup: selectedItem.new_markup?.toString() || '',
      taxaServico: selectedItem.new_taxadeservico?.toString() || '',
      requerInstalacao: Boolean(selectedItem.new_requerinstalacao),
      aceitaDesconto: Boolean(selectedItem.new_aceitadesconto),
    });
    setMode('edit');
    setDestinoModeloId(selectedItem._new_modelodeproduto_value || '');
    setDestinoModeloLabel('');
    setModeloLabel('');
    setFornecedorLabel('');

    let isActive = true;
    const syncLabels = async () => {
      const [modelo, fornecedor] = await Promise.all([
        resolveModeloLabel(selectedItem._new_modelodeproduto_value || ''),
        resolveFornecedorLabel(selectedItem._new_fornecedor_value || ''),
      ]);
      if (!isActive) return;
      setModeloLabel(modelo);
      setDestinoModeloLabel(modelo);
      setFornecedorLabel(fornecedor);
    };
    void syncLabels();

    return () => {
      isActive = false;
    };
  }, [resolveFornecedorLabel, resolveModeloLabel, selectedItem]);

  const handleModeChange = useCallback(
    (nextMode: ActionMode) => {
      if (selectedItem && nextMode !== 'edit') {
        const referenciaAtual = selectedItem.new_referenciadoproduto || '';
        if (form.referencia === referenciaAtual && referenciaAtual.trim()) {
          setForm((prev) => ({ ...prev, referencia: `${referenciaAtual} (cópia)` }));
        }
      }
      setMode(nextMode);
    },
    [form.referencia, selectedItem]
  );

  const buildPayload = useCallback(
    (modeloId: string) => {
      const payload: Record<string, any> = {
        new_descricao: form.descricao.trim(),
        new_referenciadoproduto: form.referencia.trim(),
        new_precobase: toNumberOrUndefined(form.precoBase),
        new_descontopercentualdecompra: toNumberOrUndefined(form.descontoCompra),
        new_markup: toNumberOrUndefined(form.markup),
        new_taxadeservico: toNumberOrUndefined(form.taxaServico),
        new_requerinstalacao: form.requerInstalacao,
        new_aceitadesconto: form.aceitaDesconto,
      };

      if (modeloId) {
        payload['new_ModelodeProduto@odata.bind'] = `/cr22f_modelosdeprodutofromsharepointlists(${modeloId})`;
      }

      if (form.fornecedorId) {
        payload['new_Fornecedor@odata.bind'] = `/cr22f_fornecedoresfromsharepointlists(${form.fornecedorId})`;
      }

      return payload;
    },
    [form]
  );

  const copyVinculosServico = useCallback(
    async (novoPrecoId: string) => {
      if (!selectedItem || !copyServices) return;

      const vinculosResult = await NewTiposervicoprecodeprodutoService.getAll({
        select: ['_new_tipodeservico_value', 'new_tiposervicoprecodeprodutoid'],
        filter: `_new_precodeproduto_value eq '${selectedItem.new_precodeprodutoid}' and statecode eq 0`,
      });

      if (vinculosResult.success && vinculosResult.data && vinculosResult.data.length > 0) {
        await Promise.all(
          vinculosResult.data.map((item: any) =>
            NewTiposervicoprecodeprodutoService.create({
              'new_TipodeServico@odata.bind': `/new_tipodeservicos(${item._new_tipodeservico_value})`,
              'new_PrecodeProduto@odata.bind': `/new_precodeprodutos(${novoPrecoId})`,
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
        title: 'Selecione um preço',
        body: 'Escolha um preço de produto na lista para editar ou copiar.',
      });
      return;
    }

    const modeloDestino = mode === 'edit' ? form.modeloId : destinoModeloId;
    if (!modeloDestino) {
      setMessage({
        intent: 'warning',
        title: 'Selecione o modelo de produto',
        body: 'Informe o modelo de produto para salvar as alterações.',
      });
      return;
    }

    if (!form.referencia.trim()) {
      setMessage({
        intent: 'warning',
        title: 'Informe a referência',
        body: 'Preencha a referência antes de salvar.',
      });
      return;
    }

    setActionBusy(true);
    setMessage(null);

    try {
      if (mode === 'edit') {
        const payload = buildPayload(form.modeloId);
        const result = await NewPrecodeProdutoService.update(selectedItem.new_precodeprodutoid, payload);
        if (!result.success) {
          throw result.error || new Error('Falha ao atualizar o preço.');
        }
        setMessage({ intent: 'success', title: 'Preço atualizado com sucesso.' });
      } else {
        const payload = buildPayload(modeloDestino);
        const result = await NewPrecodeProdutoService.create(payload);
        if (!result.success || !result.data) {
          throw result.error || new Error('Falha ao criar o preço.');
        }
        const novoPrecoId = (result.data as any).new_precodeprodutoid;
        if (!novoPrecoId) {
          throw new Error('Não foi possível recuperar o ID do novo preço.');
        }
        await copyVinculosServico(novoPrecoId);
        setMessage({ intent: 'success', title: 'Preço copiado com sucesso.' });
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
      createTableColumn<PrecoItem>({
        columnId: 'referencia',
        renderHeaderCell: () => 'Referência',
        renderCell: (item) => item.new_referenciadoproduto || '-',
      }),
      createTableColumn<PrecoItem>({
        columnId: 'descricao',
        renderHeaderCell: () => 'Descrição',
        renderCell: (item) => item.new_descricao || '-',
      }),
      createTableColumn<PrecoItem>({
        columnId: 'precoBase',
        renderHeaderCell: () => 'Preço Base',
        renderCell: (item) => formatCurrency(item.new_precobase),
      }),
      createTableColumn<PrecoItem>({
        columnId: 'markup',
        renderHeaderCell: () => 'Markup',
        renderCell: (item) => formatNumber(item.new_markup),
      }),
      createTableColumn<PrecoItem>({
        columnId: 'acoes',
        renderHeaderCell: () => 'Ações',
        renderCell: (item) => (
          <Button
            appearance={selectedItem?.new_precodeprodutoid === item.new_precodeprodutoid ? 'primary' : 'secondary'}
            onClick={() => setSelectedItem(item)}
          >
            {selectedItem?.new_precodeprodutoid === item.new_precodeprodutoid ? 'Selecionado' : 'Selecionar'}
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
            Preços de Produto
          </Text>
          <Button icon={<ArrowSync24Regular />} onClick={() => void loadItems()}>
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-modelo-preco">Filtrar por modelo</Label>
            <SearchableCombobox
              id="filtro-modelo-preco"
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
              placeholder="Buscar por referência ou descrição"
              value={searchTerm}
              onChange={(_, data) => setSearchTerm(data.value)}
              onKeyDown={handleSearchKeyDown}
              style={{ flexGrow: 1 }}
            />
            <Button onClick={() => void loadItems()}>Buscar</Button>
          </div>
        </div>

        {loading && <LoadingState label="Carregando preços..." />}
        {!loading && error && (
          <Text size={300} style={{ color: tokens.colorPaletteRedForeground1 }}>
            {error}
          </Text>
        )}
        {!loading && !error && items.length === 0 && (
          <EmptyState title="Nenhum preço encontrado" description="Tente ajustar o termo de busca ou o filtro." />
        )}
        {!loading && !error && items.length > 0 && (
          <DataGrid items={items} columns={columns} getRowId={(item) => item.new_precodeprodutoid} />
        )}
      </Card>

      <Card style={{ padding: 20 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
          Ajustar preço selecionado
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
            title="Selecione um preço"
            description="Escolha um preço na lista ao lado para editar, duplicar ou copiar."
          />
        )}

        {selectedItem && (
          <div className="grid grid-cols-1 gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="modo-preco">Modo de ação</Label>
              <Dropdown
                id="modo-preco"
                value={
                  mode === 'edit'
                    ? 'Editar preço existente'
                    : mode === 'duplicate'
                      ? 'Duplicar preço'
                      : 'Copiar para outro modelo'
                }
                onOptionSelect={(_, data) => handleModeChange((data.optionValue as ActionMode) || 'edit')}
              >
                <Option value="edit">Editar preço existente</Option>
                <Option value="duplicate">Duplicar preço</Option>
                <Option value="copy">Copiar para outro modelo</Option>
              </Dropdown>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="referencia-preco">Referência</Label>
              <Input
                id="referencia-preco"
                value={form.referencia}
                onChange={(_, data) => setForm((prev) => ({ ...prev, referencia: data.value }))}
                placeholder="Referência do produto"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="descricao-preco">Descrição</Label>
              <Input
                id="descricao-preco"
                value={form.descricao}
                onChange={(_, data) => setForm((prev) => ({ ...prev, descricao: data.value }))}
                placeholder="Descrição"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="modelo-preco">Modelo de Produto</Label>
              <SearchableCombobox
                id="modelo-preco"
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="fornecedor-preco">Fornecedor</Label>
              <SearchableCombobox
                id="fornecedor-preco"
                placeholder="Buscar fornecedor"
                value={fornecedorLabel}
                selectedId={form.fornecedorId}
                onSelect={(id, label) => {
                  setForm((prev) => ({ ...prev, fornecedorId: id || '' }));
                  setFornecedorLabel(label);
                }}
                onSearch={searchFornecedores}
              />
            </div>

            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="preco-base">Preço Base</Label>
                <Input
                  id="preco-base"
                  type="number"
                  value={form.precoBase}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, precoBase: data.value }))}
                  placeholder="Preço Base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="desconto-compra">Desconto Percentual de Compra</Label>
                <Input
                  id="desconto-compra"
                  type="number"
                  value={form.descontoCompra}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, descontoCompra: data.value }))}
                  placeholder="Desconto Percentual de Compra"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="markup-preco">Markup</Label>
                <Input
                  id="markup-preco"
                  type="number"
                  value={form.markup}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, markup: data.value }))}
                  placeholder="Markup"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="taxa-servico">Taxa de Serviço</Label>
                <Input
                  id="taxa-servico"
                  type="number"
                  value={form.taxaServico}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, taxaServico: data.value }))}
                  placeholder="Taxa de Serviço"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Label>Opções</Label>
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
                <Checkbox
                  checked={form.requerInstalacao}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, requerInstalacao: Boolean(data.checked) }))}
                  label="Requer Instalação"
                />
                <Checkbox
                  checked={form.aceitaDesconto}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, aceitaDesconto: Boolean(data.checked) }))}
                  label="Aceita Desconto"
                />
              </div>
            </div>

            {mode !== 'edit' && (
              <div className="flex flex-col gap-2">
                <Checkbox
                  checked={copyServices}
                  onChange={(_, data) => setCopyServices(Boolean(data.checked))}
                  label="Copiar vínculos de serviços do preço original"
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
