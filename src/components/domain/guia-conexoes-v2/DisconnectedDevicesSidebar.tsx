import { useMemo } from 'react';
import { Badge, Text, makeStyles, tokens } from '@fluentui/react-components';

export type SidebarPort = {
  id: string;
  label: string;
  directionCode: 'IN' | 'OUT' | 'BI';
  typeLabel: string;
};

export type SidebarDevice = {
  id: string;
  name: string;
  location?: string | null;
  ports: SidebarPort[];
};

interface DisconnectedDevicesSidebarProps {
  devices: SidebarDevice[];
  isConnecting: boolean;
  onPortMouseUp: (portId: string) => void;
}

const useStyles = makeStyles({
  sidebar: {
    width: '260px',
    minWidth: '260px',
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
    overflowY: 'auto',
  },
  title: {
    fontWeight: 600,
  },
  deviceCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  deviceHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  ports: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  portRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    borderRadius: '6px',
    padding: '4px 6px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'pointer',
  },
  portDot: {
    width: '10px',
    height: '10px',
    borderRadius: '999px',
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexShrink: 0,
  },
  portLabel: {
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  portMeta: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  portBadge: {
    minWidth: '36px',
    textAlign: 'center',
  },
  hint: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
});

export function DisconnectedDevicesSidebar({
  devices,
  isConnecting,
  onPortMouseUp,
}: DisconnectedDevicesSidebarProps) {
  const styles = useStyles();
  const hintText = useMemo(() => {
    if (devices.length === 0) return 'Nenhum equipamento sem conexão.';
    if (isConnecting) return 'Solte a conexão em uma porta livre.';
    return 'Arraste uma conexão do blueprint até uma porta livre.';
  }, [devices.length, isConnecting]);

  return (
    <aside className={styles.sidebar}>
      <Text className={styles.title}>Equipamentos sem conexão</Text>
      <Text className={styles.hint}>{hintText}</Text>
      {devices.map((device) => (
        <div key={device.id} className={styles.deviceCard}>
          <div className={styles.deviceHeader}>
            <Text weight="semibold">{device.name}</Text>
            {device.location && (
              <Badge size="small" appearance="outline">
                {device.location}
              </Badge>
            )}
          </div>
          <div className={styles.ports}>
            {device.ports.map((port) => (
              <div
                key={port.id}
                className={styles.portRow}
                onMouseUp={() => onPortMouseUp(port.id)}
                data-sidebar-port-id={port.id}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <span className={styles.portDot} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <Text className={styles.portLabel}>
                      {port.directionCode === 'BI'
                        ? port.label
                        : `${port.label} ${port.directionCode}`}
                    </Text>
                    {port.directionCode === 'BI' && (
                      <Text className={styles.portMeta}>{port.typeLabel}</Text>
                    )}
                  </div>
                </div>
                <Badge size="small" appearance="outline" className={styles.portBadge}>
                  {port.directionCode}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
