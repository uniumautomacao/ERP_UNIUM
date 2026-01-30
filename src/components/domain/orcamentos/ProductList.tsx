/**
 * Lista de produtos do orçamento
 * Usa DataGrid com colunas customizadas
 * Exibe produtos e serviços agrupados
 */

import { useMemo } from 'react';
import {
  TableColumnDefinition,
  createTableColumn,
  tokens,
  Badge,
} from '@fluentui/react-components';
import { DataGrid } from '../../shared/DataGrid';
import type { ItemOrcamento } from '../../../features/orcamentos/types';
import { formatarMoeda, ServicoCalculado } from '../../../features/orcamentos/utils';
import { PRODUCT_LIST_COLUMNS } from '../../../features/orcamentos/constants';

// Tipo união para linhas da tabela (produtos ou serviços)
type TableRow = ItemOrcamento | ServicoCalculado;

// Type guard para verificar se é serviço
function isServico(row: TableRow): row is ServicoCalculado {
  return 'isServico' in row && row.isServico === true;
}

interface ProductListProps {
  items: ItemOrcamento[];
  servicos?: ServicoCalculado[];
  selectedItems: Set<string>;
  onSelectionChange: (items: ItemOrcamento[]) => void;
  onItemDoubleClick?: (item: ItemOrcamento) => void;
}

export function ProductList({
  items,
  servicos = [],
  selectedItems,
  onSelectionChange,
  onItemDoubleClick,
}: ProductListProps) {
  // Combinar produtos e serviços em uma única lista
  const allRows = useMemo<TableRow[]>(() => {
    return [...items, ...servicos];
  }, [items, servicos]);

  const columns: TableColumnDefinition<TableRow>[] = useMemo(
    () => [
      createTableColumn<TableRow>({
        columnId: 'ambiente',
        compare: (a, b) => {
          if (isServico(a) || isServico(b)) return 0;
          return (a.new_ambiente || '').localeCompare(b.new_ambiente || '');
        },
        renderHeaderCell: () => 'Ambiente',
        renderCell: (row) => (
          <span style={{ fontSize: '14px' }}>
            {isServico(row) ? '' : row.new_ambiente || '-'}
          </span>
        ),
        ...PRODUCT_LIST_COLUMNS.AMBIENTE,
      }),
      createTableColumn<TableRow>({
        columnId: 'ref',
        compare: (a, b) => {
          if (isServico(a) || isServico(b)) return 0;
          return (a.new_ref || '').localeCompare(b.new_ref || '');
        },
        renderHeaderCell: () => 'REF',
        renderCell: (row) => (
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {isServico(row) ? '' : row.new_ref || '-'}
          </span>
        ),
        ...PRODUCT_LIST_COLUMNS.REF,
      }),
      createTableColumn<TableRow>({
        columnId: 'descricao',
        compare: (a, b) => {
          const aDesc = isServico(a) ? a.descricao : (a.new_descricaocalculada || a.new_descricao || '');
          const bDesc = isServico(b) ? b.descricao : (b.new_descricaocalculada || b.new_descricao || '');
          return aDesc.localeCompare(bDesc);
        },
        renderHeaderCell: () => 'Descrição',
        renderCell: (row) => {
          if (isServico(row)) {
            return (
              <div style={{ fontSize: '14px', fontStyle: 'italic' }}>
                {row.descricao}
                <Badge
                  size="small"
                  appearance="tint"
                  color="success"
                  style={{ marginLeft: tokens.spacingHorizontalXS }}
                >
                  SERVIÇO
                </Badge>
              </div>
            );
          }
          const descricao = row.new_descricaocalculada || row.new_descricao || '-';
          return (
            <div style={{ fontSize: '14px' }}>
              {descricao}
              {row.new_kit && (
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
      createTableColumn<TableRow>({
        columnId: 'quantidade',
        compare: (a, b) => {
          if (isServico(a) || isServico(b)) return 0;
          return (a.new_quantidade || 0) - (b.new_quantidade || 0);
        },
        renderHeaderCell: () => 'Qtd',
        renderCell: (row) => (
          <span style={{ fontSize: '14px', textAlign: 'right', display: 'block' }}>
            {isServico(row) ? '-' : row.new_quantidade || 0}
          </span>
        ),
        ...PRODUCT_LIST_COLUMNS.QUANTIDADE,
      }),
      createTableColumn<TableRow>({
        columnId: 'valorTotal',
        compare: (a, b) => {
          const aVal = isServico(a) ? a.valorTotal : (a.new_valordeproduto || 0);
          const bVal = isServico(b) ? b.valorTotal : (b.new_valordeproduto || 0);
          return aVal - bVal;
        },
        renderHeaderCell: () => 'Valor Total',
        renderCell: (row) => {
          const valor = isServico(row) ? row.valorTotal : row.new_valordeproduto;
          return (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                textAlign: 'right',
                display: 'block',
              }}
            >
              {formatarMoeda(valor)}
            </span>
          );
        },
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
      items={allRows}
      columns={columns}
      selectionMode="multiselect"
      selectedItems={selectedItemsArray}
      onSelectionChange={onSelectionChange}
      getRowId={(row) => isServico(row) ? row.id : row.new_itemdeorcamentoid}
      getRowStyle={(row) => isServico(row) ? {
        backgroundColor: tokens.colorNeutralBackground1Hover,
      } : undefined}
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
