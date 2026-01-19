import { ReactNode } from 'react';
import { Text, tokens } from '@fluentui/react-components';
import { useDroppable } from '@dnd-kit/core';

interface KanbanColumnProps {
  stageValue: number;
  title: string;
  ownerLabel: string;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({ stageValue, title, ownerLabel, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${stageValue}`,
  });

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
      <div
        style={{
          padding: '12px',
          borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
          backgroundColor: tokens.colorNeutralBackground3,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
        }}
      >
        <Text size={300} weight="semibold" block>
          {title}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>
          {ownerLabel}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>
          {count === 1 ? '1 item' : `${count} itens`}
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
