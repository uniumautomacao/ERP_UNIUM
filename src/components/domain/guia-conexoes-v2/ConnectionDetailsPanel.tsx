import { useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Text,
  Badge,
  Card,
  makeStyles,
  tokens,
  Divider,
} from '@fluentui/react-components';
import { Delete24Regular, ChevronUp24Regular } from '@fluentui/react-icons';
import type { GuiaDeviceIO, GuiaDeviceIOConnection } from '../../../types/guiaConexoes';
import { connectionTypeOptions, connectionDirectionOptions } from '../../../utils/device-io/optionSetMaps';
import { clearDeviceIOConnectionLink } from '../../../utils/guia-conexoes/deleteDevice';

const useStyles = makeStyles({
  panel: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `2px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: tokens.shadow28,
    zIndex: 100,
  },
  panelContent: {
    padding: tokens.spacingHorizontalL,
    maxHeight: '300px',
    overflow: 'auto',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  connectionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalM,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  infoLabel: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  deviceInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

interface ConnectionDetailsPanelProps {
  edgeId: string;
  connections: GuiaDeviceIOConnection[];
  devices: GuiaDeviceIO[];
  onClose: () => void;
  onRemoveConnection: () => void;
}

export const ConnectionDetailsPanel: React.FC<ConnectionDetailsPanelProps> = ({
  edgeId,
  connections,
  devices,
  onClose,
  onRemoveConnection,
}) => {
  const styles = useStyles();

  // Parse edge ID para obter device IDs
  const [sourceDeviceId, targetDeviceId] = edgeId.split('-');

  // Encontrar conexões
  const sourceDevice = devices.find((d) => d.new_deviceioid === sourceDeviceId);
  const targetDevice = devices.find((d) => d.new_deviceioid === targetDeviceId);

  const sourceConnections = connections.filter(
    (c) =>
      c._new_device_value === sourceDeviceId &&
      (c._new_connectedto_value === targetDeviceId ||
        c._new_connectedto_value === targetDeviceId)
  );

  const connection = sourceConnections[0];

  const getTypeLabel = useCallback((value: number | string | undefined | null) => {
    if (!value) return 'Desconhecido';
    const option = connectionTypeOptions.find((opt) => opt.value === value);
    return option?.label || 'Desconhecido';
  }, []);

  const getDirectionLabel = useCallback((value: number | string | undefined | null) => {
    if (!value) return 'Desconhecido';
    const option = connectionDirectionOptions.find((opt) => opt.value === value);
    return option?.label || 'Desconhecido';
  }, []);

  const handleRemoveConnection = useCallback(async () => {
    try {
      if (connection?._new_connectedto_value) {
        await clearDeviceIOConnectionLink(
          connection.new_deviceioconnectionid,
          connection._new_connectedto_value
        );
      }
      onRemoveConnection();
    } catch (err) {
      console.error('Erro ao remover conexão:', err);
    }
  }, [connection, onRemoveConnection]);

  if (!sourceDevice || !targetDevice || !connection) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelContent}>
        <div className={styles.panelHeader}>
          <Text weight="semibold" size={500}>
            Detalhes da Conexão
          </Text>
          <Button
            icon={<ChevronUp24Regular />}
            appearance="subtle"
            onClick={onClose}
          />
        </div>

        <div className={styles.connectionInfo}>
          {/* Origem */}
          <div className={styles.infoRow}>
            <Text className={styles.infoLabel}>Origem</Text>
            <Card className={styles.deviceInfo}>
              <Text weight="semibold">{sourceDevice.new_name}</Text>
              <Text size={200}>Porta: {connection.new_name || connection.new_displayname}</Text>
              {sourceDevice.new_localizacao && (
                <Badge appearance="outline" size="small">
                  {sourceDevice.new_localizacao}
                </Badge>
              )}
            </Card>
          </div>

          {/* Destino */}
          <div className={styles.infoRow}>
            <Text className={styles.infoLabel}>Destino</Text>
            <Card className={styles.deviceInfo}>
              <Text weight="semibold">{targetDevice.new_name}</Text>
              {targetDevice.new_localizacao && (
                <Badge appearance="outline" size="small">
                  {targetDevice.new_localizacao}
                </Badge>
              )}
            </Card>
          </div>

          {/* Detalhes da conexão */}
          <Divider />
          <div className={styles.infoRow}>
            <Text className={styles.infoLabel}>Tipo</Text>
            <Text>{getTypeLabel(connection.new_tipodeconexao)}</Text>
          </div>

          <div className={styles.infoRow}>
            <Text className={styles.infoLabel}>Direção</Text>
            <Text>{getDirectionLabel(connection.new_direcao)}</Text>
          </div>

          {/* Ações */}
          <div className={styles.actions}>
            <Button
              icon={<Delete24Regular />}
              appearance="subtle"
              onClick={handleRemoveConnection}
            >
              Remover vínculo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
