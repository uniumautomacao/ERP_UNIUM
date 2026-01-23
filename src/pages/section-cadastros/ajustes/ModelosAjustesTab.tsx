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
  Textarea,
  tokens,
} from '@fluentui/react-components';
import { ArrowSync24Regular, Search24Regular, Save24Regular, Copy24Regular } from '@fluentui/react-icons';
import { DataGrid, createTableColumn } from '../../../components/shared/DataGrid';
import { EmptyState } from '../../../components/shared/EmptyState';
import { LoadingState } from '../../../components/shared/LoadingState';
import { SearchableCombobox } from '../../../components/shared/SearchableCombobox';
import {
  Cr22fFabricantesFromSharpointListService,
  Cr22fModelosdeProdutoFromSharepointListService,
} from '../../../generated';
import { escapeOData } from './ajustesCadastroProdutosUtils';

type ModeloItem = {
  cr22f_modelosdeprodutofromsharepointlistid: string;
  cr22f_title?: string;
  cr22f_querycategoria?: string;
  new_descricao?: string;
  new_nomedofabricante?: string;
  new_tipodesistemapadrao?: number;
  new_controlasn?: boolean;
  new_controlaetiqueta?: boolean;
  new_requerconfiguracao?: boolean;
  new_requercabeamento?: boolean;
  new_requerengraving?: boolean;
  new_reservadeprodutolivre?: boolean;
  new_deviceiotemplatejson?: string;
  cr22f_horasagregadas?: string;
  _new_fabricante_value?: string;
};

type LookupOption = {
  id: string;
  label: string;
};

type ModelFormState = {
  referencia: string;
  queryCategoria: string;
  descricao: string;
  fabricanteId: string;
  tipoSistema: number | null;
  controlaSn: boolean;
  controlaEtiqueta: boolean;
  requerConfiguracao: boolean;
  requerCabeamento: boolean;
  requerEngraving: boolean;
  reservaProdutoLivre: boolean;
  deviceTemplateJson: string;
  horasAgregadas: string;
};

type ActionMode = 'edit' | 'duplicate';

const TIPO_SISTEMA_OPTIONS = [
  { value: 100000000, label: 'Automação' },
  { value: 100000001, label: 'Áudio' },
  { value: 100000002, label: 'Vídeo' },
  { value: 100000003, label: 'Aspiração Central' },
  { value: 100000004, label: 'Redes' },
  { value: 100000005, label: 'CFTV' },
  { value: 100000006, label: 'Acústica' },
  { value: 100000007, label: 'Cabos' },
  { value: 100000008, label: 'Controle de Acesso' },
  { value: 100000009, label: 'Acabamentos Elétricos' },
  { value: 100000010, label: 'Eletrodomésticos' },
  { value: 100000011, label: 'Infraestrutura' },
];

const emptyForm = (): ModelFormState => ({
  referencia: '',
  queryCategoria: '',
  descricao: '',
  fabricanteId: '',
  tipoSistema: null,
  controlaSn: false,
  controlaEtiqueta: false,
  requerConfiguracao: false,
  requerCabeamento: false,
  requerEngraving: false,
  reservaProdutoLivre: false,
  deviceTemplateJson: '',
  horasAgregadas: '',
});

type ModelosAjustesTabProps = {
  refreshToken: number;
};

export function ModelosAjustesTab({ refreshToken }: ModelosAjustesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<ModeloItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<ModeloItem | null>(null);
  const [fabricanteLabel, setFabricanteLabel] = useState('');
  const [form, setForm] = useState<ModelFormState>(emptyForm());
  const [mode, setMode] = useState<ActionMode>('edit');

  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState<{ intent: 'success' | 'error' | 'warning'; title: string; body?: string } | null>(
    null
  );

  const searchFabricantes = useCallback(async (term: string) => {
    const normalized = term.trim();
    const filter =
      normalized.length >= 2
        ? `statecode eq 0 and contains(cr22f_title, '${escapeOData(normalized)}')`
        : 'statecode eq 0';

    const result = await Cr22fFabricantesFromSharpointListService.getAll({
      select: ['cr22f_fabricantesfromsharpointlistid', 'cr22f_title', 'cr22f_id'],
      filter,
      orderBy: ['cr22f_title asc'],
      top: 50,
    });

    if (result.success && result.data) {
      return result.data.map((item: any) => ({
        id: item.cr22f_fabricantesfromsharpointlistid,
        label: item.cr22f_title || item.cr22f_id || 'Fabricante',
      }));
    }

    return [];
  }, []);

  const loadItems = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);

    try {
      const select = [
        'cr22f_modelosdeprodutofromsharepointlistid',
        'cr22f_title',
        'cr22f_querycategoria',
        'new_descricao',
        'new_nomedofabricante',
        'new_tipodesistemapadrao',
        'new_controlasn',
        'new_controlaetiqueta',
        'new_requerconfiguracao',
        'new_requercabeamento',
        'new_requerengraving',
        'new_reservadeprodutolivre',
        'new_deviceiotemplatejson',
        'cr22f_horasagregadas',
        '_new_fabricante_value',
      ];

      const baseOptions = {
        select,
        orderBy: ['cr22f_title asc'],
        top: 100,
      };

      const normalized = term.trim();
      if (normalized.length < 2) {
        const result = await Cr22fModelosdeProdutoFromSharepointListService.getAll({
          ...baseOptions,
          filter: 'statecode eq 0',
        });

        if (!result.success) {
          throw result.error || new Error('Falha ao buscar modelos de produto.');
        }

        setItems((result.data || []) as ModeloItem[]);
        return;
      }

      const escaped = escapeOData(normalized);
      const filters = [
        `statecode eq 0 and contains(cr22f_title, '${escaped}')`,
        `statecode eq 0 and contains(new_descricao, '${escaped}')`,
        `statecode eq 0 and contains(cr22f_querycategoria, '${escaped}')`,
        `statecode eq 0 and contains(new_nomedofabricante, '${escaped}')`,
      ];

      const responses = await Promise.all(
        filters.map((filter) =>
          Cr22fModelosdeProdutoFromSharepointListService.getAll({
            ...baseOptions,
            filter,
          })
        )
      );

      const merged = new Map<string, ModeloItem>();
      responses.forEach((response) => {
        if (response.success && response.data) {
          response.data.forEach((item) => {
            merged.set(item.cr22f_modelosdeprodutofromsharepointlistid, item as ModeloItem);
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
  }, []);

  useEffect(() => {
    void loadItems('');
  }, [loadItems, refreshToken]);

  useEffect(() => {
    if (!selectedItem) {
      setForm(emptyForm());
      setMode('edit');
      return;
    }

    setForm({
      referencia: selectedItem.cr22f_title || '',
      queryCategoria: selectedItem.cr22f_querycategoria || '',
      descricao: selectedItem.new_descricao || '',
      fabricanteId: selectedItem._new_fabricante_value || '',
      tipoSistema: selectedItem.new_tipodesistemapadrao ?? null,
      controlaSn: Boolean(selectedItem.new_controlasn),
      controlaEtiqueta: Boolean(selectedItem.new_controlaetiqueta),
      requerConfiguracao: Boolean(selectedItem.new_requerconfiguracao),
      requerCabeamento: Boolean(selectedItem.new_requercabeamento),
      requerEngraving: Boolean(selectedItem.new_requerengraving),
      reservaProdutoLivre: Boolean(selectedItem.new_reservadeprodutolivre),
      deviceTemplateJson: selectedItem.new_deviceiotemplatejson || '',
      horasAgregadas: selectedItem.cr22f_horasagregadas || '',
    });
    setFabricanteLabel(selectedItem.new_nomedofabricante || '');
    setMode('edit');
  }, [selectedItem]);

  const handleModeChange = useCallback(
    (nextMode: ActionMode) => {
      if (nextMode === 'duplicate' && selectedItem) {
        const original = selectedItem.cr22f_title || '';
        if (form.referencia === original && original.trim()) {
          setForm((prev) => ({ ...prev, referencia: `${original} (cópia)` }));
        }
      }
      setMode(nextMode);
    },
    [form.referencia, selectedItem]
  );

  const buildPayload = useCallback(() => {
    const payload: Record<string, any> = {
      cr22f_title: form.referencia.trim(),
      cr22f_querycategoria: form.queryCategoria.trim(),
      new_descricao: form.descricao.trim(),
      new_tipodesistemapadrao: form.tipoSistema ?? undefined,
      new_controlasn: form.controlaSn,
      new_controlaetiqueta: form.controlaEtiqueta,
      new_requerconfiguracao: form.requerConfiguracao,
      new_requercabeamento: form.requerCabeamento,
      new_requerengraving: form.requerEngraving,
      new_reservadeprodutolivre: form.reservaProdutoLivre,
      new_deviceiotemplatejson: form.deviceTemplateJson.trim(),
    };

    if (mode === 'duplicate') {
      payload.cr22f_id = crypto.randomUUID();
    }

    if (form.horasAgregadas.trim()) {
      payload.cr22f_horasagregadas = form.horasAgregadas.trim();
    }

    if (form.fabricanteId) {
      payload['new_Fabricante@odata.bind'] = `/cr22f_fabricantesfromsharpointlists(${form.fabricanteId})`;
    }

    return payload;
  }, [form, mode]);

  const handleSave = useCallback(async () => {
    if (!selectedItem) {
      setMessage({
        intent: 'warning',
        title: 'Selecione um modelo',
        body: 'Escolha um modelo de produto para editar ou duplicar.',
      });
      return;
    }

    if (!form.referencia.trim()) {
      setMessage({
        intent: 'warning',
        title: 'Informe a referência',
        body: 'Preencha o campo de referência antes de salvar.',
      });
      return;
    }

    setActionBusy(true);
    setMessage(null);

    try {
      const payload = buildPayload();
      if (mode === 'edit') {
        const result = await Cr22fModelosdeProdutoFromSharepointListService.update(
          selectedItem.cr22f_modelosdeprodutofromsharepointlistid,
          payload
        );
        if (!result.success) {
          throw result.error || new Error('Falha ao atualizar o modelo.');
        }
        setMessage({ intent: 'success', title: 'Modelo atualizado com sucesso.' });
      } else {
        const result = await Cr22fModelosdeProdutoFromSharepointListService.create(payload);
        if (!result.success) {
          throw result.error || new Error('Falha ao duplicar o modelo.');
        }
        setMessage({ intent: 'success', title: 'Modelo duplicado com sucesso.' });
      }

      await loadItems(searchTerm);
    } catch (saveError) {
      const messageText = saveError instanceof Error ? saveError.message : String(saveError);
      setMessage({ intent: 'error', title: 'Erro ao salvar', body: messageText });
    } finally {
      setActionBusy(false);
    }
  }, [buildPayload, loadItems, mode, searchTerm, selectedItem, form.referencia]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void loadItems(searchTerm);
      }
    },
    [loadItems, searchTerm]
  );

  const columns = useMemo(
    () => [
      createTableColumn<ModeloItem>({
        columnId: 'referencia',
        renderHeaderCell: () => 'Referência',
        renderCell: (item) => item.cr22f_title || '-',
      }),
      createTableColumn<ModeloItem>({
        columnId: 'descricao',
        renderHeaderCell: () => 'Descrição',
        renderCell: (item) => item.new_descricao || '-',
      }),
      createTableColumn<ModeloItem>({
        columnId: 'fabricante',
        renderHeaderCell: () => 'Fabricante',
        renderCell: (item) => item.new_nomedofabricante || '-',
      }),
      createTableColumn<ModeloItem>({
        columnId: 'acoes',
        renderHeaderCell: () => 'Ações',
        renderCell: (item) => (
          <Button
            appearance={
              selectedItem?.cr22f_modelosdeprodutofromsharepointlistid ===
              item.cr22f_modelosdeprodutofromsharepointlistid
                ? 'primary'
                : 'secondary'
            }
            onClick={() => setSelectedItem(item)}
          >
            {selectedItem?.cr22f_modelosdeprodutofromsharepointlistid ===
            item.cr22f_modelosdeprodutofromsharepointlistid
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
            Modelos de Produto
          </Text>
          <Button icon={<ArrowSync24Regular />} onClick={() => void loadItems(searchTerm)}>
            Atualizar
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <Input
            contentBefore={<Search24Regular />}
            placeholder="Buscar por referência, descrição, categoria ou fabricante"
            value={searchTerm}
            onChange={(_, data) => setSearchTerm(data.value)}
            onKeyDown={handleSearchKeyDown}
            style={{ flexGrow: 1 }}
          />
          <Button onClick={() => void loadItems(searchTerm)}>Buscar</Button>
        </div>

        {loading && <LoadingState label="Carregando modelos..." />}
        {!loading && error && (
          <Text size={300} style={{ color: tokens.colorPaletteRedForeground1 }}>
            {error}
          </Text>
        )}
        {!loading && !error && items.length === 0 && (
          <EmptyState title="Nenhum modelo encontrado" description="Tente ajustar o termo de busca." />
        )}
        {!loading && !error && items.length > 0 && (
          <DataGrid
            items={items}
            columns={columns}
            getRowId={(item) => item.cr22f_modelosdeprodutofromsharepointlistid}
          />
        )}
      </Card>

      <Card style={{ padding: 20 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
          Ajustar modelo selecionado
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
            title="Selecione um modelo"
            description="Escolha um modelo na lista ao lado para editar ou duplicar."
          />
        )}

        {selectedItem && (
          <div className="grid grid-cols-1 gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mode-modelo">Modo de ação</Label>
              <Dropdown
                id="mode-modelo"
                value={mode === 'edit' ? 'Editar modelo' : 'Duplicar modelo'}
                onOptionSelect={(_, data) => handleModeChange((data.optionValue as ActionMode) || 'edit')}
              >
                <Option value="edit">Editar modelo existente</Option>
                <Option value="duplicate">Duplicar modelo</Option>
              </Dropdown>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="referencia-modelo">Referência</Label>
              <Input
                id="referencia-modelo"
                value={form.referencia}
                onChange={(_, data) => setForm((prev) => ({ ...prev, referencia: data.value }))}
                placeholder="Referência"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="descricao-modelo">Descrição</Label>
              <Input
                id="descricao-modelo"
                value={form.descricao}
                onChange={(_, data) => setForm((prev) => ({ ...prev, descricao: data.value }))}
                placeholder="Descrição"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="querycategoria-modelo">QueryCategoria</Label>
              <Input
                id="querycategoria-modelo"
                value={form.queryCategoria}
                onChange={(_, data) => setForm((prev) => ({ ...prev, queryCategoria: data.value }))}
                placeholder="QueryCategoria"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="fabricante-modelo">Fabricante</Label>
              <SearchableCombobox
                id="fabricante-modelo"
                placeholder="Buscar fabricante"
                value={fabricanteLabel}
                selectedId={form.fabricanteId}
                onSelect={(id, label) => {
                  setForm((prev) => ({ ...prev, fabricanteId: id || '' }));
                  setFabricanteLabel(label);
                }}
                onSearch={searchFabricantes}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tipo-sistema">Tipo de Sistema Padrão</Label>
              <Dropdown
                id="tipo-sistema"
                placeholder="Selecione um tipo de sistema"
                value={
                  form.tipoSistema !== null
                    ? TIPO_SISTEMA_OPTIONS.find((option) => option.value === form.tipoSistema)?.label || ''
                    : ''
                }
                onOptionSelect={(_, data) =>
                  setForm((prev) => ({
                    ...prev,
                    tipoSistema: data.optionValue ? Number(data.optionValue) : null,
                  }))
                }
              >
                {TIPO_SISTEMA_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value.toString()}>
                    {option.label}
                  </Option>
                ))}
              </Dropdown>
            </div>

            <div className="flex flex-col gap-3">
              <Label>Opções</Label>
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
                <Checkbox
                  checked={form.controlaSn}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, controlaSn: Boolean(data.checked) }))}
                  label="Controla S/N"
                />
                <Checkbox
                  checked={form.controlaEtiqueta}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, controlaEtiqueta: Boolean(data.checked) }))}
                  label="Controla Etiqueta"
                />
                <Checkbox
                  checked={form.requerConfiguracao}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, requerConfiguracao: Boolean(data.checked) }))}
                  label="Requer Configuração"
                />
                <Checkbox
                  checked={form.requerCabeamento}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, requerCabeamento: Boolean(data.checked) }))}
                  label="Requer Cabeamento"
                />
                <Checkbox
                  checked={form.requerEngraving}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, requerEngraving: Boolean(data.checked) }))}
                  label="Requer Engraving"
                />
                <Checkbox
                  checked={form.reservaProdutoLivre}
                  onChange={(_, data) => setForm((prev) => ({ ...prev, reservaProdutoLivre: Boolean(data.checked) }))}
                  label="Reserva de Produto Livre"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="device-template-json">Device IO Template (JSON)</Label>
              <Textarea
                id="device-template-json"
                value={form.deviceTemplateJson}
                onChange={(_, data) => setForm((prev) => ({ ...prev, deviceTemplateJson: data.value }))}
                placeholder="Device IO Template (JSON)"
                resize="vertical"
                style={{ minHeight: '100px' }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="horas-agregadas">Horas Agregadas</Label>
              <Input
                id="horas-agregadas"
                type="text"
                value={form.horasAgregadas}
                onChange={(_, data) => setForm((prev) => ({ ...prev, horasAgregadas: data.value }))}
                placeholder="Horas Agregadas"
              />
            </div>

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
