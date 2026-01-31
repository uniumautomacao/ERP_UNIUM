import { useMemo } from 'react';
import { Button, Card, Text, tokens } from '@fluentui/react-components';
import { DocumentTable24Regular } from '@fluentui/react-icons';
import { DataGrid, createTableColumn } from '../../../components/shared/DataGrid';
import {
  ComparisonResults,
  ProductoDescontinuado,
  ProductoNovo,
  ReportInsights,
} from './importacaoTypes';
import {
  VariacaoPrecoItem,
  calcularEstatisticasPreco,
  calcularTicketMedio,
  calcularVariacaoPercentual,
  getAlertasVariacaoExtrema,
  getTopVariacoes,
} from './reportUtils';
import { exportarRelatorioPDF } from './pdfExport';

interface ReportStepProps {
  comparisonResults: ComparisonResults;
  fabricanteLabel: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const formatPercentSigned = (value: number) => `${value >= 0 ? '+' : ''}${formatPercent(value)}`;

const calcularValorVenda = (precoBase: number, descontoPercentual: number, markup: number) =>
  precoBase * descontoPercentual * markup;

export function ReportStep({ comparisonResults, fabricanteLabel }: ReportStepProps) {
  const updates = useMemo(
    () => comparisonResults.toUpdate.filter((item) => item.action === 'update'),
    [comparisonResults]
  );
  const creates = useMemo(
    () => comparisonResults.toCreate.filter((item) => item.action === 'create'),
    [comparisonResults]
  );
  const deactivates = useMemo(
    () => comparisonResults.toDeactivate.filter((item) => item.action === 'deactivate'),
    [comparisonResults]
  );
  const unchanged = comparisonResults.unchanged;

  const stats = useMemo(() => calcularEstatisticasPreco(updates), [updates]);
  const topAumentos = useMemo(() => getTopVariacoes(updates, 'aumento', 10), [updates]);
  const topReducoes = useMemo(() => getTopVariacoes(updates, 'reducao', 10), [updates]);
  const alertas = useMemo(() => getAlertasVariacaoExtrema(updates, 30), [updates]);

  const ticketMedioAntes = useMemo(() => {
    const valores = [
      ...updates.map((item) => {
        const precoAtual = item.precoAtual;
        const descontoAtual = item.existingPrices?.[0]?.new_descontopercentualdecompra ?? item.desconto;
        const markupAtual = item.existingPrices?.[0]?.new_markup ?? item.markup;
        return calcularValorVenda(precoAtual, descontoAtual, markupAtual);
      }),
      ...unchanged.map((item) => calcularValorVenda(item.precoBase, item.desconto, item.markup)),
    ];
    return calcularTicketMedio(valores);
  }, [updates, unchanged]);

  const ticketMedioDepois = useMemo(() => {
    const valores = [
      ...updates.map((item) => calcularValorVenda(item.precoBase, item.desconto, item.markup)),
      ...unchanged.map((item) => calcularValorVenda(item.precoBase, item.desconto, item.markup)),
      ...creates.map((item) => calcularValorVenda(item.precoBase, item.desconto, item.markup)),
    ];
    return calcularTicketMedio(valores);
  }, [updates, unchanged, creates]);

  const variacaoTicketMedio = useMemo(
    () => calcularVariacaoPercentual(ticketMedioAntes, ticketMedioDepois),
    [ticketMedioAntes, ticketMedioDepois]
  );

  const totalAtual = updates.length + unchanged.length + deactivates.length;
  const totalDepois = updates.length + unchanged.length + creates.length;
  const taxaRenovacao = totalDepois > 0 ? (creates.length / totalDepois) * 100 : 0;
  const taxaDescontinuacao = totalAtual > 0 ? (deactivates.length / totalAtual) * 100 : 0;
  const taxaEstabilidade = totalAtual > 0 ? (unchanged.length / totalAtual) * 100 : 0;

  const insights = useMemo<ReportInsights>(
    () => ({
      variacaoMedia: stats.variacaoMedia,
      ticketMedioAntes,
      ticketMedioDepois,
      variacaoTicketMedio,
      variacaoMin: stats.variacaoMin,
      variacaoMax: stats.variacaoMax,
      totalAumentos: stats.totalAumentos,
      totalReducoes: stats.totalReducoes,
      impactoTotalValor: stats.impactoTotalValor,
      taxaRenovacao,
      taxaDescontinuacao,
      taxaEstabilidade,
      alertasExtremos: alertas.map((item) => ({
        codigo: item.codigo,
        descricao: item.descricao,
        precoAtual: item.precoAtual,
        precoNovo: item.precoNovo,
        variacaoPercentual: item.variacaoPercentual,
      })),
    }),
    [
      stats,
      ticketMedioAntes,
      ticketMedioDepois,
      variacaoTicketMedio,
      taxaRenovacao,
      taxaDescontinuacao,
      taxaEstabilidade,
      alertas,
    ]
  );

  const variacaoColumns = useMemo(
    () => [
      createTableColumn<VariacaoPrecoItem>({
        columnId: 'codigo',
        renderHeaderCell: () => 'Código',
        renderCell: (item) => item.codigo,
      }),
      createTableColumn<VariacaoPrecoItem>({
        columnId: 'descricao',
        renderHeaderCell: () => 'Descrição',
        renderCell: (item) => item.descricao || '-',
      }),
      createTableColumn<VariacaoPrecoItem>({
        columnId: 'precoAtual',
        renderHeaderCell: () => 'Preço Atual',
        renderCell: (item) => formatCurrency(item.precoAtual),
      }),
      createTableColumn<VariacaoPrecoItem>({
        columnId: 'precoNovo',
        renderHeaderCell: () => 'Preço Novo',
        renderCell: (item) => formatCurrency(item.precoNovo),
      }),
      createTableColumn<VariacaoPrecoItem>({
        columnId: 'variacao',
        renderHeaderCell: () => 'Variação',
        renderCell: (item) => formatPercentSigned(item.variacaoPercentual),
      }),
    ],
    []
  );

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
        columnId: 'precoBase',
        renderHeaderCell: () => 'Preço Base',
        renderCell: (item) => formatCurrency(item.precoBase),
      }),
    ],
    []
  );

  const descontinuadosColumns = useMemo(
    () => [
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
    ],
    []
  );

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card style={{ padding: 20 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>
          Relatório de Análise - {fabricanteLabel || 'Fabricante'}
        </Text>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={600} weight="bold" block>
              {creates.length}
            </Text>
            <Text size={300}>Novos</Text>
          </Card>
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={600} weight="bold" block>
              {updates.length}
            </Text>
            <Text size={300}>Atualizar</Text>
          </Card>
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={600} weight="bold" block>
              {deactivates.length}
            </Text>
            <Text size={300}>Descontinuar</Text>
          </Card>
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={600} weight="bold" block>
              {unchanged.length}
            </Text>
            <Text size={300}>Sem Alteração</Text>
          </Card>
        </div>
      </Card>

      <Card style={{ padding: 20 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>
          Insights de Preço
        </Text>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={200} block>
              Variação Média
            </Text>
            <Text size={500} weight="bold">
              {formatPercentSigned(stats.variacaoMedia)}
            </Text>
          </Card>
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={200} block>
              Ticket Médio
            </Text>
            <Text size={500} weight="bold">
              {formatCurrency(ticketMedioAntes)} → {formatCurrency(ticketMedioDepois)}
            </Text>
            <Text size={200} block>
              {formatPercentSigned(variacaoTicketMedio)}
            </Text>
          </Card>
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={200} block>
              Impacto Total
            </Text>
            <Text size={500} weight="bold">
              {formatCurrency(stats.impactoTotalValor)}
            </Text>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={200} block>
              Distribuição
            </Text>
            <Text size={400} weight="semibold">
              {stats.totalAumentos} aumentos | {stats.totalReducoes} reduções
            </Text>
          </Card>
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={200} block>
              Faixa de Variação
            </Text>
            <Text size={400} weight="semibold">
              {formatPercentSigned(stats.variacaoMin)} a {formatPercentSigned(stats.variacaoMax)}
            </Text>
          </Card>
        </div>
      </Card>

      <Card style={{ padding: 20 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>
          Saúde do Catálogo
        </Text>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={200} block>
              Taxa de Renovação
            </Text>
            <Text size={400} weight="semibold">
              {formatPercent(taxaRenovacao)}
            </Text>
          </Card>
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={200} block>
              Taxa de Descontinuação
            </Text>
            <Text size={400} weight="semibold">
              {formatPercent(taxaDescontinuacao)}
            </Text>
          </Card>
          <Card style={{ padding: 16, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={200} block>
              Estabilidade
            </Text>
            <Text size={400} weight="semibold">
              {formatPercent(taxaEstabilidade)}
            </Text>
          </Card>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ padding: 20 }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>
            Top 10 Maiores Aumentos
          </Text>
          <DataGrid
            items={topAumentos}
            columns={variacaoColumns}
            getRowId={(item: VariacaoPrecoItem, index?: number) =>
              `aumento-${item.codigo}-${index ?? 0}`
            }
          />
        </Card>

        <Card style={{ padding: 20 }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>
            Top 10 Maiores Reduções
          </Text>
          <DataGrid
            items={topReducoes}
            columns={variacaoColumns}
            getRowId={(item: VariacaoPrecoItem, index?: number) =>
              `reducao-${item.codigo}-${index ?? 0}`
            }
          />
        </Card>
      </div>

      <Card style={{ padding: 20 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>
          Alertas de Variação Extrema (±30%)
        </Text>
        <DataGrid
          items={alertas}
          columns={variacaoColumns}
          getRowId={(item: VariacaoPrecoItem, index?: number) =>
            `alerta-${item.codigo}-${index ?? 0}`
          }
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ padding: 20 }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>
            Produtos Novos
          </Text>
          <DataGrid
            items={creates}
            columns={novosColumns}
            getRowId={(item: ProductoNovo, index?: number) => `novo-${item.codigo}-${index ?? 0}`}
          />
        </Card>

        <Card style={{ padding: 20 }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: 16 }}>
            Produtos Descontinuados
          </Text>
          <DataGrid
            items={deactivates}
            columns={descontinuadosColumns}
            getRowId={(item: ProductoDescontinuado, index?: number) =>
              `descontinuado-${item.codigo}-${index ?? 0}`
            }
          />
        </Card>
      </div>

      <Card style={{ padding: 20 }}>
        <Button
          appearance="primary"
          icon={<DocumentTable24Regular />}
          onClick={() => exportarRelatorioPDF(comparisonResults, fabricanteLabel, insights)}
        >
          Exportar Relatório em PDF
        </Button>
      </Card>
    </div>
  );
}
