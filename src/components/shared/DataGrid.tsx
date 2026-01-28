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
import { ReactNode, useEffect, useMemo, useState } from 'react';

interface DataGridProps<T> {
  items: T[];
  columns: TableColumnDefinition<T>[];
  selectionMode?: 'single' | 'multiselect';
  selectedItems?: T[];
  onSelectionChange?: (selectedItems: T[]) => void;
  getRowId?: (item: T) => string;
  emptyState?: ReactNode;
}

export function DataGrid<T>({
  items,
  columns,
  selectionMode,
  selectedItems,
  onSelectionChange,
  getRowId,
  emptyState,
}: DataGridProps<T>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const selectionEnabled = !!selectionMode;
  const resolvedGetRowId = useMemo(() => {
    if (getRowId) return getRowId;
    return (item: T) => String(items.indexOf(item));
  }, [getRowId, items]);

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!selectionEnabled) return;
    const selectedItems = items.filter((item) => selectedRowIds.has(resolvedGetRowId(item)));
    onSelectionChange?.(selectedItems);
  }, [items, onSelectionChange, resolvedGetRowId, selectedRowIds, selectionEnabled]);

  useEffect(() => {
    if (!selectionEnabled || !selectedItems) return;
    const validIds = new Set(items.map((item) => resolvedGetRowId(item)));
    const nextSelected = new Set<string>();
    selectedItems.forEach((item) => {
      const id = resolvedGetRowId(item);
      if (validIds.has(id)) nextSelected.add(id);
    });
    setSelectedRowIds(nextSelected);
  }, [items, resolvedGetRowId, selectedItems, selectionEnabled]);

  useEffect(() => {
    if (!selectionEnabled) return;
    // Quando a lista muda, remove IDs que não existem mais
    const validIds = new Set(items.map((item) => resolvedGetRowId(item)));
    setSelectedRowIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [items, resolvedGetRowId, selectionEnabled]);

  return (
    <div style={{ border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '4px', overflow: 'hidden' }}>
      <FluentDataGrid
        items={items}
        columns={columns}
        selectionMode={selectionMode}
        getRowId={resolvedGetRowId}
        selectedItems={selectionEnabled ? selectedRowIds : undefined}
        onSelectionChange={
          selectionEnabled
            ? (_, data) => setSelectedRowIds(data.selectedItems as Set<string>)
            : undefined
        }
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
