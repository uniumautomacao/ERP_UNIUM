import { Button, Card, Text, tokens } from '@fluentui/react-components';
import { createTableColumn, DataGrid } from '../../shared/DataGrid';
import { EmptyState } from '../../shared/EmptyState';
import { FilterBar } from '../../shared/FilterBar';
import { LoadingState } from '../../shared/LoadingState';
import type { DeviceIOProduct } from '../../../types';

interface DeviceIOProductsViewProps {
  products: DeviceIOProduct[];
  loading: boolean;
  error: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onReload: () => void;
  onSelect: (product: DeviceIOProduct) => void;
}

export function DeviceIOProductsView({
  products,
  loading,
  error,
  searchValue,
  onSearchChange,
  onReload,
  onSelect,
}: DeviceIOProductsViewProps) {
  if (loading) {
    return <LoadingState label="Carregando produtos..." />;
  }

  if (error) {
    return (
      <Card style={{ padding: '24px', border: `1px solid ${tokens.colorPaletteRedBorder1}` }}>
        <Text block style={{ color: tokens.colorPaletteRedForeground1, marginBottom: '12px' }}>
          {error}
        </Text>
        <Button appearance="primary" onClick={onReload}>
          Tentar novamente
        </Button>
      </Card>
    );
  }

  const columns = [
    createTableColumn<DeviceIOProduct>({
      columnId: 'name',
      renderHeaderCell: () => 'Produto',
      renderCell: (item) => item.cr22f_title,
    }),
    createTableColumn<DeviceIOProduct>({
      columnId: 'actions',
      renderHeaderCell: () => '',
      renderCell: (item) => (
        <Button appearance="subtle" onClick={() => onSelect(item)}>
          Abrir Editor
        </Button>
      ),
    }),
  ];

  return (
    <div className="flex flex-col gap-4">
      <FilterBar searchValue={searchValue} onSearchChange={onSearchChange} />
      <DataGrid
        items={products}
        columns={columns}
        getRowId={(item) => item.cr22f_modelosdeprodutofromsharepointlistid}
        emptyState={
          <EmptyState
            title="Nenhum produto encontrado"
            description={
              searchValue
                ? 'Nenhum produto corresponde à busca atual.'
                : 'Nenhum produto está disponível para este fabricante.'
            }
          />
        }
      />
    </div>
  );
}
