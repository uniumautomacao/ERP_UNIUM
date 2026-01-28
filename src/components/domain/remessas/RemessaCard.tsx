import { useMemo } from 'react';
import { Badge, Button, Card, Text, Tooltip, tokens } from '@fluentui/react-components';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy24Regular, Open24Regular, Warning24Regular } from '@fluentui/react-icons';
import { RemessaCardData } from '../../../features/remessas/types';
import {
  REMESSA_PRIORITY_ALTA,
  REMESSA_PRIORITY_BAIXA,
  REMESSA_PRIORITY_NORMAL,
  REMESSA_PRIORITIES,
} from '../../../features/remessas/constants';

interface RemessaCardProps {
  item: RemessaCardData;
  title: string;
  isSelected?: boolean;
  onOpen: (id: string) => void;
  onSelect: (id: string) => void;
}

export function RemessaCard({ item, title, isSelected, onOpen, onSelect }: RemessaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const cardStyle = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: 6,
    boxShadow: isDragging ? `0 8px 18px ${tokens.colorNeutralShadowAmbient}` : undefined,
    backgroundColor: isSelected ? tokens.colorNeutralBackground3 : tokens.colorNeutralBackground1,
  }), [transform, transition, isDragging, isSelected]);

  const prioridadeLabel = useMemo(() => {
    if (item.prioridade === null || item.prioridade === undefined) return null;
    return REMESSA_PRIORITIES.find((p) => p.value === item.prioridade)?.label ?? String(item.prioridade);
  }, [item.prioridade]);

  const prioridadeColor = useMemo(() => {
    if (item.prioridade === REMESSA_PRIORITY_ALTA) return 'danger';
    if (item.prioridade === REMESSA_PRIORITY_NORMAL) return 'brand';
    if (item.prioridade === REMESSA_PRIORITY_BAIXA) return 'informative';
    return 'warning';
  }, [item.prioridade]);

  const atrasoInfo = useMemo(() => {
    if (!item.previsaoChegada || item.entregue) return null;
    const previsao = new Date(item.previsaoChegada);
    if (Number.isNaN(previsao.getTime())) return null;
    const hoje = new Date();
    const startHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const startPrev = new Date(previsao.getFullYear(), previsao.getMonth(), previsao.getDate());
    const diffDays = Math.floor((startHoje.getTime() - startPrev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return null;
    return {
      dias: diffDays,
      label: `Atrasada ${diffDays} dia${diffDays === 1 ? '' : 's'}`,
    };
  }, [item.entregue, item.previsaoChegada]);

  const handleCopyRastreio = async () => {
    if (!item.codigoRastreio) return;
    try {
      await navigator.clipboard?.writeText(item.codigoRastreio);
    } catch {
      // Silencioso: copia nao disponivel
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={{
        ...cardStyle,
        padding: '12px',
        minHeight: 120,
        cursor: 'pointer',
      }}
      onClick={() => onSelect(item.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-2">
          <div
            className="flex flex-wrap items-center gap-2"
            {...attributes}
            {...listeners}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <Text
              size={300}
              weight="semibold"
              block
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </Text>
            {prioridadeLabel && (
              <Badge appearance="filled" color={prioridadeColor}>
                {prioridadeLabel}
              </Badge>
            )}
            {atrasoInfo && (
              <Tooltip content={atrasoInfo.label} relationship="description">
                <Badge appearance="filled" color="danger" icon={<Warning24Regular />}>
                  {atrasoInfo.dias}d
                </Badge>
              </Tooltip>
            )}
          </div>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            Fornecedor: {item.fornecedor || '-'}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            Transportadora: {item.transportadora || '-'}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            Previsão chegada: {item.previsaoChegada ? new Date(item.previsaoChegada).toLocaleDateString() : '-'}
          </Text>
        </div>
        <div className="flex flex-col items-end gap-1">
          {item.codigoRastreio && (
            <Tooltip content={`Copiar rastreio: ${item.codigoRastreio}`} relationship="description">
              <Button
                size="small"
                appearance="subtle"
                icon={<Copy24Regular />}
                aria-label="Copiar código de rastreio"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleCopyRastreio();
                }}
              />
            </Tooltip>
          )}
          <Button
            size="small"
            appearance="subtle"
            icon={<Open24Regular />}
            aria-label="Abrir remessa"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(item.id);
            }}
          />
        </div>
      </div>
    </Card>
  );
}
