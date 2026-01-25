import type {
  GuiaDeviceIO,
  GuiaDeviceIOConnection,
  GuiaModeloProduto,
} from '../../types/guiaConexoes';

const sanitizeMermaidId = (value: string) =>
  value.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');

const getDeviceName = (device: GuiaDeviceIO) => device.new_name || 'Sem nome';

const getModelName = (device: GuiaDeviceIO, modelosMap: Map<string, GuiaModeloProduto>) => {
  if (!device._new_modelodeproduto_value) return '';
  const model = modelosMap.get(device._new_modelodeproduto_value);
  return model?.cr22f_title ? `(${model.cr22f_title})` : '';
};

const getConnectionPort = (conn: GuiaDeviceIOConnection) =>
  conn.new_name;//conn.new_displayname || conn.new_name || 'Porta';

const getConnectionType = (conn: GuiaDeviceIOConnection) =>
  conn.new_tipodeconexaorawtext ||
  (conn.new_tipodeconexao ? `Tipo ${conn.new_tipodeconexao}` : 'Conexão');

export const generateMermaidGraph = (
  devices: GuiaDeviceIO[],
  connections: GuiaDeviceIOConnection[],
  modelosMap: Map<string, GuiaModeloProduto>,
  rootDeviceId?: string,
  edgeColorByTypeLabel?: Record<string, string>
) => {
  const lines: string[] = [
    "%%{init: {'flowchart': {'rankSpacing': 190, 'nodeSpacing':40, 'curve': 'linear','defaultRenderer': 'elk'}} }%%",
    'graph LR',
  ];

  const deviceMap = new Map<string, GuiaDeviceIO>();
  devices.forEach((device) => deviceMap.set(device.new_deviceioid, device));

  const connectionMap = new Map<string, GuiaDeviceIOConnection>();
  connections.forEach((conn) =>
    connectionMap.set(conn.new_deviceioconnectionid, conn)
  );

  // Identify all connected devices first (needed for fallback if no root)
  const connectedDeviceIds = new Set<string>();
  connections.forEach((conn) => {
    if (conn._new_connectedto_value && conn._new_device_value) {
      connectedDeviceIds.add(conn._new_device_value);
      const targetConn = connectionMap.get(conn._new_connectedto_value);
      if (targetConn && targetConn._new_device_value) {
        connectedDeviceIds.add(targetConn._new_device_value);
      }
    }
  });

  // BFS to order edges from root
  const processedEdges = new Set<string>();
  const visited = new Set<string>();
  const queue: string[] = [];
  const orderedEdges: { from: string; to: string; conn: GuiaDeviceIOConnection }[] = [];

  if (rootDeviceId && deviceMap.has(rootDeviceId)) {
    visited.add(rootDeviceId);
    queue.push(rootDeviceId);
  } else {
    // If no root or invalid root, just process all connections normally
    // Add all devices to queue to ensure we process everything even if disconnected
    devices.forEach(d => {
        if (connectedDeviceIds.has(d.new_deviceioid)) {
            queue.push(d.new_deviceioid);
        }
    });
  }

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    // Find all connections starting from currentId
    connections.forEach((conn) => {
        if (conn._new_device_value !== currentId) return;
        if (!conn._new_connectedto_value) return;

        const targetConn = connectionMap.get(conn._new_connectedto_value);
        if (!targetConn || !targetConn._new_device_value) return;

        const targetId = targetConn._new_device_value;
        const edgeKey = [conn.new_deviceioconnectionid, conn._new_connectedto_value].sort().join('-');

        if (processedEdges.has(edgeKey)) return;
        processedEdges.add(edgeKey);

        orderedEdges.push({ from: currentId, to: targetId, conn });

        if (!visited.has(targetId)) {
            visited.add(targetId);
            queue.push(targetId);
        }
    });
  }

  // Group reachable devices by location
  const locations = new Map<string, GuiaDeviceIO[]>();
  
  // If root is provided, only include visited devices
  const devicesToInclude = rootDeviceId ? Array.from(visited) : Array.from(connectedDeviceIds);
  
  devicesToInclude.forEach((deviceId) => {
    const device = deviceMap.get(deviceId);
    if (!device) return;
    
    const location = device.new_localizacao?.trim() || 'Sem Localização';
    const list = locations.get(location) ?? [];
    list.push(device);
    locations.set(location, list);
  });

  // Generate Subgraphs
  locations.forEach((list, location) => {
    const groupId = sanitizeMermaidId(location);
    lines.push(`    subgraph ${groupId}["${location}"]`);
    list.forEach((device) => {
      const id = sanitizeMermaidId(device.new_deviceioid);
      const name = getDeviceName(device);
      const model = getModelName(device, modelosMap);
      // Format: ID["Name (Model)"]
      const label = name;
      lines.push(`        ${id}["${label}"]`);
    });
    lines.push('    end');
  });

  orderedEdges.forEach(({ from, to, conn }, index) => {
    const fromDevice = deviceMap.get(from);
    const toDevice = deviceMap.get(to);
    const targetConn = connectionMap.get(conn._new_connectedto_value!);

    if (!fromDevice || !toDevice || !targetConn) return;

    const fromId = sanitizeMermaidId(fromDevice.new_deviceioid);
    const toId = sanitizeMermaidId(toDevice.new_deviceioid);

    const fromPort = getConnectionPort(conn);
    const toPort = getConnectionPort(targetConn);
    const typeLabel = getConnectionType(conn);
    
    const edgeLabel = `${fromPort} <-> ${toPort}`;

    // Always draw from -> to based on BFS order to maintain direction
    lines.push(`    ${fromId} -->|"${edgeLabel}"| ${toId};`);
    const edgeColor = edgeColorByTypeLabel?.[typeLabel];
    if (edgeColor) {
      lines.push(`    linkStyle ${index} stroke:${edgeColor},stroke-width:2px;`);
    }
  });

  return lines.join('\n');
};
