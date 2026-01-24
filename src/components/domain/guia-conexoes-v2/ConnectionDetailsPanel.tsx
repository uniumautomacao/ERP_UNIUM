import { useEffect, useState } from 'react';
import { Button, Text, makeStyles, tokens } from '@fluentui/react-components';
import { ChevronDown24Regular, ChevronUp24Regular, Delete24Regular } from '@fluentui/react-icons';

export type ConnectionDetails = {
  id: string;
  sourceLabel: string;
  targetLabel: string;
  typeLabel?: string;
};

interface ConnectionDetailsPanelProps {
  details: ConnectionDetails | null;
  onRemove: () => void;
  removing: boolean;
}

const useStyles = makeStyles({
  panel: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '12px 16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  content: {
    marginTop: '12px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
  empty: {
    padding: '8px 0',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
});

export function ConnectionDetailsPanel({ details, onRemove, removing }: ConnectionDetailsPanelProps) {
  const styles = useStyles();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (details) {
      setCollapsed(false);
    }
  }, [details?.id]);

  if (!details) {
    return (
      <div className={styles.panel}>
        <Text size={200} className={`${styles.muted} ${styles.empty}`}>
          Selecione uma conexão para ver os detalhes.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Text weight="semibold">Detalhes da conexão</Text>
        <Button
          appearance="subtle"
          icon={collapsed ? <ChevronUp24Regular /> : <ChevronDown24Regular />}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? 'Expandir' : 'Recolher'}
        </Button>
      </div>
      {!collapsed && (
        <>
          <div className={styles.content}>
            <div>
              <Text size={200} className={styles.muted}>
                Origem
              </Text>
              <Text>{details.sourceLabel}</Text>
            </div>
            <div>
              <Text size={200} className={styles.muted}>
                Destino
              </Text>
              <Text>{details.targetLabel}</Text>
            </div>
            <div>
              <Text size={200} className={styles.muted}>
                Tipo
              </Text>
              <Text>{details.typeLabel || 'Não informado'}</Text>
            </div>
          </div>
          <div className={styles.actions}>
            <Button
              appearance="primary"
              icon={<Delete24Regular />}
              onClick={onRemove}
              disabled={removing}
            >
              Remover vínculo
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
