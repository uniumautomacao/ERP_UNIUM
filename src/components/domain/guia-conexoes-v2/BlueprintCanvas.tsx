import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { makeStyles, tokens } from '@fluentui/react-components';
import type { GuiaConexoesData, GuiaDeviceIO, GuiaDeviceIOConnection } from '../../../types/guiaConexoes';
import { DeviceNode } from './nodes/DeviceNode';
import { connectionTypeOptions } from '../../../utils/device-io/optionSetMaps';
import { NewDeviceIOConnectionService } from '../../../generated';
import { LayoutState } from './storage/layoutStorage';
import { applyAutoLayout } from './layout/elkLayout';

const useStyles = makeStyles({
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flex: 1,
  },
});

export interface BlueprintCanvasState {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}

interface BlueprintCanvasProps {
  data: GuiaConexoesData & { loading?: boolean; error?: string; reload: () => void };
  projectId: string;
  onStateChange: (state: BlueprintCanvasState) => void;
  onSelectedEdgeChange: (edgeId: string | null) => void;
  persistedLayout: LayoutState | null;
  autoLayoutEnabled: boolean;
  onReloadData: () => void;
}

const nodeTypes = {
  device: DeviceNode,
};

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  data,
  projectId,
  onStateChange,
  onSelectedEdgeChange,
  persistedLayout,
  autoLayoutEnabled,
  onReloadData,
}) => {
  const styles = useStyles();
  const { fitView } = useReactFlow();
  const [shouldFitView, setShouldFitView] = useState(false);

  // Criar nós iniciais a partir do layout persistido ou vazio
  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];
    const modelosMap = new Map<string, string>();
    data.modelos?.forEach((m: any) => {
      modelosMap.set(
        m.cr22f_modelosdeprodutofromsharepointlistid,
        m.cr22f_title || m.new_nomedofabricante || 'Modelo'
      );
    });

    if (persistedLayout?.canvasDeviceIds) {
      persistedLayout.canvasDeviceIds.forEach((deviceId) => {
        const device = data.devices?.find((d: GuiaDeviceIO) => d.new_deviceioid === deviceId);
        if (device) {
          const pos = persistedLayout.nodePositions[deviceId] || { x: 0, y: 0 };
          const modeloId = device._new_modelodeproduto_value;
          const modelName = modeloId ? modelosMap.get(modeloId) : undefined;

          nodes.push({
            id: device.new_deviceioid,
            type: 'device',
            position: pos,
            data: {
              device,
              connections: data.connections || [],
              modelName,
            },
          });
        }
      });
    }

    return nodes;
  }, [data, persistedLayout]);

  // Criar arestas a partir de conexões
  const initialEdges = useMemo(() => {
    const edges: Edge[] = [];
    const seen = new Set<string>();

    data.connections?.forEach((conn: GuiaDeviceIOConnection) => {
      if (conn._new_connectedto_value) {
        const sourceId = conn._new_device_value;
        const targetId = conn._new_connectedto_value;

        if (sourceId && targetId) {
          const edgeId = [sourceId, targetId].sort().join('|');

          if (!seen.has(edgeId)) {
            seen.add(edgeId);

            const typeOption = connectionTypeOptions.find(
              (opt) => opt.value === conn.new_tipodeconexao
            );

            edges.push({
              id: `${sourceId}-${targetId}`,
              source: sourceId,
              target: targetId,
              label: `${conn.new_name || 'Conexão'} (${typeOption?.label || 'Desconhecido'})`,
              data: { connectionId: conn.new_deviceioconnectionid },
            });
          }
        }
      }
    });

    return edges;
  }, [data.connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Aplicar auto-layout quando habilitado
  useEffect(() => {
    if (autoLayoutEnabled && nodes.length > 0) {
      const layoutNodes = async () => {
        const locationMap = new Map<string, string>();
        nodes.forEach((node) => {
          const device = data.devices?.find(
            (d: GuiaDeviceIO) => d.new_deviceioid === node.id
          );
          if (device?.new_localizacao) {
            locationMap.set(node.id, device.new_localizacao);
          }
        });

        const layoutedNodes = await applyAutoLayout(nodes, edges, {
          direction: 'LR',
          rankSpacing: 190,
          nodeSpacing: 40,
          groupByLocation: true,
          locationMap,
        });

        setNodes(layoutedNodes);
        setShouldFitView(true);
      };

      layoutNodes();
    }
  }, [autoLayoutEnabled, nodes.length, data.devices, edges, setNodes]);

  // Trigger fit view quando layout é aplicado
  useEffect(() => {
    if (shouldFitView) {
      setTimeout(() => {
        fitView();
        setShouldFitView(false);
      }, 100);
    }
  }, [shouldFitView, fitView]);

  // Atualizar estado do canvas
  useEffect(() => {
    onStateChange({
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    });
  }, [nodes, edges, onStateChange]);

  // Listener para fit view
  useEffect(() => {
    const handleFitView = () => {
      setTimeout(() => fitView(), 0);
    };
    window.addEventListener('fitView', handleFitView);
    return () => window.removeEventListener('fitView', handleFitView);
  }, [fitView]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const deviceId = e.dataTransfer.getData('deviceId');
    if (!deviceId) return;

    const device = data.devices?.find((d: GuiaDeviceIO) => d.new_deviceioid === deviceId);
    if (!device) return;

    // Verificar se já está no canvas
    if (nodes.find((n) => n.id === deviceId)) return;

    const modelosMap = new Map<string, string>();
    data.modelos?.forEach((m: any) => {
      modelosMap.set(
        m.cr22f_modelosdeprodutofromsharepointlistid,
        m.cr22f_title || m.new_nomedofabricante || 'Modelo'
      );
    });

    const modeloId = device._new_modelodeproduto_value;
    const modelName = modeloId ? modelosMap.get(modeloId) : undefined;

    const newNode: Node = {
      id: device.new_deviceioid,
      type: 'device',
      position: { x: e.clientX, y: e.clientY },
      data: {
        device,
        connections: data.connections || [],
        modelName,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [data.devices, data.modelos, data.connections, nodes, setNodes]);

  const handleConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      try {
        // Atualizar as duas conexões (sequencial como no padrão existente)
        const updates = [
          NewDeviceIOConnectionService.update(connection.source, {
            'new_ConnectedTo@odata.bind': `/new_deviceioconnections(${connection.target})`,
          } as any),
          NewDeviceIOConnectionService.update(connection.target, {
            'new_ConnectedTo@odata.bind': `/new_deviceioconnections(${connection.source})`,
          } as any),
        ];

        await Promise.all(updates);
        onReloadData();
      } catch (err) {
        console.error('Erro ao conectar:', err);
      }
    },
    [onReloadData]
  );

  const handleEdgeClick = useCallback(
    (e: React.MouseEvent, edge: Edge) => {
      e.stopPropagation();
      onSelectedEdgeChange(edge.id);
    },
    [onSelectedEdgeChange]
  );

  return (
    <div className={styles.container}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
