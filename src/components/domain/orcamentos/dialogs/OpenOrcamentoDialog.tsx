/**
 * Dialog para selecionar e abrir um orçamento existente
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  makeStyles,
  tokens,
  Spinner,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  TableCellLayout,
} from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import { OrcamentoService } from '../../../../services/orcamentos/OrcamentoService';
import type { IGetAllOptions } from '../../../../generated/models/CommonModels';
import type { Orcamento } from '../../../../features/orcamentos/types';
import { formatarMoeda, formatarData } from '../../../../features/orcamentos/utils';

const useStyles = makeStyles({
  surface: {
    maxWidth: '800px',
    width: '90vw',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  searchContainer: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  searchInput: {
    flex: 1,
  },
  gridContainer: {
    height: '400px',
    overflow: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  emptyState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    color: tokens.colorNeutralForeground3,
  },
  selectedRow: {
    backgroundColor: tokens.colorBrandBackground2,
  },
});

interface OpenOrcamentoDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectOrcamento: (orcamentoId: string) => void;
}

export function OpenOrcamentoDialog({
  open,
  onClose,
  onSelectOrcamento,
}: OpenOrcamentoDialogProps) {
  const styles = useStyles();
  const [searchText, setSearchText] = useState('');
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [filteredOrcamentos, setFilteredOrcamentos] = useState<Orcamento[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar orçamentos quando abrir
  useEffect(() => {
    if (open) {
      loadOrcamentos();
      setSearchText('');
      setSelectedId(null);
    }
  }, [open]);

  // Filtrar orçamentos quando o texto de busca mudar
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredOrcamentos(orcamentos);
    } else {
      const searchLower = searchText.toLowerCase();
      const filtered = orcamentos.filter(
        (orc) =>
          orc.new_name?.toLowerCase().includes(searchLower) ||
          orc.new_nomecliente?.toLowerCase().includes(searchLower)
      );
      setFilteredOrcamentos(filtered);
    }
  }, [searchText, orcamentos]);

  const loadOrcamentos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await OrcamentoService.fetchAll({
        filter: 'statecode eq 0',
        orderBy: ['createdon desc'],
        top: 100,
        select: [
          'new_orcamentoid',
          'new_name',
          'new_valortotal',
          'createdon',
          '_new_cliente_value', // Lookup ID do cliente
        ],
      });

      // Mapear o nome do cliente usando o lookup formatado
      const mappedData = data.map(orc => {
        const clienteFormatado = (orc as any)['_new_cliente_value@OData.Community.Display.V1.FormattedValue'];
        
        return {
          ...orc,
          new_nomecliente: clienteFormatado || 'Cliente não identificado',
        };
      });

      setOrcamentos(mappedData);
      setFilteredOrcamentos(mappedData);
    } catch (err) {
      console.error('[OpenOrcamentoDialog] erro ao carregar orçamentos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar orçamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = useCallback((orcamentoId: string) => {
    setSelectedId(orcamentoId);
  }, []);

  const handleConfirm = () => {
    if (selectedId) {
      onSelectOrcamento(selectedId);
      onClose();
    }
  };

  const handleDoubleClick = (orcamentoId: string) => {
    onSelectOrcamento(orcamentoId);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedId) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const columns: TableColumnDefinition<Orcamento>[] = [
    createTableColumn<Orcamento>({
      columnId: 'name',
      compare: (a, b) => (a.new_name || '').localeCompare(b.new_name || ''),
      renderHeaderCell: () => 'Orçamento',
      renderCell: (item) => (
        <TableCellLayout>
          <span style={{ fontWeight: 600 }}>{item.new_name || '-'}</span>
        </TableCellLayout>
      ),
    }),
    createTableColumn<Orcamento>({
      columnId: 'cliente',
      compare: (a, b) => (a.new_nomecliente || '').localeCompare(b.new_nomecliente || ''),
      renderHeaderCell: () => 'Cliente',
      renderCell: (item) => (
        <TableCellLayout>{item.new_nomecliente || '-'}</TableCellLayout>
      ),
    }),
    createTableColumn<Orcamento>({
      columnId: 'valor',
      compare: (a, b) => (a.new_valortotal || 0) - (b.new_valortotal || 0),
      renderHeaderCell: () => 'Valor Total',
      renderCell: (item) => (
        <TableCellLayout>
          <span style={{ fontWeight: 600 }}>
            {formatarMoeda(item.new_valortotal)}
          </span>
        </TableCellLayout>
      ),
    }),
    createTableColumn<Orcamento>({
      columnId: 'data',
      compare: (a, b) => (a.createdon || '').localeCompare(b.createdon || ''),
      renderHeaderCell: () => 'Data',
      renderCell: (item) => (
        <TableCellLayout>{formatarData(item.createdon)}</TableCellLayout>
      ),
    }),
  ];

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Abrir Orçamento</DialogTitle>
          <DialogContent className={styles.content} onKeyDown={handleKeyDown}>
            <div className={styles.searchContainer}>
              <Input
                className={styles.searchInput}
                value={searchText}
                onChange={(_, data) => setSearchText(data.value)}
                placeholder="Buscar por nome ou cliente..."
                contentBefore={<Search24Regular />}
                autoFocus
              />
              <Button onClick={loadOrcamentos} disabled={isLoading}>
                Atualizar
              </Button>
            </div>

            <div className={styles.gridContainer}>
              {isLoading ? (
                <div className={styles.emptyState}>
                  <Spinner label="Carregando orçamentos..." />
                </div>
              ) : error ? (
                <div className={styles.emptyState}>
                  <span style={{ color: tokens.colorPaletteRedForeground1 }}>{error}</span>
                </div>
              ) : filteredOrcamentos.length === 0 ? (
                <div className={styles.emptyState}>
                  <div>
                    <div style={{ marginBottom: tokens.spacingVerticalS }}>
                      <span>Nenhum orçamento encontrado</span>
                    </div>
                    {searchText && (
                      <div style={{ fontSize: '12px' }}>
                        Tente ajustar os termos de busca
                      </div>
                    )}
                    {!searchText && orcamentos.length === 0 && (
                      <div style={{ fontSize: '12px' }}>
                        Não há orçamentos cadastrados no sistema
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <DataGrid
                  items={filteredOrcamentos}
                  columns={columns}
                  getRowId={(item) => item.new_orcamentoid}
                  selectionMode="single"
                  selectedItems={selectedId ? new Set([selectedId]) : new Set()}
                  onSelectionChange={(_, data) => {
                    const selected = Array.from(data.selectedItems)[0] as string;
                    handleSelect(selected);
                  }}
                  style={{ minWidth: '100%' }}
                >
                  <DataGridHeader>
                    <DataGridRow>
                      {({ renderHeaderCell }) => (
                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                      )}
                    </DataGridRow>
                  </DataGridHeader>
                  <DataGridBody<Orcamento>>
                    {({ item, rowId }) => (
                      <DataGridRow<Orcamento>
                        key={rowId}
                        onDoubleClick={() => handleDoubleClick(item.new_orcamentoid)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor:
                            selectedId === item.new_orcamentoid
                              ? tokens.colorBrandBackground2
                              : undefined,
                        }}
                      >
                        {({ renderCell }) => (
                          <DataGridCell>{renderCell(item)}</DataGridCell>
                        )}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                </DataGrid>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              onClick={handleConfirm}
              disabled={!selectedId}
            >
              Abrir
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
