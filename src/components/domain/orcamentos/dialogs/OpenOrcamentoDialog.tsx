/**
 * Dialog para selecionar e abrir um orçamento existente
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Dropdown,
  Option,
} from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import { OrcamentoService } from '../../../../services/orcamentos/OrcamentoService';
import type { IGetAllOptions } from '../../../../generated/models/CommonModels';
import type { Orcamento } from '../../../../features/orcamentos/types';
import { formatarMoeda, formatarData } from '../../../../features/orcamentos/utils';
import { escapeODataValue } from '../../../../utils/guia-conexoes/odata';

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
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
  },
  consultorFilter: {
    minWidth: '200px',
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consultorFilter, setConsultorFilter] = useState<string>('todos');

  const loadOrcamentos = useCallback(async (searchTerm?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Construir filtro base
      let filter = 'statecode eq 0';

      // Adicionar busca delegável com contains() se houver termo
      if (searchTerm?.trim()) {
        const escaped = escapeODataValue(searchTerm.trim());
        const searchFilters = [
          `(contains(new_name, '${escaped}') or contains(new_nomedocliente, '${escaped}'))`,
          // Não podemos buscar diretamente em lookups formatados, apenas no nome do orçamento
        ];
        filter += ` and (${searchFilters.join(' or ')})`;
      }

      const data = await OrcamentoService.fetchAll({
        filter,
        orderBy: ['createdon desc'],
        top: 100,
        select: [
          'new_orcamentoid',
          'new_name',
          'new_valortotal',
          'createdon',
          '_new_cliente_value', // Lookup ID do cliente
          '_new_consultor_value', // Lookup ID do consultor
          '_new_projeto_value', // Lookup ID do projeto
        ],
      } as IGetAllOptions);

      // Mapear o nome do cliente, consultor e projeto usando os lookups formatados
      const mappedData = data.map(orc => {
        const clienteFormatado = (orc as any)['_new_cliente_value@OData.Community.Display.V1.FormattedValue'];
        const consultorFormatado = (orc as any)['_new_consultor_value@OData.Community.Display.V1.FormattedValue'];
        const projetoFormatado = (orc as any)['_new_projeto_value@OData.Community.Display.V1.FormattedValue'];

        return {
          ...orc,
          new_nomecliente: clienteFormatado || 'Cliente não identificado',
          new_nomeconsultor: consultorFormatado || '-',
          new_nomeprojeto: projetoFormatado || '-',
        };
      });

      setOrcamentos(mappedData);
    } catch (err) {
      console.error('[OpenOrcamentoDialog] erro ao carregar orçamentos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar orçamentos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar orçamentos quando abrir
  useEffect(() => {
    if (open) {
      loadOrcamentos();
      setSearchText('');
      setSelectedId(null);
      setConsultorFilter('todos');
    }
  }, [open, loadOrcamentos]);

  // Busca delegável ao Dataverse com debounce
  useEffect(() => {
    if (!open) return;

    const timeoutId = setTimeout(() => {
      loadOrcamentos(searchText);
    }, 400); // Debounce de 400ms

    return () => clearTimeout(timeoutId);
  }, [searchText, open, loadOrcamentos]);

  const handleSelect = useCallback((orcamentoId: string) => {
    setSelectedId(orcamentoId);
  }, []);

  const handleRefresh = useCallback(() => {
    loadOrcamentos(searchText);
  }, [loadOrcamentos, searchText]);

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

  // Obter lista de consultores únicos
  const consultores = useMemo(() => {
    const consultoresMap = new Map<string, string>();
    orcamentos.forEach(orc => {
      const consultorId = (orc as any)._new_consultor_value;
      const consultorNome = orc.new_nomeconsultor || '-';
      if (consultorId && !consultoresMap.has(consultorId)) {
        consultoresMap.set(consultorId, consultorNome);
      }
    });
    return Array.from(consultoresMap.entries()).map(([id, nome]) => ({ id, nome }));
  }, [orcamentos]);

  // Filtrar orçamentos por consultor selecionado
  const orcamentosFiltrados = useMemo(() => {
    if (consultorFilter === 'todos') {
      return orcamentos;
    }
    return orcamentos.filter(orc => {
      const consultorId = (orc as any)._new_consultor_value;
      return consultorId === consultorFilter;
    });
  }, [orcamentos, consultorFilter]);

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
      columnId: 'consultor',
      compare: (a, b) => (a.new_nomeconsultor || '').localeCompare(b.new_nomeconsultor || ''),
      renderHeaderCell: () => 'Consultor',
      renderCell: (item) => (
        <TableCellLayout>{item.new_nomeconsultor || '-'}</TableCellLayout>
      ),
    }),
    createTableColumn<Orcamento>({
      columnId: 'projeto',
      compare: (a, b) => (a.new_nomeprojeto || '').localeCompare(b.new_nomeprojeto || ''),
      renderHeaderCell: () => 'Projeto',
      renderCell: (item) => (
        <TableCellLayout>{item.new_nomeprojeto || '-'}</TableCellLayout>
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
                placeholder="Buscar por nome, cliente ou consultor..."
                contentBefore={<Search24Regular />}
                autoFocus
              />
              <Dropdown
                className={styles.consultorFilter}
                placeholder="Filtrar por consultor"
                value={consultorFilter === 'todos' ? 'Todos' : consultores.find(c => c.id === consultorFilter)?.nome || 'Todos'}
                selectedOptions={[consultorFilter]}
                onOptionSelect={(_, data) => setConsultorFilter(data.optionValue || 'todos')}
              >
                <Option key="todos" value="todos">
                  Todos
                </Option>
                {consultores.map(consultor => (
                  <Option key={consultor.id} value={consultor.id}>
                    {consultor.nome}
                  </Option>
                ))}
              </Dropdown>
              <Button onClick={handleRefresh} disabled={isLoading}>
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
              ) : orcamentosFiltrados.length === 0 ? (
                <div className={styles.emptyState}>
                  <div>
                    <div style={{ marginBottom: tokens.spacingVerticalS }}>
                      <span>Nenhum orçamento encontrado</span>
                    </div>
                    {(searchText || consultorFilter !== 'todos') && (
                      <div style={{ fontSize: '12px' }}>
                        Tente ajustar os filtros de busca
                      </div>
                    )}
                    {!searchText && consultorFilter === 'todos' && (
                      <div style={{ fontSize: '12px' }}>
                        Não há orçamentos cadastrados no sistema
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <DataGrid
                  items={orcamentosFiltrados}
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
