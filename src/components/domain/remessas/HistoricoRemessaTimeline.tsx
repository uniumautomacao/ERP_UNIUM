import { Text, tokens } from '@fluentui/react-components';
import { RemessaHistoricoItem } from '../../../features/remessas/types';
import { EmptyState } from '../../shared/EmptyState';

interface HistoricoRemessaTimelineProps {
  items: RemessaHistoricoItem[];
  loading?: boolean;
}

export function HistoricoRemessaTimeline({ items, loading }: HistoricoRemessaTimelineProps) {
  if (loading) {
    return (
      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
        Carregando histórico...
      </Text>
    );
  }

  if (items.length === 0) {
    return <EmptyState title="Sem histórico" description="Nenhuma movimentação registrada." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            padding: '10px 12px',
            borderRadius: 6,
            border: `1px solid ${tokens.colorNeutralStroke2}`,
            backgroundColor: tokens.colorNeutralBackground1,
          }}
        >
          <Text size={200} weight="semibold" block>
            {item.campo || 'Atualização'}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }} block>
            {item.anterior ? `De: ${item.anterior}` : 'De: -'}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }} block>
            {item.novo ? `Para: ${item.novo}` : 'Para: -'}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>
            {item.data ? new Date(item.data).toLocaleString() : '-'}
          </Text>
        </div>
      ))}
    </div>
  );
}
