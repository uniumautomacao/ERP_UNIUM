import { useState } from 'react';
import { Button } from '@fluentui/react-components';
import {
  Add24Regular,
  ArrowDownload24Regular,
  ArrowExport24Regular,
  Edit24Regular,
  Delete24Regular,
  ArrowSync24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { FilterBar } from '../../components/shared/FilterBar';
import { InventoryTable } from '../../components/domain/inventory/InventoryTable';
import { inventoryItems } from '../../data/mockData';
import { InventoryItem } from '../../types';

export function InventoryPage() {
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilters, setActiveFilters] = useState<Array<{ id: string; label: string }>>([]);

  // Aplicar filtros
  const filteredItems = inventoryItems.filter((item) => {
    if (searchValue && !item.name.toLowerCase().includes(searchValue.toLowerCase()) && !item.sku.toLowerCase().includes(searchValue.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Calcular stats para o header
  const lowStockCount = inventoryItems.filter((i) => i.status === 'low_stock').length;
  const outOfStockCount = inventoryItems.filter((i) => i.status === 'out_of_stock').length;

  const primaryActions = [
    {
      id: 'add',
      label: 'Add Item',
      icon: <Add24Regular />,
      onClick: () => console.log('Add item'),
      appearance: 'primary' as const,
    },
    {
      id: 'import',
      label: 'Import',
      icon: <ArrowDownload24Regular />,
      onClick: () => console.log('Import'),
    },
    {
      id: 'export',
      label: 'Export',
      icon: <ArrowExport24Regular />,
      onClick: () => console.log('Export'),
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: <ArrowSync24Regular />,
      onClick: () => console.log('Refresh'),
    },
  ];

  const secondaryActions = selectedItems.length > 0 ? [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit24Regular />,
      onClick: () => console.log('Edit', selectedItems),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Delete24Regular />,
      onClick: () => console.log('Delete', selectedItems),
    },
  ] : [];

  const overflowActions = [];

  const filterOptions = [
    {
      id: 'category',
      label: 'Category',
      options: [
        { key: 'all', text: 'All Categories' },
        { key: 'Electronics', text: 'Electronics' },
        { key: 'Parts', text: 'Parts' },
        { key: 'Accessories', text: 'Accessories' },
        { key: 'Kits', text: 'Kits' },
        { key: 'Tools', text: 'Tools' },
      ],
      selectedKey: categoryFilter,
      onChange: (key: string) => {
        setCategoryFilter(key);
        if (key !== 'all') {
          const option = filterOptions[0].options.find((o) => o.key === key);
          if (option && !activeFilters.find((f) => f.id === `category-${key}`)) {
            setActiveFilters([...activeFilters, { id: `category-${key}`, label: option.text }]);
          }
        }
      },
    },
    {
      id: 'status',
      label: 'Status',
      options: [
        { key: 'all', text: 'All Status' },
        { key: 'in_stock', text: 'In Stock' },
        { key: 'low_stock', text: 'Low Stock' },
        { key: 'out_of_stock', text: 'Out of Stock' },
      ],
      selectedKey: statusFilter,
      onChange: (key: string) => {
        setStatusFilter(key);
        if (key !== 'all') {
          const option = filterOptions[1].options.find((o) => o.key === key);
          if (option && !activeFilters.find((f) => f.id === `status-${key}`)) {
            setActiveFilters([...activeFilters, { id: `status-${key}`, label: option.text }]);
          }
        }
      },
    },
  ];

  return (
    <>
      <CommandBar
        primaryActions={primaryActions}
        secondaryActions={secondaryActions}
        overflowActions={overflowActions}
      />
      <PageHeader
        title="Inventory Management"
        kpis={[
          { label: 'Total Items', value: inventoryItems.length },
          { label: 'Low Stock', value: lowStockCount },
          { label: 'Out of Stock', value: outOfStockCount },
        ]}
      />
      <PageContainer>
        {/* Filter Bar */}
        <div className="mb-4">
          <FilterBar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filters={filterOptions}
            activeFilters={activeFilters}
            onClearFilter={(id) => {
              setActiveFilters(activeFilters.filter((f) => f.id !== id));
              if (id.startsWith('category-')) setCategoryFilter('all');
              if (id.startsWith('status-')) setStatusFilter('all');
            }}
            onClearAll={() => {
              setActiveFilters([]);
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
          />
        </div>

        {/* Inventory Table */}
        <InventoryTable
          items={filteredItems}
          onSelectionChange={setSelectedItems}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div>
            Showing 1-{Math.min(50, filteredItems.length)} of {filteredItems.length} items
          </div>
          <div className="flex gap-2">
            <Button appearance="subtle">Previous</Button>
            <Button appearance="subtle">1</Button>
            <Button appearance="primary">2</Button>
            <Button appearance="subtle">3</Button>
            <Button appearance="subtle">...</Button>
            <Button appearance="subtle">Next</Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
