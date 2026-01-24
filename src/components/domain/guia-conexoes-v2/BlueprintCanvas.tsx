import { useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  type OnConnect,
  type OnConnectEnd,
  type OnConnectStart,
  type OnEdgesChange,
  type OnNodesChange,
  type OnEdgesDelete,
  type OnSelectionChangeFunc,
  type ReactFlowInstance,
  type IsValidConnection,
} from 'reactflow';
import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  wrapper: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    backgroundColor: '#0f2440',
  },
  emptyState: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    color: tokens.colorNeutralForegroundInverted,
    fontSize: tokens.fontSizeBase300,
    opacity: 0.8,
    textAlign: 'center',
    padding: '24px',
  },
});

interface BlueprintCanvasProps {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;
  onSelectionChange: OnSelectionChangeFunc;
  onEdgesDelete: OnEdgesDelete;
  isValidConnection: IsValidConnection;
  onInit: (instance: ReactFlowInstance) => void;
  onDropDevice: (deviceId: string, position: { x: number; y: number }) => void;
  isEmpty: boolean;
}

export function BlueprintCanvas({
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onConnectStart,
  onConnectEnd,
  onSelectionChange,
  onEdgesDelete,
  isValidConnection,
  onInit,
  onDropDevice,
  isEmpty,
}: BlueprintCanvasProps) {
  const styles = useStyles();
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);

  return (
    <div
      className={styles.wrapper}
      onDrop={(event) => {
        event.preventDefault();
        const deviceId = event.dataTransfer.getData('application/guia-device-id');
        if (!deviceId) return;
        if (!flowInstance) return;
        const position = flowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        onDropDevice(deviceId, position);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onSelectionChange={onSelectionChange}
        onEdgesDelete={onEdgesDelete}
        isValidConnection={isValidConnection}
        onInit={(instance) => {
          setFlowInstance(instance);
          onInit(instance);
        }}
        connectionMode={ConnectionMode.Strict}
        fitView
        panOnScroll
        selectionOnDrag
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#2d5a83"
        />
        <Controls position="bottom-right" />
      </ReactFlow>
      {isEmpty && (
        <div className={styles.emptyState}>
          Arraste equipamentos da paleta para iniciar o blueprint.
        </div>
      )}
    </div>
  );
}
