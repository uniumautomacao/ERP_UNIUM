import type { Edge, Node } from 'reactflow';
import type { GuiaDeviceIOConnection } from '../../../../types/guiaConexoes';
import { getDeviceNodeSize } from './elkLayout';

type Point = { x: number; y: number };

type UndirectedEdge = {
  a: string;
  b: string;
};

type LayoutScore = {
  crossings: number;
  totalLength: number;
  score: number;
};

const CROSSING_WEIGHT = 1_000_000;

const buildEdgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const computeNodeCenters = (nodes: Node[]) => {
  const centers = new Map<string, Point>();
  nodes.forEach((node) => {
    const ports = (node.data as { ports?: { side?: string; directionCode?: string }[] })?.ports ?? [];
    const inputCount = ports.reduce(
      (acc, port) => acc + (port.side === 'left' || port.directionCode === 'BI' ? 1 : 0),
      0
    );
    const outputCount = ports.reduce(
      (acc, port) => acc + (port.side === 'right' || port.directionCode === 'BI' ? 1 : 0),
      0
    );
    const { width, height } = getDeviceNodeSize(inputCount, outputCount);
    const nodeWidth = node.width ?? width;
    const nodeHeight = node.height ?? height;
    centers.set(node.id, {
      x: (node.position?.x ?? 0) + nodeWidth / 2,
      y: (node.position?.y ?? 0) + nodeHeight / 2,
    });
  });
  return centers;
};

const orientation = (a: Point, b: Point, c: Point) => {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (value === 0) return 0;
  return value > 0 ? 1 : 2;
};

const onSegment = (a: Point, b: Point, c: Point) =>
  Math.min(a.x, c.x) <= b.x &&
  b.x <= Math.max(a.x, c.x) &&
  Math.min(a.y, c.y) <= b.y &&
  b.y <= Math.max(a.y, c.y);

const segmentsIntersect = (p1: Point, p2: Point, q1: Point, q2: Point) => {
  const o1 = orientation(p1, p2, q1);
  const o2 = orientation(p1, p2, q2);
  const o3 = orientation(q1, q2, p1);
  const o4 = orientation(q1, q2, p2);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, q1, p2)) return true;
  if (o2 === 0 && onSegment(p1, q2, p2)) return true;
  if (o3 === 0 && onSegment(q1, p1, q2)) return true;
  if (o4 === 0 && onSegment(q1, p2, q2)) return true;
  return false;
};

export const buildUndirectedDeviceEdges = (
  filteredConnections: GuiaDeviceIOConnection[],
  connectionsById: Map<string, GuiaDeviceIOConnection>,
  connectedDeviceIds: Set<string>
) => {
  const edges: UndirectedEdge[] = [];
  const seen = new Set<string>();

  filteredConnections.forEach((connection) => {
    if (!connection._new_connectedto_value || !connection._new_device_value) return;
    const target = connectionsById.get(connection._new_connectedto_value);
    if (!target?._new_device_value) return;
    const sourceDeviceId = connection._new_device_value;
    const targetDeviceId = target._new_device_value;
    if (!connectedDeviceIds.has(sourceDeviceId) || !connectedDeviceIds.has(targetDeviceId)) return;
    const key = buildEdgeKey(sourceDeviceId, targetDeviceId);
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ a: sourceDeviceId, b: targetDeviceId });
  });

  return edges;
};

export const computeLayoutScore = (centers: Map<string, Point>, edges: UndirectedEdge[]): LayoutScore => {
  let crossings = 0;
  let totalLength = 0;

  const segments = edges
    .map((edge) => {
      const a = centers.get(edge.a);
      const b = centers.get(edge.b);
      if (!a || !b) return null;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      totalLength += Math.hypot(dx, dy);
      return { edge, a, b };
    })
    .filter((segment): segment is { edge: UndirectedEdge; a: Point; b: Point } => !!segment);

  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const first = segments[i];
      const second = segments[j];
      if (
        first.edge.a === second.edge.a ||
        first.edge.a === second.edge.b ||
        first.edge.b === second.edge.a ||
        first.edge.b === second.edge.b
      ) {
        continue;
      }
      if (segmentsIntersect(first.a, first.b, second.a, second.b)) {
        crossings += 1;
      }
    }
  }

  return {
    crossings,
    totalLength,
    score: crossings * CROSSING_WEIGHT + totalLength,
  };
};

export const pickBestRootByExhaustiveLayout = async (params: {
  candidates: string[];
  nodes: Node[];
  edges: Edge[];
  expandedNodes?: { id: string; spacing?: number; spacingX?: number; spacingY?: number }[];
  undirectedEdges: UndirectedEdge[];
  applyAutoLayout: (
    nodes: Node[],
    edges: Edge[],
    rootDeviceId?: string | null,
    expandedNodes?: { id: string; spacing?: number; spacingX?: number; spacingY?: number }[]
  ) => Promise<Node[]>;
  onProgress?: (current: number, total: number) => void;
  yieldFn?: () => Promise<void>;
}) => {
  const {
    candidates,
    nodes,
    edges,
    expandedNodes,
    undirectedEdges,
    applyAutoLayout,
    onProgress,
    yieldFn,
  } = params;
  if (candidates.length === 0) {
    return { bestRootId: null, bestScore: Infinity };
  }
  if (undirectedEdges.length === 0) {
    return { bestRootId: candidates[0], bestScore: 0 };
  }

  let bestRootId = candidates[0];
  let bestScore = Infinity;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidateRootId = candidates[index];
    onProgress?.(index + 1, candidates.length);
    const layoutNodes = await applyAutoLayout(nodes, edges, candidateRootId, expandedNodes);
    const centers = computeNodeCenters(layoutNodes);
    const { score } = computeLayoutScore(centers, undirectedEdges);
    if (score < bestScore) {
      bestScore = score;
      bestRootId = candidateRootId;
    }
    if (yieldFn) {
      await yieldFn();
    }
  }

  return { bestRootId, bestScore };
};
