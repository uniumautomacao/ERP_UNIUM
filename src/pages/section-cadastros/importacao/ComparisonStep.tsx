import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Tab, TabList, Text, tokens } from '@fluentui/react-components';
import { LoadingState } from '../../../components/shared/LoadingState';
import { EmptyState } from '../../../components/shared/EmptyState';
import { DataGrid, createTableColumn } from '../../../components/shared/DataGrid';
import { ParsedExcelData, ColumnMapping, ComparisonResults, ProductoNovo, ProductoExistente, ProductoDescontinuado } from './importacaoTypes';
import { parseMonetaryValue, inferirValoresModelo, inferirValoresPreco } from './importacaoUtils';
import { Cr22fModelosdeProdutoFromSharepointListService, NewPrecodeProdutoService } from '../../../generated';

interface ComparisonStepProps {
  excelData: ParsedExcelData;
  columnMapping: ColumnMapping;
  fabricanteId: string;
  markupSource: 'inferred' | 'calculated';
  defaultMarkup: number;
  defaultDesconto: number;
  onComparisonComplete: (results: ComparisonResults) => void;
}

type TabValue = 'novos' | 'existentes' | 'descontinuados';

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
        select: ['new_precodeprodutoid', 'new_precobase', '_new_modelodeproduto_value'],
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

          toUpdate.push({
            codigo,
            modeloId: model.cr22f_modelosdeprodutofromsharepointlistid,
            descricao: model.new_descricao || '',
            precoBase,
            precoAtual: existingPrices[0]?.new_precobase || 0,
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
          // Produto novo
          toCreate.push({
            codigo,
            descricao,
            precoBase,
            categoria: valoresModelo.categoria?.[0] || '',
            tipoSistema: valoresModelo.tipoSistema?.[0] || null,
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

      const comparisonResults = { toCreate, toUpdate, toDeactivate };
      setResults(comparisonResults);
      onComparisonComplete(comparisonResults);
    } catch (error) {
      console.error('Erro ao comparar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [excelData, columnMapping, fabricanteId, markupSource, defaultMarkup, defaultDesconto]);

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
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'descricao',
        renderHeaderCell: () => 'Descrição',
        renderCell: (item) => item.descricao || '-',
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'preco',
        renderHeaderCell: () => 'Preço Base',
        renderCell: (item) => `R$ ${item.precoBase.toFixed(2)}`,
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'desconto',
        renderHeaderCell: () => 'Desconto',
        renderCell: (item) => `${item.desconto.toFixed(2)}%`,
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'markup',
        renderHeaderCell: () => 'Markup',
        renderCell: (item) => `${item.markup.toFixed(2)}x`,
      }),
      createTableColumn<ProductoNovo>({
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: () => <Badge appearance="tint" color="success">Novo</Badge>,
      }),
    ],
    []
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
            <Tab value="descontinuados">
              Descontinuados ({results.toDeactivate.length})
            </Tab>
          </TabList>
        </div>

        <div className="mt-6">
          {selectedTab === 'novos' && (
            <>
              <Text size={400} weight="semibold" block style={{ marginBottom: 12 }}>
                Produtos que não existem no sistema
              </Text>
              {results.toCreate.length > 0 ? (
                <DataGrid
                  items={results.toCreate}
                  columns={novosColumns}
                  getRowId={(item: ProductoNovo, index?: number) => `novo-${item.codigo}-${index ?? 0}`}
                />
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
