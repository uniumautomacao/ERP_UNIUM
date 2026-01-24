import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Badge, Text, makeStyles, tokens } from '@fluentui/react-components';
import type { GuiaDeviceIO, GuiaDeviceIOConnection } from '../../../../types/guiaConexoes';

const useStyles = makeStyles({
  nodeContainer: {
    minWidth: '200px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingHorizontalM,
  },
  nodeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'grab',
  },
  nodeTitle: {
    fontWeight: 600,
    marginBottom: '2px',
  },
  nodeLocation: {
    fontSize: '11px',
    color: tokens.colorNeutralForegroundDisabled,
  },
  portsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalS,
  },
  portContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  port: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalXS}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: '12px',
    minHeight: '28px',
  },
  portConnected: {
    backgroundColor: tokens.colorStatusSuccessBackground2,
    color: tokens.colorStatusSuccessForeground2,
  },
  portManual: {
    backgroundColor: tokens.colorStatusWarningBackground2,
    color: tokens.colorStatusWarningForeground2,
  },
  portIncompatible: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    opacity: 0.6,
  },
  portIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  portLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
});

interface DeviceNodeData {
  device: GuiaDeviceIO;
  connections: GuiaDeviceIOConnection[];
  modelName?: string;
}

export const DeviceNode = memo(function DeviceNode({
  data,
  id,
}: NodeProps<DeviceNodeData>) {
  const styles = useStyles();
  const { device, connections, modelName } = data;

  // Agrupar conexões por porta (device)
  const portsByDevice = connections.filter(
    (c) => c._new_device_value === device.new_deviceioid
  );

  const getPortStatus = useCallback((connection: GuiaDeviceIOConnection) => {
    if (connection._new_connectedto_value) {
      return 'connected';
    }
    if (connection.new_connectedtomanual) {
      return 'manual';
    }
    return 'free';
  }, []);

  return (
    <Card className={styles.nodeContainer}>
      <div className={styles.nodeHeader}>
        <div>
          <Text className={styles.nodeTitle}>{device.new_name}</Text>
          <Text className={styles.nodeLocation}>{modelName}</Text>
          {device.new_localizacao && (
            <Badge size="small" appearance="outline">
              {device.new_localizacao}
            </Badge>
          )}
        </div>
      </div>

      {portsByDevice.length === 0 ? (
        <Text size={200}>Nenhuma porta</Text>
      ) : (
        <div className={styles.portsGrid}>
          {portsByDevice.map((connection, index) => {
            const status = getPortStatus(connection);
            const statusClass = {
              connected: styles.portConnected,
              manual: styles.portManual,
              free: '',
            }[status];

            return (
              <div
                key={`port-${connection.new_deviceioconnectionid}`}
                className={styles.portContainer}
              >
                <Handle
                  type="source"
                  position={index % 2 === 0 ? Position.Left : Position.Right}
                  id={`${id}-${connection.new_deviceioconnectionid}-source`}
                  style={{
                    background: status === 'connected' ? '#107C10' : '#FFB900',
                  }}
                />
                <Handle
                  type="target"
                  position={index % 2 === 0 ? Position.Left : Position.Right}
                  id={`${id}-${connection.new_deviceioconnectionid}-target`}
                  style={{
                    background: status === 'connected' ? '#107C10' : '#FFB900',
                  }}
                />
                <div className={`${styles.port} ${statusClass}`}>
                  <span className={styles.portIndicator} />
                  <span className={styles.portLabel}>
                    {connection.new_name || connection.new_displayname || `Porta ${index + 1}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
});

DeviceNode.displayName = 'DeviceNode';
