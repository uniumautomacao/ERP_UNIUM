import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Tab, TabList, Text, tokens, Input, Checkbox, Dropdown, Option } from '@fluentui/react-components';
import { LoadingState } from '../../../components/shared/LoadingState';
import { EmptyState } from '../../../components/shared/EmptyState';
import { DataGrid, createTableColumn } from '../../../components/shared/DataGrid';
import { ParsedExcelData, ColumnMapping, ComparisonResults, ProductoNovo, ProductoExistente, ProductoDescontinuado, ProductoSemAlteracao } from './importacaoTypes';
import { parseMonetaryValue, inferirValoresModelo, inferirValoresPreco } from './importacaoUtils';
import { Cr22fModelosdeProdutoFromSharepointListService, NewPrecodeProdutoService } from '../../../generated';

const TIPOS_SISTEMA = [
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

const TIPOS_OS = [
  { value: 100000000, label: 'Cabeamento' },
  { value: 100000001, label: 'Instalação' },
  { value: 100000002, label: 'Manutenção' },
  { value: 100000003, label: 'Conferência de infraestrutura' },
  { value: 100000004, label: 'Entrega' },
  { value: 100000005, label: 'Desenho de PTI' },
  { value: 100000006, label: 'Ajuste de PTI' },
  { value: 100000007, label: 'Instalação placa de obra' },
  { value: 100000008, label: 'Remoção de placa de obra' },
  { value: 100000009, label: 'Montagem de Quadro' },
  { value: 100000010, label: 'Serviço Interno' },
  { value: 100000011, label: 'Lista de Conferência' },
  { value: 100000012, label: 'Configuração' },
];

interface ComparisonStepProps {
  excelData: ParsedExcelData;
  columnMapping: ColumnMapping;
  fabricanteId: string;
  markupSource: 'inferred' | 'calculated';
  defaultMarkup: number;
  defaultDesconto: number;
  onComparisonComplete: (results: ComparisonResults) => void;
}

type TabValue = 'novos' | 'existentes' | 'semAlteracao' | 'descontinuados';

export function ComparisonStep({
  excelData,
  columnMapping,
  fabricanteId,
  markupSource,
  defaultMarkup,
  defaultDesconto,
  onComparisonComplete,
}: ComparisonStepProps) {
  const [selectedTab, setSelectedTab] = useState<TabValue>('novos');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ComparisonResults | null>(null);
  const [editableNovos, setEditableNovos] = useState<ProductoNovo[]>([]);

  const compareData = useCallback(async () => {
    if (!columnMapping.codigoColumn || !columnMapping.precoBaseColumn || !fabricanteId) {
      return;
    }

    setLoading(true);

    try {
      // 1. Buscar valores inferidos
      const [valoresModelo, valoresPreco] = await Promise.all([
        inferirValoresModelo(fabricanteId),
        inferirValoresPreco(fabricanteId),
      ]);

      // 2. Buscar todos os modelos do fabricante
      const modelosResult = await Cr22fModelosdeProdutoFromSharepointListService.getAll({
        filter: `statecode eq 0 and _new_fabricante_value eq '${fabricanteId}'`,
        select: ['cr22f_modelosdeprodutofromsharepointlistid', 'cr22f_title', 'new_descricao'],
      });

      const systemModels = new Map(
        (modelosResult.data || []).map((m: any) => [m.cr22f_title, m])
      );

      // 3. Buscar preços de todos os modelos
      const modelosIds = Array.from(systemModels.values()).map((m: any) => m.cr22f_modelosdeprodutofromsharepointlistid);
      const precosResult = modelosIds.length > 0 ? await NewPrecodeProdutoService.getAll({
        filter: `statecode eq 0 and _new_modelodeproduto_value ne null`,
        select: ['new_precodeprodutoid', 'new_precobase', 'new_markup', 'new_descontopercentualdecompra', '_new_modelodeproduto_value'],
      }) : { success: true, data: [] };

      const pricesByModel = new Map<string, any[]>();
      (precosResult.data || []).forEach((p: any) => {
        const modelId = p._new_modelodeproduto_value;
        if (!pricesByModel.has(modelId)) {
          pricesByModel.set(modelId, []);
        }
        pricesByModel.get(modelId)!.push(p);
      });

      // 4. Categorizar produtos
      const toCreate: ProductoNovo[] = [];
      const toUpdate: ProductoExistente[] = [];
      const unchanged: ProductoSemAlteracao[] = [];
      const excelCodigos = new Set<string>();

      excelData.rows.forEach((row) => {
        const codigo = String(row[columnMapping.codigoColumn!] || '').trim();
        if (!codigo) return;

        excelCodigos.add(codigo);

        const descricao = columnMapping.descricaoColumn ? String(row[columnMapping.descricaoColumn] || '') : '';
        const precoBase = parseMonetaryValue(row[columnMapping.precoBaseColumn!]);

        if (!precoBase || precoBase <= 0) return;

        // Calcular desconto e markup
        const desconto = valoresPreco.desconto?.[0] || defaultDesconto;
        let markup = valoresPreco.markup?.[0] || defaultMarkup;

        // Se modo de markup é calculado e há coluna de preço sugerido
        if (markupSource === 'calculated' && columnMapping.precoSugeridoColumn) {
          const precoSugerido = parseMonetaryValue(row[columnMapping.precoSugeridoColumn]);
          if (precoSugerido && precoSugerido > 0) {
            // Calcular preço de compra (preço base com desconto aplicado)
            const precoCompra = precoBase * (1 - desconto / 100);
            // Calcular markup: PreçoSugerido / PreçoCompra (multiplicador decimal)
            // Exemplo: se preço compra = 10 e sugerido = 20, markup = 2 (200%)
            markup = precoSugerido / precoCompra;
          }
        }

        if (systemModels.has(codigo)) {
          // Produto existe
          const model = systemModels.get(codigo)!;
          const existingPrices = pricesByModel.get(model.cr22f_modelosdeprodutofromsharepointlistid) || [];

          // Verificar se houve mudança nos valores principais
          const precoAtual = existingPrices[0]?.new_precobase || 0;
          const markupAtual = existingPrices[0]?.new_markup || 0;
          const descontoAtual = existingPrices[0]?.new_descontopercentualdecompra || 0;

          // Comparar com tolerância de 0.01 para evitar problemas de precisão
          const precoMudou = Math.abs(precoBase - precoAtual) > 0.01;
          const markupMudou = Math.abs(markup - markupAtual) > 0.01;
          const descontoMudou = Math.abs(desconto - descontoAtual) > 0.01;

          if (precoMudou || markupMudou || descontoMudou) {
            // Produto com alteração
            toUpdate.push({
              codigo,
              modeloId: model.cr22f_modelosdeprodutofromsharepointlistid,
              descricao: model.new_descricao || '',
              precoBase,
              precoAtual,
              descricaoPreco: descricao,
              fornecedorId: valoresPreco.fornecedorId?.[0] || '',
              desconto,
              markup,
              requerInstalacao: valoresPreco.requerInstalacao?.[0] || false,
              servicosIds: valoresPreco.servicosIds?.map(s => s.servicoId) || [],
              existingPrices,
              action: 'update',
            });
          } else {
            // Produto sem alteração
            unchanged.push({
              codigo,
              modeloId: model.cr22f_modelosdeprodutofromsharepointlistid,
              descricao: model.new_descricao || '',
              precoBase,
              desconto,
              markup,
            });
          }
        } else {
          // Produto novo
          toCreate.push({
            codigo,
            descricao,
            precoBase,
            categoria: valoresModelo.categoria?.[0] || '',
            tipoSistema: valoresModelo.tipoSistema?.[0] || null,
            tipodeOSPadrao: valoresModelo.tipodeOSPadrao?.[0] || null,
            controlaSN: valoresModelo.controlaSN?.[0] || false,
            controlaEtiqueta: valoresModelo.controlaEtiqueta?.[0] || false,
            requerConfiguracao: valoresModelo.requerConfiguracao?.[0] || false,
            requerCabeamento: valoresModelo.requerCabeamento?.[0] || false,
            omitirGuia: valoresModelo.omitirGuia?.[0] || false,
            horasAgregadas: valoresModelo.horasAgregadas?.[0] || '',
            descricaoPreco: descricao,
            fornecedorId: valoresPreco.fornecedorId?.[0] || '',
            desconto,
            markup,
            requerInstalacao: valoresPreco.requerInstalacao?.[0] || false,
            servicosIds: valoresPreco.servicosIds?.map(s => s.servicoId) || [],
            action: 'create',
            hasMultipleOptions: false,
            camposComOpcoes: [],
          });
        }
      });

      // 5. Produtos descontinuados
      const toDeactivate: ProductoDescontinuado[] = [];
      systemModels.forEach((model, codigo) => {
        if (!excelCodigos.has(codigo)) {
          toDeactivate.push({
            codigo,
            modeloId: model.cr22f_modelosdeprodutofromsharepointlistid,
            descricao: model.new_descricao || '',
            action: 'deactivate', // Default: marcar para descontinuar
          });
        }
      });

      const comparisonResults = { toCreate, toUpdate, unchanged, toDeactivate };
      setResults(comparisonResults);
      setEditableNovos(toCreate);
      onComparisonComplete(comparisonResults);
    } catch (error) {
      console.error('Erro ao comparar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [excelData, columnMapping, fabricanteId, markupSource, defaultMarkup, defaultDesconto]);

  // Handler para atualizar campos de produtos novos
  const handleUpdateNovo = useCallback((codigo: string, field: keyof ProductoNovo, value: any) => {
    setEditableNovos((prev) => {
      const updated = prev.map((item) =>
        item.codigo === codigo ? { ...item, [field]: value } : item
      );
      
      // Atualizar também os resultados para refletir nas próximas etapas
      if (results) {
        const updatedResults = {
          ...results,
          toCreate: updated,
        };
        onComparisonComplete(updatedResults);
      }
      
      return updated;
    });
  }, [results, onComparisonComplete]);

  // Handler para aplicar valor a todos os produtos novos
  const handleBulkUpdate = useCallback((field: keyof ProductoNovo, value: any) => {
    setEditableNovos((prev) => {
      const updated = prev.map((item) => ({ ...item, [field]: value }));
      
      // Atualizar também os resultados
      if (results) {
        const updatedResults = {
          ...results,
          toCreate: updated,
        };
        onComparisonComplete(updatedResults);
      }
      
      return updated;
    });
  }, [results, onComparisonComplete]);

  // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    void compareData();
  }, [compareData]);

  const novosColumns = useMemo(
    () => [
      createTableColumn<ProductoNovo>({
        columnId: 'codigo',
        renderHeaderCell: () => 'Código',
        renderCell: (item) => item.codigo,
        compare: (a, b) => a.codigo.localeCompare(b.codigo),
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'descricao',
        renderHeaderCell: () => 'Descrição',
        renderCell: (item) => item.descricao || '-',
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'categoria',
        renderHeaderCell: () => 'Categoria',
        renderCell: (item) => (
          <Input
            size="small"
            value={item.categoria}
            onChange={(e, data) => handleUpdateNovo(item.codigo, 'categoria', data.value)}
            style={{ width: '100%' }}
          />
        ),
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'horasAgregadas',
        renderHeaderCell: () => 'Horas Agregadas',
        renderCell: (item) => (
          <Input
            size="small"
            value={item.horasAgregadas}
            onChange={(e, data) => handleUpdateNovo(item.codigo, 'horasAgregadas', data.value)}
            style={{ width: '100%' }}
          />
        ),
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'tipoSistema',
        renderHeaderCell: () => 'Tipo Sistema',
        renderCell: (item) => (
          <Dropdown
            size="small"
            value={TIPOS_SISTEMA.find(t => t.value === item.tipoSistema)?.label || ''}
            selectedOptions={item.tipoSistema ? [String(item.tipoSistema)] : []}
            onOptionSelect={(e, data) => handleUpdateNovo(item.codigo, 'tipoSistema', Number(data.optionValue))}
            style={{ width: '100%' }}
          >
            {TIPOS_SISTEMA.map(tipo => (
              <Option key={tipo.value} value={String(tipo.value)}>
                {tipo.label}
              </Option>
            ))}
          </Dropdown>
        ),
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'tipodeOSPadrao',
        renderHeaderCell: () => 'Tipo OS',
        renderCell: (item) => (
          <Dropdown
            size="small"
            value={TIPOS_OS.find(t => t.value === item.tipodeOSPadrao)?.label || ''}
            selectedOptions={item.tipodeOSPadrao ? [String(item.tipodeOSPadrao)] : []}
            onOptionSelect={(e, data) => handleUpdateNovo(item.codigo, 'tipodeOSPadrao', Number(data.optionValue))}
            style={{ width: '100%' }}
          >
            {TIPOS_OS.map(tipo => (
              <Option key={tipo.value} value={String(tipo.value)}>
                {tipo.label}
              </Option>
            ))}
          </Dropdown>
        ),
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'controlaSN',
        renderHeaderCell: () => 'Controla S/N',
        renderCell: (item) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Checkbox
              checked={item.controlaSN}
              onChange={(e, data) => handleUpdateNovo(item.codigo, 'controlaSN', data.checked)}
            />
          </div>
        ),
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'controlaEtiqueta',
        renderHeaderCell: () => 'Controla Etiqueta',
        renderCell: (item) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Checkbox
              checked={item.controlaEtiqueta}
              onChange={(e, data) => handleUpdateNovo(item.codigo, 'controlaEtiqueta', data.checked)}
            />
          </div>
        ),
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'requerCabeamento',
        renderHeaderCell: () => 'Requer Cabeamento',
        renderCell: (item) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Checkbox
              checked={item.requerCabeamento}
              onChange={(e, data) => handleUpdateNovo(item.codigo, 'requerCabeamento', data.checked)}
            />
          </div>
        ),
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'requerConfiguracao',
        renderHeaderCell: () => 'Requer Configuração',
        renderCell: (item) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Checkbox
              checked={item.requerConfiguracao}
              onChange={(e, data) => handleUpdateNovo(item.codigo, 'requerConfiguracao', data.checked)}
            />
          </div>
        ),
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'omitirGuia',
        renderHeaderCell: () => 'Omitir Guia',
        renderCell: (item) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Checkbox
              checked={item.omitirGuia}
              onChange={(e, data) => handleUpdateNovo(item.codigo, 'omitirGuia', data.checked)}
            />
          </div>
        ),
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'requerInstalacao',
        renderHeaderCell: () => 'Requer Instalação',
        renderCell: (item) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Checkbox
              checked={item.requerInstalacao}
              onChange={(e, data) => handleUpdateNovo(item.codigo, 'requerInstalacao', data.checked)}
            />
          </div>
        ),
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'preco',
        renderHeaderCell: () => 'Preço Base',
        renderCell: (item) => `R$ ${item.precoBase.toFixed(2)}`,
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: () => <Badge appearance="tint" color="success">Novo</Badge>,
      }),
    ],
    [handleUpdateNovo]
  );

  const existentesColumns = useMemo(
    () => [
      createTableColumn<ProductoExistente>({
        columnId: 'codigo',
        renderHeaderCell: () => 'Código',
        renderCell: (item) => item.codigo,
      }),
      createTableColumn<ProductoExistente>({
        columnId: 'descricao',
        renderHeaderCell: () => 'Descrição',
        renderCell: (item) => item.descricao || '-',
      }),
      createTableColumn<ProductoExistente>({
        columnId: 'precoAtual',
        renderHeaderCell: () => 'Preço Atual',
        renderCell: (item) => `R$ ${item.precoAtual.toFixed(2)}`,
      }),
      createTableColumn<ProductoExistente>({
        columnId: 'precoNovo',
        renderHeaderCell: () => 'Preço Novo',
        renderCell: (item) => `R$ ${item.precoBase.toFixed(2)}`,
      }),
      createTableColumn<ProductoExistente>({
        columnId: 'desconto',
        renderHeaderCell: () => 'Desconto',
        renderCell: (item) => `${item.desconto.toFixed(2)}%`,
      }),
      createTableColumn<ProductoExistente>({
        columnId: 'markup',
        renderHeaderCell: () => 'Markup',
        renderCell: (item) => `${item.markup.toFixed(2)}x`,
      }),
      createTableColumn<ProductoExistente>({
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: () => <Badge appearance="tint" color="informative">Atualizar</Badge>,
      }),
    ],
    []
  );

  const semAlteracaoColumns = useMemo(
    () => [
      createTableColumn<ProductoSemAlteracao>({
        columnId: 'codigo',
        renderHeaderCell: () => 'Código',
        renderCell: (item) => item.codigo,
      }),
      createTableColumn<ProductoSemAlteracao>({
        columnId: 'descricao',
        renderHeaderCell: () => 'Descrição',
        renderCell: (item) => item.descricao || '-',
      }),
      createTableColumn<ProductoSemAlteracao>({
        columnId: 'precoBase',
        renderHeaderCell: () => 'Preço Base',
        renderCell: (item) => `R$ ${item.precoBase.toFixed(2)}`,
      }),
      createTableColumn<ProductoSemAlteracao>({
        columnId: 'desconto',
        renderHeaderCell: () => 'Desconto',
        renderCell: (item) => `${item.desconto.toFixed(2)}%`,
      }),
      createTableColumn<ProductoSemAlteracao>({
        columnId: 'markup',
        renderHeaderCell: () => 'Markup',
        renderCell: (item) => `${item.markup.toFixed(2)}x`,
      }),
      createTableColumn<ProductoSemAlteracao>({
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: () => <Badge appearance="tint" color="subtle">Sem Alteração</Badge>,
      }),
    ],
    []
  );

  const handleToggleDescontinuar = useCallback((codigo: string) => {
    setResults((prev) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        toDeactivate: prev.toDeactivate.map((item) =>
          item.codigo === codigo
            ? { ...item, action: item.action === 'deactivate' ? 'keep' : 'deactivate' }
            : item
        ),
      };

      // Atualizar resultados no componente pai
      onComparisonComplete(updated);
      return updated;
    });
  }, [onComparisonComplete]);

  const handleDescontinuarTodos = useCallback(() => {
    setResults((prev) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        toDeactivate: prev.toDeactivate.map((item) => ({ ...item, action: 'deactivate' as const })),
      };

      onComparisonComplete(updated);
      return updated;
    });
  }, [onComparisonComplete]);

  const handleManterTodos = useCallback(() => {
    setResults((prev) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        toDeactivate: prev.toDeactivate.map((item) => ({ ...item, action: 'keep' as const })),
      };

      onComparisonComplete(updated);
      return updated;
    });
  }, [onComparisonComplete]);

  const descontinuadosColumns = useMemo(
    () => [
      createTableColumn<ProductoDescontinuado>({
        columnId: 'descontinuar',
        renderHeaderCell: () => 'Descontinuar',
        renderCell: (item) => (
          <input
            type="checkbox"
            checked={item.action === 'deactivate'}
            onChange={() => handleToggleDescontinuar(item.codigo)}
            style={{ cursor: 'pointer', width: 16, height: 16 }}
          />
        ),
      }),
      createTableColumn<ProductoDescontinuado>({
        columnId: 'codigo',
        renderHeaderCell: () => 'Código',
        renderCell: (item) => item.codigo,
      }),
      createTableColumn<ProductoDescontinuado>({
        columnId: 'descricao',
        renderHeaderCell: () => 'Descrição',
        renderCell: (item) => item.descricao || '-',
      }),
      createTableColumn<ProductoDescontinuado>({
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: (item) => (
          <Badge
            appearance="tint"
            color={item.action === 'deactivate' ? 'danger' : 'success'}
          >
            {item.action === 'deactivate' ? 'Será Descontinuado' : 'Manter Ativo'}
          </Badge>
        ),
      }),
    ],
    [handleToggleDescontinuar]
  );

  if (loading) {
    return <LoadingState label="Comparando dados com o sistema..." />;
  }

  if (!results) {
    return <EmptyState title="Nenhum resultado" description="Não foi possível comparar os dados." />;
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card style={{ padding: 20 }}>
        <div className="mb-4">
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as TabValue)}
          >
            <Tab value="novos">
              Produtos Novos ({results.toCreate.length})
            </Tab>
            <Tab value="existentes">
              Atualizar Preços ({results.toUpdate.length})
            </Tab>
            <Tab value="semAlteracao">
              Sem Alteração ({results.unchanged.length})
            </Tab>
            <Tab value="descontinuados">
              Descontinuados ({results.toDeactivate.length})
            </Tab>
          </TabList>
        </div>

        <div className="mt-6">
          {selectedTab === 'novos' && (
            <>
              <Text size={400} weight="semibold" block style={{ marginBottom: 12 }}>
                Produtos que não existem no sistema - Preencha os campos obrigatórios
              </Text>
              
              {editableNovos.length > 0 && (
                <Card style={{ padding: 12, marginBottom: 12, backgroundColor: tokens.colorNeutralBackground2 }}>
                  <Text size={300} weight="semibold" block style={{ marginBottom: 8 }}>
                    Aplicar valor a todos os produtos:
                  </Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('controlaSN', true)}
                    >
                      Controla S/N: Sim
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('controlaSN', false)}
                    >
                      Controla S/N: Não
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('controlaEtiqueta', true)}
                    >
                      Controla Etiqueta: Sim
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('controlaEtiqueta', false)}
                    >
                      Controla Etiqueta: Não
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('requerCabeamento', true)}
                    >
                      Requer Cabeamento: Sim
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('requerCabeamento', false)}
                    >
                      Requer Cabeamento: Não
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('requerConfiguracao', true)}
                    >
                      Requer Config.: Sim
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('requerConfiguracao', false)}
                    >
                      Requer Config.: Não
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('omitirGuia', true)}
                    >
                      Omitir Guia: Sim
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('omitirGuia', false)}
                    >
                      Omitir Guia: Não
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('requerInstalacao', true)}
                    >
                      Requer Instalação: Sim
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => handleBulkUpdate('requerInstalacao', false)}
                    >
                      Requer Instalação: Não
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Text size={200}>Tipo Sistema:</Text>
                      <Dropdown
                        size="small"
                        placeholder="Aplicar a todos"
                        onOptionSelect={(e, data) => handleBulkUpdate('tipoSistema', Number(data.optionValue))}
                        style={{ minWidth: 150 }}
                      >
                        {TIPOS_SISTEMA.map(tipo => (
                          <Option key={tipo.value} value={String(tipo.value)}>
                            {tipo.label}
                          </Option>
                        ))}
                      </Dropdown>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Text size={200}>Tipo OS:</Text>
                      <Dropdown
                        size="small"
                        placeholder="Aplicar a todos"
                        onOptionSelect={(e, data) => handleBulkUpdate('tipodeOSPadrao', Number(data.optionValue))}
                        style={{ minWidth: 150 }}
                      >
                        {TIPOS_OS.map(tipo => (
                          <Option key={tipo.value} value={String(tipo.value)}>
                            {tipo.label}
                          </Option>
                        ))}
                      </Dropdown>
                    </div>
                  </div>
                </Card>
              )}

              {editableNovos.length > 0 ? (
                <>
                  <style>{`
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(1),
                    .novos-produtos-table .fui-DataGridCell:nth-child(1) { width: 300px !important; min-width: 300px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(2),
                    .novos-produtos-table .fui-DataGridCell:nth-child(2) { width: 500px !important; min-width: 500px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(3),
                    .novos-produtos-table .fui-DataGridCell:nth-child(3) { width: 400px !important; min-width: 400px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(4),
                    .novos-produtos-table .fui-DataGridCell:nth-child(4) { width: 120px !important; min-width: 120px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(5),
                    .novos-produtos-table .fui-DataGridCell:nth-child(5) { width: 440px !important; min-width: 440px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(6),
                    .novos-produtos-table .fui-DataGridCell:nth-child(6) { width: 560px !important; min-width: 560px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(7),
                    .novos-produtos-table .fui-DataGridCell:nth-child(7) { width: 130px !important; min-width: 130px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(8),
                    .novos-produtos-table .fui-DataGridCell:nth-child(8) { width: 150px !important; min-width: 150px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(9),
                    .novos-produtos-table .fui-DataGridCell:nth-child(9) { width: 160px !important; min-width: 160px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(10),
                    .novos-produtos-table .fui-DataGridCell:nth-child(10) { width: 170px !important; min-width: 170px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(11),
                    .novos-produtos-table .fui-DataGridCell:nth-child(11) { width: 120px !important; min-width: 120px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(12),
                    .novos-produtos-table .fui-DataGridCell:nth-child(12) { width: 150px !important; min-width: 150px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(13),
                    .novos-produtos-table .fui-DataGridCell:nth-child(13) { width: 130px !important; min-width: 130px !important; }
                    .novos-produtos-table .fui-DataGridHeaderCell:nth-child(14),
                    .novos-produtos-table .fui-DataGridCell:nth-child(14) { width: 90px !important; min-width: 90px !important; }
                  `}</style>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <div className="novos-produtos-table" style={{ minWidth: 3500 }}>
                      <DataGrid
                        items={editableNovos}
                        columns={novosColumns}
                        getRowId={(item: ProductoNovo, index?: number) => `novo-${item.codigo}-${index ?? 0}`}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Nenhum produto novo"
                  description="Todos os produtos do Excel já existem no sistema."
                />
              )}
            </>
          )}

          {selectedTab === 'existentes' && (
            <>
              <Text size={400} weight="semibold" block style={{ marginBottom: 12 }}>
                Produtos que serão atualizados
              </Text>
              {results.toUpdate.length > 0 ? (
                <DataGrid
                  items={results.toUpdate}
                  columns={existentesColumns}
                  getRowId={(item: ProductoExistente, index?: number) => `existente-${item.codigo}-${index ?? 0}`}
                />
              ) : (
                <EmptyState
                  title="Nenhum produto para atualizar"
                  description="Nenhum produto existente foi encontrado."
                />
              )}
            </>
          )}

          {selectedTab === 'semAlteracao' && (
            <>
              <Text size={400} weight="semibold" block style={{ marginBottom: 12 }}>
                Produtos sem alteração de preço, markup ou desconto
              </Text>
              {results.unchanged.length > 0 ? (
                <DataGrid
                  items={results.unchanged}
                  columns={semAlteracaoColumns}
                  getRowId={(item: ProductoSemAlteracao, index?: number) => `sem-alteracao-${item.codigo}-${index ?? 0}`}
                />
              ) : (
                <EmptyState
                  title="Nenhum produto sem alteração"
                  description="Todos os produtos existentes têm alterações de preço, markup ou desconto."
                />
              )}
            </>
          )}

          {selectedTab === 'descontinuados' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <Text size={400} weight="semibold">
                  Produtos no sistema mas não no Excel
                </Text>
                {results.toDeactivate.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      appearance="secondary"
                      size="small"
                      onClick={handleDescontinuarTodos}
                    >
                      Descontinuar Todos
                    </Button>
                    <Button
                      appearance="secondary"
                      size="small"
                      onClick={handleManterTodos}
                    >
                      Manter Todos
                    </Button>
                  </div>
                )}
              </div>
              {results.toDeactivate.length > 0 ? (
                <DataGrid
                  items={results.toDeactivate}
                  columns={descontinuadosColumns}
                  getRowId={(item: ProductoDescontinuado, index?: number) => `descontinuado-${item.codigo}-${index ?? 0}`}
                />
              ) : (
                <EmptyState
                  title="Nenhum produto descontinuado"
                  description="Todos os produtos do fabricante estão presentes no Excel."
                />
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
