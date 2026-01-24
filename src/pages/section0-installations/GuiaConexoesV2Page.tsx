import { useCallback, useEffect, useMemo, useState } from 'react';
import 'reactflow/dist/style.css';
import {
  Button,
  Dropdown,
  Option,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Save24Regular,
} from '@fluentui/react-icons';
import {
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from 'reactflow';
import { Cr22fProjetoService } from '../../generated/services/Cr22fProjetoService';
import { NewDeviceIOConnectionService, NewDeviceIOService } from '../../generated';
import { BlueprintCanvas } from '../../components/domain/guia-conexoes-v2/BlueprintCanvas';
import {
  ConnectionDetailsPanel,
  type ConnectionDetails,
} from '../../components/domain/guia-conexoes-v2/ConnectionDetailsPanel';
import { AddConnectionDialog } from '../../components/domain/guia-conexoes-v2/AddConnectionDialog';
import { EditDeviceLocationDialog } from '../../components/domain/guia-conexoes-v2/EditDeviceLocationDialog';
import { NovoEquipamentoDialog } from '../../components/domain/guia-conexoes/NovoEquipamentoDialog';
import {
  DeviceNode,
  type DeviceNodeData,
  type DevicePortData,
} from '../../components/domain/guia-conexoes-v2/nodes/DeviceNode';
import { applyAutoLayout } from '../../components/domain/guia-conexoes-v2/layout/elkLayout';
import {
  loadLayout,
  saveLayout,
} from '../../components/domain/guia-conexoes-v2/storage/layoutStorage';
import { useGuiaConexoesData } from '../../hooks/guia-conexoes/useGuiaConexoesData';
import type { GuiaDeviceIO, GuiaDeviceIOConnection } from '../../types/guiaConexoes';
import { resolveErrorMessage } from '../../utils/guia-conexoes/errors';
import { escapeODataValue } from '../../utils/guia-conexoes/odata';
import { clearDeviceIOConnectionLink, deleteDeviceWithConnections } from '../../utils/guia-conexoes/deleteDevice';
import { connectionDirectionOptions, connectionTypeOptions } from '../../utils/device-io/optionSetMaps';
import { SISTEMA_TIPO_LABELS } from '../../utils/guia-conexoes/systemTypes';
import { SearchableCombobox } from '../../components/shared/SearchableCombobox';
import { DisconnectedDevicesSidebar } from '../../components/domain/guia-conexoes-v2/DisconnectedDevicesSidebar.tsx';

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    gap: '16px',
    flexWrap: 'wrap',
  },
  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  headerControls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  headerField: {
    minWidth: '220px',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  content: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
  },
  canvasArea: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  statusText: {
    color: tokens.colorNeutralForeground3,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground2,
  },
});

const DIRECTION = {
  Input: 100000000,
  Output: 100000001,
  Bidirectional: 100000002,
  Bus: 100000003,
};

const CONNECTION_COLORS = [
  '#7aa2ff',
  '#a7f3d0',
  '#fca5a5',
  '#fbbf24',
  '#f472b6',
  '#60a5fa',
  '#34d399',
  '#f9a8d4',
  '#c084fc',
  '#f97316',
  '#84cc16',
  '#38bdf8',
  '#fda4af',
  '#a78bfa',
  '#fb7185',
  '#22d3ee',
  '#bef264',
  '#fde047',
  '#fca5a5',
  '#f87171',
  '#93c5fd',
];

const resolveConnectionIdFromHandle = (handleId?: string | null) => {
  if (!handleId) return null;
  const split = handleId.split(':');
  return split.length > 0 ? split[0] : handleId;
};

const getConnectionLabel = (connection: GuiaDeviceIOConnection) =>
  connection.new_name || connection.new_displayname || connection.new_tipodeconexaorawtext || 'Porta';

const buildDirectionMap = () => {
  const map = new Map<number, string>();
  for (const option of connectionDirectionOptions) {
    map.set(option.value, option.label);
  }
  return map;
};

const buildTypeMap = () => {
  const map = new Map<number, string>();
  const colorMap = new Map<number, string>();
  for (let index = 0; index < connectionTypeOptions.length; index += 1) {
    const option = connectionTypeOptions[index];
    map.set(option.value, option.label);
    colorMap.set(option.value, CONNECTION_COLORS[index % CONNECTION_COLORS.length]);
  }
  return { labelMap: map, colorMap };
};

const getDirectionFlags = (direction?: number | null) => {
  if (direction === DIRECTION.Input) {
    return { allowInput: true, allowOutput: false };
  }
  if (direction === DIRECTION.Output) {
    return { allowInput: false, allowOutput: true };
  }
  return { allowInput: true, allowOutput: true };
};

const getDirectionCode = (direction?: number | null) => {
  if (direction === DIRECTION.Input) return 'IN';
  if (direction === DIRECTION.Output) return 'OUT';
  return 'BI';
};

const isDirectionCompatible = (a?: number | null, b?: number | null) => {
  const check = (source?: number | null, target?: number | null) => {
    if (source === DIRECTION.Input) {
      return target === DIRECTION.Output || target === DIRECTION.Bidirectional || target === DIRECTION.Bus;
    }
    if (source === DIRECTION.Output) {
      return target === DIRECTION.Input || target === DIRECTION.Bidirectional || target === DIRECTION.Bus;
    }
    return true;
  };
  return check(a, b) && check(b, a);
};

const isTypeCompatible = (a?: number | null, b?: number | null) => {
  if (a === null || a === undefined || b === null || b === undefined) {
    return true;
  }
  return a === b;
};

const isConnectionCompatible = (a?: GuiaDeviceIOConnection | null, b?: GuiaDeviceIOConnection | null) => {
  if (!a || !b) return false;
  return isTypeCompatible(a.new_tipodeconexao, b.new_tipodeconexao) &&
    isDirectionCompatible(a.new_direcao, b.new_direcao);
};

const resolveEdgeEndpoints = (
  a: GuiaDeviceIOConnection,
  b: GuiaDeviceIOConnection,
  deviceDepths: Map<string, number>
) => {
  const aFlags = getDirectionFlags(a.new_direcao);
  const bFlags = getDirectionFlags(b.new_direcao);

  const canAtoB = aFlags.allowOutput && bFlags.allowInput;
  const canBtoA = bFlags.allowOutput && aFlags.allowInput;

  if (canAtoB && !canBtoA) return { source: a, target: b };
  if (canBtoA && !canAtoB) return { source: b, target: a };

  // Ambos os sentidos são possíveis (ex.: BI↔BI). Use a direção do nó raiz:
  // menor depth = mais perto do root (esquerda), maior depth = mais longe (direita).
  const aDeviceId = a._new_device_value ?? null;
  const bDeviceId = b._new_device_value ?? null;
  const aDepth = aDeviceId ? deviceDepths.get(aDeviceId) : undefined;
  const bDepth = bDeviceId ? deviceDepths.get(bDeviceId) : undefined;
  if (aDepth !== undefined && bDepth !== undefined && aDepth !== bDepth) {
    return aDepth < bDepth ? { source: a, target: b } : { source: b, target: a };
  }

  // Fallback determinístico.
  return { source: a, target: b };
};

type ProjectSearchRecord = {
  cr22f_projetoid: string;
  cr22f_apelido?: string | null;
  cr22f_ano?: string | null;
};

const formatProjectLabel = (project: ProjectSearchRecord) => {
  const parts: string[] = [];
  if (project.cr22f_apelido) parts.push(project.cr22f_apelido);
  if (project.cr22f_ano) parts.push(project.cr22f_ano);
  return parts.join(' · ') || 'Projeto';
};

export function GuiaConexoesV2Page() {
  const styles = useStyles();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectLabel, setSelectedProjectLabel] = useState('');
  const [rootDeviceId, setRootDeviceId] = useState<string | null>(null);
  const [selectedConnectionType, setSelectedConnectionType] = useState<string>('all');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectingHandleId, setConnectingHandleId] = useState<string | null>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [layoutViewport, setLayoutViewport] = useState<{ x: number; y: number; zoom: number } | null>(
    null
  );
  const [layoutPending, setLayoutPending] = useState(false);
  const [addConnectionOpen, setAddConnectionOpen] = useState(false);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [nodeShowAllPorts, setNodeShowAllPorts] = useState<Record<string, boolean>>({});
  const [sidebarDragPortId, setSidebarDragPortId] = useState<string | null>(null);
  const [hoveredHandleId, setHoveredHandleId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null>(null);
  const [locationEditDeviceId, setLocationEditDeviceId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingLink, setRemovingLink] = useState(false);
  const [linking, setLinking] = useState(false);

  const { devices, connections, modelos, loading, error, reload } = useGuiaConexoesData(
    selectedProjectId,
    '',
    ''
  );

  const { labelMap: connectionTypeLabelMap, colorMap: connectionTypeColorMap } = useMemo(
    () => buildTypeMap(),
    []
  );
  const connectionDirectionLabelMap = useMemo(() => buildDirectionMap(), []);

  const selectedConnectionTypeValue = useMemo(() => {
    if (selectedConnectionType === 'all') return null;
    const parsed = Number(selectedConnectionType);
    return Number.isNaN(parsed) ? null : parsed;
  }, [selectedConnectionType]);

  const selectedConnectionTypeLabel = useMemo(() => {
    if (selectedConnectionType === 'all') return 'Todas as conexões';
    if (selectedConnectionTypeValue === null || selectedConnectionTypeValue === undefined) {
      return 'Tipo de conexão';
    }
    return connectionTypeLabelMap.get(selectedConnectionTypeValue) ?? 'Tipo de conexão';
  }, [connectionTypeLabelMap, selectedConnectionType, selectedConnectionTypeValue]);

  const filteredConnections = useMemo(() => {
    if (selectedConnectionType === 'all') return connections;
    return connections.filter(
      (connection) => connection.new_tipodeconexao === selectedConnectionTypeValue
    );
  }, [connections, selectedConnectionType, selectedConnectionTypeValue]);

  const deviceMap = useMemo(() => {
    const map = new Map<string, GuiaDeviceIO>();
    for (const device of devices) {
      map.set(device.new_deviceioid, device);
    }
    return map;
  }, [devices]);

  const connectionsByDevice = useMemo(() => {
    const map = new Map<string, GuiaDeviceIOConnection[]>();
    for (const connection of filteredConnections) {
      const deviceId = connection._new_device_value;
      if (!deviceId) continue;
      const list = map.get(deviceId);
      if (list) {
        list.push(connection);
      } else {
        map.set(deviceId, [connection]);
      }
    }
    return map;
  }, [filteredConnections]);

  const connectionsById = useMemo(() => {
    const map = new Map<string, GuiaDeviceIOConnection>();
    for (const connection of filteredConnections) {
      map.set(connection.new_deviceioconnectionid, connection);
    }
    return map;
  }, [filteredConnections]);

  const modelosMap = useMemo(() => {
    const map = new Map<string, { new_tipodesistemapadrao?: number | null }>();
    modelos.forEach((modelo) => {
      map.set(modelo.cr22f_modelosdeprodutofromsharepointlistid, modelo);
    });
    return map;
  }, [modelos]);

  const connectedDeviceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const connection of filteredConnections) {
      if (!connection._new_connectedto_value || !connection._new_device_value) {
        continue;
      }
      ids.add(connection._new_device_value);
      const target = connectionsById.get(connection._new_connectedto_value);
      if (target && target._new_device_value) {
        ids.add(target._new_device_value);
      }
    }
    return ids;
  }, [filteredConnections, connectionsById]);

  const deviceDepths = useMemo(() => {
    if (!rootDeviceId) return new Map<string, number>();
    const adjacency = new Map<string, Set<string>>();
    connectedDeviceIds.forEach((id) => adjacency.set(id, new Set()));
    filteredConnections.forEach((connection) => {
      if (!connection._new_connectedto_value || !connection._new_device_value) return;
      const target = connectionsById.get(connection._new_connectedto_value);
      if (!target?._new_device_value) return;
      const sourceDeviceId = connection._new_device_value;
      const targetDeviceId = target._new_device_value;
      if (!connectedDeviceIds.has(sourceDeviceId) || !connectedDeviceIds.has(targetDeviceId)) return;
      adjacency.get(sourceDeviceId)?.add(targetDeviceId);
      adjacency.get(targetDeviceId)?.add(sourceDeviceId);
    });

    const depths = new Map<string, number>();
    const queue: string[] = [];
    if (connectedDeviceIds.has(rootDeviceId)) {
      depths.set(rootDeviceId, 0);
      queue.push(rootDeviceId);
    }
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      const currentDepth = depths.get(current) ?? 0;
      const neighbors = adjacency.get(current);
      if (!neighbors) continue;
      neighbors.forEach((neighbor) => {
        if (!depths.has(neighbor)) {
          depths.set(neighbor, currentDepth + 1);
          queue.push(neighbor);
        }
      });
    }
    return depths;
  }, [filteredConnections, connectionsById, connectedDeviceIds, rootDeviceId]);

  const connectedDeviceIdList = useMemo(() => {
    const list: string[] = [];
    for (const id of connectedDeviceIds) {
      list.push(id);
    }
    return list;
  }, [connectedDeviceIds]);

  const disconnectedDevices = useMemo(() => {
    const list: {
      id: string;
      name: string;
      location?: string | null;
      systemTypeValue?: string | null;
      systemTypeLabel?: string | null;
      ports: { id: string; label: string; directionCode: 'IN' | 'OUT' | 'BI'; typeLabel: string }[];
    }[] = [];
    for (const device of devices) {
      const deviceId = device.new_deviceioid;
      const deviceConnections = connectionsByDevice.get(deviceId) ?? [];
      const hasAnyLink = deviceConnections.some(
        (connection) => !!connection._new_connectedto_value || !!connection.new_connectedtomanual
      );
      if (hasAnyLink) continue;
      const ports = deviceConnections
        .filter(
          (connection) =>
            !connection._new_connectedto_value && !connection.new_connectedtomanual
        )
        .map((connection) => {
          const typeLabel =
            connection.new_tipodeconexao !== null && connection.new_tipodeconexao !== undefined
              ? connectionTypeLabelMap.get(connection.new_tipodeconexao) ?? 'Tipo'
              : connection.new_tipodeconexaorawtext || 'Tipo';
          const directionCode = getDirectionCode(connection.new_direcao) as 'IN' | 'OUT' | 'BI';
          return {
            id: connection.new_deviceioconnectionid,
            label: getConnectionLabel(connection),
            directionCode,
            typeLabel,
          };
        });
      if (ports.length === 0) continue;
      const modelId = device._new_modelodeproduto_value;
      const systemTypeValue =
        modelId && modelosMap.get(modelId)?.new_tipodesistemapadrao !== undefined
          ? String(modelosMap.get(modelId)?.new_tipodesistemapadrao ?? '')
          : null;
      const systemTypeLabel =
        modelId && modelosMap.get(modelId)?.new_tipodesistemapadrao !== undefined
          ? SISTEMA_TIPO_LABELS.get(modelosMap.get(modelId)?.new_tipodesistemapadrao ?? 0) ||
            `Tipo ${modelosMap.get(modelId)?.new_tipodesistemapadrao}`
          : 'Sem tipo de sistema';
      list.push({
        id: deviceId,
        name: device.new_name || 'Equipamento',
        location: device.new_localizacao,
        systemTypeValue: systemTypeValue || 'Sem tipo de sistema',
        systemTypeLabel,
        ports,
      });
    }
    return list;
  }, [connectionsByDevice, connectionTypeLabelMap, devices, modelosMap]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((device) => {
      const raw = device.new_localizacao?.trim();
      if (raw) {
        set.add(raw);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [devices]);

  const connectedDeviceKey = useMemo(() => {
    let key = '';
    for (const id of connectedDeviceIdList) {
      key += `${id}|`;
    }
    return key;
  }, [connectedDeviceIdList]);

  const connectedDeviceOptions = useMemo(() => {
    const options: { id: string; label: string }[] = [];
    for (const deviceId of connectedDeviceIdList) {
      const device = deviceMap.get(deviceId);
      if (!device) continue;
      const labelParts: string[] = [];
      if (device.new_name) labelParts.push(device.new_name);
      if (device.new_localizacao) labelParts.push(device.new_localizacao);
      const label = labelParts.join(' · ') || 'Equipamento';
      options.push({ id: deviceId, label });
    }
    return options;
  }, [connectedDeviceIdList, deviceMap]);

  const expandedNodes = useMemo(() => {
    const list: { id: string; spacing?: number; spacingX?: number; spacingY?: number }[] = [];
    Object.entries(nodeShowAllPorts).forEach(([deviceId, isExpanded]) => {
      const deviceConnections = connectionsByDevice.get(deviceId) ?? [];
      if (deviceConnections.length === 0) return;
      const connectedCount = deviceConnections.filter(
        (connection) => !!connection._new_connectedto_value
      ).length;
      const visibleCount = isExpanded ? deviceConnections.length : connectedCount;
      if (visibleCount <= 0) return;
      const dynamicSpacingY = Math.max(0, (visibleCount-3) * 24);
      const expandedSpacing = isExpanded ? visibleCount * 32 : 0;
      const spacingY = Math.max(dynamicSpacingY, expandedSpacing);
      if (spacingY <= 0) return;
      list.push({ id: deviceId, spacingX: 0, spacingY });
    });
    return list;
  }, [connectionsByDevice, nodeShowAllPorts]);

  const activeConnectionId = useMemo(
    () => resolveConnectionIdFromHandle(connectingHandleId),
    [connectingHandleId]
  );

  const activeConnection = useMemo(() => {
    if (!activeConnectionId) return null;
    return connectionsById.get(activeConnectionId) ?? null;
  }, [activeConnectionId, connectionsById]);

  const rootDeviceLabel = useMemo(() => {
    if (!rootDeviceId) return '';
    for (const option of connectedDeviceOptions) {
      if (option.id === rootDeviceId) {
        return option.label;
      }
    }
    return '';
  }, [connectedDeviceOptions, rootDeviceId]);

  const nodeTypes = useMemo(() => ({ device: DeviceNode }), []);

  const [nodes, setNodes] = useState<Node<DeviceNodeData>[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  useEffect(() => {
    setNodes((prevNodes) => {
      const prevMap = new Map<string, Node<DeviceNodeData>>();
      for (const node of prevNodes) {
        prevMap.set(node.id, node);
      }
      const nextNodes: Node<DeviceNodeData>[] = [];
      for (const deviceId of connectedDeviceIdList) {
        const device = deviceMap.get(deviceId);
        if (!device) continue;
        const existing = prevMap.get(deviceId);
        const currentPosition = existing?.position;
        const connectionsForDevice = connectionsByDevice.get(deviceId) ?? [];
        const ports: DevicePortData[] = [];
        for (const connection of connectionsForDevice) {
          const typeLabel =
            connection.new_tipodeconexao !== null && connection.new_tipodeconexao !== undefined
              ? connectionTypeLabelMap.get(connection.new_tipodeconexao) ?? 'Tipo'
              : connection.new_tipodeconexaorawtext || 'Tipo';
          const directionLabel =
            connection.new_direcao !== null && connection.new_direcao !== undefined
              ? connectionDirectionLabelMap.get(connection.new_direcao) ?? 'Direção'
              : connection.new_direcaorawtext || 'Direção';
          const isConnected = !!connection._new_connectedto_value;
          const isManual = !!connection.new_connectedtomanual;
          const connectable = !isConnected && !isManual;
          let state: DevicePortData['state'] = isManual ? 'manual' : isConnected ? 'connected' : 'free';
          if (activeConnection && connectable) {
            const compatible = isConnectionCompatible(activeConnection, connection);
            if (!compatible) {
              state = 'incompatible';
            }
          }
          const flags = getDirectionFlags(connection.new_direcao);
          const directionCode = getDirectionCode(connection.new_direcao);
          const highlight =
            !!activeConnection && connectable && isConnectionCompatible(activeConnection, connection);
          let side: DevicePortData['side'] = 'right';
          if (connection._new_connectedto_value) {
            const targetConnection = connectionsById.get(connection._new_connectedto_value);
            const targetDeviceId = targetConnection?._new_device_value ?? null;
            const targetPosition = targetDeviceId ? prevMap.get(targetDeviceId)?.position : undefined;
            if (currentPosition && targetPosition) {
              side = targetPosition.x < currentPosition.x ? 'left' : 'right';
            } else if (targetDeviceId && deviceDepths.has(targetDeviceId) && deviceDepths.has(deviceId)) {
              const currentDepth = deviceDepths.get(deviceId) ?? 0;
              const targetDepth = deviceDepths.get(targetDeviceId) ?? 0;
              side = targetDepth < currentDepth ? 'left' : 'right';
            }
          }
          ports.push({
            id: connection.new_deviceioconnectionid,
            label: getConnectionLabel(connection),
            typeLabel,
            directionLabel,
            direction: connection.new_direcao,
            directionCode,
            side,
            state,
            isConnectable: connectable,
            highlight,
            allowInput: flags.allowInput,
            allowOutput: flags.allowOutput,
          });
        }
        const showAllPorts = nodeShowAllPorts[deviceId] ?? false;
        const visiblePorts = showAllPorts
          ? ports
          : ports.filter((port) => port.state === 'connected');
        const position = existing?.position || ({ x: 0, y: 0 } as { x: number; y: number });
        nextNodes.push({
          id: deviceId,
          type: 'device',
          position,
          zIndex: 0,
          data: {
            title: device.new_name || 'Equipamento',
            locationLabel: device.new_localizacao || 'Sem localização',
            ports: visiblePorts,
            showAllPorts,
            onToggleShowAll: () => {
              setNodeShowAllPorts((prev) => ({
                ...prev,
                [deviceId]: !(prev[deviceId] ?? false),
              }));
              setLayoutPending(true);
            },
            onDelete: () => handleDeleteDevice(deviceId, device.new_name),
            onEditLocation: (id) => setLocationEditDeviceId(id),
          },
        });
      }
      return nextNodes;
    });
  }, [
    connectedDeviceIdList,
    connectionsByDevice,
    deviceMap,
    connectionDirectionLabelMap,
    connectionTypeLabelMap,
    activeConnection,
    connectionsById,
    deviceDepths,
    nodeShowAllPorts,
    setNodes,
  ]);

  useEffect(() => {
    const nextEdges: Edge[] = [];
    const dedupe = new Set<string>();
    for (const connection of filteredConnections) {
      const connectedId = connection._new_connectedto_value;
      if (!connectedId) continue;
      const target = connectionsById.get(connectedId);
      if (!target) continue;
      if (!connection._new_device_value || !target._new_device_value) continue;
      if (!connectedDeviceIds.has(connection._new_device_value)) continue;
      if (!connectedDeviceIds.has(target._new_device_value)) continue;
      const key = [connection.new_deviceioconnectionid, connectedId].sort().join('|');
      if (dedupe.has(key)) continue;
      dedupe.add(key);
      const typeLabel =
        connection.new_tipodeconexao !== null && connection.new_tipodeconexao !== undefined
          ? connectionTypeLabelMap.get(connection.new_tipodeconexao) ?? 'Tipo'
          : connection.new_tipodeconexaorawtext || 'Tipo';
      const edgeColor =
        connection.new_tipodeconexao !== null && connection.new_tipodeconexao !== undefined
          ? connectionTypeColorMap.get(connection.new_tipodeconexao) ?? '#7aa2ff'
          : '#7aa2ff';
      const endpoints = resolveEdgeEndpoints(connection, target, deviceDepths);
      const sourceDeviceId = endpoints.source._new_device_value;
      const targetDeviceId = endpoints.target._new_device_value;
      if (!sourceDeviceId || !targetDeviceId) continue;
      nextEdges.push({
        id: `edge:${key}`,
        source: sourceDeviceId,
        target: targetDeviceId,
        sourceHandle: `${endpoints.source.new_deviceioconnectionid}:out`,
        targetHandle: `${endpoints.target.new_deviceioconnectionid}:in`,
        style: { stroke: edgeColor },
        zIndex: 5,
        data: {
          sourceConnectionId: endpoints.source.new_deviceioconnectionid,
          targetConnectionId: endpoints.target.new_deviceioconnectionid,
          typeLabel,
        },
      });
    }
    setEdges(nextEdges);
  }, [
    filteredConnections,
    connectionsById,
    connectedDeviceIds,
    connectionTypeLabelMap,
    connectionTypeColorMap,
    deviceDepths,
    setEdges,
  ]);

  useEffect(() => {
    if (flowInstance && layoutViewport) {
      flowInstance.setViewport(layoutViewport);
    }
  }, [flowInstance, layoutViewport]);

  useEffect(() => {
    if (!selectedProjectId) {
      setLayoutViewport(null);
      return;
    }
    const stored = loadLayout(selectedProjectId);
    if (stored) {
      setLayoutViewport(stored.viewport || null);
    } else {
      setLayoutViewport(null);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (connectedDeviceIdList.length === 0) {
      setRootDeviceId(null);
      return;
    }
    const rootDevice = devices.find((device) => device.new_raiz);
    if (rootDevice?.new_deviceioid) {
      if (rootDeviceId !== rootDevice.new_deviceioid) {
        setRootDeviceId(rootDevice.new_deviceioid);
      }
      return;
    }
    if (rootDeviceId && connectedDeviceIds.has(rootDeviceId)) {
      return;
    }
    setRootDeviceId(connectedDeviceIdList[0]);
  }, [connectedDeviceIdList, connectedDeviceIds, devices, rootDeviceId]);

  useEffect(() => {
    if (connectedDeviceIdList.length === 0) {
      setLayoutPending(false);
      return;
    }
    setLayoutPending(true);
  }, [connectedDeviceKey, edges.length, rootDeviceId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    const viewport = flowInstance?.getViewport() ?? { x: 0, y: 0, zoom: 1 };
    saveLayout(selectedProjectId, { viewport });
  }, [flowInstance, selectedProjectId]);

  const searchProjects = useCallback(async (term: string) => {
    const normalized = term.trim();
    const filter =
      normalized.length >= 2
        ? `statecode eq 0 and contains(cr22f_apelido, '${escapeODataValue(normalized)}')`
        : 'statecode eq 0';

    const result = await Cr22fProjetoService.getAll({
      select: ['cr22f_projetoid', 'cr22f_apelido', 'cr22f_ano'],
      filter,
      orderBy: ['cr22f_apelido asc'],
      top: 50,
    });

    if (!result.success || !result.data) {
      return [];
    }

    const options: { id: string; label: string }[] = [];
    for (const item of result.data as ProjectSearchRecord[]) {
      if (!item.cr22f_projetoid) continue;
      options.push({
        id: item.cr22f_projetoid,
        label: formatProjectLabel(item),
      });
    }
    return options;
  }, []);

  const updateRootDevice = useCallback(
    async (nextRootId: string | null) => {
      if (!selectedProjectId || !nextRootId) return;
      if (nextRootId === rootDeviceId) return;
      setActionError(null);
      setRootDeviceId(nextRootId);
      try {
        const rootResult = await NewDeviceIOService.getAll({
          select: ['new_deviceioid'],
          filter: `statecode eq 0 and _new_projeto_value eq ${escapeODataValue(
            selectedProjectId
          )} and new_raiz eq true`,
          maxPageSize: 5000,
        });
        if (!rootResult.success) {
          throw new Error(
            resolveErrorMessage(rootResult.error, 'Falha ao buscar raiz atual.')
          );
        }
        const currentRootIds = (rootResult.data ?? [])
          .map((item) => (item as { new_deviceioid?: string }).new_deviceioid)
          .filter((id) => id && id !== nextRootId) as string[];

        const updates: Promise<unknown>[] = [];
        currentRootIds.forEach((id) => {
          updates.push(NewDeviceIOService.update(id, { new_raiz: false }));
        });
        updates.push(NewDeviceIOService.update(nextRootId, { new_raiz: true }));
        const results = await Promise.all(updates);
        const failed = results.filter(
          (result) => (result as { success?: boolean }).success === false
        );
        if (failed.length > 0) {
          throw new Error('Falha ao atualizar raiz no Dataverse.');
        }

        await reload();
        setLayoutPending(true);
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'Falha ao salvar raiz.'));
      }
    },
    [reload, rootDeviceId, selectedProjectId]
  );

  const handleSaveLocation = useCallback(
    async (deviceId: string, nextLocation: string) => {
      if (!deviceId) return;
      setActionError(null);
      const payload = {
        new_localizacao: nextLocation ? nextLocation : undefined,
      };
      const result = await NewDeviceIOService.update(deviceId, payload);
      if (!result.success) {
        throw new Error(resolveErrorMessage(result.error, 'Falha ao salvar localização.'));
      }
      await reload();
      setLayoutPending(true);
    },
    [reload]
  );

  const handleSaveLayout = useCallback(() => {
    if (!selectedProjectId) return;
    const viewport = flowInstance?.getViewport() ?? { x: 0, y: 0, zoom: 1 };
    saveLayout(selectedProjectId, {
      viewport,
    });
  }, [flowInstance, selectedProjectId]);

  useEffect(() => {
    if (!layoutPending) return;
    if (nodes.length === 0) {
      setLayoutPending(false);
      return;
    }
    let isActive = true;
    const runLayout = async () => {
      const next = await applyAutoLayout(nodes, edges, rootDeviceId, expandedNodes);
      if (isActive) {
        setNodes(next);
        setLayoutPending(false);
      }
    };
    void runLayout();
    return () => {
      isActive = false;
    };
  }, [edges, expandedNodes, layoutPending, nodes, rootDeviceId, setNodes]);

  const linkPorts = useCallback(
    async (sourcePortId: string, targetPortId: string) => {
      if (sourcePortId === targetPortId) return;
      const sourceConnection = connectionsById.get(sourcePortId);
      const targetConnection = connectionsById.get(targetPortId);
      if (!sourceConnection || !targetConnection) return;
      const sourceConnected =
        !!sourceConnection._new_connectedto_value || !!sourceConnection.new_connectedtomanual;
      const targetConnected =
        !!targetConnection._new_connectedto_value || !!targetConnection.new_connectedtomanual;
      if (sourceConnected || targetConnected) {
        setActionError('Uma das portas já está conectada.');
        return;
      }
      if (!isConnectionCompatible(sourceConnection, targetConnection)) {
        setActionError('Conexões incompatíveis.');
        return;
      }

      setLinking(true);
      setActionError(null);
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
          throw new Error(
            resolveErrorMessage(resultA.error, 'Falha ao vincular conexão A.')
          );
        }
        const resultB = await NewDeviceIOConnectionService.update(targetPortId, payloadB);
        if (!resultB.success) {
          throw new Error(
            resolveErrorMessage(resultB.error, 'Falha ao vincular conexão B.')
          );
        }
        await reload();
        setLayoutPending(true);
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'Falha ao vincular conexões.'));
      } finally {
        setLinking(false);
      }
    },
    [connectionsById, reload]
  );

  const handleConnect = useCallback(
    async (params: Connection) => {
      if (!params.sourceHandle || !params.targetHandle) return;
      const sourceId = resolveConnectionIdFromHandle(params.sourceHandle);
      const targetId = resolveConnectionIdFromHandle(params.targetHandle);
      if (!sourceId || !targetId) return;
      await linkPorts(sourceId, targetId);
    },
    [linkPorts]
  );

  const handleDeleteDevice = useCallback(
    async (deviceId: string, deviceName?: string | null) => {
      const confirm = window.confirm(
        `Deseja remover o equipamento${deviceName ? ` "${deviceName}"` : ''} e todas as conexões?`
      );
      if (!confirm) return;
      setActionError(null);
      try {
        await deleteDeviceWithConnections(deviceId);
        await reload();
        setLayoutPending(true);
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'Falha ao remover equipamento.'));
      }
    },
    [reload]
  );

  const handleRemoveLink = useCallback(
    async (edge: Edge) => {
      const sourceId = edge.data?.sourceConnectionId as string | undefined;
      const targetId = edge.data?.targetConnectionId as string | undefined;
      if (!sourceId) return;
      setRemovingLink(true);
      setActionError(null);
      try {
        await clearDeviceIOConnectionLink(sourceId, targetId);
        await reload();
        setLayoutPending(true);
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'Falha ao remover vínculo.'));
      } finally {
        setRemovingLink(false);
      }
    },
    [reload]
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (!('sourceHandle' in connection) || !('targetHandle' in connection)) {
        return false;
      }
      if (!connection.sourceHandle || !connection.targetHandle) return false;
      const sourceId = resolveConnectionIdFromHandle(connection.sourceHandle);
      const targetId = resolveConnectionIdFromHandle(connection.targetHandle);
      if (!sourceId || !targetId) return false;
      if (sourceId === targetId) return false;
      const sourceConnection = connectionsById.get(sourceId);
      const targetConnection = connectionsById.get(targetId);
      if (!sourceConnection || !targetConnection) return false;
      const sourceConnected = !!sourceConnection._new_connectedto_value || !!sourceConnection.new_connectedtomanual;
      const targetConnected = !!targetConnection._new_connectedto_value || !!targetConnection.new_connectedtomanual;
      if (sourceConnected || targetConnected) return false;
      return isConnectionCompatible(sourceConnection, targetConnection);
    },
    [connectionsById]
  );

  const handleSidebarPortMouseUp = useCallback(
    async (portId: string) => {
      if (!connectingHandleId) return;
      const sourcePortId = resolveConnectionIdFromHandle(connectingHandleId);
      if (!sourcePortId) return;
      await linkPorts(sourcePortId, portId);
      setConnectingHandleId(null);
    },
    [connectingHandleId, linkPorts]
  );

  const handleSidebarPortMouseDown = useCallback((portId: string) => {
    setSidebarDragPortId(portId);
  }, []);

  useEffect(() => {
    if (!sidebarDragPortId) return;
    const handleMouseMove = (event: MouseEvent) => {
      const wrapper = document.querySelector('[data-blueprint-wrapper="true"]') as HTMLElement | null;
      if (!wrapper) {
        setDragPreview(null);
        return;
      }
      const wrapperRect = wrapper.getBoundingClientRect();
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const handleEl =
        (element?.closest('[data-handleid]') as HTMLElement | null) ??
        (element?.closest('.react-flow__handle') as HTMLElement | null);
      const handleId =
        handleEl?.getAttribute('data-handleid') ??
        handleEl?.dataset.handleid ??
        handleEl?.dataset.handleId ??
        null;
      setHoveredHandleId(handleId);

      let startX = event.clientX - wrapperRect.left;
      let startY = event.clientY - wrapperRect.top;
      if (handleEl) {
        const handleRect = handleEl.getBoundingClientRect();
        startX = handleRect.left + handleRect.width / 2 - wrapperRect.left;
        startY = handleRect.top + handleRect.height / 2 - wrapperRect.top;
      } else {
        startX = Math.max(12, Math.min(event.clientX - wrapperRect.left, wrapperRect.width - 12));
        startY = Math.max(12, Math.min(event.clientY - wrapperRect.top, wrapperRect.height - 12));
      }
      const endX = event.clientX - wrapperRect.left;
      const endY = event.clientY - wrapperRect.top;
      setDragPreview({
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
      });
    };
    const handleMouseUp = () => {
      if (hoveredHandleId) {
        const targetPortId = resolveConnectionIdFromHandle(hoveredHandleId);
        if (targetPortId) {
          void linkPorts(sidebarDragPortId, targetPortId);
        }
      }
      setHoveredHandleId(null);
      setSidebarDragPortId(null);
      setDragPreview(null);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setDragPreview(null);
    };
  }, [hoveredHandleId, linkPorts, sidebarDragPortId]);

  const connectionDetails: ConnectionDetails | null = useMemo(() => {
    if (!selectedEdgeId) return null;
    let selectedEdge: Edge | null = null;
    for (const edge of edges) {
      if (edge.id === selectedEdgeId) {
        selectedEdge = edge;
        break;
      }
    }
    if (!selectedEdge) return null;
    const sourceId = selectedEdge.data?.sourceConnectionId as string | undefined;
    const targetId = selectedEdge.data?.targetConnectionId as string | undefined;
    if (!sourceId || !targetId) return null;
    const sourceConnection = connectionsById.get(sourceId);
    const targetConnection = connectionsById.get(targetId);
    if (!sourceConnection || !targetConnection) return null;
    const sourceDevice = sourceConnection._new_device_value
      ? deviceMap.get(sourceConnection._new_device_value)
      : null;
    const targetDevice = targetConnection._new_device_value
      ? deviceMap.get(targetConnection._new_device_value)
      : null;
    const sourceLabel = `${sourceDevice?.new_name || 'Equipamento'} · ${getConnectionLabel(
      sourceConnection
    )} · ${sourceDevice?.new_localizacao || 'Sem localização'}`;
    const targetLabel = `${targetDevice?.new_name || 'Equipamento'} · ${getConnectionLabel(
      targetConnection
    )} · ${targetDevice?.new_localizacao || 'Sem localização'}`;
    return {
      id: selectedEdge.id,
      sourceLabel,
      targetLabel,
      typeLabel: selectedEdge.data?.typeLabel as string | undefined,
    };
  }, [selectedEdgeId, edges, connectionsById, deviceMap]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Text size={500} weight="semibold">
            Guia de Conexões v2
          </Text>
        </div>
        <div className={styles.headerControls}>
          <div className={styles.headerField}>
            <SearchableCombobox
              placeholder="Selecionar projeto"
              value={selectedProjectLabel}
              selectedId={selectedProjectId}
              onSelect={(id, label) => {
                setSelectedProjectId(id);
                setSelectedProjectLabel(label);
                setLayoutViewport(null);
                setRootDeviceId(null);
              }}
              onSearch={searchProjects}
              showAllOnFocus={true}
            />
          </div>
          <div className={styles.headerField}>
            <Dropdown
              placeholder="Tipo de conexão"
              value={selectedConnectionTypeLabel}
              selectedOptions={[selectedConnectionType]}
              onOptionSelect={(_, data) => {
                setSelectedConnectionType((data.optionValue as string) || 'all');
                setLayoutPending(true);
              }}
              disabled={!selectedProjectId || connections.length === 0}
            >
              <Option value="all">Todas as conexões</Option>
              {connectionTypeOptions.map((option) => (
                <Option key={option.value} value={`${option.value}`}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </div>
          <div className={styles.headerField}>
            <Dropdown
              placeholder="Selecionar nó raiz"
              value={rootDeviceLabel}
              selectedOptions={rootDeviceId ? [rootDeviceId] : []}
              onOptionSelect={(_, data) =>
                updateRootDevice((data.optionValue as string) || null)
              }
              disabled={!selectedProjectId || connectedDeviceOptions.length === 0}
            >
              {connectedDeviceOptions.map((option) => (
                <Option key={option.id} value={option.id}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </div>
        </div>
        <div className={styles.headerActions}>
          {actionError && <Text className={styles.errorText}>{actionError}</Text>}
          {loading && (
            <Text size={200} className={styles.statusText}>
              Carregando...
            </Text>
          )}
          {error && <Text className={styles.errorText}>{error}</Text>}
          <Button
            icon={<Add24Regular />}
            onClick={() => setAddConnectionOpen(true)}
            disabled={!selectedProjectId}
          >
            Adicionar Conexão
          </Button>
          <Button
            appearance="primary"
            icon={<Save24Regular />}
            onClick={handleSaveLayout}
            disabled={!selectedProjectId}
          >
            Salvar
          </Button>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.canvasArea}>
          <BlueprintCanvas
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onConnectStart={(_, data) => setConnectingHandleId(data.handleId ?? null)}
            onConnectEnd={(event) => {
              if (event && event.target instanceof HTMLElement && connectingHandleId) {
                const targetEl = event.target.closest('[data-sidebar-port-id]') as HTMLElement | null;
                const sidebarPortId = targetEl?.dataset.sidebarPortId;
                if (sidebarPortId) {
                  const sourcePortId = resolveConnectionIdFromHandle(connectingHandleId);
                  if (sourcePortId) {
                    void linkPorts(sourcePortId, sidebarPortId);
                  }
                }
              }
              setConnectingHandleId(null);
            }}
            onSelectionChange={({ edges: selectedEdges }) => {
              const first = selectedEdges[0];
              setSelectedEdgeId(first?.id ?? null);
            }}
            onEdgesDelete={(deleted) => {
              deleted.forEach((edge) => void handleRemoveLink(edge));
            }}
            isValidConnection={isValidConnection}
            onInit={setFlowInstance}
            isEmpty={connectedDeviceIdList.length === 0}
            panOnDragEnabled={!connectingHandleId && !sidebarDragPortId}
            dragPreview={dragPreview}
          />
          <ConnectionDetailsPanel
            details={connectionDetails}
            onRemove={() => {
              if (!connectionDetails) return;
              let edge: Edge | null = null;
              for (const item of edges) {
                if (item.id === connectionDetails.id) {
                  edge = item;
                  break;
                }
              }
              if (edge) {
                void handleRemoveLink(edge);
              }
            }}
            removing={removingLink || linking}
          />
        </div>
        <DisconnectedDevicesSidebar
          devices={disconnectedDevices}
          isConnecting={!!connectingHandleId}
          onPortMouseDown={handleSidebarPortMouseDown}
          onPortMouseUp={handleSidebarPortMouseUp}
          onEditLocation={(deviceId) => setLocationEditDeviceId(deviceId)}
          onDeleteDevice={handleDeleteDevice}
          onAddDevice={() => setAddDeviceOpen(true)}
        />
      </div>
      <AddConnectionDialog
        open={addConnectionOpen}
        projectId={selectedProjectId}
        onClose={() => setAddConnectionOpen(false)}
        onLinked={async () => {
          await reload();
          setLayoutPending(true);
        }}
      />
      <NovoEquipamentoDialog
        open={addDeviceOpen}
        projectId={selectedProjectId}
        onClose={() => setAddDeviceOpen(false)}
        onCreated={async () => {
          await reload();
          setLayoutPending(true);
        }}
      />
      <EditDeviceLocationDialog
        open={!!locationEditDeviceId}
        deviceName={locationEditDeviceId ? deviceMap.get(locationEditDeviceId)?.new_name : undefined}
        currentLocation={
          locationEditDeviceId ? deviceMap.get(locationEditDeviceId)?.new_localizacao : undefined
        }
        locationOptions={locationOptions}
        onClose={() => setLocationEditDeviceId(null)}
        onSave={(nextLocation) =>
          locationEditDeviceId
            ? handleSaveLocation(locationEditDeviceId, nextLocation)
            : Promise.resolve()
        }
      />
    </div>
  );
}
