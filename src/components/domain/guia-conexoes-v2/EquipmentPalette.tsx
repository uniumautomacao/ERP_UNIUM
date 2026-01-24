import {
  Badge,
  Card,
  Dropdown,
  Input,
  Label,
  Option,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { GuiaDeviceIO, GuiaDeviceIOConnection, GuiaModeloProduto } from '../../../types/guiaConexoes';
import { SearchableCombobox } from '../../shared/SearchableCombobox';

const useStyles = makeStyles({
  palette: {
    width: '250px',
    minWidth: '250px',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  cards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  card: {
    cursor: 'grab',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  cardDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  metaText: {
    color: tokens.colorNeutralForeground3,
  },
  cardRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
});

type ProjectOption = { id: string; label: string };

interface EquipmentPaletteProps {
  devices: GuiaDeviceIO[];
  modelosMap: Map<string, GuiaModeloProduto>;
  connectionsByDevice: Map<string, GuiaDeviceIOConnection[]>;
  canvasDeviceIds: Set<string>;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  locations: string[];
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  selectedProjectId: string | null;
  selectedProjectLabel: string;
  onProjectSelect: (id: string | null, label: string) => void;
  onProjectSearch: (term: string) => Promise<ProjectOption[]>;
}

const getModelLabel = (device: GuiaDeviceIO, modelosMap: Map<string, GuiaModeloProduto>) => {
  if (!device._new_modelodeproduto_value) return 'Modelo não informado';
  const modelo = modelosMap.get(device._new_modelodeproduto_value);
  if (!modelo) return 'Modelo não informado';
  return modelo.cr22f_title || modelo.cr22f_id || 'Modelo';
};

const getConnectionStats = (connections: GuiaDeviceIOConnection[] | undefined) => {
  let total = 0;
  let connected = 0;
  if (!connections) {
    return { total, connected };
  }
  for (const connection of connections) {
    total += 1;
    if (connection._new_connectedto_value || connection.new_connectedtomanual) {
      connected += 1;
    }
  }
  return { total, connected };
};

export function EquipmentPalette({
  devices,
  modelosMap,
  connectionsByDevice,
  canvasDeviceIds,
  searchTerm,
  onSearchTermChange,
  locations,
  selectedLocation,
  onLocationChange,
  selectedProjectId,
  selectedProjectLabel,
  onProjectSelect,
  onProjectSearch,
}: EquipmentPaletteProps) {
  const styles = useStyles();

  return (
    <aside className={styles.palette}>
      <div className={styles.section}>
        <Label>Projeto</Label>
        <SearchableCombobox
          placeholder="Selecionar projeto"
          value={selectedProjectLabel}
          selectedId={selectedProjectId}
          onSelect={onProjectSelect}
          onSearch={onProjectSearch}
          showAllOnFocus={true}
        />
      </div>

      <div className={styles.section}>
        <Label>Buscar equipamento</Label>
        <Input
          placeholder="Buscar equipamento..."
          value={searchTerm}
          onChange={(_, data) => onSearchTermChange(data.value)}
          disabled={!selectedProjectId}
        />
      </div>

      <div className={styles.section}>
        <Label>Localização</Label>
        <Dropdown
          placeholder="Todas"
          value={selectedLocation || 'Todas'}
          selectedOptions={[selectedLocation || 'Todas']}
          onOptionSelect={(_, data) => onLocationChange((data.optionValue as string) || '')}
          disabled={!selectedProjectId}
        >
          <Option key="Todas" value="">
            Todas
          </Option>
          {locations.map((location) => (
            <Option key={location} value={location}>
              {location}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.cards}>
        {devices.map((device) => {
          const deviceId = device.new_deviceioid;
          const modelLabel = getModelLabel(device, modelosMap);
          const connections = connectionsByDevice.get(deviceId);
          const stats = getConnectionStats(connections);
          const free = Math.max(stats.total - stats.connected, 0);
          const isOnCanvas = canvasDeviceIds.has(deviceId);
          return (
            <Card
              key={deviceId}
              className={`${styles.card} ${isOnCanvas ? styles.cardDisabled : ''}`}
              draggable={!isOnCanvas}
              onDragStart={(event) => {
                if (isOnCanvas) return;
                event.dataTransfer.setData('application/guia-device-id', deviceId);
                event.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className={styles.cardRow}>
                <Text weight="semibold">{device.new_name || 'Equipamento'}</Text>
                {isOnCanvas && <Badge size="small">No canvas</Badge>}
              </div>
              <Text size={200} className={styles.metaText}>
                {modelLabel}
              </Text>
              <Text size={200} className={styles.metaText}>
                {device.new_localizacao || 'Sem localização'}
              </Text>
              <div className={styles.cardRow}>
                <Text size={200} className={styles.metaText}>
                  {free} livres / {stats.total} portas
                </Text>
                <Badge appearance={stats.connected > 0 ? 'filled' : 'outline'} size="small">
                  {stats.connected > 0 ? 'Conectado' : 'Livre'}
                </Badge>
              </div>
            </Card>
          );
        })}
        {devices.length === 0 && (
          <Text size={200} className={styles.metaText}>
            Nenhum equipamento encontrado.
          </Text>
        )}
      </div>
    </aside>
  );
}
