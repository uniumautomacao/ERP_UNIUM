import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Badge,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Text,
  tokens,
} from '@fluentui/react-components';
import { RemessaCardData, RemessaLookupOption, RemessaProdutoItem } from '../../../features/remessas/types';
import { REMESSA_STAGE_ENTREGUE, REMESSA_STAGES } from '../../../features/remessas/constants';
import { KanbanBoard } from './KanbanBoard';
import { KanbanColumnView } from './KanbanColumn';
import { RemessaCardView } from './RemessaCard';
import { ProdutosDaRemessaList } from './ProdutosDaRemessaList';

interface MoverProdutosDialogProps {
  open: boolean;
  loading?: boolean;
  produtos: RemessaProdutoItem[];
  produtosLoading?: boolean;
  options: RemessaLookupOption[];
  origemId?: string | null;
  origemFornecedor?: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { destinoId: string; items: RemessaProdutoItem[] }) => void;
}

export function MoverProdutosDialog({
  open,
  loading,
  produtos,
  produtosLoading,
  options,
  origemId,
  origemFornecedor,
  onOpenChange,
  onConfirm,
}: MoverProdutosDialogProps) {
  const [destinoId, setDestinoId] = useState('');
  const [selectedItems, setSelectedItems] = useState<RemessaProdutoItem[]>([]);

  useEffect(() => {
    if (!open) {
      setDestinoId('');
      setSelectedItems([]);
    }
  }, [open]);

  const stages = useMemo(
    () => REMESSA_STAGES.filter((stage) => stage.value !== REMESSA_STAGE_ENTREGUE),
    []
  );

  const destinoOptions = useMemo(
    () => options.filter((opt) => opt.id !== origemId && (!origemFornecedor || opt.fornecedor === origemFornecedor)),
    [options, origemFornecedor, origemId]
  );

  const groupedOptions = useMemo(() => {
    const map = new Map<number, RemessaLookupOption[]>();
    stages.forEach((stage) => map.set(stage.value, []));
    const semEstagio: RemessaLookupOption[] = [];
    destinoOptions.forEach((opt) => {
      if (opt.stageValue === null || opt.stageValue === undefined) {
        semEstagio.push(opt);
        return;
      }
      const list = map.get(opt.stageValue);
      if (list) list.push(opt);
      else semEstagio.push(opt);
    });
    return { map, semEstagio };
  }, [destinoOptions, stages]);

  const isAtrasada = (opt: RemessaLookupOption) => {
    if (!opt.previsaoChegada || opt.entregue) return false;
    const previsao = new Date(opt.previsaoChegada);
    if (Number.isNaN(previsao.getTime())) return false;
    const hoje = new Date();
    const startHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const startPrev = new Date(previsao.getFullYear(), previsao.getMonth(), previsao.getDate());
    return startPrev < startHoje;
  };

  const buildCardItem = (opt: RemessaLookupOption): RemessaCardData => ({
    id: opt.id,
    fornecedor: opt.fornecedor ?? null,
    transportadora: opt.transportadora ?? null,
    previsaoChegada: opt.previsaoChegada ?? null,
    codigoRastreio: opt.codigoRastreio ?? null,
    prioridade: opt.prioridade ?? null,
    entregue: opt.entregue,
    stageValue: opt.stageValue ?? undefined,
  });

  const handleDestinoClick = (id: string) => {
    setDestinoId((prev) => (prev === id ? '' : id));
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface style={{ width: '92vw', maxWidth: 1280 }}>
        <DialogBody>
          <DialogTitle>Mover itens da remessa</DialogTitle>
          <DialogContent className="flex flex-col gap-3" style={{ maxHeight: '78vh' }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
              Selecione os produtos e a remessa destino. Apenas remessas do mesmo fornecedor estão disponíveis.
            </Text>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.2fr)' }}>
              <div className="flex min-h-0 flex-col gap-2">
                <Text size={200} weight="semibold">
                  Produtos para mover ({selectedItems.length})
                </Text>
                <div style={{ minHeight: 0, maxHeight: 420, overflowY: 'auto' }}>
                  <ProdutosDaRemessaList
                    items={produtos}
                    loading={produtosLoading}
                    selectedItems={selectedItems}
                    onSelectionChange={setSelectedItems}
                  />
                </div>
              </div>
              <div className="flex min-h-0 flex-col gap-2">
                <Text size={200} weight="semibold">
                  Remessa destino
                </Text>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  <KanbanBoard>
                    {stages.map((stage) => {
                      const stageOptions = groupedOptions.map.get(stage.value) ?? [];
                      const lateCount = stageOptions.filter(isAtrasada).length;
                      return (
                        <KanbanColumnView
                          key={stage.value}
                          stageValue={stage.value}
                          title={stage.label}
                          count={stageOptions.length}
                          lateCount={lateCount}
                        >
                          {stageOptions.map((opt) => {
                            const isSelected = destinoId === opt.id;
                            return (
                              <div key={opt.id} className="flex flex-col gap-1">
                                {isSelected && (
                                  <Badge appearance="filled" color="brand">
                                    Destino
                                  </Badge>
                                )}
                                <RemessaCardView
                                  item={buildCardItem(opt)}
                                  title={opt.label}
                                  isSelected={isSelected}
                                  onSelect={handleDestinoClick}
                                  showOpenButton={false}
                                  showCopyButton={false}
                                />
                              </div>
                            );
                          })}
                        </KanbanColumnView>
                      );
                    })}
                    {groupedOptions.semEstagio.length > 0 && (
                      <KanbanColumnView
                        stageValue={0}
                        title="Sem estágio"
                        count={groupedOptions.semEstagio.length}
                      >
                        {groupedOptions.semEstagio.map((opt) => {
                          const isSelected = destinoId === opt.id;
                          return (
                            <div key={opt.id} className="flex flex-col gap-1">
                              {isSelected && (
                                <Badge appearance="filled" color="brand">
                                  Destino
                                </Badge>
                              )}
                              <RemessaCardView
                                item={buildCardItem(opt)}
                                title={opt.label}
                                isSelected={isSelected}
                                onSelect={handleDestinoClick}
                                showOpenButton={false}
                                showCopyButton={false}
                              />
                            </div>
                          );
                        })}
                      </KanbanColumnView>
                    )}
                  </KanbanBoard>
                </div>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              onClick={() => onConfirm({ destinoId, items: selectedItems })}
              disabled={!destinoId || selectedItems.length === 0 || loading}
            >
              Mover itens
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
