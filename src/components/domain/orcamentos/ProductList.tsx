/**
 * Lista de produtos do orçamento
 * Usa DataGrid com colunas customizadas
 */

import { useMemo } from 'react';
import {
  TableColumnDefinition,
  createTableColumn,
  tokens,
  Badge,
  Tooltip,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  Warning24Filled,
  ErrorCircle24Filled,
} from '@fluentui/react-icons';
import { DataGrid } from '../../shared/DataGrid';
import type { ItemOrcamento, ItemStatus } from '../../../features/orcamentos/types';
import { formatarMoeda } from '../../../features/orcamentos/utils';
import { PRODUCT_LIST_COLUMNS } from '../../../features/orcamentos/constants';

interface ItemOrcamentoWithStatus extends ItemOrcamento {
  _status?: ItemStatus;
}

interface ProductListProps {
  items: ItemOrcamentoWithStatus[];
  selectedItems: Set<string>;
  onSelectionChange: (items: ItemOrcamentoWithStatus[]) => void;
  onItemDoubleClick?: (item: ItemOrcamentoWithStatus) => void;
}

/**
 * Componente de ícone de status
 */
function StatusIcon({ status }: { status?: ItemStatus }) {
  if (!status) {
    return <CheckmarkCircle24Filled style={{ color: tokens.colorPaletteGreenForeground1 }} />;
  }

  if (status.expired) {
    return (
      <Tooltip content="Item expirado (preço desatualizado)" relationship="label">
        <ErrorCircle24Filled style={{ color: tokens.colorPaletteRedForeground1 }} />
      </Tooltip>
    );
  }

  if (status.unavailable) {
    return (
      <Tooltip content="Indisponível em estoque" relationship="label">
        <ErrorCircle24Filled style={{ color: tokens.colorPaletteRedForeground1 }} />
      </Tooltip>
    );
  }

  if (status.partial) {
    return (
      <Tooltip content="Parcialmente disponível" relationship="label">
        <Warning24Filled style={{ color: tokens.colorPaletteYellowForeground1 }} />
      </Tooltip>
    );
  }

  return (
    <Tooltip content="Disponível" relationship="label">
      <CheckmarkCircle24Filled style={{ color: tokens.colorPaletteGreenForeground1 }} />
    </Tooltip>
  );
}

export function ProductList({
  items,
  selectedItems,
  onSelectionChange,
  onItemDoubleClick,
}: ProductListProps) {
  const columns: TableColumnDefinition<ItemOrcamentoWithStatus>[] = useMemo(
    () => [
      createTableColumn<ItemOrcamentoWithStatus>({
        columnId: 'status',
        compare: (a, b) => {
          const aExpired = a._status?.expired ? 1 : 0;
          const bExpired = b._status?.expired ? 1 : 0;
          return bExpired - aExpired;
        },
        renderHeaderCell: () => '',
        renderCell: (item) => <StatusIcon status={item._status} />,
        ...PRODUCT_LIST_COLUMNS.STATUS_ICON,
      }),
      createTableColumn<ItemOrcamentoWithStatus>({
        columnId: 'ambiente',
        compare: (a, b) => (a.new_ambiente || '').localeCompare(b.new_ambiente || ''),
        renderHeaderCell: () => 'Ambiente',
        renderCell: (item) => (
          <span style={{ fontSize: '14px' }}>{item.new_ambiente || '-'}</span>
        ),
        ...PRODUCT_LIST_COLUMNS.AMBIENTE,
      }),
      createTableColumn<ItemOrcamentoWithStatus>({
        columnId: 'ref',
        compare: (a, b) => (a.new_ref || '').localeCompare(b.new_ref || ''),
        renderHeaderCell: () => 'REF',
        renderCell: (item) => (
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.new_ref || '-'}</span>
        ),
        ...PRODUCT_LIST_COLUMNS.REF,
      }),
      createTableColumn<ItemOrcamentoWithStatus>({
        columnId: 'descricao',
        compare: (a, b) =>
          (a.new_descricaocalculada || a.new_descricao || '').localeCompare(
            b.new_descricaocalculada || b.new_descricao || ''
          ),
        renderHeaderCell: () => 'Descrição',
        renderCell: (item) => {
          const descricao = item.new_descricaocalculada || item.new_descricao || '-';
          return (
            <div style={{ fontSize: '14px' }}>
              {descricao}
              {item.new_kit && (
                <Badge
                  size="small"
                  appearance="tint"
                  color="brand"
                  style={{ marginLeft: tokens.spacingHorizontalXS }}
                >
                  KIT
                </Badge>
              )}
            </div>
          );
        },
        ...PRODUCT_LIST_COLUMNS.DESCRICAO,
      }),
      createTableColumn<ItemOrcamentoWithStatus>({
        columnId: 'quantidade',
        compare: (a, b) => (a.new_quantidade || 0) - (b.new_quantidade || 0),
        renderHeaderCell: () => 'Qtd',
        renderCell: (item) => (
          <span style={{ fontSize: '14px', textAlign: 'right', display: 'block' }}>
            {item.new_quantidade || 0}
          </span>
        ),
        ...PRODUCT_LIST_COLUMNS.QUANTIDADE,
      }),
      createTableColumn<ItemOrcamentoWithStatus>({
        columnId: 'valorUnitario',
        compare: (a, b) =>
          (a.new_valordeproduto || 0) - (b.new_valordeproduto || 0),
        renderHeaderCell: () => 'Valor Unit.',
        renderCell: (item) => (
          <span style={{ fontSize: '14px', textAlign: 'right', display: 'block' }}>
            {formatarMoeda(item.new_valordeproduto)}
          </span>
        ),
        ...PRODUCT_LIST_COLUMNS.VALOR_UNITARIO,
      }),
      createTableColumn<ItemOrcamentoWithStatus>({
        columnId: 'valorTotal',
        compare: (a, b) =>
          (a.new_valortotal || 0) - (b.new_valortotal || 0),
        renderHeaderCell: () => 'Valor Total',
        renderCell: (item) => (
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              textAlign: 'right',
              display: 'block',
            }}
          >
            {formatarMoeda(item.new_valortotal)}
          </span>
        ),
        ...PRODUCT_LIST_COLUMNS.VALOR_TOTAL,
      }),
    ],
    []
  );

  const selectedItemsArray = useMemo(() => {
    return items.filter((item) => selectedItems.has(item.new_itemdeorcamentoid));
  }, [items, selectedItems]);

  return (
    <DataGrid
      items={items}
      columns={columns}
      selectionMode="multiselect"
      selectedItems={selectedItemsArray}
      onSelectionChange={onSelectionChange}
      getRowId={(item) => item.new_itemdeorcamentoid}
      emptyState={
        <div
          style={{
            padding: tokens.spacingVerticalXXL,
            textAlign: 'center',
            color: tokens.colorNeutralForeground3,
          }}
        >
          <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
            Nenhum produto adicionado
          </p>
          <p style={{ fontSize: '14px', marginTop: tokens.spacingVerticalS }}>
            Use o botão "Novo Produto" para adicionar itens a este orçamento
          </p>
        </div>
      }
    />
  );
}
