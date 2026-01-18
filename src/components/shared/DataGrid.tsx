import {
  DataGrid as FluentDataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  tokens,
} from '@fluentui/react-components';
import { ReactNode } from 'react';

interface DataGridProps<T> {
  items: T[];
  columns: TableColumnDefinition<T>[];
  selectionMode?: 'single' | 'multiselect';
  onSelectionChange?: (selectedItems: T[]) => void;
  getRowId?: (item: T) => string;
  emptyState?: ReactNode;
}

export function DataGrid<T>({
  items,
  columns,
  selectionMode,
  onSelectionChange,
  getRowId,
  emptyState,
}: DataGridProps<T>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div style={{ border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '4px', overflow: 'hidden' }}>
      <FluentDataGrid
        items={items}
        columns={columns}
        selectionMode={selectionMode}
        getRowId={getRowId}
        sortable
        resizableColumns
        style={{ minWidth: '100%' }}
      >
        <DataGridHeader>
          <DataGridRow
            selectionCell={
              selectionMode
                ? {
                    checkboxIndicator: { 'aria-label': 'Select all rows' },
                  }
                : undefined
            }
          >
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<T>>
          {({ item, rowId }) => (
            <DataGridRow<T>
              key={rowId}
              selectionCell={
                selectionMode
                  ? {
                      checkboxIndicator: { 'aria-label': 'Select row' },
                    }
                  : undefined
              }
            >
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </FluentDataGrid>
    </div>
  );
}

// Helper para criar colunas
export { createTableColumn };
