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
    ':global(.react-flow__edges)': {
      zIndex: 2,
    },
    ':global(.react-flow__nodes)': {
      zIndex: 1,
    },
    ':global(.react-flow__handle)': {
      pointerEvents: 'all',
    },
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
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;
  onSelectionChange: OnSelectionChangeFunc;
  onEdgesDelete: OnEdgesDelete;
  isValidConnection: IsValidConnection;
  onInit: (instance: ReactFlowInstance) => void;
  isEmpty: boolean;
  panOnDragEnabled?: boolean;
  onCanvasMouseUp?: (event: React.MouseEvent<HTMLDivElement>) => void;
  dragPreview?: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
}

export function BlueprintCanvas({
  nodes,
  edges,
  nodeTypes,
  onEdgesChange,
  onConnect,
  onConnectStart,
  onConnectEnd,
  onSelectionChange,
  onEdgesDelete,
  isValidConnection,
  onInit,
  isEmpty,
  panOnDragEnabled = true,
  onCanvasMouseUp,
  dragPreview,
}: BlueprintCanvasProps) {
  const styles = useStyles();

  return (
    <div className={styles.wrapper} onMouseUp={onCanvasMouseUp} data-blueprint-wrapper="true">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onSelectionChange={onSelectionChange}
        onEdgesDelete={onEdgesDelete}
        isValidConnection={isValidConnection}
        onInit={onInit}
        connectionMode={ConnectionMode.Strict}
        nodesDraggable={false}
        fitView
        panOnDrag={panOnDragEnabled}
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
      {dragPreview && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          <line
            x1={dragPreview.start.x}
            y1={dragPreview.start.y}
            x2={dragPreview.end.x}
            y2={dragPreview.end.y}
            stroke="#ffffff"
            strokeWidth={2}
            strokeDasharray="6 6"
            opacity={0.8}
          />
        </svg>
      )}
      {isEmpty && (
        <div className={styles.emptyState}>
          Nenhuma conexão encontrada. Use &quot;Adicionar Conexão&quot; para começar.
        </div>
      )}
    </div>
  );
}
