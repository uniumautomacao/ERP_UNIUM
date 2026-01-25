import { useState } from 'react';
import { Button, Text, tokens } from '@fluentui/react-components';
import { ChevronDown24Regular, ChevronUp24Regular } from '@fluentui/react-icons';
import type { CronogramaOS, StatusProgramacao } from '../../../features/cronograma-instalacoes/types';
import { STATUS_GROUPS, STATUS_COLORS } from '../../../features/cronograma-instalacoes/constants';
import { OSCard } from './OSCard';

interface PendentesTabProps {
  grupos: Record<StatusProgramacao, CronogramaOS[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PendentesTab({ grupos, selectedId, onSelect }: PendentesTabProps) {
  const [collapsed, setCollapsed] = useState<Record<StatusProgramacao, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
  });

  return (
    <div className="flex flex-col gap-4">
      {STATUS_GROUPS.map((group) => {
        const items = grupos[group.status] ?? [];
        const isCollapsed = collapsed[group.status];
        const colors = STATUS_COLORS[group.status];

        return (
          <div key={group.status}>
            <div
              className="flex items-center justify-between"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: colors.background,
                color: colors.text,
              }}
            >
              <div className="flex items-center gap-2">
                <Text size={200} weight="semibold">
                  {group.title}
                </Text>
                <span
                  style={{
                    backgroundColor: tokens.colorNeutralBackground1,
                    color: colors.text,
                    borderRadius: '999px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {items.length}
                </span>
              </div>
              <Button
                appearance="subtle"
                size="small"
                icon={isCollapsed ? <ChevronDown24Regular /> : <ChevronUp24Regular />}
                onClick={() =>
                  setCollapsed((prev) => ({
                    ...prev,
                    [group.status]: !prev[group.status],
                  }))
                }
              />
            </div>

            {!isCollapsed && (
              <div className="mt-2 flex flex-col gap-2">
                {items.length === 0 ? (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Nenhum item neste grupo.
                  </Text>
                ) : (
                  items.map((os) => (
                    <OSCard
                      key={os.id}
                      os={os}
                      onClick={() => onSelect(os.id)}
                      isSelected={selectedId === os.id}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

