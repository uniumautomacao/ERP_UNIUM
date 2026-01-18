import { Button, Card, Text, tokens } from '@fluentui/react-components';
import { createTableColumn, DataGrid } from '../../shared/DataGrid';
import { EmptyState } from '../../shared/EmptyState';
import { FilterBar } from '../../shared/FilterBar';
import { LoadingState } from '../../shared/LoadingState';
import type { DeviceIOManufacturer } from '../../../types';

interface DeviceIOManufacturersViewProps {
  manufacturers: DeviceIOManufacturer[];
  loading: boolean;
  error: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onReload: () => void;
  onSelect: (manufacturer: DeviceIOManufacturer) => void;
}

export function DeviceIOManufacturersView({
  manufacturers,
  loading,
  error,
  searchValue,
  onSearchChange,
  onReload,
  onSelect,
}: DeviceIOManufacturersViewProps) {
  if (loading) {
    return <LoadingState label="Carregando fabricantes..." />;
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
    createTableColumn<DeviceIOManufacturer>({
      columnId: 'name',
      renderHeaderCell: () => 'Fabricante',
      renderCell: (item) => item.cr22f_title,
    }),
    createTableColumn<DeviceIOManufacturer>({
      columnId: 'actions',
      renderHeaderCell: () => '',
      renderCell: (item) => (
        <Button appearance="subtle" onClick={() => onSelect(item)}>
          Abrir
        </Button>
      ),
    }),
  ];

  return (
    <div className="flex flex-col gap-4">
      <FilterBar searchValue={searchValue} onSearchChange={onSearchChange} />
      <DataGrid
        items={manufacturers}
        columns={columns}
        getRowId={(item) => item.cr22f_fabricantesfromsharpointlistid}
        emptyState={
          <EmptyState
            title="Nenhum fabricante encontrado"
            description={
              searchValue
                ? 'Nenhum fabricante corresponde à busca atual.'
                : 'Ainda não existem fabricantes cadastrados.'
            }
          />
        }
      />
    </div>
  );
}
