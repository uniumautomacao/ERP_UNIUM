import { useCallback, useMemo, useState } from 'react';
import {
  Input,
  Dropdown,
  Option,
  Card,
  Text,
  Badge,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import type { GuiaConexoesData, GuiaDeviceIO } from '../../../types/guiaConexoes';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    overflow: 'hidden',
  },
  searchBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  filterBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  cardsList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    overflow: 'auto',
  },
  deviceCard: {
    padding: tokens.spacingHorizontalM,
    cursor: 'grab',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingVerticalS,
  },
  cardTitle: {
    fontWeight: 600,
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  portStats: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  searchInput: {
    position: 'relative' as const,
  },
});

interface EquipmentPaletteProps {
  data: any;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  canvasDeviceIds: string[];
}

export const EquipmentPalette: React.FC<EquipmentPaletteProps> = ({
  data,
  searchTerm,
  onSearchTermChange,
  canvasDeviceIds,
}) => {
  const styles = useStyles();
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Extrair localizações únicas
  const locations = useMemo(() => {
    const locs = new Set<string>();
    data.devices?.forEach((device: GuiaDeviceIO) => {
      if (device.new_localizacao) {
        locs.add(device.new_localizacao);
      }
    });
    return Array.from(locs).sort();
  }, [data.devices]);

  // Filtrar dispositivos por localização
  const filteredDevices = useMemo(() => {
    if (!data.devices) return [];
    let filtered = data.devices;

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(
        (d: GuiaDeviceIO) => d.new_localizacao === selectedLocation
      );
    }

    return filtered;
  }, [data.devices, selectedLocation]);

  // Mapear modelos
  const modelosMap = useMemo(() => {
    const map = new Map<string, string>();
    data.modelos?.forEach((m: any) => {
      map.set(
        m.cr22f_modelosdeprodutofromsharepointlistid,
        m.cr22f_title || m.new_nomedofabricante || 'Modelo desconhecido'
      );
    });
    return map;
  }, [data.modelos]);

  // Contar portas por dispositivo
  const connectionsByDevice = useMemo(() => {
    const map = new Map<string, { total: number; connected: number }>();
    data.devices?.forEach((device: GuiaDeviceIO) => {
      map.set(device.new_deviceioid, { total: 0, connected: 0 });
    });

    data.connections?.forEach((conn: any) => {
      if (conn._new_device_value && map.has(conn._new_device_value)) {
        const stats = map.get(conn._new_device_value)!;
        stats.total += 1;
        if (conn._new_connectedto_value || conn.new_connectedtomanual) {
          stats.connected += 1;
        }
      }
    });

    return map;
  }, [data.devices, data.connections]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, deviceId: string) => {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('deviceId', deviceId);
    },
    []
  );

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <Input
          placeholder="Buscar equipamento…"
          value={searchTerm}
          onChange={(e, data) => onSearchTermChange(data.value)}
          contentBefore={<Search24Regular />}
        />
      </div>

      <div className={styles.filterBox}>
        <Dropdown
          value={selectedLocation === 'all' ? 'Todas' : selectedLocation}
          onOptionSelect={(e, data) => {
            setSelectedLocation(data.optionValue || 'all');
          }}
        >
          <Option value="all">Todas as localizações</Option>
          {locations.map((loc) => (
            <Option key={loc} value={loc}>
              {loc}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.cardsList}>
        {filteredDevices.length === 0 ? (
          <Text size={200}>Nenhum equipamento encontrado</Text>
        ) : (
          filteredDevices.map((device: GuiaDeviceIO) => {
            const modeloId = device._new_modelodeproduto_value;
            const modelName = modeloId
              ? modelosMap.get(modeloId) || 'Modelo desconhecido'
              : 'Sem modelo';
            const portStats = connectionsByDevice.get(device.new_deviceioid) || {
              total: 0,
              connected: 0,
            };
            const isOnCanvas = canvasDeviceIds.includes(device.new_deviceioid);

            return (
              <Card
                key={device.new_deviceioid}
                className={styles.deviceCard}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, device.new_deviceioid)
                }
              >
                <div className={styles.cardHeader}>
                  <div>
                    <Text className={styles.cardTitle}>{device.new_name}</Text>
                    {isOnCanvas && (
                      <Badge color="success" size="small">
                        No canvas
                      </Badge>
                    )}
                  </div>
                </div>

                <div className={styles.cardMeta}>
                  <Text size={200}>
                    <strong>Modelo:</strong> {modelName}
                  </Text>
                  {device.new_localizacao && (
                    <Text size={200}>
                      <strong>Localização:</strong> {device.new_localizacao}
                    </Text>
                  )}
                </div>

                <div className={styles.portStats}>
                  <Badge appearance="outline">
                    {portStats.total} porta(s)
                  </Badge>
                  <Badge appearance="outline" color="success">
                    {portStats.connected} conectada(s)
                  </Badge>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
