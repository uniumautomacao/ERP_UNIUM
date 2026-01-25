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
  Radio,
  RadioGroup,
  Text,
  makeStyles,
  tokens,
  Checkbox,
} from '@fluentui/react-components';
import { Dismiss24Regular, Print24Regular } from '@fluentui/react-icons';
import type { GuiaDeviceIO, GuiaDeviceIOConnection } from '../../../types/guiaConexoes';
import {
  generateConnectionLabels,
  downloadLabelsFile,
  type ConnectionLabel,
} from '../../../utils/guia-conexoes/labelGenerator';
import { connectionTypeOptions } from '../../../utils/device-io/optionSetMaps';

type SelectionMode = 'single' | 'device' | 'type' | 'custom';

export interface PrintLabelsDialogProps {
  open: boolean;
  onClose: () => void;
  connections: GuiaDeviceIOConnection[];
  connectionsById: Map<string, GuiaDeviceIOConnection>;
  deviceMap: Map<string, GuiaDeviceIO>;
  projectName?: string;
  preselectedConnectionId?: string | null;
  preselectedDeviceId?: string | null;
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
});

const getConnectionLabel = (connection: GuiaDeviceIOConnection) =>
  connection.new_name || connection.new_displayname || connection.new_tipodeconexaorawtext || 'Porta';

export function PrintLabelsDialog({
  open,
  onClose,
  connections,
  connectionsById,
  deviceMap,
  projectName,
  preselectedConnectionId,
  preselectedDeviceId,
}: PrintLabelsDialogProps) {
  const styles = useStyles();
  
  const [mode, setMode] = useState<SelectionMode>('single');
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [customSelection, setCustomSelection] = useState<Set<string>>(new Set());

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      if (preselectedConnectionId) {
        setMode('single');
        setSelectedConnectionId(preselectedConnectionId);
      } else if (preselectedDeviceId) {
        setMode('device');
        setSelectedDeviceId(preselectedDeviceId);
      } else {
        setMode('single');
        setSelectedConnectionId(null);
        setSelectedDeviceId(null);
      }
      setSelectedTypes([]);
      setCustomSelection(new Set());
    }
  }, [open, preselectedConnectionId, preselectedDeviceId]);

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
  const deviceOptions = useMemo(() => {
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
    switch (mode) {
      case 'single':
        if (!selectedConnectionId) return [];
        const conn = connectionsById.get(selectedConnectionId);
        return conn ? [conn] : [];
      
      case 'device':
        if (!selectedDeviceId) return [];
        return connectedConnections.filter((conn) => conn._new_device_value === selectedDeviceId);
      
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
  }, [mode, selectedConnectionId, selectedDeviceId, selectedTypes, customSelection, connectedConnections, connectionsById]);

  // Gerar labels para preview
  const labels = useMemo(() => {
    if (selectedConnections.length === 0) return [];
    return generateConnectionLabels(selectedConnections, connectionsById, deviceMap);
  }, [selectedConnections, connectionsById, deviceMap]);

  const validLabelsCount = useMemo(() => labels.filter((l) => l.isValid).length, [labels]);

  const handlePrint = () => {
    if (labels.length === 0) return;
    try {
      downloadLabelsFile(labels, undefined, projectName);
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
            Imprimir Etiquetas de Conexão
          </DialogTitle>
          <DialogContent>
            <div className={styles.section}>
              <Text className={styles.sectionTitle}>Modo de Seleção</Text>
              <RadioGroup value={mode} onChange={(_, data) => setMode(data.value as SelectionMode)}>
                <Radio value="single" label="Conexão individual" />
                <Radio value="device" label="Todas conexões de um equipamento" />
                <Radio value="type" label="Todas conexões de tipos específicos" />
                <Radio value="custom" label="Seleção personalizada" />
              </RadioGroup>
            </div>

            <div className={styles.section}>
              {mode === 'single' && (
                <Dropdown
                  placeholder="Selecione uma conexão"
                  value={
                    selectedConnectionId
                      ? connectionOptions.find((opt) => opt.id === selectedConnectionId)?.label || ''
                      : ''
                  }
                  selectedOptions={selectedConnectionId ? [selectedConnectionId] : []}
                  onOptionSelect={(_, data) =>
                    setSelectedConnectionId(data.optionValue as string || null)
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

              {mode === 'device' && (
                <Dropdown
                  placeholder="Selecione um equipamento"
                  value={
                    selectedDeviceId
                      ? deviceOptions.find((opt) => opt.id === selectedDeviceId)?.label || ''
                      : ''
                  }
                  selectedOptions={selectedDeviceId ? [selectedDeviceId] : []}
                  onOptionSelect={(_, data) => setSelectedDeviceId(data.optionValue as string || null)}
                  className={styles.dropdown}
                >
                  {deviceOptions.map((opt) => (
                    <Option key={opt.id} value={opt.id}>
                      {opt.label}
                    </Option>
                  ))}
                </Dropdown>
              )}

              {mode === 'type' && (
                <Dropdown
                  multiselect
                  placeholder="Selecione tipos de conexão"
                  value={
                    selectedTypes.length === 0
                      ? ''
                      : selectedTypes.length === 1
                      ? typeOptions.find((opt) => String(opt.value) === selectedTypes[0])?.label || ''
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

              {mode === 'custom' && (
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
                      const device = conn._new_device_value ? deviceMap.get(conn._new_device_value) : null;
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

            {labels.length > 0 && (
              <div className={styles.section}>
                <Text className={styles.sectionTitle}>Preview das Etiquetas</Text>
                <div className={styles.previewContainer}>
                  {labels.map((label, index) => (
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
                  Total: {validLabelsCount} etiqueta{validLabelsCount !== 1 ? 's' : ''} válida
                  {validLabelsCount !== 1 ? 's' : ''}
                  {labels.length !== validLabelsCount &&
                    ` (${labels.length - validLabelsCount} inválida${
                      labels.length - validLabelsCount !== 1 ? 's' : ''
                    })`}
                </Text>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              appearance="primary"
              icon={<Print24Regular />}
              onClick={handlePrint}
              disabled={validLabelsCount === 0}
            >
              Baixar Arquivo ({validLabelsCount})
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
