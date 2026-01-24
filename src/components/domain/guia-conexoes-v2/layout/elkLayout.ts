import ELK, { ElkNode } from 'elkjs';
import type { Node, Edge } from 'reactflow';

const elk = new ELK();

interface LayoutOptions {
  direction?: 'LR' | 'TB' | 'RL' | 'BT';
  rankSpacing?: number;
  nodeSpacing?: number;
  groupByLocation?: boolean;
  locationMap?: Map<string, string>;
}

async function layoutNodes(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<Node[]> {
  const {
    direction = 'LR',
    rankSpacing = 190,
    nodeSpacing = 40,
    groupByLocation = true,
    locationMap,
  } = options;

  if (nodes.length === 0) return nodes;

  // Agrupar nós por localização se groupByLocation estiver ativo
  const groups = new Map<string, Node[]>();
  const deviceGroups = new Map<string, string>();

  if (groupByLocation && locationMap) {
    nodes.forEach((node) => {
      const location = locationMap.get(node.id) || 'Sem localização';
      if (!groups.has(location)) {
        groups.set(location, []);
      }
      groups.get(location)!.push(node);
      deviceGroups.set(node.id, location);
    });
  }

  // Construir estrutura ELK
  const elkChildren: ElkNode[] = [];
  let nodeIndex = 0;

  if (groupByLocation && groups.size > 0) {
    // Criar grupos por localização
    for (const [location, groupNodes] of groups) {
      const groupElkNodes: ElkNode[] = groupNodes.map((node) => ({
        id: node.id,
        width: 200,
        height: 120,
      }));

      elkChildren.push({
        id: `group-${location.replace(/\s+/g, '-')}`,
        children: groupElkNodes,
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': direction,
          'elk.spacing.nodeNode': `${nodeSpacing}`,
        },
      });
    }
  } else {
    // Layout sem agrupamento
    elkChildren.push(
      ...nodes.map((node) => ({
        id: node.id,
        width: 200,
        height: 120,
      }))
    );
  }

  // Construir arestas para ELK
  const elkEdges = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  try {
    const layout = await elk.layout({
      id: 'root',
      layoutOptions: {
        'elk.algorithm': groupByLocation && groups.size > 0 ? 'rectpacking' : 'layered',
        'elk.direction': direction,
        'elk.spacing.nodeNode': `${nodeSpacing}`,
        'elk.spacing.rankNodeBetweenLayers': `${rankSpacing}`,
      },
      children: groupByLocation && groups.size > 0 ? elkChildren : undefined,
      edges: groupByLocation && groups.size > 0 ? undefined : elkEdges,
    } as any);

    // Mapear posições de volta aos nós
    const positionMap = new Map<string, { x: number; y: number }>();

    const processLayoutChildren = (children: ElkNode[] | undefined) => {
      if (!children) return;
      children.forEach((child) => {
        if (child.children) {
          child.children.forEach((grandChild) => {
            if (grandChild.x !== undefined && grandChild.y !== undefined) {
              positionMap.set(grandChild.id, {
                x: grandChild.x,
                y: grandChild.y,
              });
            }
          });
        } else if (child.x !== undefined && child.y !== undefined) {
          positionMap.set(child.id, {
            x: child.x,
            y: child.y,
          });
        }
      });
    };

    processLayoutChildren(layout.children);

    // Atualizar posições dos nós
    return nodes.map((node) => {
      const position = positionMap.get(node.id) || node.position;
      return {
        ...node,
        position: position || { x: 0, y: 0 },
      };
    });
  } catch (err) {
    console.error('Erro ao aplicar auto-layout:', err);
    return nodes;
  }
}

export async function applyAutoLayout(
  nodes: Node[],
  edges: Edge[],
  options?: LayoutOptions
): Promise<Node[]> {
  return layoutNodes(nodes, edges, options);
}
