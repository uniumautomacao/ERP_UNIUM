import { useState, useMemo, useCallback } from 'react';
import {
  Card,
  Text,
  tokens,
  Dropdown,
  Option,
  makeStyles,
  Spinner,
  MessageBar,
  MessageBarBody,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableCellLayout,
  createTableColumn,
  TableColumnDefinition,
  Input,
  Label,
} from '@fluentui/react-components';
import {
  ArrowSync24Regular,
  ArrowExport24Regular,
  Calendar24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { KPICard } from '../../components/shared/KPICard';
import { AreaChart } from '../../components/charts/AreaChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { BarChart } from '../../components/charts/BarChart';
import { LineChart } from '../../components/charts/LineChart';
import { useVendasAnalytics } from '../../hooks/comercial/useVendasAnalytics';

const useStyles = makeStyles({
  filterSection: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  filterItem: {
    minWidth: '200px',
    flex: '1',
  },
  dateFilterItem: {
    minWidth: '250px',
    flex: '1',
  },
  customDateContainer: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    width: '100%',
  },
  customDateField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '200px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  chartCard: {
    padding: '16px',
  },
  chartTitle: {
    marginBottom: '16px',
  },
  tableSection: {
    marginTop: '24px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
});

interface TopProduto {
  descricao: string;
  modelo: string;
  fabricante: string;
  quantidadeVendida: number;
  valorTotal: number;
}

interface TopCliente {
  nome: string;
  qtdCompras: number;
  valorTotal: number;
  lucro: number;
}

type PeriodoFiltro = 'ano-atual' | 'ultimos-30-dias' | 'ultimos-12-meses' | 'semestre-atual' | 'personalizado';

export function InteligenciaComercialPage() {
  const styles = useStyles();
  
  // Função para calcular datas baseado no período
  const calcularDatas = useCallback((periodo: PeriodoFiltro): { dataInicio: Date; dataFim: Date } => {
    const hoje = new Date();
    const dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
    let dataInicio: Date;

    switch (periodo) {
      case 'ano-atual':
        dataInicio = new Date(hoje.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      case 'ultimos-30-dias':
        dataInicio = new Date(hoje);
        dataInicio.setDate(dataInicio.getDate() - 30);
        dataInicio.setHours(0, 0, 0, 0);
        break;
      case 'ultimos-12-meses':
        dataInicio = new Date(hoje);
        dataInicio.setMonth(dataInicio.getMonth() - 12);
        dataInicio.setHours(0, 0, 0, 0);
        break;
      case 'semestre-atual':
        // Semestre 1: Jan-Jun (0-5), Semestre 2: Jul-Dez (6-11)
        const mesAtual = hoje.getMonth();
        const mesInicioSemestre = mesAtual < 6 ? 0 : 6;
        dataInicio = new Date(hoje.getFullYear(), mesInicioSemestre, 1, 0, 0, 0, 0);
        break;
      case 'personalizado':
        // Será controlado por dataInicioPersonalizada e dataFimPersonalizada
        dataInicio = new Date(hoje.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      default:
        dataInicio = new Date(hoje.getFullYear(), 0, 1, 0, 0, 0, 0);
    }

    return { dataInicio, dataFim };
  }, []);

  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoFiltro>('ano-atual');
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('');
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('');
  
  const [filtros, setFiltros] = useState({
    categoria: undefined as string | undefined,
    fabricante: undefined as string | undefined,
    vendedor: undefined as string | undefined,
  });

  // Calcular datas baseado no período selecionado
  const { dataInicio, dataFim } = useMemo(() => {
    if (periodoSelecionado === 'personalizado') {
      // Usar datas personalizadas
      const inicio = dataInicioPersonalizada
        ? new Date(dataInicioPersonalizada + 'T00:00:00')
        : new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0);
      const fim = dataFimPersonalizada
        ? new Date(dataFimPersonalizada + 'T23:59:59')
        : new Date();
      return { dataInicio: inicio, dataFim: fim };
    }
    return calcularDatas(periodoSelecionado);
  }, [periodoSelecionado, dataInicioPersonalizada, dataFimPersonalizada, calcularDatas]);

  const { loading, error, data } = useVendasAnalytics({
    ...filtros,
    dataInicio,
    dataFim,
  });

  const commandBarActions = [
    {
      id: 'refresh',
      label: 'Atualizar',
      icon: <ArrowSync24Regular />,
      onClick: () => window.location.reload(),
    },
    {
      id: 'export',
      label: 'Exportar',
      icon: <ArrowExport24Regular />,
      onClick: () => console.log('Exportar dados'),
    },
  ];

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Formatar percentual
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Formatar data
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  // Formatar data para input HTML (yyyy-mm-dd)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Gerar subtítulo com o período
  const subtitle = useMemo(() => {
    return `Período: ${formatDate(dataInicio)} - ${formatDate(dataFim)}`;
  }, [dataInicio, dataFim]);

  // Colunas para tabela de Top Produtos
  const produtosColumns: TableColumnDefinition<TopProduto>[] = [
    createTableColumn<TopProduto>({
      columnId: 'descricao',
      compare: (a, b) => a.descricao.localeCompare(b.descricao),
      renderHeaderCell: () => 'Produto',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold">{item.descricao}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<TopProduto>({
      columnId: 'modelo',
      renderHeaderCell: () => 'Modelo',
      renderCell: (item) => <TableCellLayout>{item.modelo || '-'}</TableCellLayout>,
    }),
    createTableColumn<TopProduto>({
      columnId: 'fabricante',
      renderHeaderCell: () => 'Fabricante',
      renderCell: (item) => <TableCellLayout>{item.fabricante || '-'}</TableCellLayout>,
    }),
    createTableColumn<TopProduto>({
      columnId: 'quantidade',
      renderHeaderCell: () => 'Qtd Vendida',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold">{item.quantidadeVendida}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<TopProduto>({
      columnId: 'valor',
      renderHeaderCell: () => 'Valor Total',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold" style={{ color: tokens.colorPaletteGreenForeground1 }}>
            {formatCurrency(item.valorTotal)}
          </Text>
        </TableCellLayout>
      ),
    }),
  ];

  // Colunas para tabela de Top Clientes
  const clientesColumns: TableColumnDefinition<TopCliente>[] = [
    createTableColumn<TopCliente>({
      columnId: 'nome',
      compare: (a, b) => a.nome.localeCompare(b.nome),
      renderHeaderCell: () => 'Cliente',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold">{item.nome}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<TopCliente>({
      columnId: 'qtdCompras',
      renderHeaderCell: () => 'Qtd Compras',
      renderCell: (item) => <TableCellLayout>{item.qtdCompras}</TableCellLayout>,
    }),
    createTableColumn<TopCliente>({
      columnId: 'valor',
      renderHeaderCell: () => 'Valor Total',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold" style={{ color: tokens.colorPaletteGreenForeground1 }}>
            {formatCurrency(item.valorTotal)}
          </Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<TopCliente>({
      columnId: 'lucro',
      renderHeaderCell: () => 'Lucro',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold" style={{ color: tokens.colorPaletteBlueForeground2 }}>
            {formatCurrency(item.lucro)}
          </Text>
        </TableCellLayout>
      ),
    }),
  ];

  if (loading) {
    return (
      <>
        <CommandBar primaryActions={commandBarActions} />
        <PageHeader title="Inteligência Comercial" subtitle={subtitle} />
        <PageContainer>
          <div className={styles.loadingContainer}>
            <Spinner size="extra-large" label="Carregando dados de vendas..." />
          </div>
        </PageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <CommandBar primaryActions={commandBarActions} />
        <PageHeader title="Inteligência Comercial" subtitle={subtitle} />
        <PageContainer>
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <CommandBar primaryActions={commandBarActions} />
      <PageHeader title="Inteligência Comercial" subtitle={subtitle} />
      <PageContainer>
        {/* Filtros */}
        <div className={styles.filterSection}>
          <div className={styles.dateFilterItem}>
            <Dropdown
              value={
                periodoSelecionado === 'ano-atual' ? 'Este ano' :
                periodoSelecionado === 'ultimos-30-dias' ? 'Últimos 30 dias' :
                periodoSelecionado === 'ultimos-12-meses' ? 'Últimos 12 meses' :
                periodoSelecionado === 'semestre-atual' ? 'Este semestre' :
                'Período personalizado'
              }
              onOptionSelect={(_, data) => {
                const novoPeriodo = data.optionValue as PeriodoFiltro;
                setPeriodoSelecionado(novoPeriodo);
                
                // Inicializar datas personalizadas se necessário
                if (novoPeriodo === 'personalizado') {
                  const hoje = new Date();
                  const inicioPadrao = new Date(hoje.getFullYear(), 0, 1);
                  setDataInicioPersonalizada(formatDateForInput(inicioPadrao));
                  setDataFimPersonalizada(formatDateForInput(hoje));
                }
              }}
            >
              <Option value="ano-atual">Este ano</Option>
              <Option value="ultimos-30-dias">Últimos 30 dias</Option>
              <Option value="ultimos-12-meses">Últimos 12 meses</Option>
              <Option value="semestre-atual">Este semestre</Option>
              <Option value="personalizado">Período personalizado</Option>
            </Dropdown>
          </div>
          
          {/* Campos de data personalizada */}
          {periodoSelecionado === 'personalizado' && (
            <div className={styles.customDateContainer}>
              <div className={styles.customDateField}>
                <Label htmlFor="data-inicio" size="small">
                  Data Inicial
                </Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicioPersonalizada}
                  onChange={(_, data) => setDataInicioPersonalizada(data.value)}
                />
              </div>
              <div className={styles.customDateField}>
                <Label htmlFor="data-fim" size="small">
                  Data Final
                </Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFimPersonalizada}
                  onChange={(_, data) => setDataFimPersonalizada(data.value)}
                />
              </div>
            </div>
          )}
          <div className={styles.filterItem}>
            <Dropdown
              placeholder="Todas as categorias"
              onOptionSelect={(_, data) => {
                setFiltros({ ...filtros, categoria: data.optionValue as string });
              }}
            >
              <Option value="">Todas as categorias</Option>
              {data.vendasPorCategoria.map((cat) => (
                <Option key={cat.name} value={cat.name}>
                  {cat.name}
                </Option>
              ))}
            </Dropdown>
          </div>
          <div className={styles.filterItem}>
            <Dropdown
              placeholder="Todos os fabricantes"
              onOptionSelect={(_, data) => {
                setFiltros({ ...filtros, fabricante: data.optionValue as string });
              }}
            >
              <Option value="">Todos os fabricantes</Option>
              {data.topFabricantes.map((fab) => (
                <Option key={fab.date} value={fab.date}>
                  {fab.date}
                </Option>
              ))}
            </Dropdown>
          </div>
          <div className={styles.filterItem}>
            <Dropdown
              placeholder="Todos os vendedores"
              onOptionSelect={(_, data) => {
                setFiltros({ ...filtros, vendedor: data.optionValue as string });
              }}
            >
              <Option value="">Todos os vendedores</Option>
              {data.topVendedores.map((vend) => (
                <Option key={vend.date} value={vend.date}>
                  {vend.date}
                </Option>
              ))}
            </Dropdown>
          </div>
        </div>

        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <KPICard
            label="Faturamento Total"
            value={formatCurrency(data.kpis.faturamentoTotal)}
          />
          <KPICard
            label="Lucro Bruto Total"
            value={formatCurrency(data.kpis.lucroBrutoTotal)}
          />
          <KPICard
            label="Margem Média"
            value={formatPercent(data.kpis.margemMedia)}
          />
          <KPICard
            label="Ticket Médio"
            value={formatCurrency(data.kpis.ticketMedio)}
          />
          <KPICard label="Total de Vendas" value={data.kpis.totalVendas.toString()} />
        </div>

        {/* Gráficos Row 1 */}
        <div className={styles.chartsRow}>
          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Evolução de Vendas
            </Text>
            {data.evolucaoVendas.length > 0 ? (
              <LineChart
                data={data.evolucaoVendas}
                lines={[
                  { dataKey: 'value', name: 'Faturamento', color: tokens.colorBrandBackground },
                  { dataKey: 'lucro', name: 'Lucro', color: tokens.colorPaletteGreenForeground1 },
                ]}
                height={250}
              />
            ) : (
              <Text>Sem dados para exibir</Text>
            )}
          </Card>

          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Vendas por Categoria
            </Text>
            {data.vendasPorCategoria.length > 0 ? (
              <DonutChart data={data.vendasPorCategoria} height={250} />
            ) : (
              <Text>Sem dados para exibir</Text>
            )}
          </Card>
        </div>

        {/* Gráficos Row 2 */}
        <div className={styles.chartsRow}>
          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Top 10 Fabricantes
            </Text>
            {data.topFabricantes.length > 0 ? (
              <BarChart data={data.topFabricantes} dataKey="value" height={300} horizontal />
            ) : (
              <Text>Sem dados para exibir</Text>
            )}
          </Card>

          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Ranking de Vendedores
            </Text>
            {data.topVendedores.length > 0 ? (
              <BarChart data={data.topVendedores} dataKey="value" height={300} horizontal />
            ) : (
              <Text>Sem dados para exibir</Text>
            )}
          </Card>
        </div>

        {/* Gráficos Row 3 */}
        <div className={styles.chartsRow}>
          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Top 10 Arquitetos Especificadores
            </Text>
            {data.topArquitetos.length > 0 ? (
              <BarChart data={data.topArquitetos} dataKey="value" height={300} horizontal />
            ) : (
              <Text>Sem dados para exibir</Text>
            )}
          </Card>

          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Distribuição Produto vs Serviço
            </Text>
            {data.produtoVsServico.length > 0 ? (
              <DonutChart data={data.produtoVsServico} height={250} />
            ) : (
              <Text>Sem dados para exibir</Text>
            )}
          </Card>
        </div>

        {/* Gráfico Row 4 - Margem por Categoria */}
        <div className={styles.chartsRow}>
          <Card className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Margem de Lucro por Categoria (%)
            </Text>
            {data.margemPorCategoria.length > 0 ? (
              <BarChart data={data.margemPorCategoria} dataKey="value" height={300} />
            ) : (
              <Text>Sem dados para exibir</Text>
            )}
          </Card>
        </div>

        {/* Tabelas de Detalhamento */}
        <div className={styles.tableSection}>
          <Card style={{ padding: '16px', marginBottom: '16px' }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: '16px' }}>
              Top 10 Produtos Mais Vendidos
            </Text>
            {data.topProdutos.length > 0 ? (
              <DataGrid
                items={data.topProdutos}
                columns={produtosColumns}
                sortable
                getRowId={(item) => item.descricao}
              >
                <DataGridHeader>
                  <DataGridRow>
                    {({ renderHeaderCell }) => (
                      <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                    )}
                  </DataGridRow>
                </DataGridHeader>
                <DataGridBody<TopProduto>>
                  {({ item, rowId }) => (
                    <DataGridRow<TopProduto> key={rowId}>
                      {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                    </DataGridRow>
                  )}
                </DataGridBody>
              </DataGrid>
            ) : (
              <Text>Sem dados para exibir</Text>
            )}
          </Card>

          <Card style={{ padding: '16px' }}>
            <Text size={500} weight="semibold" block style={{ marginBottom: '16px' }}>
              Top 10 Clientes por Valor
            </Text>
            {data.topClientes.length > 0 ? (
              <DataGrid
                items={data.topClientes}
                columns={clientesColumns}
                sortable
                getRowId={(item) => item.nome}
              >
                <DataGridHeader>
                  <DataGridRow>
                    {({ renderHeaderCell }) => (
                      <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                    )}
                  </DataGridRow>
                </DataGridHeader>
                <DataGridBody<TopCliente>>
                  {({ item, rowId }) => (
                    <DataGridRow<TopCliente> key={rowId}>
                      {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                    </DataGridRow>
                  )}
                </DataGridBody>
              </DataGrid>
            ) : (
              <Text>Sem dados para exibir</Text>
            )}
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
