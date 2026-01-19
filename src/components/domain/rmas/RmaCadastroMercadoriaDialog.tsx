import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Combobox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Option,
  Spinner,
  Text,
  Textarea,
  tokens,
} from '@fluentui/react-components';
import { Add24Regular, ArrowSync24Regular, Dismiss24Regular } from '@fluentui/react-icons';
import { createTableColumn, DataGrid } from '../../shared/DataGrid';
import { EmptyState } from '../../shared/EmptyState';
import { LoadingState } from '../../shared/LoadingState';
import { RMA_STAGES, RMA_TYPE_LABELS } from '../../../features/rmas/constants';
import { Cr22fProjetoService } from '../../../generated/services/Cr22fProjetoService';
import { NewOrdemdeServicoFieldControlService } from '../../../generated/services/NewOrdemdeServicoFieldControlService';
import { New_rmasService } from '../../../generated/services/New_rmasService';
import { New_estoquermasService } from '../../../generated/services/New_estoquermasService';
import { Cr22fEstoqueFromSharepointListService } from '../../../generated/services/Cr22fEstoqueFromSharepointListService';
import { Cr22fModelosdeProdutoFromSharepointListService } from '../../../generated/services/Cr22fModelosdeProdutoFromSharepointListService';

interface RmaCadastroMercadoriaDialogProps {
  open: boolean;
  rmaId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

interface LookupOption {
  id: string;
  label: string;
}

interface EstoqueItem {
  id: string;
  etiqueta: string | null;
  referencia: string | null;
  quantidadeDisponivel?: number | null;
  quantidade?: number | null;
  serialNumber?: string | null;
  modeloId?: string | null;
  status?: string | null;
}

interface EstoqueRmaRow {
  id: string;
  etiquetaAntigo?: string | null;
  etiquetaNovo?: string | null;
  tipoRma?: number | null;
  referencia?: string | null;
  createdOn?: string | null;
  serialNumber?: string | null;
}

const DEFAULT_DEBOUNCE = 300;

const escapeODataString = (value: string) => value.replace(/'/g, "''");

const buildContainsFilter = (fields: string[], value: string) => {
  const term = escapeODataString(value.trim());
  if (!term) return '';
  return fields.map((field) => `contains(${field}, '${term}')`).join(' or ');
};

export function RmaCadastroMercadoriaDialog({ open, rmaId, onClose, onSaved }: RmaCadastroMercadoriaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rmaRecord, setRmaRecord] = useState<any>(null);
  const [projetoOptions, setProjetoOptions] = useState<LookupOption[]>([]);
  const [osOptions, setOsOptions] = useState<LookupOption[]>([]);
  const [estoqueRmaRows, setEstoqueRmaRows] = useState<EstoqueRmaRow[]>([]);
  const [estoqueRmaLoading, setEstoqueRmaLoading] = useState(false);
  const [projetoSearch, setProjetoSearch] = useState('');
  const [osSearch, setOsSearch] = useState('');
  const [produtoAntigoSearch, setProdutoAntigoSearch] = useState('');
  const [produtoNovoSearch, setProdutoNovoSearch] = useState('');
  const [produtoAntigoOptions, setProdutoAntigoOptions] = useState<EstoqueItem[]>([]);
  const [produtoNovoOptions, setProdutoNovoOptions] = useState<EstoqueItem[]>([]);
  const [selectedProjetoId, setSelectedProjetoId] = useState<string | null>(null);
  const [selectedOsId, setSelectedOsId] = useState<string | null>(null);
  const [selectedSituacao, setSelectedSituacao] = useState<number | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [novoCadastro, setNovoCadastro] = useState(false);
  const [selectedTipoRma, setSelectedTipoRma] = useState<number | null>(null);
  const [pendingObservacoes, setPendingObservacoes] = useState<string | null>(null);
  const [selectedProdutoAntigo, setSelectedProdutoAntigo] = useState<EstoqueItem | null>(null);
  const [selectedProdutoNovo, setSelectedProdutoNovo] = useState<EstoqueItem | null>(null);
  const [quantidadeDevolvida, setQuantidadeDevolvida] = useState<number | null>(null);
  const [aprovarVenda, setAprovarVenda] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [controlaSN, setControlaSN] = useState<boolean | null>(null);

  const tipoOptions = useMemo(() => (
    Object.entries(RMA_TYPE_LABELS).map(([value, label]) => ({
      id: value,
      label,
      value: Number(value),
    }))
  ), []);

  const situacaoOptions = useMemo(() => (
    RMA_STAGES.map((stage) => ({
      id: String(stage.value),
      label: stage.label,
      value: stage.value,
    }))
  ), []);

  const estoqueColumns = useMemo(() => ([
    createTableColumn<EstoqueRmaRow>({
      columnId: 'etiquetaAntigo',
      renderHeaderCell: () => 'Etiqueta Produto Antigo',
      renderCell: (item) => item.etiquetaAntigo ?? '-',
    }),
    createTableColumn<EstoqueRmaRow>({
      columnId: 'etiquetaNovo',
      renderHeaderCell: () => 'Etiqueta Produto Novo',
      renderCell: (item) => item.etiquetaNovo ?? '-',
    }),
    createTableColumn<EstoqueRmaRow>({
      columnId: 'tipoRma',
      renderHeaderCell: () => 'Tipo de RMA',
      renderCell: (item) => (item.tipoRma ? RMA_TYPE_LABELS[item.tipoRma] ?? item.tipoRma : '-'),
    }),
    createTableColumn<EstoqueRmaRow>({
      columnId: 'referencia',
      renderHeaderCell: () => 'Referência do Produto',
      renderCell: (item) => item.referencia ?? '-',
    }),
    createTableColumn<EstoqueRmaRow>({
      columnId: 'serialNumber',
      renderHeaderCell: () => 'Nº de Série',
      renderCell: (item) => item.serialNumber ?? '-',
    }),
    createTableColumn<EstoqueRmaRow>({
      columnId: 'createdOn',
      renderHeaderCell: () => 'Created On',
      renderCell: (item) => item.createdOn ? new Date(item.createdOn).toLocaleString('pt-BR') : '-',
    }),
  ]), []);

  const resetCadastro = useCallback(() => {
    setNovoCadastro(false);
    setSelectedTipoRma(null);
    setSelectedProdutoAntigo(null);
    setSelectedProdutoNovo(null);
    setQuantidadeDevolvida(null);
    setAprovarVenda(false);
    setSerialNumber('');
    setControlaSN(null);
  }, []);

  const loadRmaInfo = useCallback(async () => {
    if (!rmaId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await New_rmasService.get(rmaId, {
        select: [
          'new_rmaid',
          '_new_projeto_value',
          '_new_ordemdeservico_value',
          'new_situacao',
          'new_observacoes',
        ],
      });
      setRmaRecord(result.data ?? null);
      setSelectedProjetoId(result.data?._new_projeto_value ?? null);
      setSelectedOsId(result.data?._new_ordemdeservico_value ?? null);
      setSelectedSituacao(result.data?.new_situacao ?? null);
      setObservacoes(result.data?.new_observacoes ?? '');
    } catch (err) {
      console.error('[RmaCadastroMercadoriaDialog] erro ao carregar RMA', err);
      setError('Erro ao carregar dados do RMA.');
    } finally {
      setLoading(false);
    }
  }, [rmaId]);

  const loadProjetos = useCallback(async (searchValue: string) => {
    const filterParts: string[] = ['statecode eq 0'];
    if (searchValue.trim()) {
      const filterText = buildContainsFilter(['cr22f_apelido'], searchValue);
      if (filterText) {
        filterParts.push(`(${filterText})`);
      }
    }
    const result = await Cr22fProjetoService.getAll({
      select: ['cr22f_projetoid', 'cr22f_apelido'],
      filter: filterParts.join(' and '),
      orderBy: ['cr22f_apelido asc'],
      top: 50,
    });
    const options = (result.data || []).map((item: any) => ({
      id: item.cr22f_projetoid,
      label: item.cr22f_apelido ?? item.cr22f_projetoid,
    }));
    setProjetoOptions(options);
  }, []);

  const loadOs = useCallback(async (projectId: string | null, searchValue: string) => {
    if (!projectId) {
      setOsOptions([]);
      return;
    }
    const filterParts = [
      'statecode eq 0',
      `_new_projeto_value eq '${projectId}'`,
    ];
    if (searchValue.trim()) {
      const filterText = buildContainsFilter(['new_name', 'new_clientenome'], searchValue);
      if (filterText) {
        filterParts.push(`(${filterText})`);
      }
    }
    const result = await NewOrdemdeServicoFieldControlService.getAll({
      select: ['new_ordemdeservicofieldcontrolid', 'new_name', 'new_clientenome'],
      filter: filterParts.join(' and '),
      orderBy: ['new_name asc'],
      top: 50,
    });
    const options = (result.data || []).map((item: any) => ({
      id: item.new_ordemdeservicofieldcontrolid,
      label: item.new_name ?? item.new_ordemdeservicofieldcontrolid,
    }));
    setOsOptions(options);
  }, []);

  const loadEstoqueRmaRows = useCallback(async () => {
    if (!rmaId) return;
    setEstoqueRmaLoading(true);
    try {
      const result = await New_estoquermasService.getAll({
        filter: `_new_rma_value eq '${rmaId}'`,
        select: [
          'new_estoquermaid',
          'new_etiquetaprodutoantigo',
          'new_etiquetaprodutonovo',
          'new_tipoderma',
          'new_referenciadoproduto',
          'createdon',
        ],
        expand: {
          new_Produto: {
            select: ['cr22f_serialnumber'],
          },
        },
        orderBy: ['createdon desc'],
      });
      const rows = (result.data || []).map((item: any) => ({
        id: item.new_estoquermaid,
        etiquetaAntigo: item.new_etiquetaprodutoantigo ?? null,
        etiquetaNovo: item.new_etiquetaprodutonovo ?? null,
        tipoRma: item.new_tipoderma ?? null,
        referencia: item.new_referenciadoproduto ?? null,
        createdOn: item.createdon ?? null,
        serialNumber: (item.new_Produto as any)?.cr22f_serialnumber ?? null,
      }));
      setEstoqueRmaRows(rows);
    } catch (err) {
      console.error('[RmaCadastroMercadoriaDialog] erro ao carregar mercadorias', err);
    } finally {
      setEstoqueRmaLoading(false);
    }
  }, [rmaId]);

  const shouldShowProdutoAntigo = useMemo(() => (
    selectedTipoRma !== null && [
      100000003,
      100000002,
      100000000,
      100000004,
    ].includes(selectedTipoRma)
  ), [selectedTipoRma]);

  const shouldShowProdutoNovo = useMemo(() => (
    selectedTipoRma !== null && [
      100000001,
      100000002,
    ].includes(selectedTipoRma)
  ), [selectedTipoRma]);

  const shouldShowQuantidade = useMemo(() => (
    selectedTipoRma !== null && [
      100000003,
      100000002,
      100000000,
      100000004,
    ].includes(selectedTipoRma)
  ), [selectedTipoRma]);

  const shouldShowAprovarVenda = useMemo(() => (
    selectedTipoRma !== null && [
      100000003,
      100000002,
      100000004,
    ].includes(selectedTipoRma)
  ), [selectedTipoRma]);

  const shouldShowSerial = useMemo(() => (
    selectedTipoRma !== null && [
      100000003,
      100000001,
      100000002,
      100000000,
      100000004,
    ].includes(selectedTipoRma)
  ), [selectedTipoRma]);

  const loadProdutoAntigoOptions = useCallback(async () => {
    if (!selectedTipoRma || !selectedProjetoId) {
      setProdutoAntigoOptions([]);
      return;
    }
    const filters: string[] = [
      'statecode eq 0',
      '_new_produtoservico_value ne null',
    ];
    const produtoFilter: string[] = [];

    if (selectedTipoRma === 100000003) {
      produtoFilter.push("new_ProdutoServico/new_eemprestimo eq true");
      produtoFilter.push("new_ProdutoServico/new_emprestimodevolvido ne true");
    } else {
      produtoFilter.push("new_ProdutoServico/new_eemprestimo ne true");
      produtoFilter.push("new_ProdutoServico/new_emprestimodevolvido ne true");
    }

    if (selectedTipoRma === 100000002) {
      produtoFilter.push('new_ProdutoServico/new_opcaodefornecimento eq 100000000');
      filters.push('new_quantidadedisponiveldevolucao gt 0');
    }

    if (selectedTipoRma === 100000000 || selectedTipoRma === 100000001 || selectedTipoRma === 100000004) {
      filters.push('new_quantidade eq 1');
    }

    filters.push(`new_ProdutoServico/_new_projeto_value eq '${selectedProjetoId}'`);
    filters.push(`(${[
      "cr22f_status eq 'Entregue'",
      'new_ProdutoServico/new_entregue eq true',
    ].join(' or ')})`);
    filters.push(...produtoFilter);

    const searchFilter = buildContainsFilter(
      ['new_referenciadoproduto', 'new_etiquetaemtextocalculated'],
      produtoAntigoSearch
    );
    if (searchFilter) {
      filters.push(`(${searchFilter})`);
    }

    const result = await Cr22fEstoqueFromSharepointListService.getAll({
      select: [
        'cr22f_estoquefromsharepointlistid',
        'new_etiquetaemtextocalculated',
        'new_referenciadoproduto',
        'new_quantidadedisponiveldevolucao',
        'new_quantidade',
        'cr22f_serialnumber',
        '_new_modelodeproduto_value',
        'cr22f_status',
      ],
      filter: filters.join(' and '),
      orderBy: ['new_referenciadoproduto asc'],
      top: 50,
    });
    const options = (result.data || []).map((item: any) => ({
      id: item.cr22f_estoquefromsharepointlistid,
      etiqueta: item.new_etiquetaemtextocalculated ?? null,
      referencia: item.new_referenciadoproduto ?? null,
      quantidadeDisponivel: item.new_quantidadedisponiveldevolucao ?? null,
      quantidade: item.new_quantidade ?? null,
      serialNumber: item.cr22f_serialnumber ?? null,
      modeloId: item._new_modelodeproduto_value ?? null,
      status: item.cr22f_status ?? null,
    }));
    setProdutoAntigoOptions(options);
  }, [produtoAntigoSearch, selectedProjetoId, selectedTipoRma]);

  const loadProdutoNovoOptions = useCallback(async () => {
    if (!selectedTipoRma) {
      setProdutoNovoOptions([]);
      return;
    }
    const filters: string[] = [
      'statecode eq 0',
    ];

    if (selectedTipoRma === 100000001) {
      filters.push('_new_produtoservico_value eq null');
      filters.push("cr22f_status eq 'Disponível'");
      filters.push('new_quantidade eq 1');
    }

    if (selectedTipoRma === 100000002 && selectedProdutoAntigo) {
      const quantidade = quantidadeDevolvida ?? selectedProdutoAntigo.quantidadeDisponivel ?? null;
      if (quantidade !== null) {
        filters.push(`new_quantidade eq ${quantidade}`);
        filters.push(`new_quantidadedisponiveldevolucao eq ${quantidade}`);
        filters.push('new_quantidadedisponiveldevolucao gt 0');
      }
      filters.push('_new_produtoservico_value ne null');
      filters.push('new_ProdutoServico/new_opcaodefornecimento eq 100000000');
      filters.push('new_ProdutoServico/new_eemprestimo ne true');
      filters.push(`(${[
        `cr22f_estoquefromsharepointlistid eq '${selectedProdutoAntigo.id}'`,
        selectedProdutoAntigo.modeloId
          ? `(_new_modelodeproduto_value eq '${selectedProdutoAntigo.modeloId}' and cr22f_status eq 'Disponível')`
          : "cr22f_status eq 'Disponível'",
      ].join(' or ')})`);
    }

    const searchFilter = buildContainsFilter(
      ['new_referenciadoproduto', 'new_etiquetaemtextocalculated'],
      produtoNovoSearch
    );
    if (searchFilter) {
      filters.push(`(${searchFilter})`);
    }

    const result = await Cr22fEstoqueFromSharepointListService.getAll({
      select: [
        'cr22f_estoquefromsharepointlistid',
        'new_etiquetaemtextocalculated',
        'new_referenciadoproduto',
        'new_quantidade',
        'new_quantidadedisponiveldevolucao',
        'cr22f_serialnumber',
        '_new_modelodeproduto_value',
        'new_datadaultimaleitura',
        'cr22f_status',
      ],
      filter: filters.join(' and '),
      orderBy: selectedTipoRma === 100000001 ? ['new_datadaultimaleitura desc'] : ['new_referenciadoproduto asc'],
      top: 50,
    });
    const options = (result.data || []).map((item: any) => ({
      id: item.cr22f_estoquefromsharepointlistid,
      etiqueta: item.new_etiquetaemtextocalculated ?? null,
      referencia: item.new_referenciadoproduto ?? null,
      quantidade: item.new_quantidade ?? null,
      quantidadeDisponivel: item.new_quantidadedisponiveldevolucao ?? null,
      serialNumber: item.cr22f_serialnumber ?? null,
      modeloId: item._new_modelodeproduto_value ?? null,
      status: item.cr22f_status ?? null,
    }));
    setProdutoNovoOptions(options);
  }, [produtoNovoSearch, quantidadeDevolvida, selectedProdutoAntigo, selectedTipoRma]);

  const checkControlaSn = useCallback(async (modeloId: string | null) => {
    if (!modeloId) {
      setControlaSN(null);
      return;
    }
    try {
      const result = await Cr22fModelosdeProdutoFromSharepointListService.get(modeloId, {
        select: ['new_controlasn'],
      });
      setControlaSN(result.data?.new_controlasn ?? null);
    } catch (err) {
      console.error('[RmaCadastroMercadoriaDialog] erro ao carregar controle S/N', err);
      setControlaSN(null);
    }
  }, []);

  const canSaveCadastro = useMemo(() => {
    if (!novoCadastro || selectedTipoRma === null) return false;
    const snObrigatorio = controlaSN === true;
    const snOk = !snObrigatorio || serialNumber.trim().length > 3;
    const quantidadeDisponivel = selectedProdutoAntigo?.quantidadeDisponivel ?? null;
    const quantidadeValida = !shouldShowQuantidade
      || (quantidadeDevolvida !== null
        && quantidadeDevolvida >= 1
        && (quantidadeDisponivel === null || quantidadeDevolvida <= Number(quantidadeDisponivel)));

    switch (selectedTipoRma) {
      case 100000003:
        return Boolean(selectedProdutoAntigo?.id) && snOk && quantidadeValida;
      case 100000001:
        return Boolean(selectedProdutoNovo?.id) && Boolean(selectedOsId) && snOk;
      case 100000002:
        return Boolean(selectedProdutoAntigo?.id) && Boolean(selectedProdutoNovo?.id) && snOk && quantidadeValida;
      case 100000000:
        return Boolean(selectedProdutoAntigo?.id) && snOk && quantidadeValida;
      case 100000004:
        return Boolean(selectedProdutoAntigo?.id) && aprovarVenda && snOk && quantidadeValida;
      default:
        return false;
    }
  }, [
    novoCadastro,
    selectedTipoRma,
    selectedProdutoAntigo,
    selectedProdutoNovo,
    selectedOsId,
    serialNumber,
    controlaSN,
    aprovarVenda,
  ]);

  const handleSaveCadastro = useCallback(async () => {
    if (!rmaId || !selectedTipoRma) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        'new_RMA@odata.bind': `/new_rmas(${rmaId})`,
        new_tipoderma: selectedTipoRma,
        new_opcaodedevolucao: 100000000,
      };

      const baseProduto = selectedTipoRma === 100000001 ? selectedProdutoNovo : selectedProdutoAntigo;

      if (baseProduto) {
        payload['new_Produto@odata.bind'] = `/cr22f_estoquefromsharepointlists(${baseProduto.id})`;
      }
      if (selectedProdutoNovo && shouldShowProdutoNovo) {
        payload['new_ProdutoNovo@odata.bind'] = `/cr22f_estoquefromsharepointlists(${selectedProdutoNovo.id})`;
      }
      if (shouldShowAprovarVenda) {
        payload.new_aprovadoparavenda = aprovarVenda;
      }

      await New_estoquermasService.create(payload as any);
      await New_rmasService.update(rmaId, { new_tipoderma: selectedTipoRma } as any);

      const serialTarget = selectedTipoRma === 100000001 && selectedProdutoNovo
        ? selectedProdutoNovo
        : selectedProdutoAntigo;
      if (serialTarget && serialNumber.trim().length > 0) {
        await Cr22fEstoqueFromSharepointListService.update(serialTarget.id, {
          cr22f_serialnumber: serialNumber.trim(),
        } as any);
      }

      resetCadastro();
      await loadEstoqueRmaRows();
      onSaved();
    } catch (err) {
      console.error('[RmaCadastroMercadoriaDialog] erro ao registrar retorno', err);
      setError('Erro ao registrar retorno.');
    } finally {
      setSaving(false);
    }
  }, [
    rmaId,
    selectedTipoRma,
    selectedProdutoAntigo,
    selectedProdutoNovo,
    shouldShowProdutoNovo,
    shouldShowAprovarVenda,
    aprovarVenda,
    serialNumber,
    resetCadastro,
    loadEstoqueRmaRows,
    onSaved,
  ]);

  useEffect(() => {
    if (!open) return;
    void loadRmaInfo();
    void loadEstoqueRmaRows();
  }, [open, loadRmaInfo, loadEstoqueRmaRows]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      void loadProjetos(projetoSearch);
    }, DEFAULT_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [open, projetoSearch, loadProjetos]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      void loadOs(selectedProjetoId, osSearch);
    }, DEFAULT_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [open, selectedProjetoId, osSearch, loadOs]);

  useEffect(() => {
    if (!open || !novoCadastro) return;
    const timer = setTimeout(() => {
      void loadProdutoAntigoOptions();
    }, DEFAULT_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [open, novoCadastro, loadProdutoAntigoOptions]);

  useEffect(() => {
    if (!open || !novoCadastro) return;
    const timer = setTimeout(() => {
      void loadProdutoNovoOptions();
    }, DEFAULT_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [open, novoCadastro, loadProdutoNovoOptions]);

  useEffect(() => {
    if (!novoCadastro) return;
    const modeloId = selectedProdutoAntigo?.modeloId ?? selectedProdutoNovo?.modeloId ?? null;
    void checkControlaSn(modeloId);
  }, [checkControlaSn, novoCadastro, selectedProdutoAntigo, selectedProdutoNovo]);

  useEffect(() => {
    if (!novoCadastro) return;
    if (selectedProdutoAntigo?.quantidadeDisponivel != null) {
      setQuantidadeDevolvida(Number(selectedProdutoAntigo.quantidadeDisponivel));
    }
    setSerialNumber(selectedProdutoAntigo?.serialNumber ?? '');
  }, [novoCadastro, selectedProdutoAntigo]);

  useEffect(() => {
    if (pendingObservacoes === null || !rmaId) return;
    const timer = setTimeout(async () => {
      try {
        await New_rmasService.update(rmaId, {
          new_observacoes: pendingObservacoes || null,
        } as any);
        onSaved();
      } catch (err) {
        console.error('[RmaCadastroMercadoriaDialog] erro ao salvar observações', err);
      }
      setPendingObservacoes(null);
    }, 500);
    return () => clearTimeout(timer);
  }, [pendingObservacoes, rmaId, onSaved]);

  const updateRmaField = useCallback(async (fields: Partial<any>) => {
    if (!rmaId) return;
    try {
      await New_rmasService.update(rmaId, fields);
      onSaved();
    } catch (err) {
      console.error('[RmaCadastroMercadoriaDialog] erro ao atualizar campo do RMA', err);
      setError('Erro ao atualizar campo.');
    }
  }, [rmaId, onSaved]);

  const dialogTitle = rmaRecord?.new_id ? `Cadastro de Retorno de Mercadoria | ${rmaRecord.new_id}` : 'Cadastro de Retorno de Mercadoria';

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface style={{ maxWidth: 1200 }}>
        <DialogBody>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogContent>
            {loading ? (
              <LoadingState label="Carregando informações do RMA..." />
            ) : error ? (
              <EmptyState title="Erro ao carregar dados" description={error} />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    icon={<ArrowSync24Regular />}
                    onClick={loadEstoqueRmaRows}
                    appearance="secondary"
                  >
                    Atualizar
                  </Button>
                  <Button
                    icon={<Add24Regular />}
                    onClick={() => setNovoCadastro(true)}
                    appearance="primary"
                  >
                    Nova mercadoria
                  </Button>
                  <Button
                    icon={<Dismiss24Regular />}
                    onClick={onClose}
                    appearance="subtle"
                  >
                    Fechar
                  </Button>
                </div>

                <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground1 }}>
                  <Text size={400} weight="semibold" block style={{ marginBottom: 12 }}>
                    Informações do RMA
                  </Text>
                  <div className="flex flex-col gap-3">
                    <Field label="Projeto">
                      <Combobox
                        placeholder="Buscar projetos"
                        value={projetoOptions.find((item) => item.id === selectedProjetoId)?.label ?? ''}
                        selectedOptions={selectedProjetoId ? [selectedProjetoId] : []}
                        onOptionSelect={(_, data) => {
                          const nextId = data.optionValue ?? null;
                          setSelectedProjetoId(nextId);
                          setSelectedOsId(null);
                          void updateRmaField({
                            'new_Projeto@odata.bind': nextId ? `/cr22f_projetos(${nextId})` : null,
                            'new_OrdemdeServico@odata.bind': null,
                          });
                        }}
                        onChange={(_, data) => setProjetoSearch(data.value ?? '')}
                      >
                        {projetoOptions.map((item) => (
                          <Option key={item.id} value={item.id}>
                            {item.label}
                          </Option>
                        ))}
                      </Combobox>
                    </Field>

                    <Field label="OS">
                      <Combobox
                        placeholder="Buscar OS"
                        value={osOptions.find((item) => item.id === selectedOsId)?.label ?? ''}
                        selectedOptions={selectedOsId ? [selectedOsId] : []}
                        onOptionSelect={(_, data) => {
                          const nextId = data.optionValue ?? null;
                          setSelectedOsId(nextId);
                          void updateRmaField({
                            'new_OrdemdeServico@odata.bind': nextId ? `/new_ordemdeservicofieldcontrols(${nextId})` : null,
                          });
                        }}
                        onChange={(_, data) => setOsSearch(data.value ?? '')}
                        disabled={!selectedProjetoId}
                      >
                        {osOptions.map((item) => (
                          <Option key={item.id} value={item.id}>
                            {item.label}
                          </Option>
                        ))}
                      </Combobox>
                    </Field>

                    <Field label="Situação">
                      <Combobox
                        placeholder="Escolha a situação"
                        value={situacaoOptions.find((item) => item.value === selectedSituacao)?.label ?? ''}
                        selectedOptions={selectedSituacao !== null ? [String(selectedSituacao)] : []}
                        onOptionSelect={(_, data) => {
                          const nextValue = data.optionValue ? Number(data.optionValue) : null;
                          setSelectedSituacao(nextValue);
                          void updateRmaField({
                            new_situacao: nextValue,
                          });
                        }}
                      >
                        {situacaoOptions.map((item) => (
                          <Option key={item.id} value={item.id}>
                            {item.label}
                          </Option>
                        ))}
                      </Combobox>
                    </Field>

                    <Field label="Observações">
                      <Textarea
                        value={observacoes}
                        onChange={(_, data) => {
                          setObservacoes(data.value);
                          setPendingObservacoes(data.value);
                        }}
                        resize="vertical"
                        placeholder="Observações sobre o RMA"
                      />
                    </Field>
                  </div>
                </Card>

                <Card style={{ padding: 16 }}>
                  <Text size={400} weight="semibold" block style={{ marginBottom: 12 }}>
                    Mercadorias devolvidas
                  </Text>
                  {estoqueRmaLoading ? (
                    <LoadingState label="Carregando mercadorias..." />
                  ) : (
                    <DataGrid
                      items={estoqueRmaRows}
                      columns={estoqueColumns}
                      getRowId={(item) => item.id}
                      emptyState={<EmptyState title="Nenhuma mercadoria" description="Nenhum registro encontrado para este RMA." />}
                    />
                  )}
                </Card>

                {novoCadastro && (
                  <Card style={{ padding: 16 }}>
                    <Text size={400} weight="semibold" block style={{ marginBottom: 12 }}>
                      Detalhes da mercadoria
                    </Text>
                    <div className="flex flex-col gap-3">
                      <Field label="Tipo de devolução" required>
                        <Combobox
                          placeholder="Selecione o tipo de RMA"
                          value={tipoOptions.find((item) => item.value === selectedTipoRma)?.label ?? ''}
                          selectedOptions={selectedTipoRma !== null ? [String(selectedTipoRma)] : []}
                          onOptionSelect={(_, data) => {
                            const value = data.optionValue ? Number(data.optionValue) : null;
                            setSelectedTipoRma(value);
                            setSelectedProdutoAntigo(null);
                            setSelectedProdutoNovo(null);
                            setQuantidadeDevolvida(null);
                          }}
                        >
                          {tipoOptions.map((item) => (
                            <Option key={item.id} value={String(item.value)}>
                              {item.label}
                            </Option>
                          ))}
                        </Combobox>
                      </Field>

                      {shouldShowProdutoAntigo && (
                        <Field label="Produto antigo" required>
                          <Combobox
                            placeholder="Buscar mercadorias"
                            value={selectedProdutoAntigo ? `${selectedProdutoAntigo.etiqueta ?? ''} ${selectedProdutoAntigo.referencia ?? ''}`.trim() : ''}
                            selectedOptions={selectedProdutoAntigo ? [selectedProdutoAntigo.id] : []}
                            onOptionSelect={(_, data) => {
                              const next = produtoAntigoOptions.find((item) => item.id === data.optionValue) ?? null;
                              setSelectedProdutoAntigo(next);
                            }}
                            onChange={(_, data) => setProdutoAntigoSearch(data.value ?? '')}
                            disabled={!selectedProjetoId}
                          >
                            {produtoAntigoOptions.map((item) => (
                              <Option key={item.id} value={item.id}>
                                {(item.etiqueta ?? '-') + ' - ' + (item.referencia ?? '-')}
                              </Option>
                            ))}
                          </Combobox>
                        </Field>
                      )}

                      {shouldShowQuantidade && (
                        <Field label="Quantidade devolvida" required>
                          <Input
                            type="number"
                            value={quantidadeDevolvida?.toString() ?? ''}
                            onChange={(_, data) => setQuantidadeDevolvida(Number(data.value))}
                            min={1}
                            max={selectedProdutoAntigo?.quantidadeDisponivel ?? undefined}
                          />
                        </Field>
                      )}

                      {shouldShowProdutoNovo && (
                        <Field label="Produto novo" required>
                          <Combobox
                            placeholder="Buscar mercadorias"
                            value={selectedProdutoNovo ? `${selectedProdutoNovo.etiqueta ?? ''} ${selectedProdutoNovo.referencia ?? ''}`.trim() : ''}
                            selectedOptions={selectedProdutoNovo ? [selectedProdutoNovo.id] : []}
                            onOptionSelect={(_, data) => {
                              const next = produtoNovoOptions.find((item) => item.id === data.optionValue) ?? null;
                              setSelectedProdutoNovo(next);
                            }}
                            onChange={(_, data) => setProdutoNovoSearch(data.value ?? '')}
                          >
                            {produtoNovoOptions.map((item) => (
                              <Option key={item.id} value={item.id}>
                                {(item.etiqueta ?? '-') + ' - ' + (item.referencia ?? '-')}
                              </Option>
                            ))}
                          </Combobox>
                        </Field>
                      )}

                      {shouldShowAprovarVenda && (
                        <Field label="Aprovar para venda">
                          <Checkbox
                            checked={aprovarVenda}
                            onChange={(_, data) => setAprovarVenda(Boolean(data.checked))}
                            label={aprovarVenda ? 'Sim' : 'Não'}
                          />
                        </Field>
                      )}

                      {shouldShowSerial && (
                        <Field
                          label="Número de Série"
                          validationMessage={controlaSN ? 'Obrigatório (modelo controla S/N)' : undefined}
                        >
                          <Input
                            value={serialNumber}
                            onChange={(_, data) => setSerialNumber(data.value)}
                            placeholder="Informe o número de série"
                          />
                        </Field>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          appearance="primary"
                          onClick={handleSaveCadastro}
                          disabled={!canSaveCadastro || saving}
                        >
                          Registrar retorno
                        </Button>
                        <Button appearance="subtle" onClick={resetCadastro} disabled={saving}>
                          Cancelar
                        </Button>
                        {saving && <Spinner size="tiny" />}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            {saving && <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Salvando...</Text>}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
