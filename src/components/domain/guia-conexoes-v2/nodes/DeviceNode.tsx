import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Badge, Text, makeStyles, tokens } from '@fluentui/react-components';

export type DevicePortState = 'free' | 'connected' | 'manual' | 'incompatible';

export type DevicePortData = {
  id: string;
  label: string;
  typeLabel: string;
  directionLabel: string;
  direction?: number | null;
  state: DevicePortState;
  isConnectable: boolean;
  allowInput: boolean;
  allowOutput: boolean;
};

export type DeviceNodeData = {
  title: string;
  modelLabel?: string;
  locationLabel?: string;
  ports: DevicePortData[];
};

const useStyles = makeStyles({
  node: {
    borderRadius: '10px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    minWidth: '260px',
  },
  header: {
    padding: '12px 12px 8px 12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    cursor: 'grab',
  },
  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  locationBadge: {
    alignSelf: 'flex-start',
  },
  portsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
    padding: '10px 12px 12px 12px',
  },
  portCard: {
    position: 'relative',
    borderRadius: '8px',
    padding: '8px 10px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    minHeight: '44px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  portFree: {
    borderColor: tokens.colorPaletteGreenBorder2,
    backgroundColor: tokens.colorPaletteGreenBackground1,
  },
  portConnected: {
    borderColor: tokens.colorNeutralStroke2,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  portManual: {
    borderColor: tokens.colorPaletteYellowBorder2,
    backgroundColor: tokens.colorPaletteYellowBackground1,
  },
  portIncompatible: {
    borderColor: tokens.colorPaletteRedBorder2,
    backgroundColor: tokens.colorPaletteRedBackground1,
    opacity: 0.7,
  },
  portMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  handle: {
    width: '10px',
    height: '10px',
    borderRadius: '999px',
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
});

const getPortStateClass = (state: DevicePortState, styles: ReturnType<typeof useStyles>) => {
  if (state === 'connected') return styles.portConnected;
  if (state === 'manual') return styles.portManual;
  if (state === 'incompatible') return styles.portIncompatible;
  return styles.portFree;
};

const buildHandleId = (portId: string, suffix: 'in' | 'out') => `${portId}:${suffix}`;

export function DeviceNode({ data }: NodeProps<DeviceNodeData>) {
  const styles = useStyles();

  return (
    <div className={styles.node}>
      <div className={`${styles.header} device-node__header`}>
        <div className={styles.headerTitle}>
          <Text weight="semibold" size={300}>
            {data.title || 'Equipamento'}
          </Text>
          {data.modelLabel && (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              {data.modelLabel}
            </Text>
          )}
        </div>
        <Badge appearance="outline" size="small" className={styles.locationBadge}>
          {data.locationLabel || 'Sem localização'}
        </Badge>
      </div>
      <div className={styles.portsGrid}>
        {data.ports.map((port) => (
          <div
            key={port.id}
            className={`${styles.portCard} ${getPortStateClass(port.state, styles)}`}
          >
            {port.allowInput && (
              <Handle
                type="target"
                id={buildHandleId(port.id, 'in')}
                position={Position.Left}
                className={styles.handle}
                isConnectable={port.isConnectable}
                style={{ top: '50%' }}
              />
            )}
            {port.allowOutput && (
              <Handle
                type="source"
                id={buildHandleId(port.id, 'out')}
                position={Position.Right}
                className={styles.handle}
                isConnectable={port.isConnectable}
                style={{ top: '50%' }}
              />
            )}
            <Text size={200} weight="medium">
              {port.label}
            </Text>
            <span className={styles.portMeta}>
              {port.typeLabel} · {port.directionLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
