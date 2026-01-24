import ELK from 'elkjs/lib/elk.bundled.js';
import type { Edge, Node } from 'reactflow';

const elk = new ELK();

const NODE_WIDTH = 280;
const HEADER_HEIGHT = 52;
const PORT_ROW_HEIGHT = 28;
const PORTS_PER_ROW = 2;
const NODE_PADDING = 16;
const MIN_HEIGHT = 140;

export const getDeviceNodeSize = (portCount: number) => {
  const rows = Math.max(1, Math.ceil(portCount / PORTS_PER_ROW));
  const height = HEADER_HEIGHT + NODE_PADDING * 2 + rows * PORT_ROW_HEIGHT;
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
  edges: Edge[]
): Promise<Node[]> => {
  if (nodes.length === 0) return nodes;

  const groups = new Map<string, { id: string; label: string; children: ElkNode[] }>();

  for (const node of nodes) {
    const locationLabel =
      (node.data as { locationLabel?: string; device?: { new_localizacao?: string | null } })
        ?.locationLabel ??
      (node.data as { device?: { new_localizacao?: string | null } })?.device?.new_localizacao ??
      'Sem localização';
    const locationKey = locationLabel?.trim() ? locationLabel.trim() : 'Sem localização';
    const groupId = `location:${locationKey}`;

    if (!groups.has(groupId)) {
      groups.set(groupId, { id: groupId, label: locationKey, children: [] });
    }

    const ports = (node.data as { ports?: unknown[] })?.ports ?? [];
    const portCount = Array.isArray(ports) ? ports.length : 0;
    const { width, height } = getDeviceNodeSize(portCount);
    groups.get(groupId)?.children.push({
      id: node.id,
      width,
      height,
    });
  }

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': '190',
      'elk.spacing.nodeNode': '40',
      'elk.spacing.componentComponent': '60',
    },
    children: Array.from(groups.values()).map((group) => ({
      id: group.id,
      children: group.children,
      layoutOptions: {
        'elk.padding': '[top=30,left=30,bottom=30,right=30]',
        'elk.spacing.nodeNode': '40',
      },
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(elkGraph);
  const positions = new Map<string, { x: number; y: number }>();
  collectPositions(layout as ElkNode, 0, 0, positions);

  return nodes.map((node) => {
    const position = positions.get(node.id);
    if (!position) return node;
    return {
      ...node,
      position,
    };
  });
};
