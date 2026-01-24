import { useCallback, useEffect, useMemo, useState } from 'react';
import 'reactflow/dist/style.css';
import {
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
import {
  Checkmark24Regular,
  Flowchart24Regular,
  FullScreenMaximize24Regular,
  Save24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import {
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from 'reactflow';
import { Cr22fProjetoService } from '../../generated/services/Cr22fProjetoService';
import { NewDeviceIOConnectionService } from '../../generated';
import { EquipmentPalette } from '../../components/domain/guia-conexoes-v2/EquipmentPalette';
import { BlueprintCanvas } from '../../components/domain/guia-conexoes-v2/BlueprintCanvas';
import {
  ConnectionDetailsPanel,
  type ConnectionDetails,
} from '../../components/domain/guia-conexoes-v2/ConnectionDetailsPanel';
import {
  DeviceNode,
  type DeviceNodeData,
  type DevicePortData,
} from '../../components/domain/guia-conexoes-v2/nodes/DeviceNode';
import { applyAutoLayout } from '../../components/domain/guia-conexoes-v2/layout/elkLayout';
import {
  loadLayout,
  saveLayout,
  type GuiaConexoesV2Layout,
} from '../../components/domain/guia-conexoes-v2/storage/layoutStorage';
import { useGuiaConexoesData } from '../../hooks/guia-conexoes/useGuiaConexoesData';
import type { GuiaDeviceIO, GuiaDeviceIOConnection, GuiaModeloProduto } from '../../types/guiaConexoes';
import { resolveErrorMessage } from '../../utils/guia-conexoes/errors';
import { escapeODataValue } from '../../utils/guia-conexoes/odata';
import { clearDeviceIOConnectionLink } from '../../utils/guia-conexoes/deleteDevice';
import { connectionDirectionOptions, connectionTypeOptions } from '../../utils/device-io/optionSetMaps';

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
  },
  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
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

const resolveEdgeEndpoints = (a: GuiaDeviceIOConnection, b: GuiaDeviceIOConnection) => {
  const aFlags = getDirectionFlags(a.new_direcao);
  const bFlags = getDirectionFlags(b.new_direcao);

  if (aFlags.allowOutput && bFlags.allowInput) {
    return { source: a, target: b };
  }
  if (bFlags.allowOutput && aFlags.allowInput) {
    return { source: b, target: a };
  }
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
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [autoLayoutEnabled, setAutoLayoutEnabled] = useState(true);
  const [layoutPositions, setLayoutPositions] = useState<Record<string, { x: number; y: number }>>(
    {}
  );
  const [canvasDeviceIds, setCanvasDeviceIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectingHandleId, setConnectingHandleId] = useState<string | null>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [layoutViewport, setLayoutViewport] = useState<{ x: number; y: number; zoom: number } | null>(
    null
  );
  const [autoLayoutPending, setAutoLayoutPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingLink, setRemovingLink] = useState(false);
  const [linking, setLinking] = useState(false);

  const { devices, connections, modelos, loading, error, reload } = useGuiaConexoesData(
    selectedProjectId,
    searchTerm,
    locationFilter
  );

  const { labelMap: connectionTypeLabelMap, colorMap: connectionTypeColorMap } = useMemo(
    () => buildTypeMap(),
    []
  );
  const connectionDirectionLabelMap = useMemo(() => buildDirectionMap(), []);

  const modelosMap = useMemo(() => {
    const map = new Map<string, GuiaModeloProduto>();
    for (const modelo of modelos) {
      map.set(modelo.cr22f_modelosdeprodutofromsharepointlistid, modelo);
    }
    return map;
  }, [modelos]);

  const deviceMap = useMemo(() => {
    const map = new Map<string, GuiaDeviceIO>();
    for (const device of devices) {
      map.set(device.new_deviceioid, device);
    }
    return map;
  }, [devices]);

  const connectionsByDevice = useMemo(() => {
    const map = new Map<string, GuiaDeviceIOConnection[]>();
    for (const connection of connections) {
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
  }, [connections]);

  const connectionsById = useMemo(() => {
    const map = new Map<string, GuiaDeviceIOConnection>();
    for (const connection of connections) {
      map.set(connection.new_deviceioconnectionid, connection);
    }
    return map;
  }, [connections]);

  const canvasDeviceIdSet = useMemo(() => new Set(canvasDeviceIds), [canvasDeviceIds]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    for (const device of devices) {
      if (device.new_localizacao) {
        set.add(device.new_localizacao);
      }
    }
    return Array.from(set.values());
  }, [devices]);

  const activeConnectionId = useMemo(
    () => resolveConnectionIdFromHandle(connectingHandleId),
    [connectingHandleId]
  );

  const activeConnection = useMemo(() => {
    if (!activeConnectionId) return null;
    return connectionsById.get(activeConnectionId) ?? null;
  }, [activeConnectionId, connectionsById]);

  const nodeTypes = useMemo(() => ({ device: DeviceNode }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<DeviceNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    setNodes((prevNodes) => {
      const prevMap = new Map<string, Node<DeviceNodeData>>();
      for (const node of prevNodes) {
        prevMap.set(node.id, node);
      }
      const nextNodes: Node<DeviceNodeData>[] = [];
      for (const deviceId of canvasDeviceIds) {
        const device = deviceMap.get(deviceId);
        if (!device) continue;
        const existing = prevMap.get(deviceId);
        const model = device._new_modelodeproduto_value
          ? modelosMap.get(device._new_modelodeproduto_value)
          : null;
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
          ports.push({
            id: connection.new_deviceioconnectionid,
            label: getConnectionLabel(connection),
            typeLabel,
            directionLabel,
            direction: connection.new_direcao,
            state,
            isConnectable: connectable,
            allowInput: flags.allowInput,
            allowOutput: flags.allowOutput,
          });
        }
        const position =
          existing?.position ||
          layoutPositions[deviceId] ||
          ({ x: 0, y: 0 } as { x: number; y: number });
        nextNodes.push({
          id: deviceId,
          type: 'device',
          position,
          data: {
            title: device.new_name || 'Equipamento',
            modelLabel: model?.cr22f_title || model?.cr22f_id || 'Modelo',
            locationLabel: device.new_localizacao || 'Sem localização',
            ports,
          },
          draggable: true,
          dragHandle: '.device-node__header',
        });
      }
      return nextNodes;
    });
  }, [
    canvasDeviceIds,
    connectionsByDevice,
    deviceMap,
    modelosMap,
    connectionDirectionLabelMap,
    connectionTypeLabelMap,
    activeConnection,
    layoutPositions,
    setNodes,
  ]);

  useEffect(() => {
    const nextEdges: Edge[] = [];
    const dedupe = new Set<string>();
    for (const connection of connections) {
      const connectedId = connection._new_connectedto_value;
      if (!connectedId) continue;
      const target = connectionsById.get(connectedId);
      if (!target) continue;
      if (!connection._new_device_value || !target._new_device_value) continue;
      if (!canvasDeviceIdSet.has(connection._new_device_value)) continue;
      if (!canvasDeviceIdSet.has(target._new_device_value)) continue;
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
      const endpoints = resolveEdgeEndpoints(connection, target);
      const sourceDeviceId = endpoints.source._new_device_value;
      const targetDeviceId = endpoints.target._new_device_value;
      if (!sourceDeviceId || !targetDeviceId) continue;
      nextEdges.push({
        id: `edge:${key}`,
        source: sourceDeviceId,
        target: targetDeviceId,
        sourceHandle: `${endpoints.source.new_deviceioconnectionid}:out`,
        targetHandle: `${endpoints.target.new_deviceioconnectionid}:in`,
        label: `${getConnectionLabel(connection)} ↔ ${getConnectionLabel(target)}`,
        style: { stroke: edgeColor },
        labelStyle: { fill: edgeColor, fontSize: 12 },
        data: {
          sourceConnectionId: endpoints.source.new_deviceioconnectionid,
          targetConnectionId: endpoints.target.new_deviceioconnectionid,
          typeLabel,
        },
      });
    }
    setEdges(nextEdges);
  }, [connections, connectionsById, canvasDeviceIdSet, connectionTypeLabelMap, connectionTypeColorMap, setEdges]);

  useEffect(() => {
    if (flowInstance && layoutViewport) {
      flowInstance.setViewport(layoutViewport);
    }
  }, [flowInstance, layoutViewport]);

  useEffect(() => {
    if (!selectedProjectId) {
      setCanvasDeviceIds([]);
      setLayoutPositions({});
      setLayoutViewport(null);
      setAutoLayoutEnabled(true);
      return;
    }
    const stored = loadLayout(selectedProjectId);
    if (stored) {
      setCanvasDeviceIds(stored.canvasDeviceIds || []);
      setLayoutPositions(stored.nodePositions || {});
      setLayoutViewport(stored.viewport || null);
      setAutoLayoutEnabled(stored.autoLayoutEnabled ?? true);
    } else {
      setCanvasDeviceIds([]);
      setLayoutPositions({});
      setLayoutViewport(null);
      setAutoLayoutEnabled(true);
    }
  }, [selectedProjectId]);

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

  const handleSaveLayout = useCallback(() => {
    if (!selectedProjectId) return;
    const nodePositions: GuiaConexoesV2Layout['nodePositions'] = {};
    for (const node of nodes) {
      nodePositions[node.id] = { x: node.position.x, y: node.position.y };
    }
    const viewport = flowInstance?.getViewport() ?? { x: 0, y: 0, zoom: 1 };
    saveLayout(selectedProjectId, {
      canvasDeviceIds,
      nodePositions,
      viewport,
      autoLayoutEnabled,
    });
  }, [autoLayoutEnabled, canvasDeviceIds, flowInstance, nodes, selectedProjectId]);

  const handleApplyAutoLayout = useCallback(async () => {
    const next = await applyAutoLayout(nodes, edges);
    setNodes(next);
  }, [edges, nodes, setNodes]);

  useEffect(() => {
    if (!autoLayoutEnabled || !autoLayoutPending) return;
    if (nodes.length === 0) {
      setAutoLayoutPending(false);
      return;
    }
    let isActive = true;
    const runLayout = async () => {
      const next = await applyAutoLayout(nodes, edges);
      if (isActive) {
        setNodes(next);
        setAutoLayoutPending(false);
      }
    };
    void runLayout();
    return () => {
      isActive = false;
    };
  }, [autoLayoutEnabled, autoLayoutPending, edges, nodes, setNodes]);

  const handleDropDevice = useCallback(
    (deviceId: string, position: { x: number; y: number }) => {
      if (canvasDeviceIdSet.has(deviceId)) return;
      setCanvasDeviceIds((prev) => [...prev, deviceId]);
      setLayoutPositions((prev) => ({ ...prev, [deviceId]: position }));
      if (autoLayoutEnabled) {
        setAutoLayoutPending(true);
      }
    },
    [autoLayoutEnabled, canvasDeviceIdSet]
  );

  const handleConnect = useCallback(
    async (params: Connection) => {
      if (!params.sourceHandle || !params.targetHandle) return;
      const sourceId = resolveConnectionIdFromHandle(params.sourceHandle);
      const targetId = resolveConnectionIdFromHandle(params.targetHandle);
      if (!sourceId || !targetId) return;
      if (sourceId === targetId) return;
      setLinking(true);
      setActionError(null);
      try {
        const payloadA = {
          'new_ConnectedTo@odata.bind': `/new_deviceioconnections(${targetId})`,
          new_connectedtomanual: null,
        } as unknown as Record<string, unknown>;
        const payloadB = {
          'new_ConnectedTo@odata.bind': `/new_deviceioconnections(${sourceId})`,
          new_connectedtomanual: null,
        } as unknown as Record<string, unknown>;
        const resultA = await NewDeviceIOConnectionService.update(sourceId, payloadA);
        if (!resultA.success) {
          throw new Error(
            resolveErrorMessage(resultA.error, 'Falha ao vincular conexão A.')
          );
        }
        const resultB = await NewDeviceIOConnectionService.update(targetId, payloadB);
        if (!resultB.success) {
          throw new Error(
            resolveErrorMessage(resultB.error, 'Falha ao vincular conexão B.')
          );
        }
        await reload();
        if (autoLayoutEnabled) {
          setAutoLayoutPending(true);
        }
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'Falha ao vincular conexões.'));
      } finally {
        setLinking(false);
      }
    },
    [autoLayoutEnabled, handleApplyAutoLayout, reload]
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
        if (autoLayoutEnabled) {
          setAutoLayoutPending(true);
        }
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'Falha ao remover vínculo.'));
      } finally {
        setRemovingLink(false);
      }
    },
    [autoLayoutEnabled, handleApplyAutoLayout, reload]
  );

  const isValidConnection = useCallback(
    (connection: Connection) => {
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
          {selectedProjectLabel && (
            <Text size={200} className={styles.statusText}>
              Projeto: {selectedProjectLabel}
            </Text>
          )}
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
            appearance="primary"
            icon={<Save24Regular />}
            onClick={handleSaveLayout}
            disabled={!selectedProjectId}
          >
            Salvar
          </Button>
          <Menu>
            <MenuTrigger>
              <Button icon={<Settings24Regular />} aria-label="Configurações do canvas" />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={autoLayoutEnabled ? <Checkmark24Regular /> : undefined}
                  onClick={() =>
                    setAutoLayoutEnabled((prev) => {
                      const next = !prev;
                      if (!next) {
                        setAutoLayoutPending(false);
                      }
                      return next;
                    })
                  }
                >
                  Auto-layout
                </MenuItem>
                <MenuItem
                  icon={<Flowchart24Regular />}
                  onClick={() => void handleApplyAutoLayout()}
                  disabled={nodes.length === 0}
                >
                  Auto-organizar
                </MenuItem>
                <MenuItem
                  icon={<FullScreenMaximize24Regular />}
                  onClick={() => flowInstance?.fitView({ padding: 0.2 })}
                  disabled={!flowInstance || nodes.length === 0}
                >
                  Fit view
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </div>
      <div className={styles.content}>
        <EquipmentPalette
          devices={devices}
          modelosMap={modelosMap}
          connectionsByDevice={connectionsByDevice}
          canvasDeviceIds={canvasDeviceIdSet}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          locations={availableLocations}
          selectedLocation={locationFilter}
          onLocationChange={setLocationFilter}
          selectedProjectId={selectedProjectId}
          selectedProjectLabel={selectedProjectLabel}
          onProjectSelect={(id, label) => {
            setSelectedProjectId(id);
            setSelectedProjectLabel(label);
            setSearchTerm('');
            setLocationFilter('');
          }}
          onProjectSearch={searchProjects}
        />
        <div className={styles.canvasArea}>
          <BlueprintCanvas
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onConnectStart={(_, data) => setConnectingHandleId(data.handleId ?? null)}
            onConnectEnd={() => setConnectingHandleId(null)}
            onSelectionChange={({ edges: selectedEdges }) => {
              const first = selectedEdges[0];
              setSelectedEdgeId(first?.id ?? null);
            }}
            onEdgesDelete={(deleted) => {
              deleted.forEach((edge) => void handleRemoveLink(edge));
            }}
            isValidConnection={isValidConnection}
            onInit={setFlowInstance}
            onDropDevice={handleDropDevice}
            isEmpty={nodes.length === 0}
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
      </div>
    </div>
  );
}
