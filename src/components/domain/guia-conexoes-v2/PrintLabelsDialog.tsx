import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Option,
  Tab,
  TabList,
  Radio,
  RadioGroup,
  Text,
  makeStyles,
  tokens,
  Checkbox,
} from '@fluentui/react-components';
import {
  Box24Regular,
  Dismiss24Regular,
  Link24Regular,
  Print24Regular,
} from '@fluentui/react-icons';
import type { GuiaDeviceIO, GuiaDeviceIOConnection } from '../../../types/guiaConexoes';
import {
  downloadDeviceLabelsFile,
  generateConnectionLabels,
  generateDeviceLabels,
  downloadLabelsFile,
} from '../../../utils/guia-conexoes/labelGenerator';
import { connectionTypeOptions } from '../../../utils/device-io/optionSetMaps';

type ConnectionSelectionMode = 'single' | 'device' | 'type' | 'custom';
type DeviceSelectionMode = 'single' | 'custom' | 'all' | 'location';
type ActiveTab = 'connections' | 'devices';

export interface PrintLabelsDialogProps {
  open: boolean;
  onClose: () => void;
  connections: GuiaDeviceIOConnection[];
  connectionsById: Map<string, GuiaDeviceIOConnection>;
  devices: GuiaDeviceIO[];
  deviceMap: Map<string, GuiaDeviceIO>;
  projectName?: string;
  preselectedConnectionId?: string | null;
  preselectedDeviceId?: string | null;
  initialTab?: ActiveTab;
}

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '700px',
    width: '100%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '8px',
  },
  dropdown: {
    minWidth: '300px',
  },
  previewContainer: {
    maxHeight: '300px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  previewLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  previewOrigin: {
    fontWeight: tokens.fontWeightSemibold,
  },
  previewDestination: {
    color: tokens.colorNeutralForeground3,
  },
  invalidLabel: {
    color: tokens.colorPaletteRedForeground2,
    fontStyle: 'italic',
  },
  customList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '250px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '12px',
  },
  customItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  customItemText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statsText: {
    color: tokens.colorNeutralForeground3,
    marginTop: '8px',
  },
  tabs: {
    marginBottom: '16px',
  },
  tabContent: {
    marginTop: '8px',
  },
});

const getConnectionLabel = (connection: GuiaDeviceIOConnection) =>
  connection.new_name || connection.new_displayname || connection.new_tipodeconexaorawtext || 'Porta';

export function PrintLabelsDialog({
  open,
  onClose,
  connections,
  connectionsById,
  devices,
  deviceMap,
  projectName,
  preselectedConnectionId,
  preselectedDeviceId,
  initialTab,
}: PrintLabelsDialogProps) {
  const styles = useStyles();

  const [activeTab, setActiveTab] = useState<ActiveTab>('connections');
  const [connectionMode, setConnectionMode] = useState<ConnectionSelectionMode>('single');
  const [deviceMode, setDeviceMode] = useState<DeviceSelectionMode>('single');
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [selectedConnectionDeviceId, setSelectedConnectionDeviceId] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedDeviceLocation, setSelectedDeviceLocation] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [customSelection, setCustomSelection] = useState<Set<string>>(new Set());
  const [deviceCustomSelection, setDeviceCustomSelection] = useState<Set<string>>(new Set());

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      const resolvedTab: ActiveTab = initialTab ?? (preselectedDeviceId ? 'devices' : 'connections');
      setActiveTab(resolvedTab);

      if (preselectedConnectionId) {
        setConnectionMode('single');
        setSelectedConnectionId(preselectedConnectionId);
        setSelectedConnectionDeviceId(null);
      } else {
        setConnectionMode('single');
        setSelectedConnectionId(null);
        setSelectedConnectionDeviceId(null);
      }

      if (preselectedDeviceId) {
        if (resolvedTab === 'connections') {
          setConnectionMode('device');
          setSelectedConnectionDeviceId(preselectedDeviceId);
          setDeviceMode('single');
          setSelectedDeviceId(null);
        } else {
          setDeviceMode('single');
          setSelectedDeviceId(preselectedDeviceId);
          setSelectedConnectionDeviceId(null);
        }
      } else {
        setDeviceMode('single');
        setSelectedDeviceId(null);
      }

      setSelectedTypes([]);
      setCustomSelection(new Set());
      setDeviceCustomSelection(new Set());
      setSelectedDeviceLocation(null);
    }
  }, [open, preselectedConnectionId, preselectedDeviceId, initialTab]);

  // Filtrar conexões conectadas (que têm destino)
  const connectedConnections = useMemo(() => {
    return connections.filter(
      (conn) => conn._new_connectedto_value || conn.new_connectedtomanual
    );
  }, [connections]);

  // Opções de conexões individuais
  const connectionOptions = useMemo(() => {
    return connectedConnections.map((conn) => {
      const device = conn._new_device_value ? deviceMap.get(conn._new_device_value) : null;
      const deviceName = device?.new_name || 'Equipamento';
      const connectionName = getConnectionLabel(conn);
      return {
        id: conn.new_deviceioconnectionid,
        label: `${deviceName} - ${connectionName}`,
      };
    });
  }, [connectedConnections, deviceMap]);

  // Opções de equipamentos
  const connectionDeviceOptions = useMemo(() => {
    const deviceIds = new Set<string>();
    connectedConnections.forEach((conn) => {
      if (conn._new_device_value) {
        deviceIds.add(conn._new_device_value);
      }
    });
    
    return Array.from(deviceIds)
      .map((deviceId) => {
        const device = deviceMap.get(deviceId);
        if (!device) return null;
        return {
          id: deviceId,
          label: `${device.new_name || 'Equipamento'}${
            device.new_localizacao ? ` · ${device.new_localizacao}` : ''
          }`,
        };
      })
      .filter((opt): opt is { id: string; label: string } => opt !== null)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [connectedConnections, deviceMap]);

  const deviceOptions = useMemo(() => {
    return devices
      .map((device) => ({
        id: device.new_deviceioid,
        label: `${device.new_name || 'Equipamento'}${
          device.new_localizacao ? ` · ${device.new_localizacao}` : ''
        }`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [devices]);

  const deviceLocationOptions = useMemo(() => {
    const locations = new Set<string>();
    devices.forEach((device) => {
      const location = device.new_localizacao?.trim();
      if (location) {
        locations.add(location);
      }
    });
    return Array.from(locations).sort((a, b) => a.localeCompare(b));
  }, [devices]);

  // Opções de tipos
  const typeOptions = useMemo(() => {
    const typesInUse = new Set<number>();
    connectedConnections.forEach((conn) => {
      if (conn.new_tipodeconexao !== null && conn.new_tipodeconexao !== undefined) {
        typesInUse.add(conn.new_tipodeconexao);
      }
    });
    
    return connectionTypeOptions.filter((opt) => typesInUse.has(opt.value));
  }, [connectedConnections]);

  // Conexões selecionadas para preview
  const selectedConnections = useMemo(() => {
    switch (connectionMode) {
      case 'single':
        if (!selectedConnectionId) return [];
        const conn = connectionsById.get(selectedConnectionId);
        return conn ? [conn] : [];
      
      case 'device':
        if (!selectedConnectionDeviceId) return [];
        return connectedConnections.filter(
          (conn) => conn._new_device_value === selectedConnectionDeviceId
        );
      
      case 'type':
        if (selectedTypes.length === 0) return [];
        const typeValues = selectedTypes.map(Number);
        return connectedConnections.filter(
          (conn) =>
            conn.new_tipodeconexao !== null &&
            conn.new_tipodeconexao !== undefined &&
            typeValues.includes(conn.new_tipodeconexao)
        );
      
      case 'custom':
        return connectedConnections.filter((conn) => customSelection.has(conn.new_deviceioconnectionid));
      
      default:
        return [];
    }
  }, [
    connectionMode,
    selectedConnectionId,
    selectedConnectionDeviceId,
    selectedTypes,
    customSelection,
    connectedConnections,
    connectionsById,
  ]);

  // Gerar labels para preview (conexoes)
  const connectionLabels = useMemo(() => {
    if (selectedConnections.length === 0) return [];
    return generateConnectionLabels(selectedConnections, connectionsById, deviceMap);
  }, [selectedConnections, connectionsById, deviceMap]);

  const selectedDevices = useMemo(() => {
    switch (deviceMode) {
      case 'single':
        if (!selectedDeviceId) return [];
        return devices.filter((device) => device.new_deviceioid === selectedDeviceId);
      case 'custom':
        return devices.filter((device) => deviceCustomSelection.has(device.new_deviceioid));
      case 'location':
        if (!selectedDeviceLocation) return [];
        return devices.filter(
          (device) => device.new_localizacao?.trim() === selectedDeviceLocation
        );
      case 'all':
        return devices;
      default:
        return [];
    }
  }, [deviceMode, selectedDeviceId, selectedDeviceLocation, deviceCustomSelection, devices]);

  const deviceLabels = useMemo(() => {
    if (selectedDevices.length === 0) return [];
    return generateDeviceLabels(selectedDevices);
  }, [selectedDevices]);

  const connectionValidCount = useMemo(
    () => connectionLabels.filter((l) => l.isValid).length,
    [connectionLabels]
  );
  const deviceValidCount = useMemo(
    () => deviceLabels.filter((l) => l.isValid).length,
    [deviceLabels]
  );

  const handlePrint = () => {
    try {
      if (activeTab === 'connections') {
        if (connectionLabels.length === 0) return;
        downloadLabelsFile(connectionLabels, undefined, projectName);
      } else {
        if (deviceLabels.length === 0) return;
        downloadDeviceLabelsFile(deviceLabels, undefined, projectName);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao gerar arquivo:', error);
      alert(error instanceof Error ? error.message : 'Erro ao gerar arquivo');
    }
  };

  const handleToggleCustom = (connectionId: string) => {
    setCustomSelection((prev) => {
      const next = new Set(prev);
      if (next.has(connectionId)) {
        next.delete(connectionId);
      } else {
        next.add(connectionId);
      }
      return next;
    });
  };

  const handleSelectAllCustom = () => {
    setCustomSelection(new Set(connectedConnections.map((c) => c.new_deviceioconnectionid)));
  };

  const handleClearAllCustom = () => {
    setCustomSelection(new Set());
  };

  const handleToggleDeviceCustom = (deviceId: string) => {
    setDeviceCustomSelection((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) {
        next.delete(deviceId);
      } else {
        next.add(deviceId);
      }
      return next;
    });
  };

  const handleSelectAllDevices = () => {
    setDeviceCustomSelection(new Set(devices.map((d) => d.new_deviceioid)));
  };

  const handleClearAllDevices = () => {
    setDeviceCustomSelection(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle
            action={
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={onClose}
                aria-label="Fechar"
              />
            }
          >
            {activeTab === 'connections'
              ? 'Imprimir Etiquetas de Conexão'
              : 'Imprimir Etiquetas de Dispositivo'}
          </DialogTitle>
          <DialogContent>
            <TabList
              className={styles.tabs}
              selectedValue={activeTab}
              onTabSelect={(_, data) => setActiveTab(data.value as ActiveTab)}
            >
              <Tab value="connections" icon={<Link24Regular />}>
                Conexões
              </Tab>
              <Tab value="devices" icon={<Box24Regular />}>
                Dispositivos
              </Tab>
            </TabList>

            {activeTab === 'connections' && (
              <div className={styles.tabContent}>
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Modo de Seleção</Text>
                  <RadioGroup
                    value={connectionMode}
                    onChange={(_, data) => setConnectionMode(data.value as ConnectionSelectionMode)}
                  >
                    <Radio value="single" label="Conexão individual" />
                    <Radio value="device" label="Todas conexões de um equipamento" />
                    <Radio value="type" label="Todas conexões de tipos específicos" />
                    <Radio value="custom" label="Seleção personalizada" />
                  </RadioGroup>
                </div>

                <div className={styles.section}>
                  {connectionMode === 'single' && (
                    <Dropdown
                      placeholder="Selecione uma conexão"
                      value={
                        selectedConnectionId
                          ? connectionOptions.find((opt) => opt.id === selectedConnectionId)?.label ||
                            ''
                          : ''
                      }
                      selectedOptions={selectedConnectionId ? [selectedConnectionId] : []}
                      onOptionSelect={(_, data) =>
                        setSelectedConnectionId((data.optionValue as string) || null)
                      }
                      className={styles.dropdown}
                    >
                      {connectionOptions.map((opt) => (
                        <Option key={opt.id} value={opt.id}>
                          {opt.label}
                        </Option>
                      ))}
                    </Dropdown>
                  )}

                  {connectionMode === 'device' && (
                    <Dropdown
                      placeholder="Selecione um equipamento"
                      value={
                        selectedConnectionDeviceId
                          ? connectionDeviceOptions.find(
                              (opt) => opt.id === selectedConnectionDeviceId
                            )?.label || ''
                          : ''
                      }
                      selectedOptions={
                        selectedConnectionDeviceId ? [selectedConnectionDeviceId] : []
                      }
                      onOptionSelect={(_, data) =>
                        setSelectedConnectionDeviceId((data.optionValue as string) || null)
                      }
                      className={styles.dropdown}
                    >
                      {connectionDeviceOptions.map((opt) => (
                        <Option key={opt.id} value={opt.id}>
                          {opt.label}
                        </Option>
                      ))}
                    </Dropdown>
                  )}

                  {connectionMode === 'type' && (
                    <Dropdown
                      multiselect
                      placeholder="Selecione tipos de conexão"
                      value={
                        selectedTypes.length === 0
                          ? ''
                          : selectedTypes.length === 1
                          ? typeOptions.find((opt) => String(opt.value) === selectedTypes[0])
                              ?.label || ''
                          : `${selectedTypes.length} tipos selecionados`
                      }
                      selectedOptions={selectedTypes}
                      onOptionSelect={(_, data) => setSelectedTypes(data.selectedOptions)}
                      className={styles.dropdown}
                    >
                      {typeOptions.map((opt) => (
                        <Option key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </Option>
                      ))}
                    </Dropdown>
                  )}

                  {connectionMode === 'custom' && (
                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <Button size="small" onClick={handleSelectAllCustom}>
                          Selecionar Todas
                        </Button>
                        <Button size="small" onClick={handleClearAllCustom}>
                          Limpar Seleção
                        </Button>
                      </div>
                      <div className={styles.customList}>
                        {connectedConnections.map((conn) => {
                          const device = conn._new_device_value
                            ? deviceMap.get(conn._new_device_value)
                            : null;
                          const deviceName = device?.new_name || 'Equipamento';
                          const connectionName = getConnectionLabel(conn);
                          return (
                            <div key={conn.new_deviceioconnectionid} className={styles.customItem}>
                              <Checkbox
                                checked={customSelection.has(conn.new_deviceioconnectionid)}
                                onChange={() => handleToggleCustom(conn.new_deviceioconnectionid)}
                              />
                              <div className={styles.customItemText}>
                                <Text weight="semibold">{`${deviceName} - ${connectionName}`}</Text>
                                {device?.new_localizacao && (
                                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                    {device.new_localizacao}
                                  </Text>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {connectionLabels.length > 0 && (
                  <div className={styles.section}>
                    <Text className={styles.sectionTitle}>Preview das Etiquetas</Text>
                    <div className={styles.previewContainer}>
                      {connectionLabels.map((label, index) => (
                        <div key={label.id} className={styles.previewLabel}>
                          <Text size={200} weight="semibold">
                            Etiqueta {index + 1}:
                          </Text>
                          {label.isValid ? (
                            <>
                              <Text className={styles.previewOrigin}>{label.origin}</Text>
                              <Text className={styles.previewDestination}>{label.destination}</Text>
                            </>
                          ) : (
                            <Text className={styles.invalidLabel}>
                              {label.origin} (Sem destino - não será impressa)
                            </Text>
                          )}
                        </div>
                      ))}
                    </div>
                    <Text className={styles.statsText}>
                      Total: {connectionValidCount} etiqueta
                      {connectionValidCount !== 1 ? 's' : ''} válida
                      {connectionValidCount !== 1 ? 's' : ''}
                      {connectionLabels.length !== connectionValidCount &&
                        ` (${connectionLabels.length - connectionValidCount} inválida${
                          connectionLabels.length - connectionValidCount !== 1 ? 's' : ''
                        })`}
                    </Text>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'devices' && (
              <div className={styles.tabContent}>
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Modo de Seleção</Text>
                  <RadioGroup
                    value={deviceMode}
                    onChange={(_, data) => setDeviceMode(data.value as DeviceSelectionMode)}
                  >
                    <Radio value="single" label="Dispositivo individual" />
                    <Radio value="custom" label="Seleção personalizada" />
                    <Radio value="location" label="Por localização" />
                    <Radio value="all" label="Todos os dispositivos" />
                  </RadioGroup>
                </div>

                <div className={styles.section}>
                  {deviceMode === 'single' && (
                    <Dropdown
                      placeholder="Selecione um dispositivo"
                      value={
                        selectedDeviceId
                          ? deviceOptions.find((opt) => opt.id === selectedDeviceId)?.label || ''
                          : ''
                      }
                      selectedOptions={selectedDeviceId ? [selectedDeviceId] : []}
                      onOptionSelect={(_, data) =>
                        setSelectedDeviceId((data.optionValue as string) || null)
                      }
                      className={styles.dropdown}
                    >
                      {deviceOptions.map((opt) => (
                        <Option key={opt.id} value={opt.id}>
                          {opt.label}
                        </Option>
                      ))}
                    </Dropdown>
                  )}

                  {deviceMode === 'location' && (
                    <Dropdown
                      placeholder="Selecione uma localização"
                      value={selectedDeviceLocation || ''}
                      selectedOptions={selectedDeviceLocation ? [selectedDeviceLocation] : []}
                      onOptionSelect={(_, data) =>
                        setSelectedDeviceLocation((data.optionValue as string) || null)
                      }
                      className={styles.dropdown}
                    >
                      {deviceLocationOptions.map((location) => (
                        <Option key={location} value={location}>
                          {location}
                        </Option>
                      ))}
                    </Dropdown>
                  )}

                  {deviceMode === 'custom' && (
                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <Button size="small" onClick={handleSelectAllDevices}>
                          Selecionar Todos
                        </Button>
                        <Button size="small" onClick={handleClearAllDevices}>
                          Limpar Seleção
                        </Button>
                      </div>
                      <div className={styles.customList}>
                        {devices.map((device) => (
                          <div key={device.new_deviceioid} className={styles.customItem}>
                            <Checkbox
                              checked={deviceCustomSelection.has(device.new_deviceioid)}
                              onChange={() => handleToggleDeviceCustom(device.new_deviceioid)}
                            />
                            <div className={styles.customItemText}>
                              <Text weight="semibold">{device.new_name || 'Equipamento'}</Text>
                              {device.new_localizacao && (
                                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                  {device.new_localizacao}
                                </Text>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {deviceMode === 'all' && (
                    <Text size={200} className={styles.statsText}>
                      {devices.length} dispositivo{devices.length !== 1 ? 's' : ''} selecionado
                      {devices.length !== 1 ? 's' : ''}.
                    </Text>
                  )}
                </div>

                {deviceLabels.length > 0 && (
                  <div className={styles.section}>
                    <Text className={styles.sectionTitle}>Preview das Etiquetas</Text>
                    <div className={styles.previewContainer}>
                      {deviceLabels.map((label, index) => (
                        <div key={label.id} className={styles.previewLabel}>
                          <Text size={200} weight="semibold">
                            Etiqueta {index + 1}:
                          </Text>
                          {label.isValid ? (
                            <>
                              <Text className={styles.previewOrigin}>{label.name}</Text>
                              <Text className={styles.previewDestination}>
                                {label.location || 'Sem localização'}
                              </Text>
                            </>
                          ) : (
                            <Text className={styles.invalidLabel}>
                              {label.name || 'Sem nome'} (Sem nome - não será impressa)
                            </Text>
                          )}
                        </div>
                      ))}
                    </div>
                    <Text className={styles.statsText}>
                      Total: {deviceValidCount} etiqueta{deviceValidCount !== 1 ? 's' : ''}{' '}
                      válida{deviceValidCount !== 1 ? 's' : ''}
                      {deviceLabels.length !== deviceValidCount &&
                        ` (${deviceLabels.length - deviceValidCount} inválida${
                          deviceLabels.length - deviceValidCount !== 1 ? 's' : ''
                        })`}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              appearance="primary"
              icon={<Print24Regular />}
              onClick={handlePrint}
              disabled={
                activeTab === 'connections' ? connectionValidCount === 0 : deviceValidCount === 0
              }
            >
              Baixar Arquivo (
              {activeTab === 'connections' ? connectionValidCount : deviceValidCount})
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
