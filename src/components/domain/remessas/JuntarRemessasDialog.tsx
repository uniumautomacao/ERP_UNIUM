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
import { RemessaCardData, RemessaLookupOption } from '../../../features/remessas/types';
import { REMESSA_STAGE_ENTREGUE, REMESSA_STAGES } from '../../../features/remessas/constants';
import { KanbanBoard } from './KanbanBoard';
import { KanbanColumnView } from './KanbanColumn';
import { RemessaCardView } from './RemessaCard';

interface JuntarRemessasDialogProps {
  open: boolean;
  loading?: boolean;
  options: RemessaLookupOption[];
  defaultPrincipalId?: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { principalId: string; mergeIds: string[] }) => void;
}

export function JuntarRemessasDialog({
  open,
  loading,
  options,
  defaultPrincipalId,
  onOpenChange,
  onConfirm,
}: JuntarRemessasDialogProps) {
  const [principalId, setPrincipalId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setPrincipalId('');
      setSelectedIds([]);
      return;
    }
    if (defaultPrincipalId && options.some((opt) => opt.id === defaultPrincipalId)) {
      setPrincipalId(defaultPrincipalId);
    }
  }, [defaultPrincipalId, open, options]);

  useEffect(() => {
    if (!principalId) return;
    setSelectedIds((prev) => prev.filter((id) => id !== principalId));
  }, [principalId]);

  const stages = useMemo(
    () => REMESSA_STAGES.filter((stage) => stage.value !== REMESSA_STAGE_ENTREGUE),
    []
  );

  const groupedOptions = useMemo(() => {
    const map = new Map<number, RemessaLookupOption[]>();
    stages.forEach((stage) => map.set(stage.value, []));
    const semEstagio: RemessaLookupOption[] = [];
    options.forEach((opt) => {
      if (opt.stageValue === null || opt.stageValue === undefined) {
        semEstagio.push(opt);
        return;
      }
      const list = map.get(opt.stageValue);
      if (list) list.push(opt);
      else semEstagio.push(opt);
    });
    return { map, semEstagio };
  }, [options, stages]);

  const handleCardClick = (id: string) => {
    if (!principalId) {
      setPrincipalId(id);
      return;
    }
    if (id === principalId) {
      setPrincipalId('');
      return;
    }
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

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

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface style={{ width: '92vw', maxWidth: 1280 }}>
        <DialogBody>
          <DialogTitle>Juntar remessas</DialogTitle>
          <DialogContent className="flex flex-col gap-3" style={{ maxHeight: '78vh' }}>
            <div className="flex flex-col gap-1">
              <Text size={200}>
                Clique em uma remessa para definir a principal. Depois, clique nas remessas que deseja juntar.
              </Text>
              {principalId && (
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                  Principal: {options.find((opt) => opt.id === principalId)?.label ?? principalId}
                </Text>
              )}
            </div>
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
                        const isPrincipal = opt.id === principalId;
                        const isSelected = selectedIds.includes(opt.id);
                        return (
                          <div key={opt.id} className="flex flex-col gap-1">
                            {isPrincipal && (
                              <Badge appearance="filled" color="brand">
                                Principal
                              </Badge>
                            )}
                            {isSelected && !isPrincipal && (
                              <Badge appearance="filled" color="informative">
                                Selecionada
                              </Badge>
                            )}
                            <RemessaCardView
                              item={buildCardItem(opt)}
                              title={opt.label}
                              isSelected={isSelected || isPrincipal}
                              onSelect={handleCardClick}
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
                      const isPrincipal = opt.id === principalId;
                      const isSelected = selectedIds.includes(opt.id);
                      return (
                        <div key={opt.id} className="flex flex-col gap-1">
                          {isPrincipal && (
                            <Badge appearance="filled" color="brand">
                              Principal
                            </Badge>
                          )}
                          {isSelected && !isPrincipal && (
                            <Badge appearance="filled" color="informative">
                              Selecionada
                            </Badge>
                          )}
                          <RemessaCardView
                            item={buildCardItem(opt)}
                            title={opt.label}
                            isSelected={isSelected || isPrincipal}
                            onSelect={handleCardClick}
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
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              onClick={() => onConfirm({ principalId, mergeIds: selectedIds })}
              disabled={!principalId || selectedIds.length === 0 || loading}
            >
              Juntar
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
