import { useMemo } from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogActions,
  Button,
  Text,
  tokens,
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
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { KPICard } from '../shared/KPICard';
import { useVendasAnalytics } from '../../hooks/comercial/useVendasAnalytics';
import type { NewRegistrodevenda } from '../../generated/models/NewRegistrodevendaModel';

const useStyles = makeStyles({
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },
  tableContainer: {
    marginTop: '16px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
});

interface VendasDetalhesModalProps {
  open: boolean;
  onClose: () => void;
  filterType: 'fabricante' | 'vendedor' | 'arquiteto' | 'categoria' | 'produto-vs-servico' | 'evolucao' | 'produto' | 'cliente';
  filterValue: string;
  periodo: { dataInicio?: Date; dataFim?: Date };
}

export function VendasDetalhesModal({
  open,
  onClose,
  filterType,
  filterValue,
  periodo,
}: VendasDetalhesModalProps) {
  const styles = useStyles();

  // Construir filtros baseado no tipo
  const filterOptions = useMemo(() => {
    const baseOptions: any = {
      dataInicio: periodo.dataInicio,
      dataFim: periodo.dataFim,
    };

    if (filterType === 'fabricante' && filterValue) {
      baseOptions.fabricante = filterValue.trim();
    } else if (filterType === 'vendedor' && filterValue) {
      baseOptions.vendedor = filterValue.trim();
    } else if (filterType === 'arquiteto' && filterValue) {
      baseOptions.arquiteto = filterValue.trim();
    } else if (filterType === 'categoria' && filterValue) {
      baseOptions.categoria = filterValue.trim();
    } else if (filterType === 'produto' && filterValue) {
      baseOptions.produto = filterValue.trim();
    } else if (filterType === 'cliente' && filterValue) {
      baseOptions.cliente = filterValue.trim();
    } else if (filterType === 'evolucao' && filterValue) {
      // Para evolução, filtrar por data específica (formato MM/YYYY)
      const [mes, ano] = filterValue.split('/');
      if (mes && ano) {
        const dataInicio = new Date(Number(ano), Number(mes) - 1, 1, 0, 0, 0, 0);
        const dataFim = new Date(Number(ano), Number(mes), 0, 23, 59, 59, 999);
        baseOptions.dataInicio = dataInicio;
        baseOptions.dataFim = dataFim;
      }
    } else if (filterType === 'produto-vs-servico' && filterValue) {
      const normalized = filterValue
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes('produto')) {
        baseOptions.produtoVsServico = 'produto';
      } else if (normalized.includes('servico')) {
        baseOptions.produtoVsServico = 'servico';
      }
    }

    return baseOptions;
  }, [filterType, filterValue, periodo]);

  const { loading, error, data, vendas } = useVendasAnalytics(filterOptions);

  const vendasFiltradas = useMemo(() => vendas ?? [], [vendas]);

  // Recalcular KPIs baseado nas vendas filtradas
  const kpisFiltrados = useMemo(() => {
    if (vendasFiltradas.length === 0) {
      return {
        faturamentoTotal: 0,
        lucroBrutoTotal: 0,
        margemMedia: 0,
        ticketMedio: 0,
        totalVendas: 0,
      };
    }

    const faturamentoTotal = vendasFiltradas.reduce((sum, v) => sum + (v.new_valortotal || 0), 0);
    const lucroBrutoTotal = vendasFiltradas.reduce((sum, v) => sum + (v.new_lucrobrutototal || 0), 0);
    const margemMedia = faturamentoTotal > 0 ? (lucroBrutoTotal / faturamentoTotal) * 100 : 0;
    const ticketMedio = vendasFiltradas.length > 0 ? faturamentoTotal / vendasFiltradas.length : 0;
    const totalVendas = vendasFiltradas.length;

    return {
      faturamentoTotal,
      lucroBrutoTotal,
      margemMedia,
      ticketMedio,
      totalVendas,
    };
  }, [vendasFiltradas]);

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
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  // Título do modal
  const modalTitle = useMemo(() => {
    const tipoLabel: Record<string, string> = {
      fabricante: 'Fabricante',
      vendedor: 'Vendedor',
      arquiteto: 'Arquiteto',
      categoria: 'Categoria',
      produto: 'Produto',
      cliente: 'Cliente',
      'produto-vs-servico': 'Produto vs Serviço',
      evolucao: 'Período',
    };
    return `Vendas - ${tipoLabel[filterType]}: ${filterValue}`;
  }, [filterType, filterValue]);

  // Colunas da tabela de vendas
  const vendasColumns: TableColumnDefinition<NewRegistrodevenda>[] = useMemo(
    () => [
      createTableColumn<NewRegistrodevenda>({
        columnId: 'cliente',
        compare: (a, b) => (a.new_nomedocliente || '').localeCompare(b.new_nomedocliente || ''),
        renderHeaderCell: () => 'Cliente',
        renderCell: (item) => (
          <TableCellLayout>
            <Text weight="semibold">{item.new_nomedocliente || '-'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<NewRegistrodevenda>({
        columnId: 'produto',
        compare: (a, b) => (a.new_descricaodoproduto || '').localeCompare(b.new_descricaodoproduto || ''),
        renderHeaderCell: () => 'Produto',
        renderCell: (item) => <TableCellLayout>{item.new_descricaodoproduto || '-'}</TableCellLayout>,
      }),
      createTableColumn<NewRegistrodevenda>({
        columnId: 'modelo',
        renderHeaderCell: () => 'Modelo',
        renderCell: (item) => <TableCellLayout>{item.new_referenciadoprodutomodelo || '-'}</TableCellLayout>,
      }),
      createTableColumn<NewRegistrodevenda>({
        columnId: 'data',
        compare: (a, b) => {
          const dateA = a.new_datadavenda ? new Date(a.new_datadavenda).getTime() : 0;
          const dateB = b.new_datadavenda ? new Date(b.new_datadavenda).getTime() : 0;
          return dateA - dateB;
        },
        renderHeaderCell: () => 'Data Venda',
        renderCell: (item) => <TableCellLayout>{formatDate(item.new_datadavenda)}</TableCellLayout>,
      }),
      createTableColumn<NewRegistrodevenda>({
        columnId: 'quantidade',
        compare: (a, b) => (a.new_quantidade || 0) - (b.new_quantidade || 0),
        renderHeaderCell: () => 'Quantidade',
        renderCell: (item) => (
          <TableCellLayout>
            <Text weight="semibold">{item.new_quantidade || 0}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<NewRegistrodevenda>({
        columnId: 'valorProduto',
        compare: (a, b) => (a.new_valordeprodutototal || 0) - (b.new_valordeprodutototal || 0),
        renderHeaderCell: () => 'Valor Produto',
        renderCell: (item) => (
          <TableCellLayout>
            <Text>{formatCurrency(item.new_valordeprodutototal || 0)}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<NewRegistrodevenda>({
        columnId: 'valorServico',
        compare: (a, b) => (a.new_valordeservicototal || 0) - (b.new_valordeservicototal || 0),
        renderHeaderCell: () => 'Valor Serviço',
        renderCell: (item) => (
          <TableCellLayout>
            <Text>{formatCurrency(item.new_valordeservicototal || 0)}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<NewRegistrodevenda>({
        columnId: 'valorTotal',
        compare: (a, b) => (a.new_valortotal || 0) - (b.new_valortotal || 0),
        renderHeaderCell: () => 'Valor Total',
        renderCell: (item) => (
          <TableCellLayout>
            <Text weight="semibold">{formatCurrency(item.new_valortotal || 0)}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<NewRegistrodevenda>({
        columnId: 'lucro',
        compare: (a, b) => (a.new_lucrobrutototal || 0) - (b.new_lucrobrutototal || 0),
        renderHeaderCell: () => 'Lucro Bruto',
        renderCell: (item) => (
          <TableCellLayout>
            <Text
              weight="semibold"
              style={{
                color:
                  (item.new_lucrobrutototal || 0) >= 0
                    ? tokens.colorPaletteGreenForeground1
                    : tokens.colorPaletteRedForeground1,
              }}
            >
              {formatCurrency(item.new_lucrobrutototal || 0)}
            </Text>
          </TableCellLayout>
        ),
      }),
    ],
    []
  );

  // Obter vendas do hook - precisamos acessar as vendas diretamente
  // Por enquanto, vamos usar uma abordagem diferente: o hook precisa retornar as vendas
  // Vou verificar se o hook retorna vendas ou se precisamos ajustar

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface style={{ maxWidth: 1400, width: '90vw' }}>
        <DialogBody>
          <DialogTitle
            action={
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={onClose}
                aria-label="Fechar"
              />
            }
          >
            {modalTitle}
          </DialogTitle>
          <DialogContent className={styles.modalContent}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <Spinner size="large" label="Carregando dados..." />
              </div>
            ) : error ? (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            ) : data ? (
              <>
                {/* KPIs */}
                <div className={styles.kpiGrid}>
                  <KPICard
                    label="Faturamento Total"
                    value={formatCurrency(kpisFiltrados.faturamentoTotal)}
                  />
                  <KPICard
                    label="Lucro Bruto Total"
                    value={formatCurrency(kpisFiltrados.lucroBrutoTotal)}
                  />
                  <KPICard
                    label="Margem Média"
                    value={formatPercent(kpisFiltrados.margemMedia)}
                  />
                  <KPICard
                    label="Ticket Médio"
                    value={formatCurrency(kpisFiltrados.ticketMedio)}
                  />
                  <KPICard label="Total de Vendas" value={kpisFiltrados.totalVendas.toString()} />
                </div>

                {/* Tabela de Vendas */}
                <div className={styles.tableContainer}>
                  <Text size={500} weight="semibold" block style={{ marginBottom: '16px' }}>
                    Detalhamento de Vendas ({vendasFiltradas.length} registro{vendasFiltradas.length !== 1 ? 's' : ''})
                  </Text>
                  {vendasFiltradas.length > 0 ? (
                    <DataGrid
                      items={vendasFiltradas}
                      columns={vendasColumns}
                      sortable
                      getRowId={(item) => item.new_registrodevendaid}
                    >
                      <DataGridHeader>
                        <DataGridRow>
                          {({ renderHeaderCell }) => (
                            <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                          )}
                        </DataGridRow>
                      </DataGridHeader>
                      <DataGridBody<NewRegistrodevenda>>
                        {({ item, rowId }) => (
                          <DataGridRow<NewRegistrodevenda> key={rowId}>
                            {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                          </DataGridRow>
                        )}
                      </DataGridBody>
                    </DataGrid>
                  ) : (
                    <Text>Nenhuma venda encontrada para os filtros selecionados.</Text>
                  )}
                </div>
              </>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={onClose}>
              Fechar
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
