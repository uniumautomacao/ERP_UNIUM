import ELK from 'elkjs/lib/elk.bundled.js';
import type { Edge, Node } from 'reactflow';

const elk = new ELK();

const NODE_WIDTH = 220;
const HEADER_HEIGHT = 52;
const PORT_ROW_HEIGHT = 44;
const NODE_PADDING = 10;
const MIN_HEIGHT = 80;

export const getDeviceNodeSize = (inputCount: number, outputCount: number) => {
  const rows = Math.max(1, Math.max(inputCount, outputCount));
  const height = HEADER_HEIGHT + NODE_PADDING * 2 + rows * PORT_ROW_HEIGHT + (rows - 1) * 6;
  return {
    width: NODE_WIDTH,
    height: Math.max(MIN_HEIGHT, height),
  };
};

type ElkNode = {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ElkNode[];
};

const buildNodeDepths = (nodes: Node[], edges: Edge[], rootDeviceId?: string | null) => {
  if (!rootDeviceId) return new Map<string, number>();
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (!nodeIds.has(rootDeviceId)) return new Map<string, number>();

  const adjacency = new Map<string, Set<string>>();
  for (const nodeId of nodeIds) {
    adjacency.set(nodeId, new Set());
  }
  edges.forEach((edge) => {
    const source = edge.source;
    const target = edge.target;
    if (!nodeIds.has(source) || !nodeIds.has(target)) return;
    adjacency.get(source)?.add(target);
    adjacency.get(target)?.add(source);
  });

  const depths = new Map<string, number>();
  const queue: string[] = [rootDeviceId];
  depths.set(rootDeviceId, 0);

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
};

const collectPositions = (
  node: ElkNode,
  offsetX: number,
  offsetY: number,
  positions: Map<string, { x: number; y: number }>
) => {
  const currentX = offsetX + (node.x ?? 0);
  const currentY = offsetY + (node.y ?? 0);
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => collectPositions(child, currentX, currentY, positions));
    return;
  }
  if (node.x !== undefined && node.y !== undefined) {
    positions.set(node.id, { x: currentX, y: currentY });
  }
};

export const applyAutoLayout = async (
  nodes: Node[],
  edges: Edge[],
  rootDeviceId?: string | null,
  expandedNodes?: { id: string; spacing: number }[]
): Promise<Node[]> => {
  if (nodes.length === 0) return nodes;

  const elkNodes: ElkNode[] = [];
  for (const node of nodes) {
    const ports = (node.data as { ports?: { side?: string; directionCode?: string }[] })
      ?.ports ?? [];
    const inputCount = ports.reduce((acc, port) => acc + (port.side === 'left' || port.directionCode === 'BI' ? 1 : 0), 0);
    const outputCount = ports.reduce((acc, port) => acc + (port.side === 'right' || port.directionCode === 'BI' ? 1 : 0), 0);
    const { width, height } = getDeviceNodeSize(inputCount, outputCount);
    elkNodes.push({
      id: node.id,
      width,
      height,
    });
  }

  const nodeDepths = buildNodeDepths(nodes, edges, rootDeviceId);

  const elkEdges = edges.map((edge) => {
    const sourceDepth = nodeDepths.get(edge.source);
    const targetDepth = nodeDepths.get(edge.target);
    if (sourceDepth !== undefined && targetDepth !== undefined && sourceDepth !== targetDepth) {
      if (sourceDepth > targetDepth) {
        return {
          id: edge.id,
          sources: [edge.target],
          targets: [edge.source],
        };
      }
    }
    return {
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    };
  });

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': '140',
      'elk.spacing.nodeNode': '30',
      'elk.spacing.componentComponent': '40',
      'elk.spacing.edgeNode': '20',
      'elk.layered.spacing.edgeNodeBetweenLayers': '20',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.partitioning.activate': 'true',
      ...(rootDeviceId ? { 'elk.layered.rootIds': rootDeviceId } : {}),
    },
    children: elkNodes,
    edges: elkEdges,
  };

  const layout = await elk.layout(elkGraph);
  const positions = new Map<string, { x: number; y: number }>();
  collectPositions(layout as ElkNode, 0, 0, positions);

  if (expandedNodes && expandedNodes.length > 0) {
    expandedNodes.forEach((expanded) => {
      const expandedPosition = positions.get(expanded.id);
      if (!expandedPosition) return;
      positions.forEach((position, nodeId) => {
        if (nodeId === expanded.id) return;
        let nextX = position.x;
        let nextY = position.y;
        if (position.x > expandedPosition.x) {
          nextX += expanded.spacing;
        }
        if (position.y > expandedPosition.y) {
          nextY += expanded.spacing;
        }
        if (nextX !== position.x || nextY !== position.y) {
          positions.set(nodeId, { x: nextX, y: nextY });
        }
      });
    });
  }

  return nodes.map((node) => {
    const position = positions.get(node.id);
    if (!position) return node;
    return {
      ...node,
      position,
    };
  });
};
