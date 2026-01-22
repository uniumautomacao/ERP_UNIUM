import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
  NewRegimedecotacaotemporariaService,
  NewTipodeservicoregimedecotacaotemporariaService,
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

type RegimeTemporario = {
  new_regimedecotacaotemporariaid: string;
  new_name?: string;
  new_referenciadoproduto?: string;
  new_validade?: string;
  new_markup?: number;
  new_descontopercentualdecompra?: number;
};

type RegimeEdit = {
  name: string;
  markup: string;
  desconto: string;
  validade: string;
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

  const [regimes, setRegimes] = useState<RegimeTemporario[]>([]);
  const [regimesLoading, setRegimesLoading] = useState(false);
  const [regimesError, setRegimesError] = useState<string | null>(null);
  const [selectedRegimeIds, setSelectedRegimeIds] = useState<string[]>([]);
  const [regimeEdits, setRegimeEdits] = useState<Record<string, RegimeEdit>>({});

  const [fabricantes, setFabricantes] = useState<LookupOption[]>([]);
  const [fornecedores, setFornecedores] = useState<LookupOption[]>([]);

  const [copyPreco, setCopyPreco] = useState(true);
  const [copyRegimes, setCopyRegimes] = useState(false);

  const [existingModel, setExistingModel] = useState<ModeloTemplate | null>(null);
  const [pendingModelPayload, setPendingModelPayload] = useState<Record<string, any> | null>(null);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);

  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState<{ intent: 'success' | 'error' | 'warning'; title: string; body?: string } | null>(null);

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

  const loadRegimes = useCallback(async (modeloId: string) => {
    setRegimesLoading(true);
    setRegimesError(null);

    try {
      const result = await NewRegimedecotacaotemporariaService.getAll({
        select: [
          'new_regimedecotacaotemporariaid',
          'new_name',
          'new_referenciadoproduto',
          'new_validade',
          'new_markup',
          'new_descontopercentualdecompra',
        ],
        filter: `_new_modelodeproduto_value eq '${modeloId}' and statecode eq 0`,
        orderBy: ['new_name asc'],
      });

      if (!result.success) {
        throw result.error || new Error('Falha ao buscar regimes de cotação temporária.');
      }

      setRegimes((result.data || []) as RegimeTemporario[]);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      setRegimesError(messageText);
      setRegimes([]);
    } finally {
      setRegimesLoading(false);
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
            void loadRegimes(selectedTemplate.cr22f_modelosdeprodutofromsharepointlistid);
          }
        },
      },
    ],
    [loadRegimes, loadPrecos, loadTemplates, selectedTemplate, templateSearch]
  );

  useEffect(() => {
    void loadTemplates('');
    void loadLookups();
  }, [loadLookups, loadTemplates]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void loadTemplates(templateSearch);
      }
    },
    [loadTemplates, templateSearch]
  );

  useEffect(() => {
    if (!selectedTemplate) {
      setModelForm(emptyModelForm());
      setPrecos([]);
      setSelectedPreco(null);
      setPriceForm(emptyPriceForm());
      setRegimes([]);
      setSelectedRegimeIds([]);
      setRegimeEdits({});
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
    void loadRegimes(selectedTemplate.cr22f_modelosdeprodutofromsharepointlistid);
  }, [loadPrecos, loadRegimes, selectedTemplate]);

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

  const selectedRegimes = useMemo(
    () => regimes.filter((regime) => selectedRegimeIds.includes(regime.new_regimedecotacaotemporariaid)),
    [regimes, selectedRegimeIds]
  );

  const buildRegimeEdit = useCallback((regime: RegimeTemporario): RegimeEdit => {
    return {
      name: regime.new_name || '',
      markup: regime.new_markup?.toString() || '',
      desconto: regime.new_descontopercentualdecompra?.toString() || '',
      validade: regime.new_validade ? String(regime.new_validade) : '',
    };
  }, []);

  const formatBoolean = useCallback((value?: boolean) => (value ? 'Sim' : 'Não'), []);

  const fabricantesById = useMemo(() => {
    return fabricantes.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.label;
      return acc;
    }, {});
  }, [fabricantes]);

  const getTipoSistemaLabel = useCallback((value?: number | null) => {
    if (value === null || value === undefined) return '-';
    return TIPO_SISTEMA_OPTIONS.find((option) => option.value === value)?.label || String(value);
  }, []);

  const toggleRegimeSelection = useCallback((regime: RegimeTemporario) => {
    const regimeId = regime.new_regimedecotacaotemporariaid;
    setSelectedRegimeIds((prev) => {
      if (prev.includes(regimeId)) {
        return prev.filter((id) => id !== regimeId);
      }
      return [...prev, regimeId];
    });
    setRegimeEdits((prev) => {
      if (prev[regimeId]) {
        const { [regimeId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [regimeId]: buildRegimeEdit(regime) };
    });
  }, [buildRegimeEdit]);

  const handleRegimeEditChange = useCallback((regimeId: string, field: keyof RegimeEdit, value: string) => {
    setRegimeEdits((prev) => ({
      ...prev,
      [regimeId]: {
        ...prev[regimeId],
        [field]: value,
      },
    }));
  }, []);

  const buildModelPayload = useCallback(
    (includeId: boolean) => {
      const payload: Record<string, any> = {
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

      if (includeId) {
        payload.cr22f_id = crypto.randomUUID();
      }

      if (modelForm.horasAgregadas.trim()) {
        payload.cr22f_horasagregadas = modelForm.horasAgregadas.trim();
      }

      if (modelForm.fabricanteId) {
        payload['new_Fabricante@odata.bind'] = `/cr22f_fabricantesfromsharpointlists(${modelForm.fabricanteId})`;
      }

      return payload;
    },
    [modelForm]
  );

  const createRelatedRecords = useCallback(
    async (novoModeloId: string, modelActionLabel: string) => {
      let novoPrecoId: string | null = null;
      if (copyPreco) {
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

        novoPrecoId = (priceResult.data as any).new_precodeprodutoid;
        console.log('[CadastroRapidoProduto] ID do novo preço:', novoPrecoId);
        if (!novoPrecoId) {
          console.error('[CadastroRapidoProduto] Preço criado mas sem ID. Dados completos:', priceResult.data);
          throw new Error('Não foi possível recuperar o ID do novo preço.');
        }

        console.log('[CadastroRapidoProduto] === COPIANDO VÍNCULOS DE SERVIÇO ===');
        console.log('[CadastroRapidoProduto] Buscando vínculos do preço original:', selectedPreco?.new_precodeprodutoid);
        const vinculosResult = await NewTiposervicoprecodeprodutoService.getAll({
          select: ['_new_tipodeservico_value', 'new_tiposervicoprecodeprodutoid'],
          filter: `_new_precodeproduto_value eq '${selectedPreco?.new_precodeprodutoid}' and statecode eq 0`,
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
      }

      if (copyRegimes) {
        console.log('[CadastroRapidoProduto] === COPIANDO REGIMES ===');
        for (const regime of selectedRegimes) {
          const regimeId = regime.new_regimedecotacaotemporariaid;
          const regimeEdit = regimeEdits[regimeId];
          const regimeName = regimeEdit?.name?.trim() || '';
          console.log('[CadastroRapidoProduto] Criando regime:', { regimeId, regimeName });

          const regimePayload: Record<string, any> = {
            new_name: regimeName,
            new_referenciadoproduto: modelForm.referencia.trim(),
            new_validade: regimeEdit?.validade ? String(regimeEdit.validade).trim() : undefined,
            new_markup: regimeEdit?.markup?.trim() ? Number(regimeEdit.markup) : undefined,
            new_descontopercentualdecompra: regimeEdit?.desconto?.trim() ? Number(regimeEdit.desconto) : undefined,
            'new_ModelodeProduto@odata.bind': `/cr22f_modelosdeprodutofromsharepointlists(${novoModeloId})`,
          };

          console.log('[CadastroRapidoProduto] Payload do regime:', JSON.stringify(regimePayload, null, 2));
          const regimeResult = await NewRegimedecotacaotemporariaService.create(regimePayload);
          console.log('[CadastroRapidoProduto] Resultado da criação do regime:', {
            success: regimeResult.success,
            data: regimeResult.data,
            error: regimeResult.error,
          });

          if (!regimeResult.success || !regimeResult.data) {
            console.error('[CadastroRapidoProduto] Erro ao criar regime:', regimeResult.error);
            throw regimeResult.error || new Error('Falha ao criar regime de cotação temporária.');
          }

          const novoRegimeId = (regimeResult.data as any).new_regimedecotacaotemporariaid;
          if (!novoRegimeId) {
            console.error('[CadastroRapidoProduto] Regime criado mas sem ID. Dados completos:', regimeResult.data);
            throw new Error('Não foi possível recuperar o ID do novo regime.');
          }

          console.log('[CadastroRapidoProduto] Buscando serviços do regime original:', regimeId);
          const servicosResult = await NewTipodeservicoregimedecotacaotemporariaService.getAll({
            select: ['_new_tipodeservico_value', 'new_descricao', 'new_tipodeservicoregimedecotacaotemporariaid'],
            filter: `_new_regime_value eq '${regimeId}' and statecode eq 0`,
          });
          console.log('[CadastroRapidoProduto] Resultado da busca de serviços do regime:', {
            success: servicosResult.success,
            count: servicosResult.data?.length || 0,
            data: servicosResult.data,
            error: servicosResult.error,
          });

          if (servicosResult.success && servicosResult.data && servicosResult.data.length > 0) {
            console.log('[CadastroRapidoProduto] Criando', servicosResult.data.length, 'serviços para o regime...');
            const servicosCriados = await Promise.all(
              servicosResult.data.map((item: any, index: number) => {
                console.log(`[CadastroRapidoProduto] Criando serviço ${index + 1}/${servicosResult.data.length}:`, {
                  tipodeservico: item._new_tipodeservico_value,
                  regime: novoRegimeId,
                });
                return NewTipodeservicoregimedecotacaotemporariaService.create({
                  new_descricao: item.new_descricao,
                  'new_Regime@odata.bind': `/new_regimedecotacaotemporarias(${novoRegimeId})`,
                  'new_TipodeServico@odata.bind': `/new_tipodeservicos(${item._new_tipodeservico_value})`,
                });
              })
            );
            console.log('[CadastroRapidoProduto] Resultados da criação de serviços do regime:', servicosCriados);
            const servicosErrors = servicosCriados.filter((r) => !r.success);
            if (servicosErrors.length > 0) {
              console.warn('[CadastroRapidoProduto] Alguns serviços do regime falharam:', servicosErrors);
            }
          } else {
            console.log('[CadastroRapidoProduto] Nenhum serviço encontrado para copiar');
          }
        }
      }

      console.log('[CadastroRapidoProduto] === SUCESSO ===');
      const successParts: string[] = [];
      if (copyPreco) successParts.push('preço e serviços');
      if (copyRegimes) successParts.push('regimes temporários e serviços do regime');

      setMessage({
        intent: 'success',
        title: 'Novo item criado com sucesso',
        body: `${modelActionLabel} e ${successParts.join(' + ')} foram copiados.`,
      });

      setSelectedTemplate(null);
      setSelectedPreco(null);
      setTemplateSearch('');
      await loadTemplates('');
    },
    [
      copyPreco,
      copyRegimes,
      loadTemplates,
      modelForm.referencia,
      priceForm,
      regimeEdits,
      selectedPreco,
      selectedRegimes,
    ]
  );

  const handleCreate = useCallback(async () => {
    console.log('[CadastroRapidoProduto] handleCreate iniciado');
    console.log('[CadastroRapidoProduto] selectedTemplate:', selectedTemplate);
    console.log('[CadastroRapidoProduto] selectedPreco:', selectedPreco);
    console.log('[CadastroRapidoProduto] selectedRegimeIds:', selectedRegimeIds);
    console.log('[CadastroRapidoProduto] copyPreco:', copyPreco);
    console.log('[CadastroRapidoProduto] copyRegimes:', copyRegimes);
    console.log('[CadastroRapidoProduto] modelForm:', modelForm);
    console.log('[CadastroRapidoProduto] priceForm:', priceForm);

    if (!selectedTemplate) {
      console.warn('[CadastroRapidoProduto] Validação falhou: template não selecionado');
      setMessage({
        intent: 'warning',
        title: 'Selecione um modelo',
        body: 'Escolha um template de produto antes de criar o novo item.',
      });
      return;
    }

    if (!copyPreco && !copyRegimes) {
      console.warn('[CadastroRapidoProduto] Validação falhou: nenhuma opção de cópia selecionada');
      setMessage({
        intent: 'warning',
        title: 'Selecione o que deseja copiar',
        body: 'Marque ao menos uma opção: preço ou regimes temporários.',
      });
      return;
    }

    if (copyPreco && !selectedPreco) {
      console.warn('[CadastroRapidoProduto] Validação falhou: preço não selecionado');
      setMessage({
        intent: 'warning',
        title: 'Selecione um preço',
        body: 'Escolha um preço base para copiar.',
      });
      return;
    }

    if (copyRegimes) {
      if (selectedRegimes.length === 0) {
        console.warn('[CadastroRapidoProduto] Validação falhou: nenhum regime selecionado');
        setMessage({
          intent: 'warning',
          title: 'Selecione pelo menos um regime',
          body: 'Escolha os regimes de cotação temporária que deseja copiar.',
        });
        return;
      }

      const regimeSemNome = selectedRegimes.find(
        (regime) => !regimeEdits[regime.new_regimedecotacaotemporariaid]?.name?.trim()
      );
      if (regimeSemNome) {
        console.warn('[CadastroRapidoProduto] Validação falhou: nome do regime não informado');
        setMessage({
          intent: 'warning',
          title: 'Informe o nome do regime',
          body: 'Preencha a descrição de todos os regimes selecionados.',
        });
        return;
      }
    }

    setActionBusy(true);
    setMessage(null);

    try {
      console.log('[CadastroRapidoProduto] === CRIANDO NOVO MODELO ===');
      const modelPayload = buildModelPayload(true);
      console.log('[CadastroRapidoProduto] Payload do modelo:', JSON.stringify(modelPayload, null, 2));

      const reference = modelForm.referencia.trim();
      const escapedRef = escapeOData(reference);
      const existingResult = await Cr22fModelosdeProdutoFromSharepointListService.getAll({
        select: [
          'cr22f_modelosdeprodutofromsharepointlistid',
          'cr22f_title',
          'cr22f_querycategoria',
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
        ],
        filter: `cr22f_title eq '${escapedRef}' and statecode eq 0`,
        top: 1,
      });

      if (existingResult.success && existingResult.data && existingResult.data.length > 0) {
        console.warn('[CadastroRapidoProduto] Modelo existente encontrado para a referência informada.');
        setExistingModel(existingResult.data[0] as ModeloTemplate);
        setPendingModelPayload(modelPayload);
        setConfirmUpdateOpen(true);
        return;
      }

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
      await createRelatedRecords(novoModeloId, 'O modelo foi criado');
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
  }, [
    copyPreco,
    copyRegimes,
    loadTemplates,
    modelForm,
    priceForm,
    regimeEdits,
    selectedPreco,
    selectedRegimes,
    selectedRegimeIds,
    selectedTemplate,
    buildModelPayload,
    createRelatedRecords,
  ]);

  const handleConfirmUpdateExisting = useCallback(async () => {
    if (!existingModel || !pendingModelPayload) {
      setConfirmUpdateOpen(false);
      return;
    }

    setConfirmUpdateOpen(false);
    setActionBusy(true);
    setMessage(null);

    try {
      const updatePayload = { ...pendingModelPayload };
      delete updatePayload.cr22f_id;

      console.log('[CadastroRapidoProduto] Atualizando modelo existente:', existingModel.cr22f_modelosdeprodutofromsharepointlistid);
      console.log('[CadastroRapidoProduto] Payload de atualização:', JSON.stringify(updatePayload, null, 2));

      const updateResult = await Cr22fModelosdeProdutoFromSharepointListService.update(
        existingModel.cr22f_modelosdeprodutofromsharepointlistid,
        updatePayload
      );

      console.log('[CadastroRapidoProduto] Resultado da atualização do modelo:', {
        success: updateResult.success,
        data: updateResult.data,
        error: updateResult.error,
      });

      if (!updateResult.success) {
        throw updateResult.error || new Error('Falha ao atualizar o modelo existente.');
      }

      await createRelatedRecords(existingModel.cr22f_modelosdeprodutofromsharepointlistid, 'O modelo existente foi atualizado');
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
        title: 'Falha ao atualizar modelo',
        body: messageText,
      });
    } finally {
      setActionBusy(false);
      setExistingModel(null);
      setPendingModelPayload(null);
    }
  }, [createRelatedRecords, existingModel, pendingModelPayload]);

  const handleCancelUpdateExisting = useCallback(() => {
    setConfirmUpdateOpen(false);
    setExistingModel(null);
    setPendingModelPayload(null);
  }, []);

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

  const regimesColumns = useMemo(
    () => [
      createTableColumn<RegimeTemporario>({
        columnId: 'nome',
        renderHeaderCell: () => 'Nome do Regime',
        renderCell: (item) => item.new_name || '-',
      }),
      createTableColumn<RegimeTemporario>({
        columnId: 'referencia',
        renderHeaderCell: () => 'Referência',
        renderCell: (item) => item.new_referenciadoproduto || '-',
      }),
      createTableColumn<RegimeTemporario>({
        columnId: 'validade',
        renderHeaderCell: () => 'Validade',
        renderCell: (item) => item.new_validade || '-',
      }),
      createTableColumn<RegimeTemporario>({
        columnId: 'markup',
        renderHeaderCell: () => 'Markup',
        renderCell: (item) => formatNumber(item.new_markup),
      }),
      createTableColumn<RegimeTemporario>({
        columnId: 'desconto',
        renderHeaderCell: () => 'Desconto',
        renderCell: (item) => formatNumber(item.new_descontopercentualdecompra),
      }),
      createTableColumn<RegimeTemporario>({
        columnId: 'selecao',
        renderHeaderCell: () => 'Selecionar',
        renderCell: (item) => (
          <Checkbox
            checked={selectedRegimeIds.includes(item.new_regimedecotacaotemporariaid)}
            onChange={() => toggleRegimeSelection(item)}
            label={selectedRegimeIds.includes(item.new_regimedecotacaotemporariaid) ? 'Selecionado' : 'Selecionar'}
          />
        ),
      }),
    ],
    [selectedRegimeIds, toggleRegimeSelection]
  );

  const canSubmit =
    Boolean(selectedTemplate) &&
    (copyPreco || copyRegimes) &&
    (!copyPreco || Boolean(selectedPreco)) &&
    (!copyRegimes ||
      (selectedRegimes.length > 0 &&
        selectedRegimes.every((regime) => regimeEdits[regime.new_regimedecotacaotemporariaid]?.name?.trim())));

  const existingComparison = useMemo(() => {
    if (!existingModel) return [];
    return [
      {
        label: 'Referência',
        existing: existingModel.cr22f_title || '-',
        updated: modelForm.referencia || '-',
      },
      {
        label: 'QueryCategoria',
        existing: existingModel.cr22f_querycategoria || '-',
        updated: modelForm.queryCategoria || '-',
      },
      {
        label: 'Fabricante',
        existing: existingModel._new_fabricante_value
          ? fabricantesById[existingModel._new_fabricante_value] || existingModel._new_fabricante_value
          : '-',
        updated: modelForm.fabricanteId ? fabricantesById[modelForm.fabricanteId] || modelForm.fabricanteId : '-',
      },
      {
        label: 'Tipo de Sistema Padrão',
        existing: getTipoSistemaLabel(existingModel.new_tipodesistemapadrao ?? null),
        updated: getTipoSistemaLabel(modelForm.tipoSistema),
      },
      {
        label: 'Controla S/N',
        existing: formatBoolean(existingModel.new_controlasn),
        updated: formatBoolean(modelForm.controlaSn),
      },
      {
        label: 'Controla Etiqueta',
        existing: formatBoolean(existingModel.new_controlaetiqueta),
        updated: formatBoolean(modelForm.controlaEtiqueta),
      },
      {
        label: 'Requer Configuração',
        existing: formatBoolean(existingModel.new_requerconfiguracao),
        updated: formatBoolean(modelForm.requerConfiguracao),
      },
      {
        label: 'Requer Cabeamento',
        existing: formatBoolean(existingModel.new_requercabeamento),
        updated: formatBoolean(modelForm.requerCabeamento),
      },
      {
        label: 'Requer Engraving',
        existing: formatBoolean(existingModel.new_requerengraving),
        updated: formatBoolean(modelForm.requerEngraving),
      },
      {
        label: 'Reserva de Produto Livre',
        existing: formatBoolean(existingModel.new_reservadeprodutolivre),
        updated: formatBoolean(modelForm.reservaProdutoLivre),
      },
      {
        label: 'Device IO Template (JSON)',
        existing: existingModel.new_deviceiotemplatejson || '-',
        updated: modelForm.deviceTemplateJson || '-',
      },
      {
        label: 'Horas Agregadas',
        existing: existingModel.cr22f_horasagregadas?.toString() || '-',
        updated: modelForm.horasAgregadas || '-',
      },
    ];
  }, [
    existingModel,
    fabricantesById,
    formatBoolean,
    getTipoSistemaLabel,
    modelForm,
  ]);

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
                onKeyDown={handleSearchKeyDown}
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

                {copyRegimes && (
                  <div className="mt-6">
                    <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>
                      Regimes de Cotação Temporária
                    </Text>

                    {regimesLoading && <LoadingState label="Carregando regimes..." />}
                    {!regimesLoading && regimesError && (
                      <Text size={300} style={{ color: tokens.colorPaletteRedForeground1 }}>
                        {regimesError}
                      </Text>
                    )}
                    {!regimesLoading && !regimesError && regimes.length === 0 && (
                      <EmptyState
                        title="Nenhum regime encontrado"
                        description="Selecione outro modelo ou atualize a lista."
                      />
                    )}
                    {!regimesLoading && !regimesError && regimes.length > 0 && (
                      <div className="mb-4">
                        <DataGrid
                          items={regimes}
                          columns={regimesColumns}
                          getRowId={(item) => item.new_regimedecotacaotemporariaid}
                        />
                      </div>
                    )}

                    {selectedRegimes.length > 0 && (
                      <div className="grid grid-cols-1 gap-4">
                        {selectedRegimes.map((regime) => {
                          const regimeId = regime.new_regimedecotacaotemporariaid;
                          const edit = regimeEdits[regimeId];
                          const placeholder = regime.new_name ? `${regime.new_name} (cópia)` : 'Descrição do regime';
                          return (
                            <div key={regimeId} className="flex flex-col gap-2">
                              <Label htmlFor={`regime-name-${regimeId}`}>Descrição do Regime</Label>
                              <Input
                                id={`regime-name-${regimeId}`}
                                value={edit?.name || ''}
                                onChange={(_, data) => handleRegimeEditChange(regimeId, 'name', data.value)}
                                placeholder={placeholder}
                              />
                              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor={`regime-markup-${regimeId}`}>Markup</Label>
                                  <Input
                                    id={`regime-markup-${regimeId}`}
                                    type="number"
                                    value={edit?.markup || ''}
                                    onChange={(_, data) => handleRegimeEditChange(regimeId, 'markup', data.value)}
                                    placeholder={regime.new_markup?.toString() || 'Markup'}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor={`regime-desconto-${regimeId}`}>Desconto Percentual de Compra</Label>
                                  <Input
                                    id={`regime-desconto-${regimeId}`}
                                    type="number"
                                    value={edit?.desconto || ''}
                                    onChange={(_, data) => handleRegimeEditChange(regimeId, 'desconto', data.value)}
                                    placeholder={regime.new_descontopercentualdecompra?.toString() || 'Desconto'}
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Label htmlFor={`regime-validade-${regimeId}`}>Validade</Label>
                                <Input
                                  id={`regime-validade-${regimeId}`}
                                  value={edit?.validade || ''}
                                  onChange={(_, data) => handleRegimeEditChange(regimeId, 'validade', data.value)}
                                  placeholder={regime.new_validade || 'Validade'}
                                />
                              </div>
                              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                Original: {regime.new_name || '-'}
                              </Text>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label>O que copiar</Label>
            <Checkbox
              checked={copyPreco}
              onChange={(_, data) => setCopyPreco(Boolean(data.checked))}
              label="Copiar preço e serviços do preço"
            />
            <Checkbox
              checked={copyRegimes}
              onChange={(_, data) => {
                const checked = Boolean(data.checked);
                setCopyRegimes(checked);
                if (!checked) {
                  setSelectedRegimeIds([]);
                  setRegimeEdits({});
                }
              }}
              label="Copiar regimes temporários e serviços do regime"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              appearance="primary"
              icon={<Add24Regular />}
              onClick={handleCreate}
              disabled={actionBusy || !canSubmit}
              size="large"
            >
              Criar Novo Item
            </Button>
          </div>
        </div>

        <Dialog open={confirmUpdateOpen} onOpenChange={(_, data) => !data.open && handleCancelUpdateExisting()}>
          <DialogSurface style={{ maxWidth: 900, width: '90vw' }}>
            <DialogBody>
              <DialogTitle>Modelo já existente</DialogTitle>
              <DialogContent>
                <Text block>
                  Já existe um modelo com esta referência. Deseja atualizar o modelo existente com os novos valores?
                </Text>

                {existingComparison.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-3 gap-3">
                      <Text weight="semibold">Campo</Text>
                      <Text weight="semibold">Existente</Text>
                      <Text weight="semibold">Atualizado</Text>
                    </div>
                    {existingComparison.map((item) => {
                      const changed = item.existing !== item.updated;
                      return (
                        <div
                          key={item.label}
                          className="grid grid-cols-3 gap-3"
                          style={
                            changed
                              ? {
                                  backgroundColor: tokens.colorPaletteYellowBackground2,
                                  borderRadius: 6,
                                  padding: 6,
                                }
                              : undefined
                          }
                        >
                          <Text>{item.label}</Text>
                          <Text>{item.existing}</Text>
                          <Text>{item.updated}</Text>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCancelUpdateExisting} appearance="secondary">
                  Cancelar
                </Button>
                <Button onClick={handleConfirmUpdateExisting} appearance="primary">
                  Atualizar modelo existente
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
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
