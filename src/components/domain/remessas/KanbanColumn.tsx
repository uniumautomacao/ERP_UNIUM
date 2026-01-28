import { ReactNode, useMemo } from 'react';
import { Badge, Text, tokens } from '@fluentui/react-components';
import { useDroppable } from '@dnd-kit/core';
import {
  Board24Regular,
  CalendarClock24Regular,
  Checkmark24Regular,
  DocumentBulletList24Regular,
  Edit24Regular,
} from '@fluentui/react-icons';
import {
  REMESSA_STAGE_CONFIRMADO,
  REMESSA_STAGE_EM_ESPERA,
  REMESSA_STAGE_ENTREGUE,
  REMESSA_STAGE_ENVIO,
  REMESSA_STAGE_FATURAMENTO,
  REMESSA_STAGE_PRODUCAO,
} from '../../../features/remessas/constants';

interface KanbanColumnProps {
  stageValue: number;
  title: string;
  count: number;
  lateCount?: number;
  children: ReactNode;
}

export function KanbanColumn({ stageValue, title, count, lateCount = 0, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${stageValue}`,
  });

  const stageConfig = useMemo(() => {
    const base = { icon: null as ReactNode, accent: tokens.colorNeutralStroke2 };
    switch (stageValue) {
      case REMESSA_STAGE_CONFIRMADO:
        return { icon: <DocumentBulletList24Regular />, accent: tokens.colorPaletteBlueBackground2 };
      case REMESSA_STAGE_PRODUCAO:
        return { icon: <Board24Regular />, accent: tokens.colorPaletteYellowBackground2 };
      case REMESSA_STAGE_EM_ESPERA:
        return { icon: <CalendarClock24Regular />, accent: tokens.colorPaletteRedBackground2 };
      case REMESSA_STAGE_FATURAMENTO:
        return { icon: <Edit24Regular />, accent: tokens.colorPaletteBlueBackground2 };
      case REMESSA_STAGE_ENVIO:
        return { icon: <Board24Regular />, accent: tokens.colorPaletteBlueBackground2 };
      case REMESSA_STAGE_ENTREGUE:
        return { icon: <Checkmark24Regular />, accent: tokens.colorPaletteGreenBackground2 };
      default:
        return base;
    }
  }, [stageValue]);

  return (
    <div
      ref={setNodeRef}
      style={{
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: 6,
        backgroundColor: isOver ? tokens.colorNeutralBackground1Hover : tokens.colorNeutralBackground1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div style={{ height: 4, backgroundColor: stageConfig.accent, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
      <div
        style={{
          padding: '12px',
          borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
          backgroundColor: tokens.colorNeutralBackground3,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div style={{ color: tokens.colorNeutralForeground3 }}>{stageConfig.icon}</div>
            <Text size={300} weight="semibold" block>
              {title}
            </Text>
          </div>
          <Badge appearance="filled" color={lateCount > 0 ? 'danger' : 'informative'}>
            {count === 1 ? '1' : count}
          </Badge>
        </div>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>
          {count === 1 ? '1 remessa' : `${count} remessas`}
          {lateCount > 0 ? ` • ${lateCount} atrasada${lateCount === 1 ? '' : 's'}` : ''}
        </Text>
      </div>
      <div
        style={{
          padding: '12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {children}
      </div>
    </div>
  );
}
