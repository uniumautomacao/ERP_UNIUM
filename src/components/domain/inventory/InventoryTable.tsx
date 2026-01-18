import { useMemo } from 'react';
import { createTableColumn } from '@fluentui/react-components';
import { DataGrid } from '../../shared/DataGrid';
import { StatusBadge } from '../../shared/StatusBadge';
import { InventoryItem, StatusType } from '../../../types';

interface InventoryTableProps {
  items: InventoryItem[];
  onSelectionChange?: (selectedItems: InventoryItem[]) => void;
}

const statusMap: Record<InventoryItem['status'], StatusType> = {
  in_stock: 'active',
  low_stock: 'warning',
  out_of_stock: 'error',
};

const statusLabels: Record<InventoryItem['status'], string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

export function InventoryTable({ items, onSelectionChange }: InventoryTableProps) {
  const columns = useMemo(
    () => [
      createTableColumn<InventoryItem>({
        columnId: 'sku',
        renderHeaderCell: () => 'SKU',
        renderCell: (item) => item.sku,
      }),
      createTableColumn<InventoryItem>({
        columnId: 'name',
        renderHeaderCell: () => 'Product Name',
        renderCell: (item) => item.name,
      }),
      createTableColumn<InventoryItem>({
        columnId: 'category',
        renderHeaderCell: () => 'Category',
        renderCell: (item) => item.category,
      }),
      createTableColumn<InventoryItem>({
        columnId: 'quantity',
        renderHeaderCell: () => 'Quantity',
        renderCell: (item) => item.quantity.toLocaleString(),
      }),
      createTableColumn<InventoryItem>({
        columnId: 'location',
        renderHeaderCell: () => 'Location',
        renderCell: (item) => item.location,
      }),
      createTableColumn<InventoryItem>({
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: (item) => (
          <StatusBadge status={statusMap[item.status]} label={statusLabels[item.status]} />
        ),
      }),
    ],
    []
  );

  return (
    <DataGrid
      items={items}
      columns={columns}
      selectionMode="multiselect"
      onSelectionChange={onSelectionChange}
      getRowId={(item) => item.id}
    />
  );
}
