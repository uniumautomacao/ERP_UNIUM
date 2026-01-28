import { Text, tokens } from '@fluentui/react-components';
import { createTableColumn, DataGrid } from '../../shared/DataGrid';
import { EmptyState } from '../../shared/EmptyState';
import { RemessaCotacaoItem } from '../../../features/remessas/types';

interface CotacoesDaRemessaListProps {
  items: RemessaCotacaoItem[];
  loading?: boolean;
}

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : new Intl.DateTimeFormat('pt-BR').format(date);
};

export function CotacoesDaRemessaList({ items, loading }: CotacoesDaRemessaListProps) {
  const columns = [
    createTableColumn<RemessaCotacaoItem>({
      columnId: 'nome',
      renderHeaderCell: () => 'Cotação',
      renderCell: (item) => item.nome || '-',
    }),
    createTableColumn<RemessaCotacaoItem>({
      columnId: 'fornecedor',
      renderHeaderCell: () => 'Fornecedor',
      renderCell: (item) => item.fornecedor || '-',
    }),
    createTableColumn<RemessaCotacaoItem>({
      columnId: 'valor',
      renderHeaderCell: () => 'Valor total',
      renderCell: (item) => formatCurrency(item.valorTotal),
    }),
    createTableColumn<RemessaCotacaoItem>({
      columnId: 'opcaoEntrega',
      renderHeaderCell: () => 'Opção de entrega',
      renderCell: (item) => item.opcaoEntrega ?? '-',
    }),
    createTableColumn<RemessaCotacaoItem>({
      columnId: 'enderecoEntrega',
      renderHeaderCell: () => 'Endereço de entrega',
      renderCell: (item) => item.enderecoEntrega || '-',
    }),
    createTableColumn<RemessaCotacaoItem>({
      columnId: 'observacoes',
      renderHeaderCell: () => 'Observações',
      renderCell: (item) => item.observacoes || '-',
    }),
    createTableColumn<RemessaCotacaoItem>({
      columnId: 'dataAprovacao',
      renderHeaderCell: () => 'Data de aprovação',
      renderCell: (item) => formatDate(item.dataAprovacao),
    }),
  ];

  if (loading) {
    return (
      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
        Carregando cotações...
      </Text>
    );
  }

  return (
    <DataGrid
      items={items}
      columns={columns}
      getRowId={(item) => item.id}
      emptyState={<EmptyState title="Nenhuma cotação vinculada" description="A remessa ainda não possui cotações." />}
    />
  );
}
