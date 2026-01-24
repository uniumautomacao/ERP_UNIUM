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

type ElkPort = {
  id: string;
  width?: number;
  height?: number;
  properties?: Record<string, string | number | boolean>;
};

type ElkNode = {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ElkNode[];
  ports?: ElkPort[];
  layoutOptions?: Record<string, string>;
};

const resolveConnectionIdFromHandle = (handleId?: string | null) => {
  if (!handleId) return null;
  const split = handleId.split(':');
  return split.length > 0 ? split[0] : handleId;
};

const buildEdgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

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
  expandedNodes?: { id: string; spacing?: number; spacingX?: number; spacingY?: number }[]
): Promise<Node[]> => {
  if (nodes.length === 0) return nodes;

  const elkNodes: ElkNode[] = [];
  const elkNodeById = new Map<string, ElkNode>();
  const portOrderByNode = new Map<string, Map<string, number>>();

  for (const node of nodes) {
    const ports = (node.data as {
      ports?: {
        id: string;
        side?: string;
        directionCode?: string;
        allowInput?: boolean;
        allowOutput?: boolean;
      }[];
    })?.ports ?? [];
    const inputCount = ports.reduce(
      (acc, port) => acc + (port.side === 'left' || port.directionCode === 'BI' ? 1 : 0),
      0
    );
    const outputCount = ports.reduce(
      (acc, port) => acc + (port.side === 'right' || port.directionCode === 'BI' ? 1 : 0),
      0
    );
    const { width, height } = getDeviceNodeSize(inputCount, outputCount);

    const portOrder = new Map<string, number>();
    const elkPorts: ElkPort[] = [];
    ports.forEach((port, index) => {
      if (port.id) {
        portOrder.set(port.id, index);
      }
      if (port.allowInput) {
        elkPorts.push({
          id: `${port.id}:in`,
          width: 2,
          height: 2,
          properties: { 'elk.port.side': 'WEST' },
        });
      }
      if (port.allowOutput) {
        elkPorts.push({
          id: `${port.id}:out`,
          width: 2,
          height: 2,
          properties: { 'elk.port.side': 'EAST' },
        });
      }
    });

    portOrderByNode.set(node.id, portOrder);
    const elkNode: ElkNode = {
      id: node.id,
      width,
      height,
      ports: elkPorts,
    };
    elkNodes.push(elkNode);
    elkNodeById.set(node.id, elkNode);
  }

  const nodeDepths = buildNodeDepths(nodes, edges, rootDeviceId);
  const adjacency = new Map<string, Set<string>>();
  const edgesBetween = new Map<string, Edge[]>();
  nodes.forEach((node) => adjacency.set(node.id, new Set()));
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);

    const key = buildEdgeKey(edge.source, edge.target);
    const list = edgesBetween.get(key);
    if (list) {
      list.push(edge);
    } else {
      edgesBetween.set(key, [edge]);
    }
  });

  if (nodeDepths.size < nodes.length) {
    nodes.forEach((node) => {
      if (nodeDepths.has(node.id)) return;
      const queue = [node.id];
      nodeDepths.set(node.id, 0);
      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) break;
        const currentDepth = nodeDepths.get(current) ?? 0;
        const neighbors = adjacency.get(current);
        if (!neighbors) continue;
        neighbors.forEach((neighbor) => {
          if (!nodeDepths.has(neighbor)) {
            nodeDepths.set(neighbor, currentDepth + 1);
            queue.push(neighbor);
          }
        });
      }
    });
  }

  const parentByNodeId = new Map<string, { parentId: string; parentPortIndex: number }>();
  const childrenByParentId = new Map<string, { childId: string; parentPortIndex: number }[]>();

  const resolveParentPortIndex = (parentId: string, childId: string) => {
    const edgesForPair = edgesBetween.get(buildEdgeKey(parentId, childId)) ?? [];
    const portOrder = portOrderByNode.get(parentId);
    if (!portOrder) return Number.POSITIVE_INFINITY;

    let bestIndex = Number.POSITIVE_INFINITY;
    edgesForPair.forEach((edge) => {
      const handle =
        edge.source === parentId ? edge.sourceHandle : edge.target === parentId ? edge.targetHandle : undefined;
      const portId = resolveConnectionIdFromHandle(handle);
      if (!portId) return;
      const index = portOrder.get(portId);
      if (index !== undefined && index < bestIndex) {
        bestIndex = index;
      }
    });

    return bestIndex;
  };

  if (rootDeviceId && nodeDepths.size > 0) {
    nodes.forEach((node) => {
      const depth = nodeDepths.get(node.id);
      if (depth === undefined || depth === 0) return;
      const neighbors = adjacency.get(node.id);
      if (!neighbors) return;

      let bestParentId: string | null = null;
      let bestPortIndex = Number.POSITIVE_INFINITY;

      neighbors.forEach((neighborId) => {
        const neighborDepth = nodeDepths.get(neighborId);
        if (neighborDepth !== depth - 1) return;
        const portIndex = resolveParentPortIndex(neighborId, node.id);
        if (
          portIndex < bestPortIndex ||
          (portIndex === bestPortIndex && neighborId < (bestParentId ?? ''))
        ) {
          bestPortIndex = portIndex;
          bestParentId = neighborId;
        }
      });

      if (!bestParentId) return;
      parentByNodeId.set(node.id, { parentId: bestParentId, parentPortIndex: bestPortIndex });
      const siblings = childrenByParentId.get(bestParentId);
      if (siblings) {
        siblings.push({ childId: node.id, parentPortIndex: bestPortIndex });
      } else {
        childrenByParentId.set(bestParentId, [{ childId: node.id, parentPortIndex: bestPortIndex }]);
      }
    });
  }

  childrenByParentId.forEach((children) => {
    if (children.length < 2) return;
    const ordered = [...children].sort((a, b) => {
      if (a.parentPortIndex !== b.parentPortIndex) {
        return a.parentPortIndex - b.parentPortIndex;
      }
      return a.childId.localeCompare(b.childId);
    });
    for (let index = 0; index < ordered.length - 1; index += 1) {
      const currentNode = elkNodeById.get(ordered[index].childId);
      if (!currentNode) continue;
      currentNode.layoutOptions = {
        ...(currentNode.layoutOptions ?? {}),
        'elk.layered.crossingMinimization.inLayerPredOf': ordered[index + 1].childId,
      };
    }
  });

  const buildElkEdge = (
    edge: Edge,
    source: string,
    target: string,
    sourcePort?: string | null,
    targetPort?: string | null
  ) => {
    if (!sourcePort || !targetPort) {
      return { id: edge.id, source, target };
    }
    return {
      id: edge.id,
      source,
      target,
      sourcePort,
      targetPort,
    };
  };

  let elkEdges: ReturnType<typeof buildElkEdge>[] = [];
  if (rootDeviceId && parentByNodeId.size > 0) {
    parentByNodeId.forEach((meta, childId) => {
      const edgesForPair = edgesBetween.get(buildEdgeKey(meta.parentId, childId)) ?? [];
      edgesForPair.forEach((edge) => {
        let source = edge.source;
        let target = edge.target;
        let sourcePort = edge.sourceHandle;
        let targetPort = edge.targetHandle;

        if (edge.source !== meta.parentId) {
          source = edge.target;
          target = edge.source;
          sourcePort = edge.targetHandle;
          targetPort = edge.sourceHandle;
        }

        elkEdges.push(buildElkEdge(edge, source, target, sourcePort, targetPort));
      });
    });
  }

  if (elkEdges.length === 0) {
    elkEdges = edges.map((edge) => {
      const sourceDepth = nodeDepths.get(edge.source);
      const targetDepth = nodeDepths.get(edge.target);
      let source = edge.source;
      let target = edge.target;
      let sourcePort = edge.sourceHandle;
      let targetPort = edge.targetHandle;

      if (sourceDepth !== undefined && targetDepth !== undefined && sourceDepth !== targetDepth) {
        if (sourceDepth > targetDepth) {
          source = edge.target;
          target = edge.source;
          sourcePort = edge.targetHandle;
          targetPort = edge.sourceHandle;
        }
      }

      return buildElkEdge(edge, source, target, sourcePort, targetPort);
    });
  }

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
      'elk.layered.cycleBreaking.strategy': 'GREEDY_MODEL_ORDER',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.partitioning.activate': 'true',
      'elk.portConstraints': 'FIXED_ORDER',
      'elk.layered.considerModelOrder.portModelOrder': 'true',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.allowNonFlowPortsToSwitchSides': 'false',
      ...(rootDeviceId ? { 'elk.layered.rootIds': rootDeviceId } : {}),
    },
    children: elkNodes,
    edges: elkEdges,
  };

  const layout = await elk.layout(elkGraph as any);
  const positions = new Map<string, { x: number; y: number }>();
  collectPositions(layout as ElkNode, 0, 0, positions);

  if (expandedNodes && expandedNodes.length > 0) {
    expandedNodes.forEach((expanded) => {
      const expandedPosition = positions.get(expanded.id);
      if (!expandedPosition) return;
      const spacingX = expanded.spacingX ?? expanded.spacing ?? 0;
      const spacingY = expanded.spacingY ?? expanded.spacing ?? 0;
      positions.forEach((position, nodeId) => {
        if (nodeId === expanded.id) return;
        let nextX = position.x;
        let nextY = position.y;
        if (position.x > expandedPosition.x) {
          nextX += spacingX;
        }
        if (position.y > expandedPosition.y) {
          nextY += spacingY;
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
