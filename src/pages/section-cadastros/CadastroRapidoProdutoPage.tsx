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
  Spinner,
  Text,
  Textarea,
  tokens,
} from '@fluentui/react-components';
import { Add24Regular, ArrowSync24Regular, Search24Regular } from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataGrid, createTableColumn } from '../../components/shared/DataGrid';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingState } from '../../components/shared/LoadingState';
import {
  Cr22fFabricantesFromSharpointListService,
  Cr22fFornecedoresFromSharepointListService,
  Cr22fModelosdeProdutoFromSharepointListService,
  NewPrecodeProdutoService,
  NewTiposervicoprecodeprodutoService,
} from '../../generated';

type ModeloTemplate = {
  cr22f_modelosdeprodutofromsharepointlistid: string;
  cr22f_title?: string;
  new_descricao?: string;
  cr22f_querycategoria?: string;
  new_nomedofabricante?: string;
  new_tipodesistemapadrao?: number;
  new_controlasn?: boolean;
  new_controlaetiqueta?: boolean;
  new_requerconfiguracao?: boolean;
  new_requercabeamento?: boolean;
  new_requerengraving?: boolean;
  new_reservadeprodutolivre?: boolean;
  new_deviceiotemplatejson?: string;
  cr22f_horasagregadas?: number;
  _new_fabricante_value?: string;
};

type PrecoProduto = {
  new_precodeprodutoid: string;
  new_descricao?: string;
  new_referenciadoproduto?: string;
  new_precodevenda?: number;
  new_precocominstalacao?: number;
  new_precobase?: number;
  new_precodecompra?: number;
  new_descontopercentualdecompra?: number;
  new_markup?: number;
  new_requerinstalacao?: boolean;
  new_aceitadesconto?: boolean;
  _new_fornecedor_value?: string;
};

type LookupOption = {
  id: string;
  label: string;
  subtitle?: string;
};

type ModelFormState = {
  referencia: string;
  queryCategoria: string;
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

type PriceFormState = {
  descricao: string;
  fornecedorId: string;
  precoBase: string;
  descontoCompra: string;
  markup: string;
  requerInstalacao: boolean;
  aceitaDesconto: boolean;
};

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

const emptyModelForm = (): ModelFormState => ({
  referencia: '',
  queryCategoria: '',
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

const emptyPriceForm = (): PriceFormState => ({
  descricao: '',
  fornecedorId: '',
  precoBase: '',
  descontoCompra: '',
  markup: '',
  requerInstalacao: false,
  aceitaDesconto: false,
});

const formatCurrency = (value?: number) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatNumber = (value?: number) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR');
};

const escapeOData = (value: string) => value.replace(/'/g, "''");

export function CadastroRapidoProdutoPage() {
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateResults, setTemplateResults] = useState<ModeloTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ModeloTemplate | null>(null);
  const [modelForm, setModelForm] = useState<ModelFormState>(emptyModelForm());

  const [precos, setPrecos] = useState<PrecoProduto[]>([]);
  const [precosLoading, setPrecosLoading] = useState(false);
  const [precosError, setPrecosError] = useState<string | null>(null);
  const [selectedPreco, setSelectedPreco] = useState<PrecoProduto | null>(null);
  const [priceForm, setPriceForm] = useState<PriceFormState>(emptyPriceForm());

  const [fabricantes, setFabricantes] = useState<LookupOption[]>([]);
  const [fornecedores, setFornecedores] = useState<LookupOption[]>([]);

  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState<{ intent: 'success' | 'error' | 'warning'; title: string; body?: string } | null>(null);

  const primaryActions = useMemo(
    () => [
      {
        id: 'refresh',
        label: 'Atualizar',
        icon: <ArrowSync24Regular />,
        onClick: () => {
          void loadTemplates(templateSearch);
          if (selectedTemplate?.cr22f_modelosdeprodutofromsharepointlistid) {
            void loadPrecos(selectedTemplate.cr22f_modelosdeprodutofromsharepointlistid);
          }
        },
      },
    ],
    [selectedTemplate, templateSearch]
  );

  const loadTemplates = useCallback(async (searchTerm: string) => {
    setTemplatesLoading(true);
    setTemplatesError(null);

    try {
      const select = [
        'cr22f_modelosdeprodutofromsharepointlistid',
        'cr22f_title',
        'new_descricao',
        'cr22f_querycategoria',
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
        top: 50,
      };

      const normalized = searchTerm.trim();
      if (normalized.length < 2) {
        const result = await Cr22fModelosdeProdutoFromSharepointListService.getAll({
          ...baseOptions,
          filter: 'statecode eq 0',
        });

        if (!result.success) {
          throw result.error || new Error('Falha ao buscar modelos de produto.');
        }

        setTemplateResults((result.data || []) as ModeloTemplate[]);
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

      const merged = new Map<string, ModeloTemplate>();
      responses.forEach((response) => {
        if (response.success && response.data) {
          response.data.forEach((item) => {
            merged.set(item.cr22f_modelosdeprodutofromsharepointlistid, item as ModeloTemplate);
          });
        }
      });

      setTemplateResults(Array.from(merged.values()));
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      setTemplatesError(messageText);
      setTemplateResults([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const loadPrecos = useCallback(async (modeloId: string) => {
    setPrecosLoading(true);
    setPrecosError(null);

    try {
      const result = await NewPrecodeProdutoService.getAll({
        select: [
          'new_precodeprodutoid',
          'new_descricao',
          'new_referenciadoproduto',
          'new_precodevenda',
          'new_precocominstalacao',
          'new_precobase',
          'new_precodecompra',
          'new_descontopercentualdecompra',
          'new_markup',
          'new_requerinstalacao',
          'new_aceitadesconto',
          '_new_fornecedor_value',
        ],
        filter: `_new_modelodeproduto_value eq '${modeloId}' and statecode eq 0`,
        orderBy: ['new_referenciadoproduto asc'],
      });

      if (!result.success) {
        throw result.error || new Error('Falha ao buscar preços do produto.');
      }

      setPrecos((result.data || []) as PrecoProduto[]);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      setPrecosError(messageText);
      setPrecos([]);
    } finally {
      setPrecosLoading(false);
    }
  }, []);

  const loadLookups = useCallback(async () => {
    try {
      const [fabricantesResult, fornecedoresResult] = await Promise.all([
        Cr22fFabricantesFromSharpointListService.getAll({
          select: ['cr22f_fabricantesfromsharpointlistid', 'cr22f_title', 'cr22f_id'],
          filter: 'statecode eq 0',
          orderBy: ['cr22f_title asc'],
          top: 200,
        }),
        Cr22fFornecedoresFromSharepointListService.getAll({
          select: ['cr22f_fornecedoresfromsharepointlistid', 'cr22f_title', 'cr22f_nomefantasia'],
          filter: 'statecode eq 0',
          orderBy: ['cr22f_title asc'],
          top: 200,
        }),
      ]);

      if (fabricantesResult.success && fabricantesResult.data) {
        setFabricantes(
          fabricantesResult.data.map((item: any) => ({
            id: item.cr22f_fabricantesfromsharpointlistid,
            label: item.cr22f_title || item.cr22f_id || 'Fabricante',
          }))
        );
      }

      if (fornecedoresResult.success && fornecedoresResult.data) {
        setFornecedores(
          fornecedoresResult.data.map((item: any) => ({
            id: item.cr22f_fornecedoresfromsharepointlistid,
            label: item.cr22f_title || item.cr22f_nomefantasia || 'Fornecedor',
          }))
        );
      }
    } catch (error) {
      console.error('[CadastroRapidoProduto] Erro ao carregar lookups', error);
    }
  }, []);

  useEffect(() => {
    void loadTemplates('');
    void loadLookups();
  }, [loadLookups, loadTemplates]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTemplates(templateSearch);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [loadTemplates, templateSearch]);

  useEffect(() => {
    if (!selectedTemplate) {
      setModelForm(emptyModelForm());
      setPrecos([]);
      setSelectedPreco(null);
      setPriceForm(emptyPriceForm());
      return;
    }

    setModelForm({
      referencia: selectedTemplate.cr22f_title || '',
      queryCategoria: selectedTemplate.cr22f_querycategoria || '',
      fabricanteId: selectedTemplate._new_fabricante_value || '',
      tipoSistema: selectedTemplate.new_tipodesistemapadrao ?? null,
      controlaSn: Boolean(selectedTemplate.new_controlasn),
      controlaEtiqueta: Boolean(selectedTemplate.new_controlaetiqueta),
      requerConfiguracao: Boolean(selectedTemplate.new_requerconfiguracao),
      requerCabeamento: Boolean(selectedTemplate.new_requercabeamento),
      requerEngraving: Boolean(selectedTemplate.new_requerengraving),
      reservaProdutoLivre: Boolean(selectedTemplate.new_reservadeprodutolivre),
      deviceTemplateJson: selectedTemplate.new_deviceiotemplatejson || '',
      horasAgregadas: selectedTemplate.cr22f_horasagregadas?.toString() || '',
    });

    void loadPrecos(selectedTemplate.cr22f_modelosdeprodutofromsharepointlistid);
  }, [loadPrecos, selectedTemplate]);

  useEffect(() => {
    if (!selectedPreco) {
      setPriceForm(emptyPriceForm());
      return;
    }

    setPriceForm({
      descricao: selectedPreco.new_descricao || '',
      fornecedorId: selectedPreco._new_fornecedor_value || '',
      precoBase: selectedPreco.new_precobase?.toString() || '',
      descontoCompra: selectedPreco.new_descontopercentualdecompra?.toString() || '',
      markup: selectedPreco.new_markup?.toString() || '',
      requerInstalacao: Boolean(selectedPreco.new_requerinstalacao),
      aceitaDesconto: Boolean(selectedPreco.new_aceitadesconto),
    });
  }, [selectedPreco]);

  const handleCreate = useCallback(async () => {
    console.log('[CadastroRapidoProduto] handleCreate iniciado');
    console.log('[CadastroRapidoProduto] selectedTemplate:', selectedTemplate);
    console.log('[CadastroRapidoProduto] selectedPreco:', selectedPreco);
    console.log('[CadastroRapidoProduto] modelForm:', modelForm);
    console.log('[CadastroRapidoProduto] priceForm:', priceForm);

    if (!selectedTemplate || !selectedPreco) {
      console.warn('[CadastroRapidoProduto] Validação falhou: template ou preço não selecionado');
      setMessage({
        intent: 'warning',
        title: 'Selecione um modelo e um preço',
        body: 'Escolha um template e um preço base antes de criar o novo item.',
      });
      return;
    }

    setActionBusy(true);
    setMessage(null);

    try {
      console.log('[CadastroRapidoProduto] === CRIANDO NOVO MODELO ===');
      const modelPayload: Record<string, any> = {
        cr22f_id: crypto.randomUUID(),
        cr22f_title: modelForm.referencia.trim(),
        cr22f_querycategoria: modelForm.queryCategoria.trim(),
        new_tipodesistemapadrao: modelForm.tipoSistema ?? undefined,
        new_controlasn: modelForm.controlaSn,
        new_controlaetiqueta: modelForm.controlaEtiqueta,
        new_requerconfiguracao: modelForm.requerConfiguracao,
        new_requercabeamento: modelForm.requerCabeamento,
        new_requerengraving: modelForm.requerEngraving,
        new_reservadeprodutolivre: modelForm.reservaProdutoLivre,
        new_deviceiotemplatejson: modelForm.deviceTemplateJson.trim(),
      };

      if (modelForm.horasAgregadas.trim()) {
        modelPayload.cr22f_horasagregadas = modelForm.horasAgregadas.trim();
      }

      if (modelForm.fabricanteId) {
        modelPayload['new_Fabricante@odata.bind'] = `/cr22f_fabricantesfromsharpointlists(${modelForm.fabricanteId})`;
      }

      console.log('[CadastroRapidoProduto] Payload do modelo:', JSON.stringify(modelPayload, null, 2));
      const modelResult = await Cr22fModelosdeProdutoFromSharepointListService.create(modelPayload);
      console.log('[CadastroRapidoProduto] Resultado da criação do modelo:', {
        success: modelResult.success,
        data: modelResult.data,
        error: modelResult.error,
      });

      if (!modelResult.success || !modelResult.data) {
        console.error('[CadastroRapidoProduto] Erro ao criar modelo:', modelResult.error);
        throw modelResult.error || new Error('Falha ao criar o novo modelo.');
      }

      const novoModeloId = (modelResult.data as any).cr22f_modelosdeprodutofromsharepointlistid;
      console.log('[CadastroRapidoProduto] ID do novo modelo:', novoModeloId);
      if (!novoModeloId) {
        console.error('[CadastroRapidoProduto] Modelo criado mas sem ID. Dados completos:', modelResult.data);
        throw new Error('Não foi possível recuperar o ID do novo modelo.');
      }

      console.log('[CadastroRapidoProduto] === CRIANDO NOVO PREÇO ===');
      const pricePayload: Record<string, any> = {
        new_descricao: priceForm.descricao.trim(),
        new_precobase: priceForm.precoBase ? Number(priceForm.precoBase) : undefined,
        new_descontopercentualdecompra: priceForm.descontoCompra ? Number(priceForm.descontoCompra) : undefined,
        new_markup: priceForm.markup ? Number(priceForm.markup) : undefined,
        new_requerinstalacao: priceForm.requerInstalacao,
        new_aceitadesconto: priceForm.aceitaDesconto,
        'new_ModelodeProduto@odata.bind': `/cr22f_modelosdeprodutofromsharepointlists(${novoModeloId})`,
      };

      if (priceForm.fornecedorId) {
        pricePayload['new_Fornecedor@odata.bind'] = `/cr22f_fornecedoresfromsharepointlists(${priceForm.fornecedorId})`;
      }

      console.log('[CadastroRapidoProduto] Payload do preço:', JSON.stringify(pricePayload, null, 2));
      const priceResult = await NewPrecodeProdutoService.create(pricePayload);
      console.log('[CadastroRapidoProduto] Resultado da criação do preço:', {
        success: priceResult.success,
        data: priceResult.data,
        error: priceResult.error,
      });

      if (!priceResult.success || !priceResult.data) {
        console.error('[CadastroRapidoProduto] Erro ao criar preço:', priceResult.error);
        throw priceResult.error || new Error('Falha ao criar o novo preço.');
      }

      const novoPrecoId = (priceResult.data as any).new_precodeprodutoid;
      console.log('[CadastroRapidoProduto] ID do novo preço:', novoPrecoId);
      if (!novoPrecoId) {
        console.error('[CadastroRapidoProduto] Preço criado mas sem ID. Dados completos:', priceResult.data);
        throw new Error('Não foi possível recuperar o ID do novo preço.');
      }

      console.log('[CadastroRapidoProduto] === COPIANDO VÍNCULOS DE SERVIÇO ===');
      console.log('[CadastroRapidoProduto] Buscando vínculos do preço original:', selectedPreco.new_precodeprodutoid);
      const vinculosResult = await NewTiposervicoprecodeprodutoService.getAll({
        select: ['_new_tipodeservico_value', 'new_tiposervicoprecodeprodutoid'],
        filter: `_new_precodeproduto_value eq '${selectedPreco.new_precodeprodutoid}' and statecode eq 0`,
      });
      console.log('[CadastroRapidoProduto] Resultado da busca de vínculos:', {
        success: vinculosResult.success,
        count: vinculosResult.data?.length || 0,
        data: vinculosResult.data,
        error: vinculosResult.error,
      });

      if (vinculosResult.success && vinculosResult.data && vinculosResult.data.length > 0) {
        console.log('[CadastroRapidoProduto] Criando', vinculosResult.data.length, 'vínculos de serviço...');
        const vinculosResults = await Promise.all(
          vinculosResult.data.map((item: any, index: number) => {
            console.log(`[CadastroRapidoProduto] Criando vínculo ${index + 1}/${vinculosResult.data.length}:`, {
              tipodeservico: item._new_tipodeservico_value,
              precodeproduto: novoPrecoId,
            });
            return NewTiposervicoprecodeprodutoService.create({
              'new_TipodeServico@odata.bind': `/new_tipodeservicos(${item._new_tipodeservico_value})`,
              'new_PrecodeProduto@odata.bind': `/new_precodeprodutos(${novoPrecoId})`,
            });
          })
        );
        console.log('[CadastroRapidoProduto] Resultados da criação de vínculos:', vinculosResults);
        const vinculosErrors = vinculosResults.filter((r) => !r.success);
        if (vinculosErrors.length > 0) {
          console.warn('[CadastroRapidoProduto] Alguns vínculos falharam:', vinculosErrors);
        }
      } else {
        console.log('[CadastroRapidoProduto] Nenhum vínculo encontrado para copiar');
      }

      console.log('[CadastroRapidoProduto] === SUCESSO ===');
      setMessage({
        intent: 'success',
        title: 'Novo item criado com sucesso',
        body: 'O modelo, preço e vínculos de serviço foram copiados.',
      });

      setSelectedTemplate(null);
      setSelectedPreco(null);
      setTemplateSearch('');
      await loadTemplates('');
    } catch (error) {
      console.error('[CadastroRapidoProduto] === ERRO ===');
      console.error('[CadastroRapidoProduto] Tipo do erro:', typeof error);
      console.error('[CadastroRapidoProduto] Erro completo:', error);
      console.error('[CadastroRapidoProduto] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      if (error && typeof error === 'object') {
        console.error('[CadastroRapidoProduto] Propriedades do erro:', Object.keys(error));
        console.error('[CadastroRapidoProduto] Erro stringificado:', JSON.stringify(error, null, 2));
      }

      let messageText: string;
      if (error instanceof Error) {
        messageText = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        messageText = String((error as any).message);
      } else if (error && typeof error === 'object' && 'error' in error) {
        messageText = String((error as any).error);
      } else {
        messageText = String(error);
      }

      console.error('[CadastroRapidoProduto] Mensagem de erro final:', messageText);
      setMessage({
        intent: 'error',
        title: 'Falha ao criar novo item',
        body: messageText,
      });
    } finally {
      setActionBusy(false);
      console.log('[CadastroRapidoProduto] handleCreate finalizado');
    }
  }, [loadTemplates, modelForm, priceForm, selectedPreco, selectedTemplate]);

  const templatesColumns = useMemo(
    () => [
      createTableColumn<ModeloTemplate>({
        columnId: 'referencia',
        renderHeaderCell: () => 'Referência',
        renderCell: (item) => item.cr22f_title || '-',
      }),
      createTableColumn<ModeloTemplate>({
        columnId: 'descricao',
        renderHeaderCell: () => 'Descrição',
        renderCell: (item) => item.new_descricao || '-',
      }),
      createTableColumn<ModeloTemplate>({
        columnId: 'fabricante',
        renderHeaderCell: () => 'Fabricante',
        renderCell: (item) => item.new_nomedofabricante || '-',
      }),
      createTableColumn<ModeloTemplate>({
        columnId: 'acoes',
        renderHeaderCell: () => 'Ações',
        renderCell: (item) => (
          <Button
            appearance={selectedTemplate?.cr22f_modelosdeprodutofromsharepointlistid === item.cr22f_modelosdeprodutofromsharepointlistid ? 'primary' : 'secondary'}
            onClick={() => setSelectedTemplate(item)}
          >
            {selectedTemplate?.cr22f_modelosdeprodutofromsharepointlistid === item.cr22f_modelosdeprodutofromsharepointlistid ? 'Selecionado' : 'Selecionar'}
          </Button>
        ),
      }),
    ],
    [selectedTemplate]
  );

  const precosColumns = useMemo(
    () => [
      createTableColumn<PrecoProduto>({
        columnId: 'referencia',
        renderHeaderCell: () => 'Referência',
        renderCell: (item) => item.new_referenciadoproduto || '-',
      }),
      createTableColumn<PrecoProduto>({
        columnId: 'descricao',
        renderHeaderCell: () => 'Descrição',
        renderCell: (item) => item.new_descricao || '-',
      }),
      createTableColumn<PrecoProduto>({
        columnId: 'precoBase',
        renderHeaderCell: () => 'Preço Base',
        renderCell: (item) => formatCurrency(item.new_precobase),
      }),
      createTableColumn<PrecoProduto>({
        columnId: 'markup',
        renderHeaderCell: () => 'Markup',
        renderCell: (item) => formatNumber(item.new_markup),
      }),
      createTableColumn<PrecoProduto>({
        columnId: 'acoes',
        renderHeaderCell: () => 'Ações',
        renderCell: (item) => (
          <Button
            appearance={selectedPreco?.new_precodeprodutoid === item.new_precodeprodutoid ? 'primary' : 'secondary'}
            onClick={() => setSelectedPreco(item)}
          >
            {selectedPreco?.new_precodeprodutoid === item.new_precodeprodutoid ? 'Selecionado' : 'Selecionar'}
          </Button>
        ),
      }),
    ],
    [selectedPreco]
  );

  return (
    <>
      <CommandBar primaryActions={primaryActions} />
      <PageHeader
        title="Cadastro Rápido de Produto"
        subtitle="Selecione um modelo existente, ajuste informações e copie preços/serviços."
      />
      <PageContainer>
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

        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card style={{ padding: 20 }}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <Text size={500} weight="semibold">
                Templates de Produto
              </Text>
              <Button icon={<ArrowSync24Regular />} onClick={() => void loadTemplates(templateSearch)}>
                Atualizar
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <Input
                contentBefore={<Search24Regular />}
                placeholder="Buscar por referência, descrição, categoria ou fabricante"
                value={templateSearch}
                onChange={(_, data) => setTemplateSearch(data.value)}
                style={{ flexGrow: 1 }}
              />
              <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                {templateResults.length} resultados
              </Text>
            </div>

            {templatesLoading && <LoadingState label="Carregando templates..." />}

            {!templatesLoading && templatesError && (
              <Text size={300} style={{ color: tokens.colorPaletteRedForeground1 }}>
                {templatesError}
              </Text>
            )}

            {!templatesLoading && !templatesError && templateResults.length === 0 && (
              <EmptyState title="Nenhum template encontrado" description="Tente ajustar o termo de busca." />
            )}

            {!templatesLoading && !templatesError && templateResults.length > 0 && (
              <DataGrid
                items={templateResults}
                columns={templatesColumns}
                getRowId={(item) => item.cr22f_modelosdeprodutofromsharepointlistid}
              />
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6 mb-6">
          <Card style={{ padding: 20 }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
              Ajustar informações do novo modelo
            </Text>

            {!selectedTemplate && (
              <EmptyState
                title="Selecione um template"
                description="Escolha um modelo existente para preencher automaticamente os campos."
              />
            )}

            {selectedTemplate && (
              <div className="grid grid-cols-1 gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="referencia">Referência</Label>
                  <Input
                    id="referencia"
                    value={modelForm.referencia}
                    onChange={(_, data) => setModelForm((prev) => ({ ...prev, referencia: data.value }))}
                    placeholder="Referência"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="querycategoria">QueryCategoria</Label>
                  <Input
                    id="querycategoria"
                    value={modelForm.queryCategoria}
                    onChange={(_, data) => setModelForm((prev) => ({ ...prev, queryCategoria: data.value }))}
                    placeholder="QueryCategoria"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fabricante">Fabricante</Label>
                  <Dropdown
                    id="fabricante"
                    placeholder="Selecione um fabricante"
                    value={fabricantes.find((item) => item.id === modelForm.fabricanteId)?.label || ''}
                    onOptionSelect={(_, data) =>
                      setModelForm((prev) => ({ ...prev, fabricanteId: (data.optionValue as string) || '' }))
                    }
                  >
                    {fabricantes.map((item) => (
                      <Option key={item.id} value={item.id}>
                        {item.label}
                      </Option>
                    ))}
                  </Dropdown>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tiposistema">Tipo de Sistema Padrão</Label>
                  <Dropdown
                    id="tiposistema"
                    placeholder="Selecione um tipo de sistema"
                    value={
                      modelForm.tipoSistema !== null
                        ? TIPO_SISTEMA_OPTIONS.find((option) => option.value === modelForm.tipoSistema)?.label || ''
                        : ''
                    }
                    onOptionSelect={(_, data) =>
                      setModelForm((prev) => ({
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
                      checked={modelForm.controlaSn}
                      onChange={(_, data) => setModelForm((prev) => ({ ...prev, controlaSn: Boolean(data.checked) }))}
                      label="Controla S/N"
                    />
                    <Checkbox
                      checked={modelForm.controlaEtiqueta}
                      onChange={(_, data) =>
                        setModelForm((prev) => ({ ...prev, controlaEtiqueta: Boolean(data.checked) }))
                      }
                      label="Controla Etiqueta"
                    />
                    <Checkbox
                      checked={modelForm.requerConfiguracao}
                      onChange={(_, data) =>
                        setModelForm((prev) => ({ ...prev, requerConfiguracao: Boolean(data.checked) }))
                      }
                      label="Requer Configuração"
                    />
                    <Checkbox
                      checked={modelForm.requerCabeamento}
                      onChange={(_, data) =>
                        setModelForm((prev) => ({ ...prev, requerCabeamento: Boolean(data.checked) }))
                      }
                      label="Requer Cabeamento"
                    />
                    <Checkbox
                      checked={modelForm.requerEngraving}
                      onChange={(_, data) =>
                        setModelForm((prev) => ({ ...prev, requerEngraving: Boolean(data.checked) }))
                      }
                      label="Requer Engraving"
                    />
                    <Checkbox
                      checked={modelForm.reservaProdutoLivre}
                      onChange={(_, data) =>
                        setModelForm((prev) => ({ ...prev, reservaProdutoLivre: Boolean(data.checked) }))
                      }
                      label="Reserva de Produto Livre"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="deviceiotemplatejson">Device IO Template (JSON)</Label>
                  <Textarea
                    id="deviceiotemplatejson"
                    value={modelForm.deviceTemplateJson}
                    onChange={(_, data) => setModelForm((prev) => ({ ...prev, deviceTemplateJson: data.value }))}
                    placeholder="Device IO Template (JSON)"
                    resize="vertical"
                    style={{ minHeight: '100px' }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="horasagregadas">Horas Agregadas</Label>
                  <Input
                    id="horasagregadas"
                    type="number"
                    value={modelForm.horasAgregadas}
                    onChange={(_, data) => setModelForm((prev) => ({ ...prev, horasAgregadas: data.value }))}
                    placeholder="Horas Agregadas"
                  />
                </div>
              </div>
            )}
          </Card>

          <Card style={{ padding: 20 }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
              Ajustar informações do novo preço
            </Text>

            {!selectedTemplate && (
              <EmptyState
                title="Selecione um template"
                description="A lista de preços aparece após escolher um modelo."
              />
            )}

            {selectedTemplate && (
              <>
                {precosLoading && <LoadingState label="Carregando preços..." />}
                {!precosLoading && precosError && (
                  <Text size={300} style={{ color: tokens.colorPaletteRedForeground1 }}>
                    {precosError}
                  </Text>
                )}
                {!precosLoading && !precosError && precos.length === 0 && (
                  <EmptyState title="Nenhum preço encontrado" description="Selecione outro modelo ou atualize a lista." />
                )}
                {!precosLoading && !precosError && precos.length > 0 && (
                  <div className="mb-4">
                    <DataGrid items={precos} columns={precosColumns} getRowId={(item) => item.new_precodeprodutoid} />
                  </div>
                )}

                {selectedPreco && (
                  <div className="grid grid-cols-1 gap-5">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="descricao-preco">Descrição</Label>
                      <Input
                        id="descricao-preco"
                        value={priceForm.descricao}
                        onChange={(_, data) => setPriceForm((prev) => ({ ...prev, descricao: data.value }))}
                        placeholder="Descrição"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="fornecedor">Fornecedor</Label>
                      <Dropdown
                        id="fornecedor"
                        placeholder="Selecione um fornecedor"
                        value={fornecedores.find((item) => item.id === priceForm.fornecedorId)?.label || ''}
                        onOptionSelect={(_, data) =>
                          setPriceForm((prev) => ({ ...prev, fornecedorId: (data.optionValue as string) || '' }))
                        }
                      >
                        {fornecedores.map((item) => (
                          <Option key={item.id} value={item.id}>
                            {item.label}
                          </Option>
                        ))}
                      </Dropdown>
                    </div>
                    <div className="grid grid-cols-1 tablet:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="precobase">Preço Base</Label>
                        <Input
                          id="precobase"
                          type="number"
                          value={priceForm.precoBase}
                          onChange={(_, data) => setPriceForm((prev) => ({ ...prev, precoBase: data.value }))}
                          placeholder="Preço Base"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="descontocompra">Desconto Percentual de Compra</Label>
                        <Input
                          id="descontocompra"
                          type="number"
                          value={priceForm.descontoCompra}
                          onChange={(_, data) => setPriceForm((prev) => ({ ...prev, descontoCompra: data.value }))}
                          placeholder="Desconto Percentual de Compra"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="markup">Markup</Label>
                        <Input
                          id="markup"
                          type="number"
                          value={priceForm.markup}
                          onChange={(_, data) => setPriceForm((prev) => ({ ...prev, markup: data.value }))}
                          placeholder="Markup"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Label>Opções</Label>
                      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
                        <Checkbox
                          checked={priceForm.requerInstalacao}
                          onChange={(_, data) =>
                            setPriceForm((prev) => ({ ...prev, requerInstalacao: Boolean(data.checked) }))
                          }
                          label="Requer Instalação"
                        />
                        <Checkbox
                          checked={priceForm.aceitaDesconto}
                          onChange={(_, data) =>
                            setPriceForm((prev) => ({ ...prev, aceitaDesconto: Boolean(data.checked) }))
                          }
                          label="Aceita Desconto"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={handleCreate}
            disabled={actionBusy || !selectedTemplate || !selectedPreco}
            size="large"
          >
            Criar Novo Item
          </Button>
        </div>
      </PageContainer>

      {actionBusy && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Card style={{ padding: 24 }}>
            <div className="flex items-center gap-3">
              <Spinner size="medium" />
              <Text>Processando criação do novo item...</Text>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
