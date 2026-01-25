import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import {
  Badge,
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { shorthands } from '@fluentui/react-components';
import {
  Box24Regular,
  Delete24Regular,
  Edit24Regular,
  Eye24Regular,
  EyeOff24Regular,
  Link24Regular,
  Print24Regular,
} from '@fluentui/react-icons';

export type DevicePortState = 'free' | 'connected' | 'manual' | 'incompatible';

export type DevicePortData = {
  id: string;
  label: string;
  typeLabel: string;
  directionLabel: string;
  direction?: number | null;
  directionCode?: 'IN' | 'OUT' | 'BI';
  side?: 'left' | 'right';
  state: DevicePortState;
  isConnectable: boolean;
  highlight?: boolean;
  allowInput: boolean;
  allowOutput: boolean;
};

export type DeviceNodeData = {
  title: string;
  locationLabel?: string;
  ports: DevicePortData[];
  showAllPorts?: boolean;
  onToggleShowAll?: () => void;
  onDelete?: () => void;
  onEditLocation?: (deviceId: string) => void;
  onPrintConnections?: (deviceId: string) => void;
  onPrintDevice?: (deviceId: string) => void;
};

const useStyles = makeStyles({
  node: {
    borderRadius: '10px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    minWidth: '200px',
  },
  header: {
    padding: '8px 10px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    alignItems: 'center',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  locationBadge: {
    alignSelf: 'flex-start',
  },
  portList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '8px 10px 10px 10px',
  },
  portCard: {
    position: 'relative',
    borderRadius: '6px',
    padding: '6px 8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    minHeight: '30px',
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: '6px',
  },
  portFree: {
    ...shorthands.borderColor(tokens.colorPaletteGreenBorder2),
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
  portLeft: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '6px',
    minWidth: 0,
  },
  portRight: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '6px',
    minWidth: 0,
  },
  portCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  handle: {
    width: '12px',
    height: '12px',
    borderRadius: '999px',
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  handleHighlight: {
    animationDuration: '900ms',
    animationIterationCount: 'infinite',
    animationName: {
      from: {
        boxShadow: `0 0 0 0 ${tokens.colorBrandBackground}`,
        borderColor: tokens.colorBrandBackground,
      },
      '50%': {
        boxShadow: `0 0 0 6px ${tokens.colorBrandBackground}`,
        borderColor: tokens.colorBrandBackground,
      },
      to: {
        boxShadow: `0 0 0 0 ${tokens.colorBrandBackground}`,
        borderColor: tokens.colorBrandBackground,
      },
    },
  },
  portLabel: {
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

const getPortStateClass = (state: DevicePortState, styles: ReturnType<typeof useStyles>) => {
  if (state === 'connected') return styles.portConnected;
  if (state === 'manual') return styles.portManual;
  if (state === 'incompatible') return styles.portIncompatible;
  return styles.portFree;
};

const buildHandleId = (portId: string, suffix: 'in' | 'out') => `${portId}:${suffix}`;

export function DeviceNode({ data, id }: NodeProps<DeviceNodeData>) {
  const styles = useStyles();

  return (
    <div className={styles.node}>
      <div className={`${styles.header} device-node__header`}>
        <div className={styles.headerTitle}>
          <Text weight="semibold" size={300}>
            {data.title || 'Equipamento'}
          </Text>
        </div>
        <div className={styles.headerActions}>
          <Badge appearance="outline" size="small" className={styles.locationBadge}>
            {data.locationLabel || 'Sem localização'}
          </Badge>
          <Button
            appearance="subtle"
            size="small"
            icon={<Edit24Regular />}
            onClick={() => data.onEditLocation?.(id)}
          />
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                size="small"
                icon={<Print24Regular />}
                title="Imprimir etiquetas"
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<Link24Regular />} onClick={() => data.onPrintConnections?.(id)}>
                  Etiquetas de conexões
                </MenuItem>
                <MenuItem icon={<Box24Regular />} onClick={() => data.onPrintDevice?.(id)}>
                  Etiqueta do dispositivo
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
          <Button
            appearance="subtle"
            size="small"
            icon={data.showAllPorts ? <Eye24Regular /> : <EyeOff24Regular />}
            onClick={data.onToggleShowAll}
          />
          <Button
            appearance="subtle"
            size="small"
            icon={<Delete24Regular />}
            onClick={data.onDelete}
          />
        </div>
      </div>
      <div className={styles.portList}>
        {data.ports.map((port) => (
          <div
            key={port.id}
            className={`${styles.portCard} ${getPortStateClass(port.state, styles)}`}
          >
            <div className={styles.portLeft}>
              {(port.side === 'left' || port.directionCode === 'BI') && (
                <Handle
                  type={port.allowInput ? 'target' : 'source'}
                  id={buildHandleId(port.id, port.allowInput ? 'in' : 'out')}
                  position={Position.Left}
                  className={`${styles.handle} ${port.highlight ? styles.handleHighlight : ''}`}
                  isConnectable={port.isConnectable}
                  style={{ top: '50%' }}
                />
              )}
              {port.side === 'left' && (
                <Text className={styles.portLabel}>
                  {port.directionCode === 'BI' ? port.label : `${port.label} ${port.directionCode ?? 'IN'}`}
                </Text>
              )}
            </div>
            <div className={styles.portCenter}>
              {(port.directionCode === 'BI' || (!port.allowInput && !port.allowOutput)) && (
                <Text className={styles.portMeta}>BI</Text>
              )}
              {(port.directionCode === 'BI' || (!port.allowInput && !port.allowOutput)) && (
                <Text className={styles.portMeta}>{port.typeLabel}</Text>
              )}
            </div>
            <div className={styles.portRight}>
              {port.side === 'right' && (
                <Text className={styles.portLabel}>
                  {port.directionCode === 'BI' ? port.label : `${port.label} ${port.directionCode ?? 'OUT'}`}
                </Text>
              )}
              {(port.side === 'right' || port.directionCode === 'BI') && (
                <Handle
                  type={port.allowOutput ? 'source' : 'target'}
                  id={buildHandleId(port.id, port.allowOutput ? 'out' : 'in')}
                  position={Position.Right}
                  className={`${styles.handle} ${port.highlight ? styles.handleHighlight : ''}`}
                  isConnectable={port.isConnectable}
                  style={{ top: '50%' }}
                />
              )}
            </div>
          </div>
        ))}
        {data.ports.length === 0 && (
          <Text size={200} className={styles.portMeta}>
            Nenhuma conexão disponível.
          </Text>
        )}
      </div>
    </div>
  );
}
