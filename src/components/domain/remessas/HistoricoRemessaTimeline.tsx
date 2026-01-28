import { Text, tokens } from '@fluentui/react-components';
import {
  ArrowSync24Regular,
  Box24Regular,
  Copy24Regular,
  DocumentBulletList24Regular,
  Edit24Regular,
} from '@fluentui/react-icons';
import { RemessaHistoricoItem } from '../../../features/remessas/types';
import {
  REMESSA_HISTORICO_DIVISAO,
  REMESSA_HISTORICO_EDICAO,
  REMESSA_HISTORICO_JUNCAO,
  REMESSA_HISTORICO_MOVIMENTACAO,
  REMESSA_HISTORICO_MOVER_ITENS,
} from '../../../features/remessas/constants';
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

  const getIconConfig = (tipo?: number | null) => {
    switch (tipo) {
      case REMESSA_HISTORICO_DIVISAO:
        return { icon: <Copy24Regular />, color: tokens.colorPaletteBlueForeground2 };
      case REMESSA_HISTORICO_JUNCAO:
        return { icon: <DocumentBulletList24Regular />, color: tokens.colorPalettePurpleForeground2 };
      case REMESSA_HISTORICO_EDICAO:
        return { icon: <Edit24Regular />, color: tokens.colorPaletteYellowForeground2 };
      case REMESSA_HISTORICO_MOVIMENTACAO:
        return { icon: <ArrowSync24Regular />, color: tokens.colorPaletteTealForeground2 };
      case REMESSA_HISTORICO_MOVER_ITENS:
        return { icon: <Box24Regular />, color: tokens.colorPaletteGreenForeground2 };
      default:
        return { icon: <Edit24Regular />, color: tokens.colorNeutralForeground3 };
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => {
        const iconConfig = getIconConfig(item.tipo);
        const isLast = index === items.length - 1;
        return (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: tokens.colorNeutralBackground3,
                  color: iconConfig.color,
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                }}
              >
                {iconConfig.icon}
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: tokens.colorNeutralStroke2,
                    marginTop: 4,
                  }}
                />
              )}
            </div>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 6,
                border: `1px solid ${tokens.colorNeutralStroke2}`,
                backgroundColor: tokens.colorNeutralBackground1,
                width: '100%',
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
          </div>
        );
      })}
    </div>
  );
}
