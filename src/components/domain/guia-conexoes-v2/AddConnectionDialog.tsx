import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Field,
  Label,
  Option,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { SearchableCombobox } from '../../shared/SearchableCombobox';
import { NewDeviceIOConnectionService, NewDeviceIOService } from '../../../generated';
import { resolveErrorMessage } from '../../../utils/guia-conexoes/errors';
import { escapeODataValue } from '../../../utils/guia-conexoes/odata';
import { connectionDirectionOptions, connectionTypeOptions } from '../../../utils/device-io/optionSetMaps';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground2,
  },
  helper: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

const DIRECTION = {
  Input: 100000000,
  Output: 100000001,
  Bidirectional: 100000002,
  Bus: 100000003,
};

type DeviceOption = {
  id: string;
  label: string;
};

type PortOption = {
  id: string;
  label: string;
  type?: number | null;
  direction?: number | null;
};

interface AddConnectionDialogProps {
  open: boolean;
  projectId: string | null;
  onClose: () => void;
  onLinked: () => Promise<void> | void;
}

const buildDirectionFilter = (direction?: number | null) => {
  if (direction === DIRECTION.Input) {
    return `(new_direcao eq ${DIRECTION.Output} or new_direcao eq ${DIRECTION.Bidirectional} or new_direcao eq ${DIRECTION.Bus})`;
  }
  if (direction === DIRECTION.Output) {
    return `(new_direcao eq ${DIRECTION.Input} or new_direcao eq ${DIRECTION.Bidirectional} or new_direcao eq ${DIRECTION.Bus})`;
  }
  return '';
};

const buildTypeLabelMap = () => {
  const map = new Map<number, string>();
  for (const option of connectionTypeOptions) {
    map.set(option.value, option.label);
  }
  return map;
};

const buildDirectionLabelMap = () => {
  const map = new Map<number, string>();
  for (const option of connectionDirectionOptions) {
    map.set(option.value, option.label);
  }
  return map;
};

export function AddConnectionDialog({ open, projectId, onClose, onLinked }: AddConnectionDialogProps) {
  const styles = useStyles();
  const [sourceDeviceId, setSourceDeviceId] = useState<string | null>(null);
  const [sourceDeviceLabel, setSourceDeviceLabel] = useState('');
  const [targetDeviceId, setTargetDeviceId] = useState<string | null>(null);
  const [targetDeviceLabel, setTargetDeviceLabel] = useState('');
  const [sourcePortId, setSourcePortId] = useState<string | null>(null);
  const [targetPortId, setTargetPortId] = useState<string | null>(null);
  const [sourcePorts, setSourcePorts] = useState<PortOption[]>([]);
  const [targetPorts, setTargetPorts] = useState<PortOption[]>([]);
  const [selectedSourcePort, setSelectedSourcePort] = useState<PortOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const typeLabelMap = useMemo(() => buildTypeLabelMap(), []);
  const directionLabelMap = useMemo(() => buildDirectionLabelMap(), []);

  const sourcePortLabel = useMemo(() => {
    if (!sourcePortId) return '';
    for (const option of sourcePorts) {
      if (option.id === sourcePortId) {
        return option.label;
      }
    }
    return '';
  }, [sourcePortId, sourcePorts]);

  const targetPortLabel = useMemo(() => {
    if (!targetPortId) return '';
    for (const option of targetPorts) {
      if (option.id === targetPortId) {
        return option.label;
      }
    }
    return '';
  }, [targetPortId, targetPorts]);

  useEffect(() => {
    if (open) return;
    setSourceDeviceId(null);
    setSourceDeviceLabel('');
    setTargetDeviceId(null);
    setTargetDeviceLabel('');
    setSourcePortId(null);
    setTargetPortId(null);
    setSourcePorts([]);
    setTargetPorts([]);
    setSelectedSourcePort(null);
    setLoading(false);
    setError('');
  }, [open]);

  const searchDevices = useCallback(
    async (term: string, excludeDeviceId?: string | null) => {
      if (!projectId) return [];
      const normalized = term.trim();
      const filterParts: string[] = [
        'statecode eq 0',
        `_new_projeto_value eq ${escapeODataValue(projectId)}`,
      ];
      if (excludeDeviceId) {
        filterParts.push(`new_deviceioid ne ${escapeODataValue(excludeDeviceId)}`);
      }
      if (normalized) {
        const escaped = escapeODataValue(normalized);
        filterParts.push(`(contains(new_name, '${escaped}') or contains(new_localizacao, '${escaped}'))`);
      }

      const result = await NewDeviceIOService.getAll({
        select: ['new_deviceioid', 'new_name', 'new_localizacao'],
        filter: filterParts.join(' and '),
        orderBy: ['new_name asc'],
        top: 50,
      });

      if (!result.success || !result.data) {
        return [];
      }

      const options: DeviceOption[] = [];
      for (const item of result.data as { new_deviceioid: string; new_name?: string; new_localizacao?: string }[]) {
        if (!item.new_deviceioid) continue;
        const labelParts: string[] = [];
        if (item.new_name) labelParts.push(item.new_name);
        if (item.new_localizacao) labelParts.push(item.new_localizacao);
        const label = labelParts.join(' · ') || 'Equipamento';
        options.push({ id: item.new_deviceioid, label });
      }
      return options;
    },
    [projectId]
  );

  const loadPortsForDevice = useCallback(
    async (
      deviceId: string,
      sourcePort?: PortOption | null
    ) => {
      if (!projectId) return [];
      const filterParts: string[] = [
        'statecode eq 0',
        `_new_projeto_value eq ${escapeODataValue(projectId)}`,
        `_new_device_value eq ${escapeODataValue(deviceId)}`,
        `_new_connectedto_value eq null and (new_connectedtomanual eq null or new_connectedtomanual eq '')`,
      ];

      if (sourcePort && sourcePort.type !== null && sourcePort.type !== undefined) {
        filterParts.push(`new_tipodeconexao eq ${sourcePort.type}`);
      }

      if (sourcePort) {
        const directionFilter = buildDirectionFilter(sourcePort.direction);
        if (directionFilter) {
          filterParts.push(directionFilter);
        }
      }

      const result = await NewDeviceIOConnectionService.getAll({
        select: [
          'new_deviceioconnectionid',
          'new_name',
          'new_displayname',
          'new_direcao',
          'new_tipodeconexao',
        ],
        filter: filterParts.join(' and '),
        orderBy: ['new_name asc'],
        top: 200,
      });

      if (!result.success || !result.data) {
        return [];
      }

      const options: PortOption[] = [];
      for (const item of result.data as {
        new_deviceioconnectionid: string;
        new_name?: string | null;
        new_displayname?: string | null;
        new_direcao?: number | null;
        new_tipodeconexao?: number | null;
      }[]) {
        if (!item.new_deviceioconnectionid) continue;
        const labelParts: string[] = [];
        labelParts.push(item.new_name || item.new_displayname || 'Porta');
        if (item.new_tipodeconexao !== null && item.new_tipodeconexao !== undefined) {
          const typeLabel = typeLabelMap.get(item.new_tipodeconexao) ?? 'Tipo';
          labelParts.push(typeLabel);
        }
        if (item.new_direcao !== null && item.new_direcao !== undefined) {
          const directionLabel = directionLabelMap.get(item.new_direcao) ?? 'Direção';
          labelParts.push(directionLabel);
        }
        options.push({
          id: item.new_deviceioconnectionid,
          label: labelParts.join(' · '),
          type: item.new_tipodeconexao,
          direction: item.new_direcao,
        });
      }
      return options;
    },
    [directionLabelMap, projectId, typeLabelMap]
  );

  useEffect(() => {
    if (!sourceDeviceId) {
      setSourcePorts([]);
      setSourcePortId(null);
      setSelectedSourcePort(null);
      return;
    }
    let isActive = true;
    const loadPorts = async () => {
      const options = await loadPortsForDevice(sourceDeviceId);
      if (!isActive) return;
      setSourcePorts(options);
      setSourcePortId(null);
      setSelectedSourcePort(null);
    };
    void loadPorts();
    return () => {
      isActive = false;
    };
  }, [loadPortsForDevice, sourceDeviceId]);

  useEffect(() => {
    if (!targetDeviceId || !selectedSourcePort) {
      setTargetPorts([]);
      setTargetPortId(null);
      return;
    }
    let isActive = true;
    const loadPorts = async () => {
      const options = await loadPortsForDevice(targetDeviceId, selectedSourcePort);
      if (!isActive) return;
      setTargetPorts(options);
      setTargetPortId(null);
    };
    void loadPorts();
    return () => {
      isActive = false;
    };
  }, [loadPortsForDevice, selectedSourcePort, targetDeviceId]);

  const handleSelectSourcePort = useCallback(
    (_: unknown, data: { optionValue?: string }) => {
      const value = data.optionValue ?? '';
      setSourcePortId(value || null);
      let selected: PortOption | null = null;
      for (const option of sourcePorts) {
        if (option.id === value) {
          selected = option;
          break;
        }
      }
      setSelectedSourcePort(selected);
    },
    [sourcePorts]
  );

  const handleSelectTargetPort = useCallback((_: unknown, data: { optionValue?: string }) => {
    const value = data.optionValue ?? '';
    setTargetPortId(value || null);
  }, []);

  const handleConnect = useCallback(async () => {
    if (!sourcePortId || !targetPortId) return;
    setLoading(true);
    setError('');
    try {
      const payloadA = {
        'new_ConnectedTo@odata.bind': `/new_deviceioconnections(${targetPortId})`,
        new_connectedtomanual: null,
      } as unknown as Record<string, unknown>;
      const payloadB = {
        'new_ConnectedTo@odata.bind': `/new_deviceioconnections(${sourcePortId})`,
        new_connectedtomanual: null,
      } as unknown as Record<string, unknown>;

      const resultA = await NewDeviceIOConnectionService.update(sourcePortId, payloadA);
      if (!resultA.success) {
        throw new Error(resolveErrorMessage(resultA.error, 'Falha ao vincular conexão A.'));
      }

      const resultB = await NewDeviceIOConnectionService.update(targetPortId, payloadB);
      if (!resultB.success) {
        throw new Error(resolveErrorMessage(resultB.error, 'Falha ao vincular conexão B.'));
      }

      await onLinked();
      onClose();
    } catch (err) {
      setError(resolveErrorMessage(err, 'Falha ao vincular conexões.'));
    } finally {
      setLoading(false);
    }
  }, [onClose, onLinked, sourcePortId, targetPortId]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => (!data.open ? onClose() : null)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Adicionar conexão</DialogTitle>
          <DialogContent className={styles.content}>
            {error && <Text className={styles.errorText}>{error}</Text>}

            <div>
              <Label>Origem</Label>
              <SearchableCombobox
                placeholder="Buscar equipamento de origem"
                value={sourceDeviceLabel}
                selectedId={sourceDeviceId}
                onSelect={(id, label) => {
                  setSourceDeviceId(id);
                  setSourceDeviceLabel(label);
                  setTargetDeviceId(null);
                  setTargetDeviceLabel('');
                  setTargetPorts([]);
                  setTargetPortId(null);
                }}
                onSearch={(term) => searchDevices(term, null)}
                showAllOnFocus={true}
              />
              <Field label="Porta de origem">
                <Dropdown
                  placeholder="Selecione a porta"
                  value={sourcePortLabel}
                  selectedOptions={sourcePortId ? [sourcePortId] : []}
                  onOptionSelect={handleSelectSourcePort}
                  disabled={!sourceDeviceId || sourcePorts.length === 0}
                >
                  {sourcePorts.map((option) => (
                    <Option key={option.id} value={option.id}>
                      {option.label}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            <div>
              <Label>Destino</Label>
              <SearchableCombobox
                placeholder="Buscar equipamento de destino"
                value={targetDeviceLabel}
                selectedId={targetDeviceId}
                onSelect={(id, label) => {
                  setTargetDeviceId(id);
                  setTargetDeviceLabel(label);
                  setTargetPortId(null);
                }}
                onSearch={(term) => searchDevices(term, sourceDeviceId)}
                showAllOnFocus={true}
              />
              <Field label="Porta de destino">
                <Dropdown
                  placeholder="Selecione a porta"
                  value={targetPortLabel}
                  selectedOptions={targetPortId ? [targetPortId] : []}
                  onOptionSelect={handleSelectTargetPort}
                  disabled={!targetDeviceId || !selectedSourcePort || targetPorts.length === 0}
                >
                  {targetPorts.map((option) => (
                    <Option key={option.id} value={option.id}>
                      {option.label}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Text className={styles.helper}>
                Apenas portas livres e compatíveis com a origem são listadas.
              </Text>
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              appearance="primary"
              onClick={handleConnect}
              disabled={!sourcePortId || !targetPortId || loading}
            >
              Conectar
            </Button>
            <Button appearance="subtle" onClick={onClose}>
              Cancelar
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
