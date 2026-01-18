import React, { useMemo, useState, useEffect } from 'react';
import { Badge, Button, Spinner, Text } from '@fluentui/react-components';
import type { OrdemServicoproduto } from './dataverseMapper';
import './UsoInstalador.css';

interface Props {
  produtos: OrdemServicoproduto[];
  // Optional: ordemId to use for server-side sorting (will be provided when we want server-side sort)
  ordemId?: string;
  onRequestServerSort?: (ordemId: string, column: 'quantidade' | 'referenciaProduto' | 'descricao' | 'situacaoReserva', dir: 'asc' | 'desc') => Promise<void>;
  loading?: boolean;
  compact?: boolean;
}

type SortKey = 'quantidade' | 'referenciaProduto' | 'descricao' | 'situacaoReserva' | null;

const ProdutosDataGrid: React.FC<Props> = ({ produtos, ordemId, onRequestServerSort, loading = false, compact = false }) => {
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(() => (
    compact
      ? { quantidade: 64, referenciaProduto: 130, descricao: 220, situacaoReserva: 90 }
      : { quantidade: 80, referenciaProduto: 160, descricao: 200, situacaoReserva: 100 }
  ));
  const [resizing, setResizing] = useState<{ key: string | null; startX: number; startWidth: number } | null>(null);

  // Column resizing handlers
  const onMouseDownResize = (key: string, e: React.MouseEvent) => {
    if (compact) return;
    setResizing({ key, startX: e.clientX, startWidth: columnWidths[key] || 100 });
  };
  
  useEffect(() => {
    if (compact) return;
    const onMouseMove = (ev: MouseEvent) => {
      if (!resizing) return;
      const diff = ev.clientX - resizing.startX;
      setColumnWidths(prev => ({ ...prev, [resizing.key as string]: Math.max(48, resizing.startWidth + diff) }));
    };
    const onMouseUp = () => setResizing(null);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [compact, resizing, setColumnWidths]);

  const sorted = useMemo(() => {
    if (!sortKey) return produtos;
    const copy = [...produtos];
    copy.sort((a: any, b: any) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const sa = String(av).toLowerCase();
      const sb = String(bv).toLowerCase();
      if (sa < sb) return sortDir === 'asc' ? -1 : 1;
      if (sa > sb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [produtos, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
      // If server-side sorting is enabled, request with new direction
      if (onRequestServerSort && ordemId && key) {
        onRequestServerSort(ordemId, key, sortDir === 'asc' ? 'desc' : 'asc');
        return;
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
      if (onRequestServerSort && ordemId && key) {
        onRequestServerSort(ordemId, key, 'asc');
        return;
      }
    }

    // fallback to client-side sorting if server sort not provided
    if (!onRequestServerSort) {
      // trigger memo recompute by changing state
      setSortKey(prev => (prev === key ? prev : key));
    }
  };

  const renderSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return <span className="uso-instalador__sort-indicator">⇅</span>;
    return <span className="uso-instalador__sort-indicator">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div
      className={`uso-instalador__os-produtos-table-wrapper ${
        compact ? 'uso-instalador__os-produtos-table-wrapper--compact' : ''
      }`}
      role="region"
      aria-label="Produtos da OS"
    >
      {/* Loading indicator if parent sets produtos to loading by clearing array or by external flag */}
      <table className="uso-instalador__os-produtos-table" role="table">
        <thead>
          <tr>
            <th style={{ width: columnWidths.quantidade }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                  appearance="subtle"
                  size="small"
                  className={`uso-instalador__sortable-header ${sortKey === 'quantidade' ? 'sorted' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleSort('quantidade'); }}
                  aria-label="Ordenar por quantidade"
                >
                  Quantidade {renderSortIndicator('quantidade')}
                </Button>
                {!compact && (
                  <div
                    className="uso-instalador__column-resizer"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onMouseDownResize('quantidade', e as any);
                    }}
                  />
                )}
              </div>
            </th>
            <th style={{ width: columnWidths.referenciaProduto }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                  appearance="subtle"
                  size="small"
                  className={`uso-instalador__sortable-header ${sortKey === 'referenciaProduto' ? 'sorted' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleSort('referenciaProduto'); }}
                  aria-label="Ordenar por referência"
                >
                  Referência {renderSortIndicator('referenciaProduto')}
                </Button>
                {!compact && (
                  <div
                    className="uso-instalador__column-resizer"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onMouseDownResize('referenciaProduto', e as any);
                    }}
                  />
                )}
              </div>
            </th>
            <th style={{ width: columnWidths.descricao }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                  appearance="subtle"
                  size="small"
                  className={`uso-instalador__sortable-header ${sortKey === 'descricao' ? 'sorted' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleSort('descricao'); }}
                  aria-label="Ordenar por descrição"
                >
                  Descrição {renderSortIndicator('descricao')}
                </Button>
                {!compact && (
                  <div
                    className="uso-instalador__column-resizer"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onMouseDownResize('descricao', e as any);
                    }}
                  />
                )}
              </div>
            </th>
            <th style={{ width: columnWidths.situacaoReserva }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                  appearance="subtle"
                  size="small"
                  className={`uso-instalador__sortable-header ${sortKey === 'situacaoReserva' ? 'sorted' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleSort('situacaoReserva'); }}
                  aria-label="Ordenar por situação"
                >
                  Situação {renderSortIndicator('situacaoReserva')}
                </Button>
                {!compact && (
                  <div
                    className="uso-instalador__column-resizer"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onMouseDownResize('situacaoReserva', e as any);
                    }}
                  />
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4}>
                <div className="uso-instalador__produtos-loading">
                  <Spinner size="tiny" />
                  <Text size={200}>Carregando produtos...</Text>
                </div>
              </td>
            </tr>
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <div className="uso-instalador__os-no-produtos">Sem produtos</div>
              </td>
            </tr>
          ) : (
            sorted.map(p => (
              <tr key={p.id} className="uso-instalador__os-produto-row">
                <td className="uso-instalador__os-produto-quantidade" style={{ width: columnWidths.quantidade }}>{p.quantidade}</td>
                <td className="uso-instalador__os-produto-referencia" style={{ width: columnWidths.referenciaProduto }}>{p.referenciaProduto || '—'}</td>
                <td className="uso-instalador__os-produto-descricao" style={{ width: columnWidths.descricao }}>{p.descricao || '—'}</td>
                <td className="uso-instalador__os-produto-situacao" style={{ width: columnWidths.situacaoReserva }}>
                  <Badge
                    appearance="tint"
                    className={`uso-instalador__status-badge ${p.statecode === 0 ? 'uso-instalador__status-badge--active' : 'uso-instalador__status-badge--inactive'}`}
                  >
                    {p.situacaoReserva || p.situacao || (p.statecode === 0 ? 'Ativo' : 'Inativo')}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProdutosDataGrid;
