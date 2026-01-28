import { Text, tokens } from '@fluentui/react-components';
import { createTableColumn, DataGrid } from '../../shared/DataGrid';
import { RemessaProdutoItem } from '../../../features/remessas/types';
import { EmptyState } from '../../shared/EmptyState';

interface ProdutosDaRemessaListProps {
  items: RemessaProdutoItem[];
  loading?: boolean;
  onSelectionChange?: (items: RemessaProdutoItem[]) => void;
}

export function ProdutosDaRemessaList({ items, loading, onSelectionChange }: ProdutosDaRemessaListProps) {
  const columns = [
    createTableColumn<RemessaProdutoItem>({
      columnId: 'referencia',
      renderHeaderCell: () => 'Referência',
      renderCell: (item) => item.referencia || '-',
    }),
    createTableColumn<RemessaProdutoItem>({
      columnId: 'fabricante',
      renderHeaderCell: () => 'Fabricante',
      renderCell: (item) => item.fabricante || '-',
    }),
    createTableColumn<RemessaProdutoItem>({
      columnId: 'cliente',
      renderHeaderCell: () => 'Cliente',
      renderCell: (item) => item.cliente || '-',
    }),
    createTableColumn<RemessaProdutoItem>({
      columnId: 'projeto',
      renderHeaderCell: () => 'Projeto',
      renderCell: (item) => item.projeto || '-',
    }),
    createTableColumn<RemessaProdutoItem>({
      columnId: 'quantidade',
      renderHeaderCell: () => 'Qtd.',
      renderCell: (item) => item.quantidade ?? '-',
    }),
  ];

  if (loading) {
    return (
      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
        Carregando produtos...
      </Text>
    );
  }

  return (
    <DataGrid
      items={items}
      columns={columns}
      selectionMode="multiselect"
      onSelectionChange={onSelectionChange}
      getRowId={(item) => item.id}
      emptyState={<EmptyState title="Nenhum produto vinculado" description="A remessa ainda não possui itens." />}
    />
  );
}
