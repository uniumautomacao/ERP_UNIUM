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
  TabList,
  Tab,
  Switch,
} from '@fluentui/react-components';
import {
  ArrowSync24Regular,
  ArrowExport24Regular,
  Calendar24Regular,
  Search24Regular,
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
import { VendasDetalhesModal } from '../../components/comercial/VendasDetalhesModal';
import { useAnaliseABC, ABCItem } from '../../hooks/comercial/useAnaliseABC';
import type { ChartDataPoint } from '../../types';

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
    alignItems: 'flex-start',
  },
  filterItem: {
    minWidth: '180px',
    flex: '1 1 180px',
  },
  dateFilterItem: {
    minWidth: '200px',
    flex: '1 1 200px',
  },
  customDateContainer: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    flexBasis: '100%',
    width: '100%',
  },
  customDateField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '180px',
    flex: '1 1 180px',
  },
  searchField: {
    minWidth: '250px',
    flex: '1 1 250px',
    flexBasis: '100%',
    width: '100%',
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
  tabContainer: {
    marginBottom: '24px',
  },
  yearSelectorContainer: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  yearSelector: {
    minWidth: '180px',
    flex: '1 1 180px',
  },
  comparisonKpiCard: {
    padding: '16px',
    minWidth: '280px',
  },
  comparisonValue: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '12px',
  },
  comparisonYearRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  abcToggleContainer: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  abcTableCard: {
    padding: '16px',
    marginTop: '24px',
  },
  classA: {
    color: tokens.colorPaletteGreenForeground1,
    fontWeight: 'bold',
  },
  classB: {
    color: tokens.colorPaletteDarkOrangeForeground1,
    fontWeight: 'bold',
  },
  classC: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: 'bold',
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

type PeriodoFiltro = 'todos-os-tempos' | 'ano-atual' | 'ultimos-30-dias' | 'ultimos-12-meses' | 'semestre-atual' | 'personalizado';

export function InteligenciaComercialPage() {
  const styles = useStyles();
  
  // Estado das abas
  const [selectedTab, setSelectedTab] = useState<'analise' | 'comparacao' | 'abc'>('analise');
  
  // Estado para análise ABC
  const [tipoABC, setTipoABC] = useState<'faturamento' | 'lucro'>('faturamento');
  
  // Estados para comparação de anos
  const [anoBase, setAnoBase] = useState(new Date().getFullYear());
  const [anoComparacao, setAnoComparacao] = useState(new Date().getFullYear() - 1);
  
  // Estados para modal de detalhes
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ 
    type: 'fabricante' | 'vendedor' | 'arquiteto' | 'categoria' | 'produto-vs-servico' | 'evolucao' | 'produto' | 'cliente'; 
    value: string;
    anoClicado?: 'base' | 'comparacao'; // Para identificar qual ano foi clicado na aba de comparação
  } | null>(null);
  
  // Função para calcular datas baseado no período
  const calcularDatas = useCallback((periodo: PeriodoFiltro): { dataInicio?: Date; dataFim?: Date } => {
    const hoje = new Date();
    const dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
    let dataInicio: Date | undefined;

    switch (periodo) {
      case 'todos-os-tempos':
        // Sem filtro de data - retorna undefined para não filtrar por data
        return { dataInicio: undefined, dataFim: undefined };
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

  // Função para calcular datas de um ano específico (para comparação)
  const calcularDatasAno = useCallback((ano: number): { dataInicio: Date; dataFim: Date } => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    
    const dataInicio = new Date(ano, 0, 1, 0, 0, 0, 0);
    
    // Usar o mesmo período relativo em ambos os anos para comparação justa
    const dataFim = ano === anoAtual
      ? new Date(ano, hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999)
      : new Date(ano, hoje.getMonth(), Math.min(hoje.getDate(), new Date(ano, hoje.getMonth() + 1, 0).getDate()), 23, 59, 59, 999);
    
    return { dataInicio, dataFim };
  }, []);

  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoFiltro>('ano-atual');
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('');
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('');
  const [busca, setBusca] = useState<string>('');
  const [buscaInput, setBuscaInput] = useState<string>('');
  
  const [filtros, setFiltros] = useState({
    categoria: undefined as string | undefined,
    fabricante: undefined as string | undefined,
    vendedor: undefined as string | undefined,
    arquiteto: undefined as string | undefined,
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

  // Hook para aba de análise
  const { loading, error, data } = useVendasAnalytics({
    ...filtros,
    dataInicio,
    dataFim,
    busca,
  });

  // Hooks para aba de comparação
  const datasAnoBase = useMemo(() => calcularDatasAno(anoBase), [anoBase, calcularDatasAno]);
  const datasAnoComparacao = useMemo(() => calcularDatasAno(anoComparacao), [anoComparacao, calcularDatasAno]);

  const { loading: loadingAnoBase, error: errorAnoBase, data: dataAnoBase } = useVendasAnalytics({
    dataInicio: datasAnoBase.dataInicio,
    dataFim: datasAnoBase.dataFim,
  });

  const { loading: loadingAnoComparacao, error: errorAnoComparacao, data: dataAnoComparacao } = useVendasAnalytics({
    dataInicio: datasAnoComparacao.dataInicio,
    dataFim: datasAnoComparacao.dataFim,
  });

  // Hook para aba de análise ABC
  const { loading: loadingABC, error: errorABC, data: dataABC } = useAnaliseABC({
    dataInicio,
    dataFim,
    tipo: tipoABC,
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
    if (selectedTab === 'comparacao') {
      return `Comparando ${anoBase} vs ${anoComparacao} (${formatDate(datasAnoBase.dataInicio)} - ${formatDate(datasAnoBase.dataFim)})`;
    }
    if (selectedTab === 'abc') {
      const tipoTexto = tipoABC === 'faturamento' ? 'Faturamento' : 'Lucro';
      if (!dataInicio || !dataFim) {
        return `Análise ABC por ${tipoTexto} - Todos os tempos`;
      }
      return `Análise ABC por ${tipoTexto} - ${formatDate(dataInicio)} a ${formatDate(dataFim)}`;
    }
    if (!dataInicio || !dataFim) {
      return 'Período: Todos os tempos';
    }
    return `Período: ${formatDate(dataInicio)} - ${formatDate(dataFim)}`;
  }, [selectedTab, dataInicio, dataFim, anoBase, anoComparacao, datasAnoBase, tipoABC]);

  // Calcular variação percentual
  const calcularVariacao = useCallback((valorAtual: number, valorAnterior: number): number => {
    if (valorAnterior === 0) return valorAtual > 0 ? 100 : 0;
    return ((valorAtual - valorAnterior) / valorAnterior) * 100;
  }, []);

  // Gerar lista de anos disponíveis (últimos 10 anos)
  const anosDisponiveis = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    const anos: number[] = [];
    for (let i = 0; i < 10; i++) {
      anos.push(anoAtual - i);
    }
    return anos;
  }, []);

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

  // Componente de KPI Comparativo
  const KPIComparativo = ({ label, valorBase, valorComparacao, formato = 'currency' }: {
    label: string;
    valorBase: number;
    valorComparacao: number;
    formato?: 'currency' | 'percent' | 'number';
  }) => {
    const variacao = calcularVariacao(valorBase, valorComparacao);
    const variacaoPositiva = variacao >= 0;

    const formatarValor = (valor: number) => {
      if (formato === 'currency') return formatCurrency(valor);
      if (formato === 'percent') return formatPercent(valor);
      return valor.toFixed(0);
    };

    return (
      <Card className={styles.comparisonKpiCard}>
        <Text
          size={200}
          weight="medium"
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: tokens.colorNeutralForeground3,
            display: 'block',
          }}
        >
          {label}
        </Text>

        <div className={styles.comparisonValue}>
          <div className={styles.comparisonYearRow}>
            <Text size={300} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
              {anoComparacao}
            </Text>
            <Text size={600} weight="bold" block>
              {formatarValor(valorComparacao)}
            </Text>
          </div>
          <div className={styles.comparisonYearRow}>
            <Text size={300} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
              {anoBase}
            </Text>
            <Text size={600} weight="bold" block>
              {formatarValor(valorBase)}
            </Text>
          </div>
        </div>

        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <Text
            size={400}
            weight="semibold"
            style={{
              color: variacaoPositiva ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1,
            }}
          >
            {variacaoPositiva ? '+' : ''}{variacao.toFixed(2)}%
          </Text>
        </div>
      </Card>
    );
  };

  // Colunas para tabela de Análise ABC
  const abcColumns: TableColumnDefinition<ABCItem>[] = [
    createTableColumn<ABCItem>({
      columnId: 'descricao',
      renderHeaderCell: () => 'Produto',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold">{item.descricao}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<ABCItem>({
      columnId: 'modelo',
      renderHeaderCell: () => 'Modelo',
      renderCell: (item) => <TableCellLayout>{item.modelo || '-'}</TableCellLayout>,
    }),
    createTableColumn<ABCItem>({
      columnId: 'fabricante',
      renderHeaderCell: () => 'Fabricante',
      renderCell: (item) => <TableCellLayout>{item.fabricante || '-'}</TableCellLayout>,
    }),
    createTableColumn<ABCItem>({
      columnId: 'quantidade',
      renderHeaderCell: () => 'Qtd',
      renderCell: (item) => (
        <TableCellLayout>
          <Text>{item.quantidade}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<ABCItem>({
      columnId: 'valor',
      renderHeaderCell: () => 'Valor',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold" style={{ color: tokens.colorPaletteGreenForeground1 }}>
            {formatCurrency(item.valor)}
          </Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<ABCItem>({
      columnId: 'percentual',
      renderHeaderCell: () => '%',
      renderCell: (item) => (
        <TableCellLayout>
          <Text>{item.percentual.toFixed(2)}%</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<ABCItem>({
      columnId: 'percentualAcumulado',
      renderHeaderCell: () => '% Acum.',
      renderCell: (item) => (
        <TableCellLayout>
          <Text>{item.percentualAcumulado.toFixed(2)}%</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<ABCItem>({
      columnId: 'classificacao',
      renderHeaderCell: () => 'Classe',
      renderCell: (item) => (
        <TableCellLayout>
          <Text className={
            item.classificacao === 'A' ? styles.classA :
            item.classificacao === 'B' ? styles.classB :
            styles.classC
          }>
            {item.classificacao}
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

  // Função para renderizar a aba de Análise ABC
  const renderAnaliseABC = () => {
    if (loadingABC) {
      return (
        <div className={styles.loadingContainer}>
          <Spinner size="extra-large" label="Carregando análise ABC..." />
        </div>
      );
    }

    if (errorABC) {
      return (
        <MessageBar intent="error">
          <MessageBarBody>{errorABC}</MessageBarBody>
        </MessageBar>
      );
    }

    // Dados para gráfico de pizza da distribuição ABC
    const distribuicaoABC = [
      { name: 'Classe A', value: dataABC.totais.valorA },
      { name: 'Classe B', value: dataABC.totais.valorB },
      { name: 'Classe C', value: dataABC.totais.valorC },
    ].filter(item => item.value > 0);

    return (
      <>
        {/* Filtro de Período e Toggle */}
        <div className={styles.filterSection}>
          <div className={styles.dateFilterItem}>
            <Dropdown
              value={
                periodoSelecionado === 'todos-os-tempos' ? 'Todos os tempos' :
                periodoSelecionado === 'ano-atual' ? 'Este ano' :
                periodoSelecionado === 'ultimos-30-dias' ? 'Últimos 30 dias' :
                periodoSelecionado === 'ultimos-12-meses' ? 'Últimos 12 meses' :
                periodoSelecionado === 'semestre-atual' ? 'Este semestre' :
                'Período personalizado'
              }
              onOptionSelect={(_, data) => {
                const novoPeriodo = data.optionValue as PeriodoFiltro;
                setPeriodoSelecionado(novoPeriodo);
                
                if (novoPeriodo === 'personalizado') {
                  const hoje = new Date();
                  const inicioPadrao = new Date(hoje.getFullYear(), 0, 1);
                  setDataInicioPersonalizada(formatDateForInput(inicioPadrao));
                  setDataFimPersonalizada(formatDateForInput(hoje));
                }
              }}
            >
              <Option value="todos-os-tempos">Todos os tempos</Option>
              <Option value="ano-atual">Este ano</Option>
              <Option value="ultimos-30-dias">Últimos 30 dias</Option>
              <Option value="ultimos-12-meses">Últimos 12 meses</Option>
              <Option value="semestre-atual">Este semestre</Option>
              <Option value="personalizado">Período personalizado</Option>
            </Dropdown>
          </div>
          
          {periodoSelecionado === 'personalizado' && (
            <div className={styles.customDateContainer}>
              <div className={styles.customDateField}>
                <Label htmlFor="data-inicio-abc" size="small">
                  Data Inicial
                </Label>
                <Input
                  id="data-inicio-abc"
                  type="date"
                  value={dataInicioPersonalizada}
                  onChange={(_, data) => setDataInicioPersonalizada(data.value)}
                />
              </div>
              <div className={styles.customDateField}>
                <Label htmlFor="data-fim-abc" size="small">
                  Data Final
                </Label>
                <Input
                  id="data-fim-abc"
                  type="date"
                  value={dataFimPersonalizada}
                  onChange={(_, data) => setDataFimPersonalizada(data.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Toggle Faturamento/Lucro */}
        <div className={styles.abcToggleContainer}>
          <Label>Analisar por:</Label>
          <Switch
            checked={tipoABC === 'lucro'}
            onChange={(_, data) => setTipoABC(data.checked ? 'lucro' : 'faturamento')}
            label={tipoABC === 'faturamento' ? 'Faturamento' : 'Lucro'}
          />
        </div>

        {/* KPIs por Classificação */}
        <div className={styles.kpiGrid}>
          <KPICard
            label="Classe A - Quantidade"
            value={dataABC.totais.qtdA.toString()}
            subtitle="produtos"
          />
          <KPICard
            label="Classe A - Valor"
            value={formatCurrency(dataABC.totais.valorA)}
            subtitle={`${dataABC.totais.valorTotal > 0 ? ((dataABC.totais.valorA / dataABC.totais.valorTotal) * 100).toFixed(1) : 0}% do total`}
          />
          <KPICard
            label="Classe B - Quantidade"
            value={dataABC.totais.qtdB.toString()}
            subtitle="produtos"
          />
          <KPICard
            label="Classe B - Valor"
            value={formatCurrency(dataABC.totais.valorB)}
            subtitle={`${dataABC.totais.valorTotal > 0 ? ((dataABC.totais.valorB / dataABC.totais.valorTotal) * 100).toFixed(1) : 0}% do total`}
          />
          <KPICard
            label="Classe C - Quantidade"
            value={dataABC.totais.qtdC.toString()}
            subtitle="produtos"
          />
          <KPICard
            label="Classe C - Valor"
            value={formatCurrency(dataABC.totais.valorC)}
            subtitle={`${dataABC.totais.valorTotal > 0 ? ((dataABC.totais.valorC / dataABC.totais.valorTotal) * 100).toFixed(1) : 0}% do total`}
          />
        </div>

        {/* Gráfico de Distribuição ABC */}
        <Card className={styles.chartCard} style={{ marginBottom: '24px' }}>
          <Text size={500} weight="semibold" className={styles.chartTitle}>
            Distribuição ABC por {tipoABC === 'faturamento' ? 'Faturamento' : 'Lucro'}
          </Text>
          {distribuicaoABC.length > 0 ? (
            <DonutChart data={distribuicaoABC} height={300} />
          ) : (
            <Text>Sem dados para exibir</Text>
          )}
        </Card>

        {/* Tabela de Produtos Classificados */}
        <Card className={styles.abcTableCard}>
          <Text size={500} weight="semibold" block style={{ marginBottom: '16px' }}>
            Produtos Classificados por {tipoABC === 'faturamento' ? 'Faturamento' : 'Lucro'}
          </Text>
          {dataABC.items.length > 0 ? (
            <DataGrid
              items={dataABC.items}
              columns={abcColumns}
              sortable
              getRowId={(item) => item.modelo || item.descricao}
            >
              <DataGridHeader>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<ABCItem>>
                {({ item, rowId }) => (
                  <DataGridRow<ABCItem> key={rowId}>
                    {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          ) : (
            <Text>Sem dados para exibir</Text>
          )}
        </Card>
      </>
    );
  };

  // Função para renderizar a aba de comparação
  const renderComparacao = () => {
    if (loadingAnoBase || loadingAnoComparacao) {
      return (
        <div className={styles.loadingContainer}>
          <Spinner size="extra-large" label="Carregando dados para comparação..." />
        </div>
      );
    }
    if (errorAnoBase || errorAnoComparacao) {
      return (
        <MessageBar intent="error">
          <MessageBarBody>
            {errorAnoBase || errorAnoComparacao}
          </MessageBarBody>
        </MessageBar>
      );
    }

    // Preparar dados de evolução mensal comparativa
    const mesesDoAno = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const evolucaoComparativa: (ChartDataPoint & { monthNumber: number })[] = mesesDoAno.map((mes, index) => {
      const mesNum = index + 1;
      
      // Buscar valor do ano base
      const dadoAnoBase = dataAnoBase.evolucaoVendas.find(ev => {
        const [m] = ev.date.split('/');
        return Number(m) === mesNum;
      });
      
      // Buscar valor do ano de comparação
      const dadoAnoComp = dataAnoComparacao.evolucaoVendas.find(ev => {
        const [m] = ev.date.split('/');
        return Number(m) === mesNum;
      });
      
      return {
        date: mes,
        monthNumber: mesNum,
        value: dadoAnoBase?.value || 0,
        [anoBase.toString()]: dadoAnoBase?.value || 0,
        [anoComparacao.toString()]: dadoAnoComp?.value || 0,
      };
    });

    return (
      <>
        {/* Seletor de Anos */}
        <div className={styles.yearSelectorContainer}>
          <div className={styles.yearSelector}>
            <Label>Ano Base</Label>
            <Dropdown
              value={anoBase.toString()}
              onOptionSelect={(_, data) => setAnoBase(Number(data.optionValue))}
            >
              {anosDisponiveis.map((ano) => (
                <Option key={ano} value={ano.toString()} text={ano.toString()}>
                  {ano}
                </Option>
              ))}
            </Dropdown>
          </div>
          <div className={styles.yearSelector}>
            <Label>Comparar com</Label>
            <Dropdown
              value={anoComparacao.toString()}
              onOptionSelect={(_, data) => setAnoComparacao(Number(data.optionValue))}
            >
              {anosDisponiveis.map((ano) => (
                <Option key={ano} value={ano.toString()} text={ano.toString()}>
                  {ano}
                </Option>
              ))}
            </Dropdown>
          </div>
        </div>

        {/* KPIs Comparativos */}
        <div className={styles.comparisonGrid}>
          <KPIComparativo
            label="Faturamento Total"
            valorBase={dataAnoBase.kpis.faturamentoTotal}
            valorComparacao={dataAnoComparacao.kpis.faturamentoTotal}
            formato="currency"
          />
          <KPIComparativo
            label="Lucro Bruto Total"
            valorBase={dataAnoBase.kpis.lucroBrutoTotal}
            valorComparacao={dataAnoComparacao.kpis.lucroBrutoTotal}
            formato="currency"
          />
          <KPIComparativo
            label="Margem Média"
            valorBase={dataAnoBase.kpis.margemMedia}
            valorComparacao={dataAnoComparacao.kpis.margemMedia}
            formato="percent"
          />
          <KPIComparativo
            label="Ticket Médio"
            valorBase={dataAnoBase.kpis.ticketMedio}
            valorComparacao={dataAnoComparacao.kpis.ticketMedio}
            formato="currency"
          />
          <KPIComparativo
            label="Total de Vendas"
            valorBase={dataAnoBase.kpis.totalVendas}
            valorComparacao={dataAnoComparacao.kpis.totalVendas}
            formato="number"
          />
        </div>

        {/* Gráfico de Evolução Mensal Comparativa */}
        <Card className={styles.chartCard} style={{ marginBottom: '24px' }}>
          <Text size={500} weight="semibold" className={styles.chartTitle}>
            Evolução Mensal Comparativa
          </Text>
          <LineChart
            data={evolucaoComparativa}
            lines={[
              { dataKey: anoBase.toString(), name: `${anoBase}`, color: tokens.colorBrandBackground },
              { dataKey: anoComparacao.toString(), name: `${anoComparacao}`, color: tokens.colorPaletteBlueForeground2 },
            ]}
            height={300}
            onPointClick={(item, meta) => {
              const anoSelecionado = meta?.dataKey === anoComparacao.toString() ? anoComparacao : anoBase;
              const anoClicado = meta?.dataKey === anoComparacao.toString() ? 'comparacao' : 'base';
              const monthNumber = 'monthNumber' in item ? item.monthNumber : undefined;
              const filterValue = monthNumber ? `${monthNumber}/${anoSelecionado}` : item.date;
              setModalData({ type: 'evolucao', value: filterValue, anoClicado });
              setModalOpen(true);
            }}
          />
        </Card>

        {/* Gráficos Comparativos Row */}
        <div className={styles.chartsRow}>
          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Vendas por Categoria - {anoBase}
            </Text>
            {dataAnoBase.vendasPorCategoria.length > 0 ? (
              <DonutChart 
                data={dataAnoBase.vendasPorCategoria} 
                height={250}
                onSegmentClick={(item) => {
                  setModalData({ type: 'categoria', value: item.name, anoClicado: 'base' });
                  setModalOpen(true);
                }}
              />
            ) : (
              <Text>Sem dados para {anoBase}</Text>
            )}
          </Card>

          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Vendas por Categoria - {anoComparacao}
            </Text>
            {dataAnoComparacao.vendasPorCategoria.length > 0 ? (
              <DonutChart 
                data={dataAnoComparacao.vendasPorCategoria} 
                height={250}
                onSegmentClick={(item) => {
                  setModalData({ type: 'categoria', value: item.name, anoClicado: 'comparacao' });
                  setModalOpen(true);
                }}
              />
            ) : (
              <Text>Sem dados para {anoComparacao}</Text>
            )}
          </Card>
        </div>

        {/* Produto vs Serviço Comparativo */}
        <div className={styles.chartsRow}>
          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Produto vs Serviço - {anoBase}
            </Text>
            {dataAnoBase.produtoVsServico.length > 0 ? (
              <DonutChart 
                data={dataAnoBase.produtoVsServico} 
                height={250}
                onSegmentClick={(item) => {
                  setModalData({ type: 'produto-vs-servico', value: item.name, anoClicado: 'base' });
                  setModalOpen(true);
                }}
              />
            ) : (
              <Text>Sem dados para {anoBase}</Text>
            )}
          </Card>

          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Produto vs Serviço - {anoComparacao}
            </Text>
            {dataAnoComparacao.produtoVsServico.length > 0 ? (
              <DonutChart 
                data={dataAnoComparacao.produtoVsServico} 
                height={250}
                onSegmentClick={(item) => {
                  setModalData({ type: 'produto-vs-servico', value: item.name, anoClicado: 'comparacao' });
                  setModalOpen(true);
                }}
              />
            ) : (
              <Text>Sem dados para {anoComparacao}</Text>
            )}
          </Card>
        </div>

        {/* Top Fabricantes Comparativo */}
        <div className={styles.chartsRow}>
          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Top 10 Fabricantes - {anoBase}
            </Text>
            {dataAnoBase.topFabricantes.length > 0 ? (
              <BarChart 
                data={dataAnoBase.topFabricantes} 
                dataKey="value" 
                height={300} 
                horizontal
                onBarClick={(item) => {
                  setModalData({ type: 'fabricante', value: item.date, anoClicado: 'base' });
                  setModalOpen(true);
                }}
              />
            ) : (
              <Text>Sem dados para {anoBase}</Text>
            )}
          </Card>

          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Top 10 Fabricantes - {anoComparacao}
            </Text>
            {dataAnoComparacao.topFabricantes.length > 0 ? (
              <BarChart 
                data={dataAnoComparacao.topFabricantes} 
                dataKey="value" 
                height={300} 
                horizontal
                onBarClick={(item) => {
                  setModalData({ type: 'fabricante', value: item.date, anoClicado: 'comparacao' });
                  setModalOpen(true);
                }}
              />
            ) : (
              <Text>Sem dados para {anoComparacao}</Text>
            )}
          </Card>
        </div>
      </>
    );
  };

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
        {/* Abas */}
        <div className={styles.tabContainer}>
          <TabList selectedValue={selectedTab} onTabSelect={(_, data) => setSelectedTab(data.value as 'analise' | 'comparacao' | 'abc')}>
            <Tab value="analise">Análise</Tab>
            <Tab value="comparacao">Comparação Ano a Ano</Tab>
            <Tab value="abc">Análise ABC</Tab>
          </TabList>
        </div>

        {/* Conteúdo da aba de Análise */}
        {selectedTab === 'analise' && (
          <>
            {/* Filtros */}
            <div className={styles.filterSection}>
          {/* Campo de Busca */}
          <div className={styles.searchField}>
            <Input
              placeholder="Buscar por cliente, produto, fabricante, vendedor, arquiteto..."
              value={buscaInput}
              onChange={(_, data) => setBuscaInput(data.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setBusca(buscaInput.trim());
                }
              }}
              contentBefore={<Search24Regular />}
            />
          </div>

          <div className={styles.dateFilterItem}>
            <Dropdown
              value={
                periodoSelecionado === 'todos-os-tempos' ? 'Todos os tempos' :
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
              <Option value="todos-os-tempos">Todos os tempos</Option>
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
          <div className={styles.filterItem}>
            <Dropdown
              placeholder="Todos os arquitetos"
              onOptionSelect={(_, data) => {
                setFiltros({ ...filtros, arquiteto: data.optionValue as string });
              }}
            >
              <Option value="">Todos os arquitetos</Option>
              {data.topArquitetos.map((arq) => (
                <Option key={arq.date} value={arq.date}>
                  {arq.date}
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
                onPointClick={(item, _meta) => {
                  setModalData({ type: 'evolucao', value: item.date });
                  setModalOpen(true);
                }}
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
              <DonutChart 
                data={data.vendasPorCategoria} 
                height={250}
                onSegmentClick={(item) => {
                  setModalData({ type: 'categoria', value: item.name });
                  setModalOpen(true);
                }}
              />
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
              <BarChart 
                data={data.topFabricantes} 
                dataKey="value" 
                height={300} 
                horizontal
                onBarClick={(item) => {
                  setModalData({ type: 'fabricante', value: item.date });
                  setModalOpen(true);
                }}
              />
            ) : (
              <Text>Sem dados para exibir</Text>
            )}
          </Card>

          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Ranking de Vendedores
            </Text>
            {data.topVendedores.length > 0 ? (
              <BarChart 
                data={data.topVendedores} 
                dataKey="value" 
                height={300} 
                horizontal
                onBarClick={(item) => {
                  setModalData({ type: 'vendedor', value: item.date });
                  setModalOpen(true);
                }}
              />
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
              <BarChart 
                data={data.topArquitetos} 
                dataKey="value" 
                height={300} 
                horizontal
                onBarClick={(item) => {
                  setModalData({ type: 'arquiteto', value: item.date });
                  setModalOpen(true);
                }}
              />
            ) : (
              <Text>Sem dados para exibir</Text>
            )}
          </Card>

          <Card className={styles.chartCard}>
            <Text size={500} weight="semibold" className={styles.chartTitle}>
              Distribuição Produto vs Serviço
            </Text>
            {data.produtoVsServico.length > 0 ? (
              <DonutChart 
                data={data.produtoVsServico} 
                height={250}
                onSegmentClick={(item) => {
                  setModalData({ type: 'produto-vs-servico', value: item.name });
                  setModalOpen(true);
                }}
              />
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
              <BarChart 
                data={data.margemPorCategoria} 
                dataKey="value" 
                height={300}
                valueFormatter={(value: number) => `${value.toFixed(2)}%`}
                onBarClick={(item) => {
                  setModalData({ type: 'categoria', value: item.date });
                  setModalOpen(true);
                }}
              />
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
                    <DataGridRow<TopProduto> 
                      key={rowId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setModalData({ type: 'produto', value: item.descricao });
                        setModalOpen(true);
                      }}
                    >
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
                    <DataGridRow<TopCliente> 
                      key={rowId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setModalData({ type: 'cliente', value: item.nome });
                        setModalOpen(true);
                      }}
                    >
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
          </>
        )}

        {/* Conteúdo da aba de Comparação */}
        {selectedTab === 'comparacao' && renderComparacao()}

        {/* Conteúdo da aba de Análise ABC */}
        {selectedTab === 'abc' && renderAnaliseABC()}

        {/* Modal de Detalhes */}
        {modalData && (
          <VendasDetalhesModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setModalData(null);
            }}
            filterType={modalData.type}
            filterValue={modalData.value}
            periodo={
              selectedTab === 'comparacao'
                ? modalData?.anoClicado === 'comparacao'
                  ? { dataInicio: datasAnoComparacao.dataInicio, dataFim: datasAnoComparacao.dataFim }
                  : { dataInicio: datasAnoBase.dataInicio, dataFim: datasAnoBase.dataFim }
                : { dataInicio, dataFim }
            }
          />
        )}
      </PageContainer>
    </>
  );
}
